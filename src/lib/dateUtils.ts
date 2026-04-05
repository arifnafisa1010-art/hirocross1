import { addDays } from 'date-fns';

export type WeekMode = 'monday' | 'startDay';

/**
 * Get the Monday on or after the given date.
 */
export function getMondayOnOrAfter(date: Date): Date {
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (dayOfWeek === 1) return date;
  if (dayOfWeek === 0) return addDays(date, 1);
  return addDays(date, 8 - dayOfWeek);
}

/**
 * Get the Monday on or before the given date (start of ISO week).
 */
export function getMondayOnOrBefore(date: Date): Date {
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (dayOfWeek === 1) return date;
  if (dayOfWeek === 0) return addDays(date, -6);
  return addDays(date, 1 - dayOfWeek);
}

/**
 * Get the start date of a given week number based on the week mode.
 * 
 * Mode 'monday': Week 1 starts on the Monday of the week containing startDate.
 *   Days before startDate in week 1 are shown but disabled.
 * 
 * Mode 'startDay': Week 1 starts on startDate itself.
 *   E.g., if startDate is Wednesday, each week runs Wed→Tue.
 */
export function getWeekStartDate(programStart: Date, weekNumber: number, mode: WeekMode): Date {
  if (mode === 'monday') {
    const monday = getMondayOnOrBefore(programStart);
    return addDays(monday, (weekNumber - 1) * 7);
  } else {
    // startDay mode: week starts from the actual start date
    return addDays(programStart, (weekNumber - 1) * 7);
  }
}

/**
 * Get the ordered day names (Indonesian) for the week based on mode and start date.
 * 
 * Mode 'monday': Always Mon-Sun.
 * Mode 'startDay': Rotated to start from the start day.
 */
const ALL_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export function getOrderedDays(programStart: Date, mode: WeekMode): string[] {
  if (mode === 'monday') return ALL_DAYS;
  
  // Get the day of week for the start date (JS: 0=Sun, 1=Mon, ..., 6=Sat)
  const jsDay = programStart.getDay();
  // Convert to Monday-based index: Mon=0, Tue=1, ..., Sun=6
  const startIndex = jsDay === 0 ? 6 : jsDay - 1;
  
  return [...ALL_DAYS.slice(startIndex), ...ALL_DAYS.slice(0, startIndex)];
}

/**
 * Check if a specific day in week 1 is before the program start date.
 * Only relevant for 'monday' mode.
 */
export function isDayBeforeStart(programStart: Date, weekNumber: number, dayIndex: number, mode: WeekMode): boolean {
  if (mode !== 'monday' || weekNumber !== 1) return false;
  const weekStart = getWeekStartDate(programStart, 1, mode);
  const dayDate = addDays(weekStart, dayIndex);
  return dayDate < programStart;
}
