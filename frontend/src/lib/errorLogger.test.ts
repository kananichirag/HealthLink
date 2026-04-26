import { logError, getErrorLogs, clearErrorLogs, ErrorSeverity } from './errorLogger';

describe('errorLogger', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear console mocks
    jest.clearAllMocks();
  });

  describe('logError', () => {
    it('should log error with message and severity', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      logError('Test error', ErrorSeverity.HIGH);
      
      expect(consoleSpy).toHaveBeenCalled();
      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test error');
      expect(logs[0].severity).toBe(ErrorSeverity.HIGH);
      
      consoleSpy.mockRestore();
    });

    it('should log Error object with stack trace', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error object');
      
      logError(error, ErrorSeverity.CRITICAL);
      
      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test error object');
      expect(logs[0].severity).toBe(ErrorSeverity.CRITICAL);
      expect(logs[0].stack).toBeDefined();
      
      consoleSpy.mockRestore();
    });

    it('should include context information', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const context = { userId: '123', action: 'login' };
      
      logError('Login failed', ErrorSeverity.MEDIUM, context);
      
      const logs = getErrorLogs();
      expect(logs[0].context).toEqual(context);
      
      consoleSpy.mockRestore();
    });

    it('should limit stored logs to 50 entries', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Log 60 errors
      for (let i = 0; i < 60; i++) {
        logError(`Error ${i}`, ErrorSeverity.LOW);
      }
      
      const logs = getErrorLogs();
      expect(logs).toHaveLength(50);
      // Should keep the most recent 50
      expect(logs[0].message).toBe('Error 10');
      expect(logs[49].message).toBe('Error 59');
      
      consoleSpy.mockRestore();
    });
  });

  describe('getErrorLogs', () => {
    it('should return empty array when no logs exist', () => {
      const logs = getErrorLogs();
      expect(logs).toEqual([]);
    });

    it('should return all stored logs', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      logError('Error 1', ErrorSeverity.LOW);
      logError('Error 2', ErrorSeverity.HIGH);
      
      const logs = getErrorLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('Error 1');
      expect(logs[1].message).toBe('Error 2');
      
      consoleSpy.mockRestore();
    });
  });

  describe('clearErrorLogs', () => {
    it('should remove all stored logs', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      logError('Error 1', ErrorSeverity.LOW);
      logError('Error 2', ErrorSeverity.HIGH);
      
      expect(getErrorLogs()).toHaveLength(2);
      
      clearErrorLogs();
      
      expect(getErrorLogs()).toEqual([]);
      
      consoleSpy.mockRestore();
    });
  });
});
