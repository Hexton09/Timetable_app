import React from 'react';
import { User, MapPin } from 'lucide-react';
import { TimetableItem } from '../types';
import { getCourseColor, formatDateString, sortDateStrings } from '../utils';

interface AgendaViewProps {
  groupedAgenda: { [date: string]: TimetableItem[] };
  todayDateObj: Date;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ groupedAgenda, todayDateObj }) => {
  const tZero = new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), todayDateObj.getDate()).getTime();
  
  // Only include dates that are today or in the future
  const upcomingDates = sortDateStrings(Object.keys(groupedAgenda)).filter(dateStr => {
    const p = new Date(dateStr);
    return new Date(p.getFullYear(), p.getMonth(), p.getDate()).getTime() >= tZero;
  });

  return (
    <div className="space-y-6 print:space-y-4">
      {upcomingDates.length === 0 ? (
        <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl">
          <div className="text-slate-400 dark:text-slate-550 flex justify-center text-3xl mb-3">☕</div>
          <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Upcoming Classes</h5>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">
            You don't have any future classes scheduled.
          </p>
        </div>
      ) : (
        upcomingDates.map(dateStr => (
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
              let colors = getCourseColor(item.abbr);
              if (item.isCancelled) {
                colors = { bg: 'bg-rose-50/90 dark:bg-rose-950/40 bg-cancelled-stripes', borderL: 'border-rose-500', border: 'border-rose-200 dark:border-rose-900/60', textDark: 'text-rose-900 dark:text-rose-200', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 shadow-inner', text: 'text-rose-800 dark:text-rose-300' };
              }
              const textOpacity = item.isCancelled ? 'opacity-60 grayscale-[50%]' : '';
              
              return (
                <div
                  key={item.id}
                  className={`${colors.bg} border-l-4 ${colors.borderL} border ${colors.border} rounded-lg p-3.5 shadow-xs transition-all hover:shadow-md space-y-2.5 relative overflow-hidden`}
                >
                  {item.isCancelled && (
                    <div className="absolute top-0 right-0 bg-gradient-to-bl from-rose-500 to-rose-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-sm flex items-center gap-1.5 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"></span>
                      CANCELLED
                    </div>
                  )}
                  <div className={textOpacity}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                        {item.time}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold font-mono tracking-wider shrink-0 ${colors.badge}`}>
                        {item.abbr === 'BLOCKED' ? 'BLOCKED' : `${item.abbr}-${item.section}`}
                      </span>
                    </div>
                    <h4 className={`text-xs font-bold line-clamp-2 mt-1 leading-snug ${colors.textDark || 'text-slate-900 dark:text-white'} ${item.isCancelled ? 'line-through decoration-rose-400/50 dark:decoration-rose-600/50' : ''}`}>
                      {item.courseName}
                    </h4>
                  </div>

                  <div className={`pt-2 border-t ${colors.border} flex flex-col gap-1 text-[10px] text-slate-600 dark:text-slate-300 font-medium ${textOpacity}`}>
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
      )))}
    </div>
  );
};
