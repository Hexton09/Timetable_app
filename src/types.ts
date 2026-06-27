export interface CourseMapping {
  "Abbr.": string;
  Course: string;
  Remarks: string;
}

export interface ScheduleRow {
  Date: string;
  Time: string;
  [classroom: string]: string; // Classroom columns like "CR A1", "CR A2"
}

export interface CourseInfo {
  abbr: string;
  courseName: string;
  professor: string;
}

export interface CourseLookup {
  [abbr: string]: CourseInfo;
}

export interface TimetableItem {
  id: string;
  date: string;
  time: string;
  classroom: string;
  originalCode: string;
  abbr: string;
  section: string;
  courseName: string;
  professor: string;
}

export interface TimetableData {
  items: TimetableItem[];
  courses: CourseInfo[];
  classrooms: string[];
  sections: string[];
  dates: string[];
}
