import { addDays } from 'date-fns';

/**
 * Get the Monday on or after the given date.
 * This ensures week 1 of a training program never shows dates before the start date.
 */
export function getMondayOnOrAfter(date: Date): Date {
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (dayOfWeek === 1) return date; // Already Monday
  if (dayOfWeek === 0) return addDays(date, 1); // Sunday → next Monday
  return addDays(date, 8 - dayOfWeek); // Tue-Sat → next Monday
}
