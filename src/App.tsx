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

import { getCourseColor, parseDateString, sortDateStrings, formatDateString, normalizeTime } from './utils';

import { parseAndProcessData } from './dataProcessor';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AgendaView } from './components/AgendaView';
import { GridView } from './components/GridView';
import { CalendarView } from './components/CalendarView';
import { useTimetable } from './hooks/useTimetable';

export default function App() {
  const {
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
  } = useTimetable();


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
      
      <Header 
        timetable={timetable}
        filteredItems={filteredItems}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isDark={isDark}
        setIsDark={setIsDark}
        handleExportCSV={handleExportCSV}
      />

      {/* Main Layout containing Sidebar + Content Container */}
      <main className="flex-1 flex overflow-hidden print:overflow-visible print:block relative">
        
        <Sidebar 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          activeNowClass={activeNowClass}
          loading={loading}
          loadTimetableData={loadTimetableData}
          handleExportCSV={handleExportCSV}
          filteredItems={filteredItems}
          timetable={timetable}
          lastSyncTime={lastSyncTime}
        />

        {/* TIMETABLE CONTENT VIEWPORT */}
          <section className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-y-auto p-3.5 sm:p-6 gap-4 sm:gap-6 print:p-0 print:overflow-visible print:block">
          
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

          {/* Mobile-only Section Selector (moved down to main page view) */}
          <div className="sm:hidden shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs print:hidden">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
              Viewing Section
            </h3>
            <div className="flex overflow-x-auto gap-1.5 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button
                onClick={() => setSelectedSection('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border shrink-0 ${
                  selectedSection === 'all'
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All
              </button>
              {timetable.sections.map(sec => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border shrink-0 ${
                    selectedSection === sec
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Sec {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Master Filters and View Mode Controls Row */}
            <div className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-2xs print:hidden">
            {/* Search & Tabs control */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch justify-between">
              
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-3.5 h-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by course code, full title, professor, or room..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-lg pl-9 pr-8 py-2 text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden text-slate-900 dark:text-white"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Switcher Tabs (Agenda vs Room Grid vs Interactive Calendar) */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-lg shrink-0 self-center lg:self-auto gap-0.5">
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

            {/* Selector Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
              
              {/* Date selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Select Date</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all" className="dark:bg-slate-900 dark:text-white">All Dates ({timetable.dates.length})</option>
                  {timetable.dates.map(date => (
                    <option key={date} value={date} className="dark:bg-slate-900 dark:text-white">{date}</option>
                  ))}
                </select>
              </div>

              {/* Course selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Select Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all" className="dark:bg-slate-900 dark:text-white">All Courses ({timetable.courses.length})</option>
                  {timetable.courses.map(course => (
                    <option key={course.abbr} value={course.abbr} className="dark:bg-slate-900 dark:text-white">{course.abbr} - {course.courseName}</option>
                  ))}
                </select>
              </div>

              {/* Classroom location */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Classroom</label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
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
                  className="w-full text-center py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>

            </div>

          </div>

            {/* DYNAMIC SCENE VIEWS CONTAINER */}
            <div className="flex-1 min-h-0 print:overflow-visible">
            
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
                  <AgendaView groupedAgenda={groupedAgenda} todayDateObj={todayDateObj} />
                )}

                {/* OCCUPANCY GRID MATRIX */}
                {viewMode === 'grid' && (
                  <GridView 
                    activeGridDate={activeGridDate}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    selectedClassroom={selectedClassroom}
                    timetable={timetable}
                    uniqueTimeSlots={uniqueTimeSlots}
                    filteredItems={filteredItems}
                  />
                )}

                {/* INTERACTIVE CALENDAR VIEW */}
                {viewMode === 'calendar' && (
                  <CalendarView 
                    calendarYear={calendarYear}
                    setCalendarYear={setCalendarYear}
                    calendarMonth={calendarMonth}
                    setCalendarMonth={setCalendarMonth}
                    inspectedDate={inspectedDate}
                    setInspectedDate={setInspectedDate}
                    timetable={timetable}
                    filteredItems={filteredItems}
                    nextActiveDate={nextActiveDate}
                    getDetailedDateStatus={getDetailedDateStatus}
                    todayDateObj={todayDateObj}
                    availableMonths={availableMonths}
                    dateToDatesMap={dateToDatesMap}
                  />
                )}
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
