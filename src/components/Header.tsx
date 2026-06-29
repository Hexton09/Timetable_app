import React from 'react';
import { Sparkles, Menu, School, Download, Printer, Sun, Moon } from 'lucide-react';
import { TimetableData, TimetableItem } from '../types';

interface HeaderProps {
  timetable: TimetableData;
  filteredItems: TimetableItem[];
  selectedSection: string;
  setSelectedSection: (section: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
  handleExportCSV: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  timetable,
  filteredItems,
  selectedSection,
  setSelectedSection,
  isSidebarOpen,
  setIsSidebarOpen,
  isDark,
  setIsDark,
  handleExportCSV
}) => {
  return (
    <>
      {/* Sleek Top Banner */}
      <div className="bg-slate-950 text-slate-300 text-center py-2 px-4 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 print:hidden shrink-0 border-b border-slate-850">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Made by <strong className="text-white">Rahul Singh Nagesh Batch PGP 2026-28</strong></span>
      </div>

      {/* Sleek Header Navigation */}
      <header className="h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shadow-xs z-25 print:relative print:border-b-2 print:shadow-none">
        
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

        {/* Viewing Section Selector & Live update status */}
        <div className="flex items-center gap-2 sm:gap-3 print:hidden">
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 max-w-[150px] sm:max-w-md overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setSelectedSection('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedSection === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All
            </button>
            {timetable.sections.map(sec => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  selectedSection === sec 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-wide uppercase">Live Updates Active</span>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredItems.length === 0}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
            title="Download/Export timetable as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            disabled={filteredItems.length === 0}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-700 cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>
    </>
  );
};
