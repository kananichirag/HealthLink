/**
 * Centralized API client with token management
 * Handles JWT token storage and automatic attachment to authenticated requests
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'access_token';

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
    const body = options?.body ? String(options.body) : '';
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
      const oldestKey = this.cache.keys().next().value as string | undefined;
      if (oldestKey) this.cache.delete(oldestKey);
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
 * Centralized fetch wrapper that automatically attaches JWT to authenticated requests
 * Includes response caching for GET requests and automatic cache invalidation on mutations
 * @param path The API endpoint path (e.g., '/auth/login')
 * @param options Optional fetch options
 * @param useCache Whether to use caching for this request (default: true for GET requests)
 * @returns The fetch response
 */
export async function apiFetch(
  path: string,
  options?: RequestInit,
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

  const response = await fetch(url, {
    ...options,
    headers,
  });

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
    } else if (path.includes('/prescriptions')) {
      responseCache.invalidate('/prescriptions');
    } else if (path.includes('/orders')) {
      responseCache.invalidate('/orders');
    } else if (path.includes('/payments')) {
      responseCache.invalidate('/payments');
    } else if (path.includes('/notifications')) {
      responseCache.invalidate('/notifications');
    } else if (path.includes('/sales')) {
      responseCache.invalidate('/sales');
    }
  }

  return response;
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

// Patient-related types
export interface CreatePatientPayload {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  medicalHistory?: string;
}

export interface UpdatePatientPayload {
  name?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  medicalHistory?: string;
}

export interface PatientResponse {
  id: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  medicalHistory?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    role: string;
  };
  ageGroup?: 'CHILD' | 'ADULT' | 'SENIOR';
  recordAge?: number;
}

export interface PaginatedPatientsResponse {
  data: PatientResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface GetPatientsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// Inventory-related types
export interface CreateMedicinePayload {
  name: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  supplier: string;
}

export interface UpdateMedicinePayload {
  name?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity?: number;
  supplier?: string;
}

export interface MedicineResponse {
  id: string;
  name: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  supplier: string;
  createdAt: string;
  updatedAt: string;
  stockStatus: 'LOW' | 'NORMAL';
  expiryStatus: 'EXPIRED' | 'EXPIRING' | 'NORMAL';
  daysUntilExpiry: number;
  isActive: boolean;
}

export interface InventoryStats {
  lowStock: number;
  expiring: number;
  expired: number;
  total: number;
}

export interface PaginatedMedicinesResponse {
  data: MedicineResponse[];
  total: number;
  page: number;
  limit: number;
  stats: InventoryStats;
}

export interface GetInventoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  stockStatus?: 'LOW' | 'NORMAL';
  expiryStatus?: 'EXPIRED' | 'EXPIRING' | 'NORMAL';
}

export interface BulkUpdateStock {
  updates: Array<{
    id: string;
    quantity: number;
  }>;
}

/**
 * Registers a new user
 * @param data Registration payload with name, email, password, and role
 * @returns The created user object (without password)
 * @throws Error if registration fails
 */
export async function register(data: RegisterPayload): Promise<UserResponse> {
  const response = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}

/**
 * Logs in a user and returns a JWT token
 * @param data Login payload with email and password
 * @returns The login response containing the access token
 * @throws Error if login fails
 */
export async function login(data: LoginPayload): Promise<LoginResponse> {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

/**
 * Patient API functions
 */

/**
 * Creates a new patient
 * @param data Patient creation payload
 * @returns The created patient object
 * @throws Error if creation fails
 */
export async function createPatient(data: CreatePatientPayload): Promise<PatientResponse> {
  const response = await apiFetch('/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create patient');
  }

  return response.json();
}

/**
 * Retrieves a patient by ID
 * @param id The patient ID
 * @returns The patient object
 * @throws Error if retrieval fails
 */
export async function getPatient(id: string): Promise<PatientResponse> {
  const response = await apiFetch(`/patients/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve patient');
  }

  return response.json();
}

/**
 * Updates a patient
 * @param id The patient ID
 * @param data Patient update payload
 * @returns The updated patient object
 * @throws Error if update fails
 */
export async function updatePatient(id: string, data: UpdatePatientPayload): Promise<PatientResponse> {
  const response = await apiFetch(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update patient');
  }

  return response.json();
}

/**
 * Retrieves a paginated list of patients
 * @param query Query parameters for pagination and search
 * @returns Paginated patients response
 * @throws Error if retrieval fails
 */
export async function getPatients(query: GetPatientsQuery = {}): Promise<PaginatedPatientsResponse> {
  const searchParams = new URLSearchParams();
  
  if (query.page) searchParams.append('page', query.page.toString());
  if (query.limit) searchParams.append('limit', query.limit.toString());
  if (query.search) searchParams.append('search', query.search);

  const queryString = searchParams.toString();
  const url = queryString ? `/patients?${queryString}` : '/patients';

  const response = await apiFetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve patients');
  }

  return response.json();
}
/**
 * Inventory API functions
 */

/**
 * Creates a new medicine
 * @param data Medicine creation payload
 * @returns The created medicine object
 * @throws Error if creation fails
 */
export async function createMedicine(data: CreateMedicinePayload): Promise<MedicineResponse> {
  const response = await apiFetch('/inventory', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create medicine');
  }

  return response.json();
}

/**
 * Retrieves a medicine by ID
 * @param id The medicine ID
 * @returns The medicine object
 * @throws Error if retrieval fails
 */
export async function getMedicine(id: string): Promise<MedicineResponse> {
  const response = await apiFetch(`/inventory/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve medicine');
  }

  return response.json();
}

/**
 * Updates a medicine
 * @param id The medicine ID
 * @param data Medicine update payload
 * @returns The updated medicine object
 * @throws Error if update fails
 */
export async function updateMedicine(id: string, data: UpdateMedicinePayload): Promise<MedicineResponse> {
  const response = await apiFetch(`/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update medicine');
  }

  return response.json();
}

/**
 * Deletes a medicine
 * @param id The medicine ID
 * @throws Error if deletion fails
 */
export async function deleteMedicine(id: string): Promise<void> {
  const response = await apiFetch(`/inventory/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete medicine');
  }
}

/**
 * Retrieves a paginated list of medicines with filtering
 * @param query Query parameters for pagination, search, and filtering
 * @returns Paginated medicines response with stats
 * @throws Error if retrieval fails
 */
export async function getMedicines(query: GetInventoryQuery = {}): Promise<PaginatedMedicinesResponse> {
  const searchParams = new URLSearchParams();
  
  if (query.page) searchParams.append('page', query.page.toString());
  if (query.limit) searchParams.append('limit', query.limit.toString());
  if (query.search) searchParams.append('search', query.search);
  if (query.stockStatus) searchParams.append('stockStatus', query.stockStatus);
  if (query.expiryStatus) searchParams.append('expiryStatus', query.expiryStatus);

  const queryString = searchParams.toString();
  const url = queryString ? `/inventory?${queryString}` : '/inventory';

  const response = await apiFetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve medicines');
  }

  return response.json();
}

/**
 * Performs bulk stock updates for multiple medicines
 * @param data Bulk update payload with medicine IDs and new quantities
 * @throws Error if bulk update fails
 */
export async function bulkUpdateStock(data: BulkUpdateStock): Promise<void> {
  const response = await apiFetch('/inventory/bulk-update', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update stock levels');
  }
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

// ============================================================
// Prescription types
// ============================================================

export interface PrescriptionItemPayload {
  medicineId: string;
  quantity: number;
}

export interface CreatePrescriptionPayload {
  patientId: string;
  items: PrescriptionItemPayload[];
}

export interface PrescriptionItemResponse {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  createdAt: string;
}

export interface PrescriptionResponse {
  id: string;
  patientId: string;
  doctorId: string;
  status: 'PENDING' | 'DISPENSED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  items?: PrescriptionItemResponse[];
  itemCount?: number;
}

export interface PaginatedPrescriptionsResponse {
  data: PrescriptionResponse[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================
// Order types
// ============================================================

export interface CreateOrderPayload {
  prescriptionId: string;
}

export interface UpdateOrderStatusPayload {
  status: 'SHIPPED' | 'DELIVERED';
  trackingInfo?: string;
}

export interface OrderResponse {
  id: string;
  prescriptionId: string;
  pharmacyId: string;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED';
  trackingInfo?: string | null;
  createdAt: string;
  updatedAt: string;
  prescription?: {
    id: string;
    patientId: string;
    doctorId: string;
    status: string;
  };
  pharmacy?: {
    id: string;
    name: string;
  };
}

export interface PaginatedOrdersResponse {
  data: OrderResponse[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================
// Payment types
// ============================================================

export interface CreatePaymentIntentPayload {
  amount: number;
  currency: string;
  paymentType: 'CONSULTATION' | 'MEDICINE';
  orderId?: string;
}

export interface PaymentResponse {
  id: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  paymentType: 'CONSULTATION' | 'MEDICINE';
  orderId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  clientSecret?: string;
}

export interface PaginatedPaymentsResponse {
  data: PaymentResponse[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================
// Notification types
// ============================================================

export interface NotificationResponse {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedNotificationsResponse {
  data: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  count: number;
}

// ============================================================
// Sales types
// ============================================================

export type SalePaymentMethod = 'CASH' | 'CARD' | 'ONLINE';
export type DiscountType = 'FLAT' | 'PERCENTAGE';

export interface SaleItemPayload {
  medicineId: string;
  quantity: number;
  pricePerUnit: number;
}

export interface CreateSalePayload {
  customerName: string;
  prescriptionId?: string;
  paymentMethod: SalePaymentMethod;
  discountType?: DiscountType;
  discount?: number;
  taxRate?: number;
  items: SaleItemPayload[];
}

export interface SaleItemResponse {
  id: string;
  saleId: string;
  medicineId: string;
  medicineName?: string;
  batchNumber: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  createdAt: string;
}

export interface SaleResponse {
  id: string;
  customerName: string;
  prescriptionId?: string;
  paymentMethod: SalePaymentMethod;
  discountType: DiscountType;
  subtotal: number;
  discount: number;
  tax: number;
  finalAmount: number;
  createdBy: string;
  createdAt: string;
  items?: SaleItemResponse[];
  itemCount?: number;
}

export interface InvoiceItemResponse {
  medicineName: string;
  batchNumber: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface InvoiceResponse {
  pharmacyName: string;
  pharmacyAddress: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  paymentMethod: string;
  items: InvoiceItemResponse[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
}

export interface PaymentMethodBreakdown {
  count: number;
  revenue: number;
}

export interface DailySalesReportResponse {
  date: string;
  totalSales: number;
  totalRevenue: number;
  totalItemsSold: number;
  paymentMethodBreakdown: {
    CASH: PaymentMethodBreakdown;
    CARD: PaymentMethodBreakdown;
    ONLINE: PaymentMethodBreakdown;
  };
}

export interface PaginatedSalesResponse {
  sales: SaleResponse[];
  total: number;
}

// ============================================================
// Prescription API functions
// ============================================================

export async function createPrescription(data: CreatePrescriptionPayload): Promise<PrescriptionResponse> {
  const response = await apiFetch('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create prescription');
  }
  return response.json();
}

export async function getPrescriptions(page = 1, limit = 10): Promise<PaginatedPrescriptionsResponse> {
  const response = await apiFetch(`/prescriptions?page=${page}&limit=${limit}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve prescriptions');
  }
  return response.json();
}

export async function getPrescription(id: string): Promise<PrescriptionResponse> {
  const response = await apiFetch(`/prescriptions/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve prescription');
  }
  return response.json();
}

export async function updatePrescriptionStatus(
  id: string,
  status: 'PENDING' | 'DISPENSED' | 'CANCELLED',
): Promise<PrescriptionResponse> {
  const response = await apiFetch(`/prescriptions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update prescription status');
  }
  return response.json();
}

// ============================================================
// Order API functions
// ============================================================

export async function createOrder(data: CreateOrderPayload): Promise<OrderResponse> {
  const response = await apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create order');
  }
  return response.json();
}

export async function getOrders(page = 1, limit = 10): Promise<PaginatedOrdersResponse> {
  const response = await apiFetch(`/orders?page=${page}&limit=${limit}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve orders');
  }
  return response.json();
}

export async function getOrder(id: string): Promise<OrderResponse> {
  const response = await apiFetch(`/orders/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve order');
  }
  return response.json();
}

export async function updateOrderStatus(
  id: string,
  data: UpdateOrderStatusPayload,
): Promise<OrderResponse> {
  const response = await apiFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update order status');
  }
  return response.json();
}

// ============================================================
// Payment API functions
// ============================================================

export async function createPaymentIntent(
  data: CreatePaymentIntentPayload,
): Promise<PaymentResponse> {
  const response = await apiFetch('/payments/intent', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create payment intent');
  }
  return response.json();
}

export async function getPayments(page = 1, limit = 10): Promise<PaginatedPaymentsResponse> {
  const response = await apiFetch(`/payments?page=${page}&limit=${limit}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve payments');
  }
  return response.json();
}

export async function getPayment(id: string): Promise<PaymentResponse> {
  const response = await apiFetch(`/payments/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve payment');
  }
  return response.json();
}

// ============================================================
// Notification API functions
// ============================================================

export async function getNotifications(page = 1, limit = 20): Promise<PaginatedNotificationsResponse> {
  const response = await apiFetch(`/notifications?page=${page}&limit=${limit}`, undefined, false);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve notifications');
  }
  return response.json();
}

export async function markNotificationRead(id: string): Promise<NotificationResponse> {
  const response = await apiFetch(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark notification as read');
  }
  return response.json();
}

export async function getUnreadNotificationCount(): Promise<UnreadCountResponse> {
  const response = await apiFetch('/notifications/unread-count', undefined, false);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get unread count');
  }
  return response.json();
}

// ============================================================
// Sales API functions
// ============================================================

export async function createSale(data: CreateSalePayload): Promise<SaleResponse> {
  const response = await apiFetch('/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create sale');
  }
  return response.json();
}

export async function getSales(
  page = 1,
  limit = 20,
  startDate?: string,
  endDate?: string,
): Promise<PaginatedSalesResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('page', page.toString());
  searchParams.append('limit', limit.toString());
  if (startDate) searchParams.append('startDate', startDate);
  if (endDate) searchParams.append('endDate', endDate);

  const queryString = searchParams.toString();
  const response = await apiFetch(`/sales?${queryString}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve sales');
  }
  return response.json();
}

export async function getSale(id: string): Promise<SaleResponse> {
  const response = await apiFetch(`/sales/${id}`, undefined, false); // Disable cache for detail views
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve sale');
  }
  return response.json();
}

export async function getSaleInvoice(id: string): Promise<InvoiceResponse> {
  const response = await apiFetch(`/sales/${id}/invoice`, undefined, false); // Disable cache for invoices
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve invoice');
  }
  return response.json();
}

export async function getDailySalesReport(date?: string): Promise<DailySalesReportResponse> {
  const searchParams = new URLSearchParams();
  if (date) searchParams.append('date', date);

  const queryString = searchParams.toString();
  const url = queryString ? `/sales/report/daily?${queryString}` : '/sales/report/daily';
  
  const response = await apiFetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve daily sales report');
  }
  return response.json();
}
