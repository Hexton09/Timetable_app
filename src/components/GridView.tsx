import React from 'react';
import { TimetableData, TimetableItem } from '../types';
import { getCourseColor } from '../utils';

interface GridViewProps {
  activeGridDate: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedClassroom: string;
  timetable: TimetableData;
  uniqueTimeSlots: string[];
  filteredItems: TimetableItem[];
}

export const GridView: React.FC<GridViewProps> = ({
  activeGridDate,
  selectedDate,
  setSelectedDate,
  selectedClassroom,
  timetable,
  uniqueTimeSlots,
  filteredItems
}) => {
  return (
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

                    return (
                      <td 
                        key={room} 
                        className={`p-2.5 text-center border-l border-slate-200 dark:border-slate-805 min-w-36 align-middle ${
                          selectedClassroom === room ? 'bg-indigo-50/15 dark:bg-indigo-950/10' : ''
                        }`}
                      >
                        {session ? (() => {
                          let colors = matchesFilters ? getCourseColor(session.abbr) : null;
                          if (session.isCancelled && matchesFilters) {
                            colors = { bg: 'bg-rose-50/90 dark:bg-rose-950/40 bg-cancelled-stripes', borderL: 'border-rose-500', border: 'border-rose-200 dark:border-rose-900/60', textDark: 'text-rose-900 dark:text-rose-200', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 shadow-inner', text: 'text-rose-800 dark:text-rose-300' } as any;
                          }
                          const textOpacity = session.isCancelled ? 'opacity-60 grayscale-[50%]' : '';
                          
                          return (
                            <div 
                              className={`relative overflow-hidden rounded-lg p-2.5 text-left border transition-all ${
                                matchesFilters 
                                  ? `${colors?.bg} border-l-4 ${colors?.borderL} border ${colors?.border} text-slate-900 dark:text-slate-100` 
                                  : 'bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-805 opacity-30'
                              }`}
                            >
                              {session.isCancelled && matchesFilters && (
                                <div className="absolute top-0 right-0 bg-gradient-to-bl from-rose-500 to-rose-600 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-bl-lg uppercase tracking-widest shadow-sm flex items-center gap-1 z-10">
                                  <span className="w-1 h-1 rounded-full bg-white/80 animate-pulse"></span>
                                  CXL
                                </div>
                              )}
                              <div className={textOpacity}>
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
                                  matchesFilters ? colors?.textDark || 'text-slate-900 dark:text-slate-150' : 'text-slate-400 dark:text-slate-600'
                                } ${session.isCancelled ? 'line-through decoration-rose-400/50 dark:decoration-rose-600/50' : ''}`}>
                                  {session.courseName}
                                </h5>
                                <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                                  👤 {session.professor}
                                </p>
                              </div>
                            </div>
                          );
                        })() : (
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
  );
};
