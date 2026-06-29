import React from 'react';
import { X, Activity, RefreshCw, Download, Printer } from 'lucide-react';
import { TimetableData, TimetableItem } from '../types';
import { getCourseColor } from '../utils';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeNowClass: TimetableItem | null;
  loading: boolean;
  loadTimetableData: () => void;
  handleExportCSV: () => void;
  filteredItems: TimetableItem[];
  timetable: TimetableData;
  lastSyncTime: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  activeNowClass,
  loading,
  loadTimetableData,
  handleExportCSV,
  filteredItems,
  timetable,
  lastSyncTime
}) => {
  return (
    <>
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
    </>
  );
};
