/**
 * Error logging utilities for debugging and monitoring
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorLogEntry {
  message: string;
  severity: ErrorSeverity;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
}

/**
 * Logs an error with context information
 * In production, this could send logs to a monitoring service
 */
export function logError(
  error: Error | string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: Record<string, unknown>
): void {
  const logEntry: ErrorLogEntry = {
    message: typeof error === 'string' ? error : error.message,
    severity,
    timestamp: new Date().toISOString(),
    context,
    stack: error instanceof Error ? error.stack : undefined,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Log]', logEntry);
  } else {
    // In production, you would send this to a logging service
    // Example: sendToLoggingService(logEntry);
    console.error('[Error]', logEntry.message);
  }

  // Store in localStorage for debugging (keep last 50 errors)
  try {
    const storedLogs = localStorage.getItem('error_logs');
    const logs: ErrorLogEntry[] = storedLogs ? JSON.parse(storedLogs) : [];
    logs.push(logEntry);
    
    // Keep only the last 50 errors
    if (logs.length > 50) {
      logs.shift();
    }
    
    localStorage.setItem('error_logs', JSON.stringify(logs));
  } catch (e) {
    // Silently fail if localStorage is not available
  }
}

/**
 * Retrieves stored error logs from localStorage
 */
export function getErrorLogs(): ErrorLogEntry[] {
  try {
    const storedLogs = localStorage.getItem('error_logs');
    return storedLogs ? JSON.parse(storedLogs) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Clears all stored error logs
 */
export function clearErrorLogs(): void {
  try {
    localStorage.removeItem('error_logs');
  } catch (e) {
    // Silently fail if localStorage is not available
  }
}
