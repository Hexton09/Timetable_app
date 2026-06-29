import React from 'react';
import { Clock, ArrowRight, Sparkles, ChevronLeft, ChevronRight, User, MapPin } from 'lucide-react';
import { TimetableData, TimetableItem } from '../types';
import { formatDateString, getCourseColor } from '../utils';

interface CalendarViewProps {
  calendarYear: number;
  setCalendarYear: (year: number) => void;
  calendarMonth: number;
  setCalendarMonth: (month: number) => void;
  inspectedDate: string | null;
  setInspectedDate: (date: string | null) => void;
  timetable: TimetableData;
  nextActiveDate: string | null;
  getDetailedDateStatus: (dateStr: string) => { label: string; color: string; badge: string; };
  todayDateObj: Date;
  availableMonths: { monthNum: number; year: number; label: string }[];
  dateToDatesMap: { [key: string]: string };
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  calendarYear,
  setCalendarYear,
  calendarMonth,
  setCalendarMonth,
  inspectedDate,
  setInspectedDate,
  timetable,
  nextActiveDate,
  getDetailedDateStatus,
  todayDateObj,
  availableMonths,
  dateToDatesMap
}) => {
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[calendarMonth];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Find the selected inspected date's timetable items
  const activeInspectedDate = inspectedDate || nextActiveDate || '';
  const inspectedItemsRaw = timetable.items.filter(item => item.date === activeInspectedDate);
  const inspectedItems = inspectedItemsRaw.filter((item, index, self) => {
    const isSpecial = item.abbr === 'BLOCKED' || item.abbr === 'HOLIDAY';
    if (!isSpecial) return true;
    return index === self.findIndex(g => g.time === item.time && g.abbr === item.abbr);
  });
  const statusInfo = activeInspectedDate ? getDetailedDateStatus(activeInspectedDate) : null;

  // List of all holidays and blocked slots in the dataset to show in a legend / special list
  const specialDaysList = timetable.items.reduce((acc: { date: string; type: 'HOLIDAY' | 'BLOCKED'; name: string }[], item) => {
    if (item.abbr === 'HOLIDAY' || item.abbr === 'BLOCKED') {
      if (!acc.some(x => x.date === item.date && x.type === item.abbr)) {
        acc.push({
          date: item.date,
          type: item.abbr as 'HOLIDAY' | 'BLOCKED',
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
          <div className="grid grid-cols-7 gap-1.5">
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
                  onClick={() => {
                    if (matchingDateStr) {
                      setInspectedDate(matchingDateStr);
                    } else {
                      // Construct YYYY-MM-DD string
                      const constructedDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      setInspectedDate(constructedDate);
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
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
                let colors = getCourseColor(session.abbr);
                if (session.isCancelled) {
                  colors = { bg: 'bg-rose-50/90 dark:bg-rose-950/40 bg-cancelled-stripes', borderL: 'border-rose-500', border: 'border-rose-200 dark:border-rose-900/60', textDark: 'text-rose-900 dark:text-rose-200', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 shadow-inner', text: 'text-rose-800 dark:text-rose-300' } as any;
                }
                const textOpacity = session.isCancelled ? 'opacity-60 grayscale-[50%]' : '';

                return (
                  <div 
                    key={session.id}
                    className={`p-3 rounded-xl border shadow-3xs flex flex-col gap-2 relative overflow-hidden transition-all ${
                      isBlocked 
                        ? 'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 border-l-4 border-l-red-600' 
                        : isHoliday 
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/30 border-l-4 border-l-emerald-500' 
                          : `${colors.bg} ${colors.border} border-l-4 ${colors.borderL}`
                    }`}
                  >
                    {session.isCancelled && (
                      <div className="absolute top-0 right-0 bg-gradient-to-bl from-rose-500 to-rose-600 text-white text-[9px] font-black px-2.5 py-1 rounded-bl-xl uppercase tracking-widest shadow-sm flex items-center gap-1.5 z-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"></span>
                        CANCELLED
                      </div>
                    )}
                    <div className={textOpacity}>
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
                        <h5 className={`text-xs font-bold leading-snug mt-1.5 ${colors.textDark || 'text-slate-855 dark:text-slate-100'} ${session.isCancelled ? 'line-through decoration-rose-400/50 dark:decoration-rose-600/50' : ''}`}>
                          {session.courseName}
                        </h5>
                      </div>

                      <div className={`pt-2 mt-2 border-t flex items-center justify-between text-[10px] font-medium ${colors.border} ${colors.textDark ? 'opacity-80' : 'text-slate-500 dark:text-slate-450'}`}>
                        <span className="flex items-center gap-1 min-w-0 max-w-[50%]">
                          <User className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate italic">{session.professor}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-bold">{session.classroom}</span>
                        </span>
                      </div>
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
};
