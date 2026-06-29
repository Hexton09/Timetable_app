import { useState, useEffect, useMemo, useCallback } from 'react';
import { TimetableData, TimetableItem } from '../types';
import { SAMPLE_SCHEDULE_CSV, SAMPLE_COURSE_MAPPING_CSV } from '../sampleData';
import { parseAndProcessData } from '../dataProcessor';
import { parseDateString, sortDateStrings } from '../utils';

export function useTimetable() {
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

  // Perform full fetch and sync
  const loadTimetableData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let scheduleText = '';
      let courseText = '';
      let fetchedFromBackend = false;

      try {
        // Attempt to load from secure backend API (proxying env variables) with cache busting
        const response = await fetch('/api/timetable?t=' + Date.now(), { cache: 'no-store' });
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
  }, []);

  // Trigger load on mounting and auto-sync when window regains focus
  useEffect(() => {
    loadTimetableData();

    const handleFocus = () => {
      console.log("Window focused, live syncing timetable...");
      loadTimetableData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadTimetableData]);

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
      const isSpecial = item.abbr === 'BLOCKED' || item.abbr === 'HOLIDAY';
      if (isSpecial) {
        if (!groups[item.date].some(g => g.time === item.time && g.abbr === item.abbr)) {
          groups[item.date].push(item);
        }
      } else {
        groups[item.date].push(item);
      }
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

  // Automatically align calendar view to the most relevant loaded date
  useEffect(() => {
    if (nextActiveDate) {
      const parsed = parseDateString(nextActiveDate);
      if (!isNaN(parsed.getTime())) {
        setCalendarMonth(parsed.getMonth());
        setCalendarYear(parsed.getFullYear());
      }
    } else if (timetable.dates.length > 0) {
      const parsed = parseDateString(timetable.dates[0]);
      if (!isNaN(parsed.getTime())) {
        setCalendarMonth(parsed.getMonth());
        setCalendarYear(parsed.getFullYear());
      }
    }
  }, [nextActiveDate, timetable.dates]);

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
  const handleExportCSV = useCallback(() => {
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
  }, [filteredItems]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setSelectedSection('all');
    setSelectedCourse('all');
    setSelectedClassroom('all');
    setSelectedDate('all');
    setSearchQuery('');
  }, []);

  return {
    timetable,
    loading,
    error,
    successMsg,
    lastSyncTime,
    selectedSection,
    setSelectedSection,
    selectedCourse,
    setSelectedCourse,
    selectedClassroom,
    setSelectedClassroom,
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    calendarMonth,
    setCalendarMonth,
    calendarYear,
    setCalendarYear,
    inspectedDate,
    setInspectedDate,
    isSidebarOpen,
    setIsSidebarOpen,
    isDark,
    setIsDark,
    filteredItems,
    activeGridDate,
    uniqueTimeSlots,
    groupedAgenda,
    todayDateObj,
    getDetailedDateStatus,
    dateToDatesMap,
    nextActiveDate,
    availableMonths,
    handleExportCSV,
    handleResetFilters,
    loadTimetableData
  };
}
