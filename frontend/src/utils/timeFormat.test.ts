import {
  formatTimeToAMPM,
  formatTimeSlotAMPM,
  formatDate,
  getTodayDateString,
  isPastDate,
} from './timeFormat';

describe('timeFormat utilities', () => {
  describe('formatTimeToAMPM', () => {
    it('converts 24-hour time to AM/PM format', () => {
      expect(formatTimeToAMPM('00:00')).toBe('12:00 AM');
      expect(formatTimeToAMPM('01:30')).toBe('1:30 AM');
      expect(formatTimeToAMPM('12:00')).toBe('12:00 PM');
      expect(formatTimeToAMPM('13:45')).toBe('1:45 PM');
      expect(formatTimeToAMPM('23:59')).toBe('11:59 PM');
    });

    it('handles time with seconds', () => {
      expect(formatTimeToAMPM('14:30:00')).toBe('2:30 PM');
      expect(formatTimeToAMPM('09:15:30')).toBe('9:15 AM');
    });

    it('handles edge cases', () => {
      expect(formatTimeToAMPM('12:30')).toBe('12:30 PM'); // Noon
      expect(formatTimeToAMPM('00:30')).toBe('12:30 AM'); // Midnight
    });

    it('returns original string if already in AM/PM format', () => {
      expect(formatTimeToAMPM('2:30 PM')).toBe('2:30 PM');
      expect(formatTimeToAMPM('9:00 AM')).toBe('9:00 AM');
    });

    it('returns original string if parsing fails', () => {
      expect(formatTimeToAMPM('invalid')).toBe('invalid');
      expect(formatTimeToAMPM('')).toBe('');
      expect(formatTimeToAMPM('25:00')).toBe('25:00'); // Invalid hour
    });

    it('handles missing minutes', () => {
      expect(formatTimeToAMPM('14')).toBe('2:00 PM');
      expect(formatTimeToAMPM('09')).toBe('9:00 AM');
    });
  });

  describe('formatTimeSlotAMPM', () => {
    it('is an alias for formatTimeToAMPM', () => {
      expect(formatTimeSlotAMPM('14:30')).toBe('2:30 PM');
      expect(formatTimeSlotAMPM('09:00')).toBe('9:00 AM');
    });
  });

  describe('formatDate', () => {
    it('formats Date objects correctly', () => {
      const date = new Date('2025-05-15T10:00:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Thursday, May 15, 2025/);
    });

    it('formats date strings correctly', () => {
      const formatted = formatDate('2025-05-15');
      expect(formatted).toMatch(/May 15, 2025/);
    });
  });

  describe('getTodayDateString', () => {
    it('returns today\'s date in YYYY-MM-DD format', () => {
      const today = getTodayDateString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Verify it's actually today
      const expectedToday = new Date().toISOString().split('T')[0];
      expect(today).toBe(expectedToday);
    });
  });

  describe('isPastDate', () => {
    it('returns true for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isPastDate(yesterday)).toBe(true);
      
      expect(isPastDate('2020-01-01')).toBe(true);
    });

    it('returns false for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isPastDate(tomorrow)).toBe(false);
      
      expect(isPastDate('2030-12-31')).toBe(false);
    });

    it('returns false for today', () => {
      const today = new Date();
      expect(isPastDate(today)).toBe(false);
      
      const todayString = new Date().toISOString().split('T')[0];
      expect(isPastDate(todayString)).toBe(false);
    });

    it('handles date strings', () => {
      expect(isPastDate('2020-01-01')).toBe(true);
      expect(isPastDate('2030-12-31')).toBe(false);
    });
  });
});