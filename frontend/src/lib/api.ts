/**
 * Centralized API client with token management
 * Handles JWT token storage and automatic attachment to authenticated requests
 */

import { logError, ErrorSeverity } from './errorLogger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'access_token';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// Cache configuration
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_SIZE = 100; // Maximum number of cached entries

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ResponseCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Generates a cache key from URL and options
   */
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Gets cached response if valid
   */
  get<T>(url: string, options?: RequestInit): T | null {
    const key = this.generateKey(url, options);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Sets cache entry with expiration
   */
  set<T>(url: string, data: T, options?: RequestInit, ttl: number = CACHE_DURATION_MS): void {
    const key = this.generateKey(url, options);
    const now = Date.now();

    // Implement LRU eviction if cache is full
    if (this.cache.size >= CACHE_MAX_SIZE && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  /**
   * Invalidates cache entries matching a pattern
   */
  invalidate(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clears all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: CACHE_MAX_SIZE,
    };
  }
}

// Global cache instance
const responseCache = new ResponseCache();

/**
 * Retrieves the JWT token from localStorage
 * @returns The stored JWT token or null if not present
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Stores the JWT token in localStorage
 * @param token The JWT token to store
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Removes the JWT token from localStorage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Custom API Error class with enhanced error information
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Delays execution for retry mechanism
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines if an error is retryable based on status code
 */
function isRetryableError(statusCode: number): boolean {
  return RETRY_STATUS_CODES.includes(statusCode);
}

/**
 * Converts backend error response to user-friendly message
 */
function getUserFriendlyErrorMessage(statusCode: number, message?: string): string {
  // Use backend message if available and user-friendly
  if (message && !message.toLowerCase().includes('error') && message.length < 100) {
    return message;
  }

  // Default user-friendly messages based on status code
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'You are not authenticated. Please log in and try again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This operation conflicts with existing data.';
    case 422:
      return 'The data provided is invalid. Please check and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'A server error occurred. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'The service is temporarily unavailable. Please try again later.';
    default:
      return message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Centralized fetch wrapper that automatically attaches JWT to authenticated requests
 * Includes retry logic for transient failures, response caching for GET requests, and standardized error handling
 * @param path The API endpoint path (e.g., '/auth/login')
 * @param options Optional fetch options
 * @param retryCount Current retry attempt (used internally)
 * @param useCache Whether to use caching for this request (default: true for GET requests)
 * @returns The fetch response
 */
export async function apiFetch(
  path: string,
  options?: RequestInit,
  retryCount = 0,
  useCache: boolean = true
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  const token = getToken();
  const method = options?.method || 'GET';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  // Attach JWT to Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Check cache for GET requests
  if (method === 'GET' && useCache) {
    const cachedResponse = responseCache.get<any>(url, options);
    if (cachedResponse) {
      // Return a mock Response object with cached data
      return new Response(JSON.stringify(cachedResponse), {
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        }),
      });
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If response is not ok and is retryable, attempt retry
    if (!response.ok && isRetryableError(response.status) && retryCount < MAX_RETRIES) {
      logError(
        `API request failed with status ${response.status}, retrying... (attempt ${retryCount + 1}/${MAX_RETRIES})`,
        ErrorSeverity.LOW,
        { endpoint: path, statusCode: response.status }
      );
      
      await delay(RETRY_DELAY_MS * (retryCount + 1)); // Exponential backoff
      return apiFetch(path, options, retryCount + 1, useCache);
    }

    // If response is not ok and not retryable or max retries reached, handle error
    if (!response.ok) {
      let errorMessage: string;
      let backendMessage: string | undefined;

      try {
        const errorData = await response.json();
        backendMessage = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message;
        errorMessage = getUserFriendlyErrorMessage(response.status, backendMessage);
      } catch {
        errorMessage = getUserFriendlyErrorMessage(response.status);
      }

      // Log the error
      logError(
        `API Error: ${errorMessage}`,
        response.status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
        {
          endpoint: path,
          statusCode: response.status,
          backendMessage,
        }
      );

      throw new ApiError(errorMessage, response.status, path);
    }

    // Cache successful GET responses
    if (method === 'GET' && useCache && response.ok) {
      const clonedResponse = response.clone();
      try {
        const data = await clonedResponse.json();
        responseCache.set(url, data, options);
      } catch (error) {
        // If response is not JSON, don't cache it
        // This is fine, just continue
      }
    }

    // Invalidate cache for mutation operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && response.ok) {
      // Invalidate related cache entries based on the endpoint
      if (path.includes('/patients')) {
        responseCache.invalidate('/patients');
      } else if (path.includes('/inventory')) {
        responseCache.invalidate('/inventory');
      }
    }

    return response;
  } catch (error) {
    // Handle network errors or other fetch failures
    if (error instanceof ApiError) {
      throw error; // Re-throw ApiError as-is
    }

    // Network error - retry if possible
    if (retryCount < MAX_RETRIES) {
      logError(
        `Network error, retrying... (attempt ${retryCount + 1}/${MAX_RETRIES})`,
        ErrorSeverity.MEDIUM,
        { endpoint: path, error: error instanceof Error ? error.message : String(error) }
      );
      
      await delay(RETRY_DELAY_MS * (retryCount + 1));
      return apiFetch(path, options, retryCount + 1, useCache);
    }

    // Max retries reached or non-retryable error
    const errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    logError(
      errorMessage,
      ErrorSeverity.HIGH,
      { endpoint: path, error: error instanceof Error ? error.message : String(error) }
    );

    throw new ApiError(errorMessage, 0, path, error);
  }
}

/**
 * Type definitions for API payloads and responses
 */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'DOCTOR' | 'PATIENT' | 'PHARMACY' | 'ADMIN';
  tenantName?: string;
  tenantType?: 'PHARMACY' | 'CLINIC';
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: 'DOCTOR' | 'PATIENT' | 'PHARMACY' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

/**
 * Registers a new user
 * @param data Registration payload with name, email, password, and role
 * @returns The created user object (without password)
 * @throws ApiError if registration fails
 */
export async function register(data: RegisterPayload): Promise<UserResponse> {
  const response = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    // Error is already handled by apiFetch, but this shouldn't be reached
    throw new ApiError('Registration failed', response.status, '/auth/register');
  }

  return response.json();
}

/**
 * Logs in a user and returns a JWT token
 * @param data Login payload with email and password
 * @returns The login response containing the access token
 * @throws ApiError if login fails
 */
export async function login(data: LoginPayload): Promise<LoginResponse> {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    // Error is already handled by apiFetch, but this shouldn't be reached
    throw new ApiError('Login failed', response.status, '/auth/login');
  }

  return response.json();
}

/**
 * Cache management utilities
 */

/**
 * Clears all cached responses
 */
export function clearCache(): void {
  responseCache.clear();
}

/**
 * Invalidates cache entries matching a pattern
 * @param pattern Pattern to match against cache keys (e.g., '/patients', '/inventory')
 */
export function invalidateCache(pattern: string): void {
  responseCache.invalidate(pattern);
}

/**
 * Gets cache statistics
 * @returns Object containing cache size and max size
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return responseCache.getStats();
}
