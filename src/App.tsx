/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, FormEvent, useCallback } from 'react';
import Papa from 'papaparse';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  User, 
  Users,
  MapPin, 
  Layers, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  RefreshCw, 
  Info, 
  ChevronDown, 
  Check, 
  Sparkles, 
  Database, 
  FileText, 
  X,
  HelpCircle,
  AlertTriangle,
  LayoutGrid,
  School,
  Activity,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Lock,
  Coffee,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SAMPLE_SCHEDULE_CSV, 
  SAMPLE_COURSE_MAPPING_CSV, 
  DEFAULT_SCHEDULE_URL, 
  DEFAULT_COURSE_URL 
} from './sampleData';
import { 
  TimetableItem, 
  TimetableData, 
  CourseLookup, 
  CourseInfo 
} from './types';

// Palette mapping helper for courses matching the theme
const courseColorIndices: Record<string, number> = {};
let nextColorIndex = 0;

function getCourseColor(abbr: string): { 
  bg: string; 
  text: string; 
  border: string; 
  badge: string; 
  borderL: string;
  textDark: string;
} {
  const colors = [
    { 
      bg: 'bg-indigo-100 dark:bg-indigo-950/50', 
      text: 'text-indigo-700 dark:text-indigo-300', 
      border: 'border-indigo-300 dark:border-indigo-900', 
      badge: 'bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100 border border-indigo-300/65 dark:border-indigo-800/40', 
      borderL: 'border-indigo-600 dark:border-indigo-400', 
      textDark: 'text-indigo-950 dark:text-indigo-100' 
    },
    { 
      bg: 'bg-amber-100 dark:bg-amber-950/50', 
      text: 'text-amber-700 dark:text-amber-300', 
      border: 'border-amber-300 dark:border-amber-900', 
      badge: 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 border border-amber-300/65 dark:border-amber-800/40', 
      borderL: 'border-amber-600 dark:border-amber-400', 
      textDark: 'text-amber-950 dark:text-amber-100' 
    },
    { 
      bg: 'bg-emerald-100 dark:bg-emerald-950/50', 
      text: 'text-emerald-700 dark:text-emerald-300', 
      border: 'border-emerald-300 dark:border-emerald-900', 
      badge: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 border border-emerald-300/65 dark:border-emerald-800/40', 
      borderL: 'border-emerald-600 dark:border-emerald-400', 
      textDark: 'text-emerald-955 dark:text-emerald-100' 
    },
    { 
      bg: 'bg-sky-100 dark:bg-sky-950/50', 
      text: 'text-sky-700 dark:text-sky-300', 
      border: 'border-sky-300 dark:border-sky-900', 
      badge: 'bg-sky-200 text-sky-900 dark:bg-sky-900 dark:text-sky-100 border border-sky-300/65 dark:border-sky-800/40', 
      borderL: 'border-sky-600 dark:border-sky-400', 
      textDark: 'text-sky-955 dark:text-sky-100' 
    },
    { 
      bg: 'bg-fuchsia-100 dark:bg-fuchsia-950/50', 
      text: 'text-fuchsia-700 dark:text-fuchsia-300', 
      border: 'border-fuchsia-300 dark:border-fuchsia-900', 
      badge: 'bg-fuchsia-200 text-fuchsia-900 dark:bg-fuchsia-900 dark:text-fuchsia-100 border border-fuchsia-300/65 dark:border-fuchsia-800/40', 
      borderL: 'border-fuchsia-600 dark:border-fuchsia-400', 
      textDark: 'text-fuchsia-955 dark:text-fuchsia-100' 
    },
    { 
      bg: 'bg-violet-100 dark:bg-violet-950/50', 
      text: 'text-violet-700 dark:text-violet-300', 
      border: 'border-violet-300 dark:border-violet-900', 
      badge: 'bg-violet-200 text-violet-900 dark:bg-violet-900 dark:text-violet-100 border border-violet-300/65 dark:border-violet-800/40', 
      borderL: 'border-violet-600 dark:border-violet-400', 
      textDark: 'text-violet-955 dark:text-violet-100' 
    },
    { 
      bg: 'bg-teal-100 dark:bg-teal-950/50', 
      text: 'text-teal-700 dark:text-teal-300', 
      border: 'border-teal-300 dark:border-teal-900', 
      badge: 'bg-teal-200 text-teal-900 dark:bg-teal-900 dark:text-teal-100 border border-teal-300/65 dark:border-teal-800/40', 
      borderL: 'border-teal-600 dark:border-teal-400', 
      textDark: 'text-teal-955 dark:text-teal-100' 
    },
    { 
      bg: 'bg-orange-100 dark:bg-orange-950/50', 
      text: 'text-orange-700 dark:text-orange-300', 
      border: 'border-orange-300 dark:border-orange-900', 
      badge: 'bg-orange-200 text-orange-900 dark:bg-orange-900 dark:text-orange-100 border border-orange-300/65 dark:border-orange-800/40', 
      borderL: 'border-orange-600 dark:border-orange-400', 
      textDark: 'text-orange-955 dark:text-orange-100' 
    },
    { 
      bg: 'bg-cyan-100 dark:bg-cyan-950/50', 
      text: 'text-cyan-700 dark:text-cyan-300', 
      border: 'border-cyan-300 dark:border-cyan-900', 
      badge: 'bg-cyan-200 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-100 border border-cyan-300/65 dark:border-cyan-800/40', 
      borderL: 'border-cyan-600 dark:border-cyan-400', 
      textDark: 'text-cyan-955 dark:text-cyan-100' 
    },
    { 
      bg: 'bg-pink-100 dark:bg-pink-950/50', 
      text: 'text-pink-700 dark:text-pink-300', 
      border: 'border-pink-300 dark:border-pink-900', 
      badge: 'bg-pink-200 text-pink-900 dark:bg-pink-900 dark:text-pink-100 border border-pink-300/65 dark:border-pink-800/40', 
      borderL: 'border-pink-600 dark:border-pink-400', 
      textDark: 'text-pink-955 dark:text-pink-100' 
    }
  ];
  
  if (!abbr) return colors[0];
  if (abbr.toUpperCase() === 'BLOCKED') {
    return {
      bg: 'bg-red-100 dark:bg-red-950/50',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-300 dark:border-red-900',
      badge: 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100 border border-red-300/65 dark:border-red-800/40',
      borderL: 'border-red-600',
      textDark: 'text-red-955 dark:text-red-200'
    };
  }
  if (abbr.toUpperCase() === 'HOLIDAY') {
    return {
      bg: 'bg-emerald-100 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-900',
      badge: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 border border-emerald-300/65 dark:border-emerald-800/40',
      borderL: 'border-emerald-500',
      textDark: 'text-emerald-955 dark:text-emerald-200'
    };
  }
  const upperAbbr = abbr.toUpperCase().trim();
  if (courseColorIndices[upperAbbr] === undefined) {
    courseColorIndices[upperAbbr] = nextColorIndex;
    nextColorIndex = (nextColorIndex + 1) % colors.length;
  }
  const index = courseColorIndices[upperAbbr];
  return colors[index];
}

// Custom Helper to parse Date safely from various formats (e.g., "Monday, June 29, 2026")
function parseDateString(dateStr: string): Date {
  const cleanStr = dateStr.trim();
  if (!cleanStr) return new Date(0);

  // Try standard parsing first
  let d = new Date(cleanStr);
  if (!isNaN(d.getTime())) {
    return d;
  }

  // Handle formats like "Monday, June 29, 2026" by stripping the day of week and comma
  if (cleanStr.includes(',')) {
    const parts = cleanStr.split(',');
    if (parts.length > 1) {
      const weekdayPattern = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
      if (weekdayPattern.test(parts[0].trim())) {
        const remaining = parts.slice(1).join(',').trim();
        d = new Date(remaining);
        if (!isNaN(d.getTime())) {
          return d;
        }
      }
    }
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY formats (common in spreadsheets)
  const dmYRegex = /^(\d{1,2})[/\.-](\d{1,2})[/\.-](\d{4})$/;
  const match = cleanStr.match(dmYRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    const year = parseInt(match[3], 10);
    return new Date(year, month, day);
  }

  // Handle YYYY/MM/DD or YYYY-MM-DD
  const YmdRegex = /^(\d{4})[/\.-](\d{1,2})[/\.-](\d{1,2})$/;
  const matchYmd = cleanStr.match(YmdRegex);
  if (matchYmd) {
    const year = parseInt(matchYmd[1], 10);
    const month = parseInt(matchYmd[2], 10) - 1;
    const day = parseInt(matchYmd[3], 10);
    return new Date(year, month, day);
  }

  return new Date(0);
}

// Custom Helper to sort date strings chronologically
function sortDateStrings(dateStrings: string[]): string[] {
  return [...dateStrings].sort((a, b) => {
    const timeA = parseDateString(a).getTime();
    const timeB = parseDateString(b).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.localeCompare(b);
  });
}

// Custom Helper to format Date nicely
function formatDateString(dateStr: string): string {
  try {
    const dateObj = parseDateString(dateStr);
    if (isNaN(dateObj.getTime()) || dateObj.getTime() === 0) return dateStr;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export default function App() {
  // Master timetable state
  const [timetable, setTimetable] = useState<TimetableData>({
    items: [],
    courses: [],
    classrooms: [],
    sections: [],
    dates: []
  });

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Not Synced');

  // Filters state
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'agenda' | 'grid' | 'calendar'>('agenda');
  const [calendarMonth, setCalendarMonth] = useState<number>(5); // June
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [inspectedDate, setInspectedDate] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('timetable_dark_mode') === 'true';
  });

  // Dark mode class syncing
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('timetable_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('timetable_dark_mode', 'false');
    }
  }, [isDark]);

  // Parser core function
  const parseAndProcessData = (scheduleCsv: string, courseCsv: string): TimetableData => {
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
      const time = (row[timeKey] || '').trim();

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

        const cellVal = (row[roomCol] || '').trim();
        // Ignore empty cells and LUNCH BREAK
        if (!cellVal || cellVal === "" || cellVal.toUpperCase() === "LUNCH BREAK") {
          return;
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
          professor
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

  // Perform full fetch and sync
  const loadTimetableData = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let scheduleText = '';
      let courseText = '';
      let fetchedFromBackend = false;

      try {
        // Attempt to load from secure backend API (proxying env variables)
        const response = await fetch('/api/timetable');
        if (response.ok) {
          const data = await response.json();
          if (data.scheduleCsv && data.courseCsv) {
            scheduleText = data.scheduleCsv;
            courseText = data.courseCsv;
            fetchedFromBackend = true;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn("Backend timetable fetch did not succeed.", errData);
        }
      } catch (backendErr) {
        console.warn("Backend endpoint not reachable or returned error:", backendErr);
      }

      // Fallback to local demo timetable if backend is not set up / returns empty
      if (!fetchedFromBackend) {
        console.info("Falling back to local demo sandbox timetable data.");
        const parsed = parseAndProcessData(SAMPLE_SCHEDULE_CSV, SAMPLE_COURSE_MAPPING_CSV);
        setTimetable(parsed);
        setSuccessMsg("Synced with demo sample timetable! (Backend env not configured or reachable)");
        
        const now = new Date();
        setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Sandbox)');
      } else {
        const parsed = parseAndProcessData(scheduleText, courseText);
        
        if (parsed.items.length === 0) {
          throw new Error("No classes or sessions found in the fetched schedule CSV. Ensure headers and cell formats are correct.");
        }

        setTimetable(parsed);
        setSuccessMsg(`Fetched and synced successfully with live Google Sheet! ${parsed.items.length} classes mapped.`);
        
        const now = new Date();
        setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during processing.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger load on mounting
  useEffect(() => {
    loadTimetableData();
  }, []);

  // Filtered timetable items based on selectors & query search
  const filteredItems = useMemo(() => {
    return timetable.items.filter(item => {
      const isSpecial = item.abbr === 'BLOCKED' || item.abbr === 'HOLIDAY';
      const matchSection = selectedSection === 'all' || item.section === selectedSection || isSpecial;
      const matchCourse = selectedCourse === 'all' || item.abbr === selectedCourse || isSpecial;
      const matchRoom = selectedClassroom === 'all' || item.classroom === selectedClassroom;
      const matchDate = selectedDate === 'all' || item.date === selectedDate;
      
      const searchLower = searchQuery.toLowerCase().trim();
      const matchSearch = !searchLower || 
        item.courseName.toLowerCase().includes(searchLower) ||
        item.abbr.toLowerCase().includes(searchLower) ||
        item.professor.toLowerCase().includes(searchLower) ||
        item.classroom.toLowerCase().includes(searchLower) ||
        item.section.toLowerCase().includes(searchLower) ||
        isSpecial;

      return matchSection && matchCourse && matchRoom && matchDate && matchSearch;
    });
  }, [timetable.items, selectedSection, selectedCourse, selectedClassroom, selectedDate, searchQuery]);

  // Set the first date available as default if filter date is not set, or keep 'all'
  const activeGridDate = useMemo(() => {
    if (selectedDate !== 'all') return selectedDate;
    return timetable.dates[0] || '';
  }, [selectedDate, timetable.dates]);

  // Unique time slots list
  const uniqueTimeSlots = useMemo(() => {
    const slots = Array.from(new Set(timetable.items.map(item => item.time)));
    return slots.sort((a: string, b: string) => a.localeCompare(b));
  }, [timetable.items]);

  // Grouped agenda: Group filtered items by Date, then Sort by Time
  const groupedAgenda = useMemo(() => {
    const groups: { [date: string]: TimetableItem[] } = {};
    filteredItems.forEach(item => {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }
      groups[item.date].push(item);
    });

    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => a.time.localeCompare(b.time));
    });

    return groups;
  }, [filteredItems]);

  // Anchor date for academic timeline tracker: June 27, 2026 (Saturday)
  const todayDateObj = useMemo(() => new Date(2026, 5, 27), []);

  const getDetailedDateStatus = useCallback((dateStr: string) => {
    const dateObj = parseDateString(dateStr);
    if (isNaN(dateObj.getTime())) return { label: 'Unknown', color: 'text-slate-400', badge: 'bg-slate-100 text-slate-500' };
    
    const dZero = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
    const tZero = new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), todayDateObj.getDate()).getTime();
    
    if (dZero < tZero) {
      return { 
        label: 'Past Day', 
        color: 'text-slate-400 dark:text-slate-500', 
        badge: 'bg-slate-100 dark:bg-slate-900/40 text-slate-500 dark:text-slate-450 border border-slate-200 dark:border-slate-800' 
      };
    }
    if (dZero === tZero) {
      return { 
        label: 'Today', 
        color: 'text-indigo-650 dark:text-indigo-400 font-bold', 
        badge: 'bg-indigo-600 text-white border border-indigo-600' 
      };
    }
    
    // Check if it is the first active date strictly after today
    const sortedFutureDates = sortDateStrings(timetable.dates).filter(ds => {
      const p = parseDateString(ds);
      return new Date(p.getFullYear(), p.getMonth(), p.getDate()).getTime() > tZero;
    });
    if (sortedFutureDates.length > 0 && sortedFutureDates[0] === dateStr) {
      return { 
        label: 'Next in Sequence', 
        color: 'text-amber-600 dark:text-amber-400 font-bold', 
        badge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-850' 
      };
    }
    
    return { 
      label: 'Upcoming Day', 
      color: 'text-emerald-600 dark:text-emerald-400', 
      badge: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
    };
  }, [timetable.dates, todayDateObj]);

  const dateToDatesMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    timetable.dates.forEach(ds => {
      const parsed = parseDateString(ds);
      if (!isNaN(parsed.getTime())) {
        const key = `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}`;
        map[key] = ds;
      }
    });
    return map;
  }, [timetable.dates]);

  const nextActiveDate = useMemo(() => {
    if (timetable.dates.length === 0) return null;
    const tZero = new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), todayDateObj.getDate()).getTime();
    
    const sortedDates = sortDateStrings(timetable.dates);
    const upcoming = sortedDates.find(ds => {
      const d = parseDateString(ds);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() >= tZero;
    });
    
    return upcoming || sortedDates[sortedDates.length - 1];
  }, [timetable.dates, todayDateObj]);

  const availableMonths = useMemo(() => {
    const months: { monthNum: number; year: number; label: string }[] = [];
    timetable.dates.forEach(ds => {
      const p = parseDateString(ds);
      if (!isNaN(p.getTime())) {
        const mNum = p.getMonth();
        const yr = p.getFullYear();
        const lbl = p.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!months.some(m => m.monthNum === mNum && m.year === yr)) {
          months.push({ monthNum: mNum, year: yr, label: lbl });
        }
      }
    });
    return months.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNum - b.monthNum;
    });
  }, [timetable.dates]);

  // Handle Export as CSV
  const handleExportCSV = () => {
    if (filteredItems.length === 0) return;
    const csvRows = [
      ['Date', 'Time', 'Classroom', 'Course Code', 'Course Name', 'Section', 'Professor']
    ];
    filteredItems.forEach(item => {
      csvRows.push([
        item.date,
        item.time,
        item.classroom,
        `${item.abbr}-${item.section}`,
        item.courseName,
        item.section,
        item.professor
      ]);
    });

    const csvContent = csvRows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `campus_sync_schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedSection('all');
    setSelectedCourse('all');
    setSelectedClassroom('all');
    setSelectedDate('all');
    setSearchQuery('');
  };

  // Find the Active Now or upcoming class for the Current Status sidebar widget
  const activeNowClass = useMemo(() => {
    if (timetable.items.length === 0) return null;
    // By default, show the first item of the filtered list, or first item in total
    return filteredItems[0] || timetable.items[0];
  }, [filteredItems, timetable.items]);

  // Calculate stats for the bottom bar
  const totalClassesCount = filteredItems.length;
  const uniqueClassroomsCount = new Set(filteredItems.map(i => i.classroom)).size;

  return (
    <div className={`h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden text-slate-900 dark:text-slate-100 print:h-auto print:overflow-visible print:bg-white ${isDark ? 'dark' : ''}`}>
      
      {/* Sleek Top Banner */}
      <div className="bg-slate-950 text-slate-300 text-center py-1 px-4 text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 print:hidden shrink-0 border-b border-slate-850">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Made by <strong className="text-white">ABC Batch PGP 2026-28</strong></span>
      </div>

      {/* Sleek Header Navigation */}
      <header className="h-12 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shadow-xs z-25 print:relative print:border-b-2 print:shadow-none">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Toggle Sidebar Menu"
            aria-label="Toggle Sidebar Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100 dark:shadow-none print:bg-slate-800 shrink-0">
            <School className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm sm:text-lg font-extrabold tracking-tight text-slate-800 dark:text-white leading-none">
              Campus<span className="text-indigo-600 dark:text-indigo-400">Sync</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5 print:hidden">Published spreadsheet mapper</p>
          </div>
        </div>

        {/* Viewing Section Selector & Live update status (Sleek Theme pattern) */}
        <div className="flex items-center gap-2 sm:gap-3 print:hidden">
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
            <label htmlFor="sectionSelect" className="text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mr-1.5">
              Section:
            </label>
            <select 
              id="sectionSelect" 
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:outline-hidden cursor-pointer py-0 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All ({timetable.sections.length})</option>
              {timetable.sections.map(sec => (
                <option key={sec} value={sec} className="dark:bg-slate-900 dark:text-white">Sec {sec}</option>
              ))}
            </select>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-wide uppercase">Live Updates Active</span>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredItems.length === 0}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
            title="Download/Export timetable as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            disabled={filteredItems.length === 0}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-700 cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* Main Layout containing Sidebar + Content Container */}
      <main className="flex-1 flex overflow-hidden print:overflow-visible print:block relative">
        
        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-35 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* SLEEK SIDEBAR */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col gap-5 overflow-y-auto transition-transform duration-300 lg:translate-x-0 lg:static lg:flex print:hidden shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between lg:hidden border-b border-slate-100 dark:border-slate-800 pb-3 mb-1 shrink-0">
            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Navigation Menu</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 text-slate-500 hover:text-slate-700 dark:hover:bg-slate-850 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Viewing Section Select */}
          <div className="sm:hidden space-y-1">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Viewing Section
            </h3>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
              <select 
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full bg-transparent border-none text-xs font-semibold focus:outline-hidden cursor-pointer text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Sections ({timetable.sections.length})</option>
                {timetable.sections.map(sec => (
                  <option key={sec} value={sec} className="dark:bg-slate-900 dark:text-white">Section {sec}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Current Status Widget */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
              <Activity className="w-3 h-3 text-indigo-500" />
              <span>Current Status</span>
            </h3>
            
            {activeNowClass ? (
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl p-4 border border-indigo-100/80 dark:border-indigo-900/50 space-y-3">
                <div>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">Active / Next</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{activeNowClass.courseName}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{activeNowClass.professor}</p>
                </div>
                <div className="pt-2 border-t border-indigo-100/50 dark:border-indigo-950/50 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-450 font-mono">
                  <span>Room: <strong className="text-indigo-950 dark:text-indigo-300">{activeNowClass.classroom}</strong></span>
                  <span>Sec: <strong className="text-indigo-950 dark:text-indigo-300">{activeNowClass.section}</strong></span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-850 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                No classes loaded
              </div>
            )}
          </div>

          {/* SYNC TIMETABLE ACTION BUTTON */}
          <div className="border border-indigo-100 dark:border-indigo-900/40 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/20 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Live Schedule Sync</span>
            </div>
            
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Timetable pulls live from Google Sheets. Click sync below to refresh with latest entries instantly.
            </p>

            <button
              onClick={() => loadTimetableData()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Tools & Actions</h3>

            <button
              onClick={handleExportCSV}
              disabled={filteredItems.length === 0}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Export Filtered CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              disabled={filteredItems.length === 0}
              className="w-full flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Timetable</span>
            </button>
          </div>

          {/* Courses Overview Badged List */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">Course Overview</h3>
            {timetable.courses.length > 0 ? (
              <ul className="space-y-1.5">
                {timetable.courses.slice(0, 8).map((course) => {
                  const colors = getCourseColor(course.abbr);
                  return (
                    <li key={course.abbr} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-350 font-medium truncate max-w-[120px]">{course.courseName}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${colors.badge}`}>
                        {course.abbr}
                      </span>
                    </li>
                  );
                })}
                {timetable.courses.length > 8 && (
                  <li className="text-[10px] text-slate-400 dark:text-slate-500 italic pt-1 text-center">
                    + {timetable.courses.length - 8} more courses
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No course maps found</p>
            )}
          </div>

          {/* Sync Stats footer */}
          <div className="mt-auto border-t border-slate-150 dark:border-slate-800 pt-4 space-y-1">
            <div className="text-[9px] text-slate-400 dark:text-slate-500 leading-relaxed font-mono">
              Source: Live Google Sheets<br />
              Last sync: {lastSyncTime}
            </div>
          </div>
        </aside>

        {/* TIMETABLE CONTENT VIEWPORT */}
        <section className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden p-3.5 sm:p-6 gap-4 sm:gap-6 print:p-0 print:overflow-visible print:block">
          
          {/* Success/Error Alerts inside viewports */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 p-3.5 rounded-xl text-xs text-rose-950 dark:text-rose-400 flex items-start gap-2 print:hidden">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-bold">Sync error occurred</p>
                <p className="text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            </div>
          )}

          {successMsg && !error && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 p-2.5 rounded-xl text-xs text-emerald-950 dark:text-emerald-400 flex items-center gap-2 print:hidden">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="flex-1 font-medium">{successMsg}</p>
            </div>
          )}

          {/* Master Filters and View Mode Controls Row */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-2.5 shadow-2xs print:hidden shrink-0">
            
            {/* Search & Tabs control */}
            <div className="flex flex-col lg:flex-row gap-2.5 items-stretch justify-between">
              
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-3.5 h-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by course code, full title, professor, or room..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-lg pl-9 pr-8 py-1.5 text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden text-slate-900 dark:text-white"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Switcher Tabs (Agenda vs Room Grid vs Interactive Calendar) */}
              <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg shrink-0 self-center lg:self-auto gap-0.5">
                <button
                  onClick={() => setViewMode('agenda')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                    viewMode === 'agenda' 
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' 
                      : 'text-slate-500 dark:text-slate-450 hover:text-slate-850 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Agenda List</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' 
                      : 'text-slate-500 dark:text-slate-450 hover:text-slate-850 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Room Occupancy Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                    viewMode === 'calendar' 
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' 
                      : 'text-slate-500 dark:text-slate-450 hover:text-slate-850 dark:hover:text-slate-200'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Interactive Calendar</span>
                </button>
              </div>
            </div>

            {/* Horizontal Section Pills - Highly Accessible on Mobile! */}
            <div className="space-y-1 border-t border-b border-slate-100 dark:border-slate-800/60 py-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Choose Section (Front & Center)</span>
                </label>
                {selectedSection !== 'all' && (
                  <button 
                    onClick={() => setSelectedSection('all')}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
                <button
                  onClick={() => setSelectedSection('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                    selectedSection === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  All Sections ({timetable.sections.length})
                </button>
                {timetable.sections.map(sec => (
                  <button
                    key={sec}
                    onClick={() => setSelectedSection(sec)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                      selectedSection === sec
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    Section {sec}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              
              {/* Date selection */}
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Select Date</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all" className="dark:bg-slate-900 dark:text-white">All Dates ({timetable.dates.length})</option>
                  {timetable.dates.map(date => (
                    <option key={date} value={date} className="dark:bg-slate-900 dark:text-white">{date}</option>
                  ))}
                </select>
              </div>

              {/* Course selection */}
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Select Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all" className="dark:bg-slate-900 dark:text-white">All Courses ({timetable.courses.length})</option>
                  {timetable.courses.map(course => (
                    <option key={course.abbr} value={course.abbr} className="dark:bg-slate-900 dark:text-white">{course.abbr} - {course.courseName}</option>
                  ))}
                </select>
              </div>

              {/* Classroom location */}
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Classroom</label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all" className="dark:bg-slate-900 dark:text-white">All Classrooms ({timetable.classrooms.length})</option>
                  {timetable.classrooms.map(room => (
                    <option key={room} value={room} className="dark:bg-slate-900 dark:text-white">{room}</option>
                  ))}
                </select>
              </div>

              {/* Reset button inside filter grids */}
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  disabled={selectedDate === 'all' && selectedCourse === 'all' && selectedClassroom === 'all' && selectedSection === 'all' && !searchQuery}
                  className="w-full text-center py-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>

            </div>

          </div>

          {/* DYNAMIC SCENE VIEWS CONTAINER */}
          <div className="flex-1 overflow-y-auto min-h-0 print:overflow-visible">
            
            {filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3 max-w-md mx-auto my-8">
                <div className="p-3.5 bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">No Class Sessions Match Your Criteria</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Try clearing search queries or setting the Section, Course or Classroom dropdowns back to "All".
                  </p>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-400 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  Reset Active Filters
                </button>
              </div>
            ) : (
              <>
                {/* AGENDA MODE */}
                {viewMode === 'agenda' && (
                  <div className="space-y-6 print:space-y-4">
                    {sortDateStrings(Object.keys(groupedAgenda)).map(dateStr => (
                      <div key={dateStr} className="space-y-2.5">
                        
                        {/* Day / Date Header banner */}
                        <div className="bg-slate-100/80 dark:bg-slate-900/40 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                            📅 {formatDateString(dateStr)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                            {dateStr} • {groupedAgenda[dateStr].length} classes
                          </span>
                        </div>
                        {/* List cards (matches the style criteria for Sleek Interface theme cards) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {groupedAgenda[dateStr].map((item) => {
                            const colors = getCourseColor(item.abbr);
                            return (
                              <div
                                key={item.id}
                                className={`${colors.bg} border-l-4 ${colors.borderL} border ${colors.border} rounded-lg p-3.5 shadow-xs transition-all hover:shadow-md space-y-2.5`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                                      {item.time}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold font-mono tracking-wider shrink-0 ${colors.badge}`}>
                                      {item.abbr === 'BLOCKED' ? 'BLOCKED' : `${item.abbr}-${item.section}`}
                                    </span>
                                  </div>
                                  <h4 className={`text-xs font-bold line-clamp-2 mt-1 leading-snug ${colors.textDark || 'text-slate-900 dark:text-white'}`}>
                                    {item.courseName}
                                  </h4>
                                </div>

                                <div className={`pt-2 border-t ${colors.border} flex flex-col gap-1 text-[10px] text-slate-600 dark:text-slate-300 font-medium`}>
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                                    <span className="truncate italic">{item.professor}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                                    <span className="font-bold">{item.classroom}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* OCCUPANCY GRID MATRIX */}
                {viewMode === 'grid' && (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs print:hidden">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">Room Allocation Chart</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Timeline allocation matrices across room channels. Active date: <strong className="text-indigo-600 dark:text-indigo-400">{activeGridDate}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Pick Matrix Date:</span>
                        <select
                          value={selectedDate === 'all' ? activeGridDate : selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded px-2 py-1 text-[11px] font-semibold focus:outline-hidden cursor-pointer"
                        >
                          {timetable.dates.map(date => (
                            <option key={date} value={date} className="dark:bg-slate-900 dark:text-white">{date}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[750px]">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-805">
                              <th className="p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-950 z-10 w-40">
                                🕒 TIME SLOT
                              </th>
                              {timetable.classrooms.map(room => (
                                <th 
                                  key={room} 
                                  className={`p-3 text-[10px] font-bold text-slate-900 dark:text-slate-100 tracking-tight text-center border-l border-slate-200 dark:border-slate-800 ${
                                    selectedClassroom === room ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200' : ''
                                  }`}
                                >
                                  {room}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {uniqueTimeSlots.map((timeSlot) => (
                              <tr key={timeSlot} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-all">
                                <td className="p-3 text-[10px] font-bold text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 shadow-3xs z-10 font-mono">
                                  {timeSlot}
                                </td>

                                {timetable.classrooms.map(room => {
                                  const session = timetable.items.find(item => 
                                    item.date === activeGridDate && 
                                    item.time === timeSlot && 
                                    item.classroom === room
                                  );

                                  const matchesFilters = session ? filteredItems.some(f => f.id === session.id) : false;
                                  const colors = session ? getCourseColor(session.abbr) : null;

                                  return (
                                    <td 
                                      key={room} 
                                      className={`p-2.5 text-center border-l border-slate-200 dark:border-slate-805 min-w-36 align-middle ${
                                        selectedClassroom === room ? 'bg-indigo-50/15 dark:bg-indigo-950/10' : ''
                                      }`}
                                    >
                                      {session ? (
                                        <div 
                                          className={`rounded-lg p-2.5 text-left border transition-all ${
                                            matchesFilters 
                                              ? `${colors?.bg} border-l-4 ${colors?.borderL} border ${colors?.border} text-slate-900 dark:text-slate-100` 
                                              : 'bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-805 opacity-30'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-1">
                                            <span className={`text-[9px] font-extrabold font-mono tracking-wider px-1 rounded ${
                                              matchesFilters ? colors?.badge : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                            }`}>
                                              {session.abbr}
                                            </span>
                                            {session.abbr !== 'BLOCKED' && (
                                              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-550 font-mono">
                                                Sect. {session.section}
                                              </span>
                                            )}
                                          </div>
                                          <h5 className={`font-bold text-[11px] mt-1 leading-snug line-clamp-1 ${
                                            matchesFilters ? 'text-slate-900 dark:text-slate-150' : 'text-slate-400 dark:text-slate-600'
                                          }`}>
                                            {session.courseName}
                                          </h5>
                                          <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                                            👤 {session.professor}
                                          </p>
                                        </div>
                                      ) : (
                                        <span className="text-[9px] text-slate-300 dark:text-slate-700 font-mono">-- empty --</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* INTERACTIVE CALENDAR VIEW */}
                {viewMode === 'calendar' && (() => {
                  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
                  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                  const monthName = monthNames[calendarMonth];
                  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

                  // Find the selected inspected date's timetable items
                  const activeInspectedDate = inspectedDate || nextActiveDate || '';
                  const inspectedItems = timetable.items.filter(item => item.date === activeInspectedDate);
                  const statusInfo = activeInspectedDate ? getDetailedDateStatus(activeInspectedDate) : null;

                  // List of all holidays and blocked slots in the dataset to show in a legend / special list
                  const specialDaysList = timetable.items.reduce((acc: { date: string; type: 'HOLIDAY' | 'BLOCKED'; name: string }[], item) => {
                    if (item.abbr === 'HOLIDAY' || item.abbr === 'BLOCKED') {
                      if (!acc.some(x => x.date === item.date && x.type === item.abbr)) {
                        acc.push({
                          date: item.date,
                          type: item.abbr,
                          name: item.courseName
                        });
                      }
                    }
                    return acc;
                  }, []);

                  return (
                    <div className="space-y-6">
                      
                      {/* Timeline Tracker & Sequence Header */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Tracker Card 1: Today Status */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Today's Academic Reference</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">Saturday, June 27, 2026</span>
                            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 bg-indigo-500 animate-ping rounded-full inline-block"></span>
                              <span>Weekend / Prep Day (No Classes)</span>
                            </span>
                          </div>
                        </div>

                        {/* Tracker Card 2: Next in Sequence */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Next Active Day in Sequence</span>
                            {nextActiveDate ? (
                              <>
                                <span className="text-sm font-bold text-slate-900 dark:text-white truncate block mt-0.5">{formatDateString(nextActiveDate)}</span>
                                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-0.5 font-mono block">Starts Monday • {timetable.items.filter(i => i.date === nextActiveDate).length} lectures scheduled</span>
                              </>
                            ) : (
                              <span className="text-xs text-slate-500 dark:text-slate-400 italic block mt-0.5">No upcoming dates found</span>
                            )}
                          </div>
                        </div>

                        {/* Tracker Card 3: Holidays & Blocked Summary */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-xs">
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Holidays & Reserved slots</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white block mt-0.5">
                              {specialDaysList.filter(s => s.type === 'HOLIDAY').length} Holidays • {specialDaysList.filter(s => s.type === 'BLOCKED').length} Blocks
                            </span>
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block mt-0.5">All tracked automatically in calendar grid</span>
                          </div>
                        </div>

                      </div>

                      {/* Main Calendar Viewport Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        
                        {/* CALENDAR TILE MATRIX (Takes 3 columns on desktop) */}
                        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
                          
                          {/* Calendar Month Navigation Header */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                                {monthName} {calendarYear}
                              </h3>
                              <p className="text-[10px] text-slate-500 dark:text-slate-450">Click any date to inspect daily lecture slots</p>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Quick Month Select Drops */}
                              {availableMonths.length > 0 && (
                                <select
                                  value={`${calendarYear}-${calendarMonth}`}
                                  onChange={(e) => {
                                    const [y, m] = e.target.value.split('-').map(Number);
                                    setCalendarMonth(m);
                                    setCalendarYear(y);
                                  }}
                                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 rounded px-2.5 py-1.5 text-xs font-bold focus:outline-hidden"
                                >
                                  {availableMonths.map(item => (
                                    <option key={`${item.year}-${item.monthNum}`} value={`${item.year}-${item.monthNum}`}>
                                      {item.label}
                                    </option>
                                  ))}
                                </select>
                              )}

                              <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850">
                                <button
                                  onClick={() => {
                                    if (calendarMonth === 0) {
                                      setCalendarMonth(11);
                                      setCalendarYear(calendarYear - 1);
                                    } else {
                                      setCalendarMonth(calendarMonth - 1);
                                    }
                                  }}
                                  className="p-1 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                                  title="Previous Month"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (calendarMonth === 11) {
                                      setCalendarMonth(0);
                                      setCalendarYear(calendarYear + 1);
                                    } else {
                                      setCalendarMonth(calendarMonth + 1);
                                    }
                                  }}
                                  className="p-1 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                                  title="Next Month"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Legend Indicators */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-450 border-t border-b border-slate-100 dark:border-slate-850 py-2 shrink-0">
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded bg-indigo-600 inline-block"></span>
                              <span>Today (June 27)</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded border border-amber-400 bg-amber-50 dark:bg-amber-950/30 inline-block"></span>
                              <span>Next Active</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                              <span>Holidays</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded bg-red-600 inline-block"></span>
                              <span>Blocked Slots</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-800 inline-block"></span>
                              <span>Regular Days</span>
                            </span>
                          </div>

                          {/* Grid Headers Sun-Sat */}
                          <div className="grid grid-cols-7 gap-1.5 text-center font-extrabold text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                            {daysOfWeek.map(day => (
                              <div key={day} className="py-1">{day}</div>
                            ))}
                          </div>

                          {/* Grid Days Tiles */}
                          <div className="grid grid-cols-7 gap-1.5 flex-1">
                            {/* Empty spacing padding cells */}
                            {Array.from({ length: firstDayIndex }).map((_, idx) => (
                              <div 
                                key={`spacer-${idx}`} 
                                className="aspect-square bg-slate-50/50 dark:bg-slate-950/20 rounded-lg border border-dashed border-slate-100 dark:border-slate-900 opacity-30"
                              />
                            ))}

                            {/* Active Days Cells */}
                            {Array.from({ length: daysInMonth }).map((_, idx) => {
                              const d = idx + 1;
                              const matchingDateStr = dateToDatesMap[`${calendarYear}-${calendarMonth}-${d}`];
                              const dayItems = matchingDateStr ? timetable.items.filter(item => item.date === matchingDateStr) : [];
                              const holidays = dayItems.filter(item => item.abbr === 'HOLIDAY');
                              const blocked = dayItems.filter(item => item.abbr === 'BLOCKED');
                              const regularClasses = dayItems.filter(item => item.abbr !== 'HOLIDAY' && item.abbr !== 'BLOCKED');

                              // Determine Date states
                              const isToday = calendarYear === 2026 && calendarMonth === 5 && d === 27;
                              const isNextActive = nextActiveDate && matchingDateStr === nextActiveDate;
                              const isPast = new Date(calendarYear, calendarMonth, d).getTime() < todayDateObj.getTime();
                              const isInspected = matchingDateStr && activeInspectedDate === matchingDateStr;

                              let tileStyles = "bg-slate-50/70 dark:bg-slate-950/40 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 border-slate-100 dark:border-slate-850";
                              let borderAccent = "border";
                              let indicatorRing = "";

                              if (isPast) {
                                tileStyles = "bg-slate-50/30 dark:bg-slate-950/10 text-slate-400 dark:text-slate-600 opacity-65 border-slate-100 dark:border-slate-900";
                              }

                              if (dayItems.length > 0) {
                                if (holidays.length > 0) {
                                  const holColors = getCourseColor('HOLIDAY');
                                  tileStyles = `${holColors.bg} hover:brightness-95 dark:hover:brightness-110 text-emerald-800 dark:text-emerald-200 border ${holColors.border} shadow-3xs cursor-pointer`;
                                } else if (blocked.length > 0) {
                                  const blkColors = getCourseColor('BLOCKED');
                                  tileStyles = `${blkColors.bg} hover:brightness-95 dark:hover:brightness-110 text-red-800 dark:text-red-200 border ${blkColors.border} shadow-3xs cursor-pointer`;
                                } else if (regularClasses.length > 0) {
                                  const firstCourseColors = getCourseColor(regularClasses[0].abbr);
                                  tileStyles = `${firstCourseColors.bg} hover:brightness-95 dark:hover:brightness-110 text-slate-800 dark:text-slate-200 border ${firstCourseColors.border} shadow-3xs cursor-pointer`;
                                }
                              }

                              if (isToday) {
                                tileStyles = "bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-indigo-600 shadow-md shadow-indigo-150 dark:shadow-none";
                                indicatorRing = "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900";
                              } else if (isNextActive) {
                                tileStyles = "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 border-amber-400 dark:border-amber-700 font-semibold";
                                borderAccent = "border-2 animate-pulse";
                              }

                              if (isInspected) {
                                indicatorRing = "ring-2 ring-indigo-500 dark:ring-indigo-400 border-indigo-500 dark:border-indigo-400";
                              }

                              return (
                                <button
                                  key={`day-${d}`}
                                  disabled={!matchingDateStr && !isToday}
                                  onClick={() => {
                                    if (matchingDateStr) {
                                      setInspectedDate(matchingDateStr);
                                    }
                                  }}
                                  className={`aspect-square p-1.5 sm:p-2 rounded-xl flex flex-col justify-between items-stretch transition-all relative ${tileStyles} ${borderAccent} ${indicatorRing}`}
                                >
                                  {/* Day Number + Tiny category status label */}
                                  <div className="flex justify-between items-center w-full">
                                    <span className="text-[11px] sm:text-xs font-bold font-mono">
                                      {d}
                                    </span>
                                    
                                    {isToday && (
                                      <span className="text-[7px] font-extrabold uppercase bg-white text-indigo-700 px-1 py-0.2 rounded-sm tracking-wide shrink-0">Today</span>
                                    )}
                                    {isNextActive && !isToday && (
                                      <span className="text-[7px] font-extrabold uppercase bg-amber-500 text-white px-1 py-0.2 rounded-sm tracking-wide shrink-0 animate-bounce">Next</span>
                                    )}
                                  </div>

                                  {/* Inner Day details */}
                                  <div className="space-y-1">
                                    {/* Display Holidays or Blocked Slots */}
                                    {holidays.length > 0 && (
                                      <span className="block text-[7px] sm:text-[8px] font-extrabold bg-emerald-500 text-white px-1 py-0.5 rounded text-center truncate tracking-wide uppercase">
                                        🌴 Holiday
                                      </span>
                                    )}
                                    {blocked.length > 0 && holidays.length === 0 && (
                                      <span className="block text-[7px] sm:text-[8px] font-extrabold bg-red-600 text-white px-1 py-0.5 rounded text-center truncate tracking-wide uppercase">
                                        🚫 Blocked
                                      </span>
                                    )}

                                    {/* Display mini course-code badge lines if regular lectures exist */}
                                    {regularClasses.length > 0 && holidays.length === 0 && blocked.length === 0 && (
                                      <div className="flex flex-wrap gap-0.5 justify-center w-full max-h-5 overflow-hidden">
                                        {Array.from(new Set(regularClasses.map(c => c.abbr))).slice(0, 3).map((abbrCode, cIdx) => {
                                          const itemColors = getCourseColor(abbrCode as string);
                                          return (
                                            <span 
                                              key={cIdx} 
                                              className={`text-[7px] font-bold px-1 py-0.2 rounded shrink-0 scale-95 uppercase tracking-tighter ${
                                                isToday ? 'bg-white/20 text-white' : itemColors.badge
                                              }`}
                                            >
                                              {abbrCode}
                                            </span>
                                          );
                                        })}
                                        {Array.from(new Set(regularClasses.map(c => c.abbr))).length > 3 && (
                                          <span className={`text-[6px] font-bold shrink-0 ${isToday ? 'text-white/60' : 'text-slate-400'}`}>+</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                        </div>

                        {/* DETAIL INSPECTION DRAWER (Takes 2 columns on desktop) */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
                          
                          {/* Selected Date Header Status */}
                          <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">Selected Day Inspector</span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                              📅 {activeInspectedDate ? formatDateString(activeInspectedDate) : 'No Date Selected'}
                            </h4>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono mt-0.5">{activeInspectedDate}</p>

                            {/* Sequence Status Badge Pill */}
                            {statusInfo && (
                              <div className="flex gap-2 items-center mt-2.5">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${statusInfo.badge}`}>
                                  {statusInfo.label}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
                                  {inspectedItems.length} items on this day
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Render Detailed Day schedule or empty free-day message */}
                          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[350px]">
                            {inspectedItems.length === 0 ? (
                              <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
                                <div className="text-slate-400 dark:text-slate-550 flex justify-center text-2xl">🌴</div>
                                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Self-Study / Rest Day</h5>
                                <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed">
                                  Enjoy your weekend or catch up on PGP assignments! No official college lectures mapped in the sheet.
                                </p>
                              </div>
                            ) : (
                              inspectedItems.map(session => {
                                const isBlocked = session.abbr === 'BLOCKED';
                                const isHoliday = session.abbr === 'HOLIDAY';
                                const colors = getCourseColor(session.abbr);

                                return (
                                  <div 
                                    key={session.id}
                                    className={`p-3 rounded-xl border shadow-3xs flex flex-col gap-2 relative transition-all ${
                                      isBlocked 
                                        ? 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 border-l-4 border-l-red-600' 
                                        : isHoliday 
                                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/30 border-l-4 border-l-emerald-500' 
                                          : `${colors.bg} ${colors.border} border-l-4 ${colors.borderL}`
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 font-mono flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550 shrink-0" />
                                        <span>{session.time}</span>
                                      </span>

                                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold font-mono tracking-wider shrink-0 uppercase ${colors.badge}`}>
                                        {isBlocked ? 'Blocked Slot' : isHoliday ? 'Academic Holiday' : `${session.abbr}-${session.section}`}
                                      </span>
                                    </div>

                                    <div>
                                      <h5 className="text-xs font-bold text-slate-855 dark:text-slate-100 leading-snug">
                                        {session.courseName}
                                      </h5>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-450 font-medium">
                                      <span className="flex items-center gap-1 min-w-0 max-w-[50%]">
                                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate italic">{session.professor}</span>
                                      </span>
                                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-mono">
                                        <MapPin className="w-3.5 h-3.5 text-indigo-550 shrink-0" />
                                        <span className="font-bold">{session.classroom}</span>
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                        </div>

                      </div>

                    </div>
                  );
                })()}
              </>
            )}

          </div>

        </section>

      </main>

      {/* Sleek Bottom Status Bar */}
      <footer className="h-10 bg-slate-800 dark:bg-slate-950 text-white shrink-0 flex items-center px-4 sm:px-6 justify-between text-[10px] font-mono border-t border-slate-700 dark:border-slate-900 print:hidden">
        <div className="flex gap-4 sm:gap-6 uppercase tracking-wider font-semibold">
          <span className="opacity-60">Classes: {totalClassesCount}</span>
          <span className="opacity-60 hidden sm:inline">Rooms: {uniqueClassroomsCount}</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-indigo-400 dark:text-indigo-300 hidden md:inline">CampusSync v2.4.1</span>
          <button 
            onClick={() => loadTimetableData()} 
            disabled={loading}
            className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white px-2.5 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer font-sans text-[10px] font-bold"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </footer>

    </div>
  );
}
