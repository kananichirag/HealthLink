/**
 * Tests for API response caching functionality
 */

import { apiFetch, clearCache, invalidateCache, getCacheStats } from './api';

// Polyfill Response and Headers for Node.js test environment
if (typeof Response === 'undefined') {
  global.Response = class Response {
    private _body: string;
    private _status: number;
    private _statusText: string;
    public headers: Headers;

    constructor(body: string, init?: { status?: number; statusText?: string; headers?: Headers }) {
      this._body = body;
      this._status = init?.status || 200;
      this._statusText = init?.statusText || 'OK';
      this.headers = init?.headers || new Headers();
    }

    get ok() {
      return this._status >= 200 && this._status < 300;
    }

    get status() {
      return this._status;
    }

    async json() {
      return JSON.parse(this._body);
    }

    clone() {
      return new Response(this._body, {
        status: this._status,
        statusText: this._statusText,
        headers: this.headers,
      });
    }
  } as any;
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    private _headers: Map<string, string> = new Map();

    constructor(init?: Record<string, string>) {
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value);
        });
      }
    }

    get(name: string): string | null {
      return this._headers.get(name.toLowerCase()) || null;
    }

    set(name: string, value: string): void {
      this._headers.set(name.toLowerCase(), value);
    }
  } as any;
}

// Mock fetch globally
global.fetch = jest.fn();

describe('API Response Caching', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should cache GET requests', async () => {
    const mockData = { id: '1', name: 'Test Patient' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
      clone: function() {
        return {
          json: async () => mockData,
        };
      },
    });

    // First request - should hit the API
    const response1 = await apiFetch('/patients/1');
    const data1 = await response1.json();
    expect(data1).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second request - should use cache
    const response2 = await apiFetch('/patients/1');
    const data2 = await response2.json();
    expect(data2).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(1); // Still only 1 call
    expect(response2.headers.get('X-Cache')).toBe('HIT');
  });

  it('should not cache POST requests', async () => {
    const mockData = { id: '1', name: 'New Patient' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockData,
      clone: function() {
        return {
          json: async () => mockData,
        };
      },
    });

    // First POST request
    await apiFetch('/patients', { method: 'POST', body: JSON.stringify(mockData) });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second POST request - should not use cache
    await apiFetch('/patients', { method: 'POST', body: JSON.stringify(mockData) });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should invalidate cache on mutation operations', async () => {
    const mockGetData = { id: '1', name: 'Test Patient' };
    const mockPostData = { id: '2', name: 'New Patient' };

    // Mock GET request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGetData,
      clone: function() {
        return {
          json: async () => mockGetData,
        };
      },
    });

    // First GET request - should cache
    await apiFetch('/patients');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Mock POST request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockPostData,
      clone: function() {
        return {
          json: async () => mockPostData,
        };
      },
    });

    // POST request - should invalidate cache
    await apiFetch('/patients', { method: 'POST', body: JSON.stringify(mockPostData) });
    expect(global.fetch).toHaveBeenCalledTimes(2);

    // Mock another GET request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGetData,
      clone: function() {
        return {
          json: async () => mockGetData,
        };
      },
    });

    // Second GET request - should hit API again (cache was invalidated)
    await apiFetch('/patients');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should clear all cache entries', async () => {
    const mockData = { id: '1', name: 'Test' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      clone: function() {
        return {
          json: async () => mockData,
        };
      },
    });

    // Make some cached requests
    await apiFetch('/patients/1');
    await apiFetch('/patients/2');
    
    const statsBefore = getCacheStats();
    expect(statsBefore.size).toBe(2);

    // Clear cache
    clearCache();
    
    const statsAfter = getCacheStats();
    expect(statsAfter.size).toBe(0);
  });

  it('should invalidate cache by pattern', async () => {
    const mockPatientData = { id: '1', name: 'Patient' };
    const mockInventoryData = { id: '1', name: 'Medicine' };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPatientData,
        clone: function() {
          return { json: async () => mockPatientData };
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockInventoryData,
        clone: function() {
          return { json: async () => mockInventoryData };
        },
      });

    // Cache both endpoints
    await apiFetch('/patients/1');
    await apiFetch('/inventory/1');
    
    expect(getCacheStats().size).toBe(2);

    // Invalidate only patient cache
    invalidateCache('/patients');
    
    expect(getCacheStats().size).toBe(1);
  });

  it('should respect cache TTL', async () => {
    jest.useFakeTimers();
    
    const mockData = { id: '1', name: 'Test' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
      clone: function() {
        return {
          json: async () => mockData,
        };
      },
    });

    // First request - should cache
    await apiFetch('/patients/1');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Advance time by 4 minutes (cache TTL is 5 minutes)
    jest.advanceTimersByTime(4 * 60 * 1000);

    // Second request - should still use cache
    const response2 = await apiFetch('/patients/1');
    expect(response2.headers.get('X-Cache')).toBe('HIT');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Advance time by 2 more minutes (total 6 minutes, past TTL)
    jest.advanceTimersByTime(2 * 60 * 1000);

    // Third request - cache expired, should hit API
    await apiFetch('/patients/1');
    expect(global.fetch).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});
