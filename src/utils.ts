// Palette mapping helper for courses matching the theme
const courseColorIndices: Record<string, number> = {};
let nextColorIndex = 0;

export function getCourseColor(abbr: string): { 
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
export function parseDateString(dateStr: string): Date {
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
export function sortDateStrings(dateStrings: string[]): string[] {
  return [...dateStrings].sort((a, b) => {
    const timeA = parseDateString(a).getTime();
    const timeB = parseDateString(b).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.localeCompare(b);
  });
}

// Custom Helper to format Date nicely
export function formatDateString(dateStr: string): string {
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

// Custom Helper to normalize time slot strings (e.g. converting dot separator to colon, matching layout spacing)
export function normalizeTime(timeStr: string): string {
  if (!timeStr) return '';
  let normalized = timeStr.trim();
  
  // Replace dot separating hours and minutes, e.g. "09.15" -> "09:15"
  normalized = normalized.replace(/(\d{1,2})\.(\d{2})/g, '$1:$2');
  
  // Normalize dashes/hyphens: replace any type of dash or spaces around it with a standard " - "
  normalized = normalized.replace(/\s*[\-\u2013\u2014]\s*/g, ' - ');
  
  // Pad single digit hours with leading zeros for sorting and consistency, e.g. "9:15" -> "09:15"
  normalized = normalized.replace(/\b(\d):(\d{2})\b/g, '0$1:$2');
  
  return normalized;
}
