const TIMEZONE = 'Europe/Kyiv';

/** Current date/time interpreted in EET (Europe/Kyiv) */
function nowInEET(): Date {
  const eetString = new Date().toLocaleString('en-US', { timeZone: TIMEZONE });
  return new Date(eetString);
}

/** Today's date as YYYY-MM-DD in EET */
export function getToday(): string {
  return formatDateISO(nowInEET());
}

/** Tomorrow's date as YYYY-MM-DD in EET */
export function getTomorrow(): string {
  const d = nowInEET();
  d.setDate(d.getDate() + 1);
  return formatDateISO(d);
}

/** Next Monday's date as YYYY-MM-DD in EET */
export function getNextMonday(): string {
  const d = nowInEET();
  const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  let daysUntilMonday = (8 - dayOfWeek) % 7;
  if (daysUntilMonday === 0) {
    daysUntilMonday = 7;
  }
  d.setDate(d.getDate() + daysUntilMonday);
  return formatDateISO(d);
}

/** Whether current day in EET is Sunday */
export function isSunday(): boolean {
  return nowInEET().getDay() === 0;
}

/** Check if a due date is overdue (before today in EET) */
export function isOverdue(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const today = getToday();
  return dateString < today;
}

/** Check if a due date is due soon — today or within 3 days in EET */
export function isDueSoon(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const d = nowInEET();
  const today = formatDateISO(d);
  d.setDate(d.getDate() + 3);
  const threeDays = formatDateISO(d);
  return dateString >= today && dateString <= threeDays;
}

/** Format a YYYY-MM-DD date for display (e.g. "Apr 19") */
export function formatDueDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format a Date object as YYYY-MM-DD */
function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
