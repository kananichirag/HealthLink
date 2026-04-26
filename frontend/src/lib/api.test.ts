/**
 * Unit tests for the centralized API client
 * Tests token management and API request handling
 */

import {
  getToken,
  setToken,
  removeToken,
  apiFetch,
  register,
  login,
  RegisterPayload,
  LoginPayload,
  ApiError,
} from './api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client - Token Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getToken()', () => {
    it('should return null when no token is stored', () => {
      const token = getToken();
      expect(token).toBeNull();
    });

    it('should return the stored token', () => {
      const testToken = 'test-jwt-token-123';
      localStorage.setItem('access_token', testToken);

      const token = getToken();
      expect(token).toBe(testToken);
    });

    it('should return null when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const token = getToken();
      expect(token).toBeNull();

      global.window = originalWindow;
    });
  });

  describe('setToken()', () => {
    it('should store a token in localStorage', () => {
      const testToken = 'test-jwt-token-456';
      setToken(testToken);

      const stored = localStorage.getItem('access_token');
      expect(stored).toBe(testToken);
    });

    it('should overwrite an existing token', () => {
      setToken('old-token');
      setToken('new-token');

      const stored = localStorage.getItem('access_token');
      expect(stored).toBe('new-token');
    });

    it('should handle SSR gracefully when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      // Should not throw
      expect(() => setToken('test-token')).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('removeToken()', () => {
    it('should remove the token from localStorage', () => {
      setToken('test-token');
      expect(localStorage.getItem('access_token')).toBe('test-token');

      removeToken();
      expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('should not throw when no token exists', () => {
      expect(() => removeToken()).not.toThrow();
    });

    it('should handle SSR gracefully when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      // Should not throw
      expect(() => removeToken()).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('Token round-trip (Property 8)', () => {
    it('should store and retrieve the same token', () => {
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';

      setToken(testToken);
      const retrieved = getToken();

      expect(retrieved).toBe(testToken);
    });

    it('should return null after removing token', () => {
      const testToken = 'test-token-789';

      setToken(testToken);
      expect(getToken()).toBe(testToken);

      removeToken();
      expect(getToken()).toBeNull();
    });

    it('should handle multiple tokens sequentially', () => {
      const token1 = 'token-1';
      const token2 = 'token-2';

      setToken(token1);
      expect(getToken()).toBe(token1);

      setToken(token2);
      expect(getToken()).toBe(token2);

      removeToken();
      expect(getToken()).toBeNull();
    });
  });
});

describe('API Client - apiFetch()', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should make a request without token when none is stored', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });

    await apiFetch('/health');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/health',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    // Verify Authorization header is not present
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[1].headers['Authorization']).toBeUndefined();
  });

  it('should attach JWT to Authorization header when token exists', async () => {
    const testToken = 'test-jwt-token';
    setToken(testToken);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    await apiFetch('/protected-endpoint');

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[1].headers['Authorization']).toBe(`Bearer ${testToken}`);
  });

  it('should merge custom headers with default headers', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiFetch('/test', {
      headers: {
        'X-Custom-Header': 'custom-value',
      },
    });

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[1].headers['Content-Type']).toBe('application/json');
    expect(callArgs[1].headers['X-Custom-Header']).toBe('custom-value');
  });

  it('should pass through fetch options', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiFetch('/test', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    });

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[1].method).toBe('POST');
    expect(callArgs[1].body).toBe(JSON.stringify({ test: 'data' }));
  });

  it('should construct correct URL with API_BASE_URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiFetch('/auth/login');

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[0]).toBe('http://localhost:3001/auth/login');
  });
});

describe('API Client - register()', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should successfully register a user', async () => {
    const payload: RegisterPayload = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'PATIENT',
    };

    const mockResponse = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'PATIENT',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await register(payload);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/auth/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });

  it('should throw error on registration failure', async () => {
    const payload: RegisterPayload = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      role: 'DOCTOR',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Email already in use' }),
    });

    await expect(register(payload)).rejects.toThrow('Email already in use');
  });

  it('should throw generic error when API returns no message', async () => {
    const payload: RegisterPayload = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'ADMIN',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({}),
    });

    await expect(register(payload)).rejects.toThrow(ApiError);
  });

  it('should send correct request body', async () => {
    const payload: RegisterPayload = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'securepass123',
      role: 'PHARMACY',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'user-456', ...payload }),
    });

    await register(payload);

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(callArgs[1].body)).toEqual(payload);
  });
});

describe('API Client - login()', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should successfully login and return access token', async () => {
    const payload: LoginPayload = {
      email: 'user@example.com',
      password: 'password123',
    };

    const mockResponse = {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await login(payload);

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });

  it('should throw error on invalid credentials', async () => {
    const payload: LoginPayload = {
      email: 'user@example.com',
      password: 'wrongpassword',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    await expect(login(payload)).rejects.toThrow('Invalid credentials');
  });

  it('should throw generic error when API returns no message', async () => {
    const payload: LoginPayload = {
      email: 'user@example.com',
      password: 'password123',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    await expect(login(payload)).rejects.toThrow(ApiError);
  });

  it('should send correct request body', async () => {
    const payload: LoginPayload = {
      email: 'test@example.com',
      password: 'testpass123',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token' }),
    });

    await login(payload);

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(callArgs[1].body)).toEqual(payload);
  });

  it('should handle network errors with retry', async () => {
    const payload: LoginPayload = {
      email: 'user@example.com',
      password: 'password123',
    };

    // Mock all retries to fail
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    await expect(login(payload)).rejects.toThrow(ApiError);
    
    // Should have tried 1 initial + 3 retries = 4 times
    expect(global.fetch).toHaveBeenCalledTimes(4);
  }, 10000); // Increase timeout for retries
});

describe('API Client - Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should handle complete login flow with token storage', async () => {
    const loginPayload: LoginPayload = {
      email: 'user@example.com',
      password: 'password123',
    };

    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: token }),
    });

    const result = await login(loginPayload);
    expect(result.access_token).toBe(token);

    // Manually store token (as would happen in a component)
    setToken(result.access_token);

    // Verify token is stored
    expect(getToken()).toBe(token);

    // Verify subsequent requests include the token
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'protected' }),
    });

    await apiFetch('/protected-endpoint');

    const callArgs = (global.fetch as jest.Mock).mock.calls[1];
    expect(callArgs[1].headers['Authorization']).toBe(`Bearer ${token}`);
  });

  it('should handle logout flow', async () => {
    const token = 'test-token-123';
    setToken(token);

    expect(getToken()).toBe(token);

    removeToken();

    expect(getToken()).toBeNull();

    // Verify subsequent requests don't include token
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiFetch('/public-endpoint');

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[1].headers['Authorization']).toBeUndefined();
  });
});
