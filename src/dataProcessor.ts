import Papa from 'papaparse';
import { 
  TimetableItem, 
  TimetableData, 
  CourseLookup, 
  CourseInfo 
} from './types';
import { normalizeTime, sortDateStrings } from './utils';

export const parseAndProcessData = (scheduleCsv: string, courseCsv: string): TimetableData => {
  // 1. Parse Course Mapping as a raw hierarchical grid to process section-specific instructors correctly
  const parsedRawCourses = Papa.parse<any>(courseCsv, {
    header: false,
    skipEmptyLines: true
  });

  interface CourseDetailsEntry {
    courseName: string;
    abbr: string;
    credit: string;
    sections: string;
    professor: string;
  }

  const courseEntries: CourseDetailsEntry[] = [];
  let currentCourseName = "";
  let currentAbbr = "";
  let currentCredit = "";

  parsedRawCourses.data.forEach((row: any) => {
    if (!Array.isArray(row) || row.length < 2) return;
    
    const col0 = (row[0] || '').trim();
    const col1 = (row[1] || '').trim();
    const col2 = (row[2] || '').trim();
    const col3 = (row[3] || '').trim();
    const col4 = (row[4] || '').trim();

    // Skip sheet headers or titles
    if (
      col0.toLowerCase().includes('course details') ||
      col0.toLowerCase() === 'course' ||
      col1.toLowerCase() === 'abbr.'
    ) {
      return;
    }

    // Skip completely empty rows
    if (!col0 && !col1 && !col2 && !col3 && !col4) {
      return;
    }

    // If Course or Abbr is specified, update current course context
    if (col0 || col1) {
      currentCourseName = col0 || currentCourseName;
      currentAbbr = col1 || currentAbbr;
      currentCredit = col2 || currentCredit;
    }

    courseEntries.push({
      courseName: currentCourseName,
      abbr: currentAbbr,
      credit: currentCredit,
      sections: col3,
      professor: col4 || 'Staff/Instructor'
    });
  });

  const coursesList: CourseInfo[] = [];
  const courseLookup: CourseLookup = {};

  courseEntries.forEach(entry => {
    const abbr = entry.abbr.toUpperCase();
    if (!abbr) return;

    if (!courseLookup[abbr]) {
      courseLookup[abbr] = {
        abbr,
        courseName: entry.courseName,
        professor: entry.professor
      };
    } else {
      const existingProf = courseLookup[abbr].professor;
      if (entry.professor && existingProf && !existingProf.includes(entry.professor) && entry.professor !== 'TBD') {
        courseLookup[abbr].professor = `${existingProf} / ${entry.professor}`;
      } else if (entry.professor && (!existingProf || existingProf === 'TBD')) {
        courseLookup[abbr].professor = entry.professor;
      }
    }
  });

  Object.keys(courseLookup).forEach(abbr => {
    coursesList.push(courseLookup[abbr]);
  });

  // Clean Schedule CSV: Find line containing both 'date' and 'time' and skip leading title lines
  const scheduleLines = scheduleCsv.split(/\r?\n/);
  const scheduleHeaderIndex = scheduleLines.findIndex(line => {
    const lower = line.toLowerCase();
    return lower.includes('date') && lower.includes('time') && lower.includes(',');
  });
  const cleanedScheduleCsv = scheduleHeaderIndex !== -1 
    ? scheduleLines.slice(scheduleHeaderIndex).join('\n') 
    : scheduleCsv;

  // 2. Parse Schedule rows
  const parsedSchedule = Papa.parse<any>(cleanedScheduleCsv, {
    header: true,
    skipEmptyLines: true
  });

  const items: TimetableItem[] = [];
  const classroomsSet = new Set<string>();
  const sectionsSet = new Set<string>();
  const datesSet = new Set<string>();

  parsedSchedule.data.forEach((row, rowIndex) => {
    const dateKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'date') || 'Date';
    const timeKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'time') || 'Time';

    const date = (row[dateKey] || '').trim();
    const rawTime = (row[timeKey] || '').trim();
    const time = normalizeTime(rawTime);

    if (!date || !time) return;

    datesSet.add(date);

    // Any column that is not Date or Time, representing Classroom columns
    const classroomKeys = Object.keys(row).filter(k => {
      const norm = k.trim().toLowerCase();
      return norm !== '' && norm !== dateKey.toLowerCase() && norm !== timeKey.toLowerCase();
    });

    classroomKeys.forEach(roomCol => {
      const roomName = roomCol.trim();
      classroomsSet.add(roomName);

      let cellVal = (row[roomCol] || '').trim();
      // Ignore empty cells and LUNCH BREAK
      if (!cellVal || cellVal === "" || cellVal.toUpperCase() === "LUNCH BREAK") {
        return;
      }

      let isCancelled = false;
      if (cellVal.startsWith('[CANCELLED] ')) {
        isCancelled = true;
        cellVal = cellVal.substring('[CANCELLED] '.length).trim();
      }

      const upperVal = cellVal.toUpperCase();
      let abbr = "";
      let section = "";
      let courseName = "";
      let professor = "";

      if (upperVal === 'BLOCKED') {
        abbr = 'BLOCKED';
        section = ''; // empty section to represent global block
        courseName = 'Blocked Slot';
        professor = 'Reserved';
      } else if (upperVal.includes('HOLIDAY') || upperVal.includes('VACATION') || upperVal.includes('OFF-DAY') || upperVal.includes('OFF DAY')) {
        abbr = 'HOLIDAY';
        section = '';
        courseName = cellVal;
        professor = 'Academic Holiday';
      } else {
        // Parse course code: {CourseAbbreviation}-{Section}
        const hyphenIndex = cellVal.indexOf('-');
        if (hyphenIndex !== -1) {
          abbr = cellVal.substring(0, hyphenIndex).trim().toUpperCase();
          section = cellVal.substring(hyphenIndex + 1).trim();
        } else {
          abbr = cellVal.trim().toUpperCase();
          section = "N/A";
        }

        // Smart lookup across the hierarchical courseDetails entries
        // 1. Try exact match by sections (handles Fin and LSM section codes like ME-Fin, BSL-Fin, BC-LSM)
        let matchedEntry = courseEntries.find(e => {
          const eSecs = (e.sections || '').split(/[\s,]+/).map(s => s.trim().toUpperCase());
          return eSecs.includes(upperVal);
        });

        // 2. If not matched, search by matching abbreviation AND section (handling "GH", "ABC", "DE")
        if (!matchedEntry) {
          matchedEntry = courseEntries.find(e => {
            if (e.abbr.toUpperCase() !== abbr) return false;
            const eSecs = (e.sections || '').trim().toUpperCase();
            if (eSecs.includes(section.toUpperCase())) return true;
            const parts = eSecs.split(/[\s,]+/).map(p => p.trim());
            return parts.some(p => p.includes(section.toUpperCase()) || section.toUpperCase().includes(p));
          });
        }

        // 3. If still not matched, fallback to abbreviation match
        if (!matchedEntry) {
          matchedEntry = courseEntries.find(e => e.abbr.toUpperCase() === abbr);
        }

        if (matchedEntry) {
          courseName = matchedEntry.courseName;
          professor = matchedEntry.professor;
        } else {
          courseName = cellVal;
          professor = "Staff/Instructor";
        }
      }

      if (section && section !== 'N/A' && section !== 'all') {
        sectionsSet.add(section);
      }

      items.push({
        id: `item-${rowIndex}-${roomName}-${abbr}-${section}`,
        date,
        time,
        classroom: roomName,
        originalCode: cellVal,
        abbr,
        section,
        courseName,
        professor,
        isCancelled
      });
    });
  });

  return {
    items,
    courses: coursesList,
    classrooms: Array.from(classroomsSet).sort(),
    sections: Array.from(sectionsSet).sort(),
    dates: sortDateStrings(Array.from(datesSet))
  };
};
