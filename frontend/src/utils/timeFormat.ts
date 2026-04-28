/**
 * Utility functions for time formatting
 */

/**
 * Convert 24-hour time format to AM/PM format
 * @param time - Time string in 24-hour format (e.g., "14:30" or "14:30:00")
 * @returns Time string in AM/PM format (e.g., "2:30 PM")
 */
export function formatTimeToAMPM(time: string): string {
  if (!time) return time;
  
  // Handle if already in AM/PM format
  if (time.includes('AM') || time.includes('PM')) {
    return time;
  }
  
  // Parse 24-hour format (e.g., "14:30" or "14:30:00")
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr || '0', 10);
  
  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return time; // Return original if parsing fails or values are invalid
  }
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Format a slot range "HH:MM-HH:MM" to "H:MM AM - H:MM AM" display format.
 * Falls back to formatTimeToAMPM for plain time strings.
 */
export function formatSlotRange(slot: string): string {
  if (!slot) return slot;
  if (slot.includes('-') && !slot.includes('AM') && !slot.includes('PM')) {
    const parts = slot.split('-');
    if (parts.length === 2) {
      return `${formatTimeToAMPM(parts[0])} - ${formatTimeToAMPM(parts[1])}`;
    }
  }
  return formatTimeToAMPM(slot);
}

/**
 * Format a date to a readable string
 * @param date - Date object or date string
 * @returns Formatted date string (e.g., "Thursday, May 15, 2025")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get today's date in YYYY-MM-DD format for HTML date inputs
 * @returns Today's date string in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns True if the date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  return dateObj < today;
}