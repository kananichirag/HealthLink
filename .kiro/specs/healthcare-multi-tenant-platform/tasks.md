# Implementation Plan: Healthcare Multi-Tenant Platform

## Overview

This plan transforms the existing single-tenant healthcare app into a multi-tenant platform. Tasks are ordered to build foundational infrastructure first (schema, tenant isolation, auth changes), then layer domain modules (doctor, patient, pharmacy, admin), then frontend migration (TanStack Query, new UIs), and finally documentation. Each task builds incrementally on previous work so there is no orphaned code.

## Tasks

- [x] 1. Database schema migration and tenant infrastructure
  - [x] 1.1 Update Prisma schema with new enums, Tenant model, and new domain models
    - Add enums: `TenantType`, `ConnectionStatus`, `AppointmentStatus`, `AllergySeverity`, `DayOfWeek`
    - Add models: `Tenant`, `DoctorPharmacyConnection`, `AllergyReport`, `Appointment`, `DoctorSchedule`, `BlockedDate`, `PurchaseRecord`
    - Add `tenantId` (nullable initially) to existing models: `User`, `Patient`, `Medicine`, `Prescription`, `PrescriptionItem` (add `dosage`, `frequency`, `duration`), `Sale`, `SaleItem`, `Order`, `Payment`, `Notification`
    - Add `email` and `mobile` fields to `Patient`, `category` and `unitPrice` to `Medicine`, `targetPharmacyId` to `Prescription`
    - Add all new relations on `User` model (`doctorConnections`, `pharmacyConnections`, `allergyReports`, `doctorAppointments`, `doctorSchedules`, `blockedDates`)
    - Add all indexes as specified in design (`@@index([tenantId])`, composite indexes, unique constraints)
    - Generate and run Prisma migration
    - _Requirements: 1.1, 1.5, 3.1, 3.4, 4.1, 5.1, 5.5, 6.1, 8.1, 14.3, 14.4, 16.1_

  - [ ]* 1.2 Write property tests for tenant-scoped record creation
    - **Property 1: Tenant-scoped record creation** — verify every created record has `tenantId` matching the creating user's `tenantId`
    - **Validates: Requirements 1.1, 3.1, 4.1, 14.3, 16.1**

  - [x] 1.3 Implement Prisma tenant middleware and AsyncLocalStorage context
    - Create `backend/src/tenant/tenant-context.ts` with `AsyncLocalStorage` for storing `tenantId` per request
    - Create `backend/src/tenant/tenant-context.middleware.ts` — NestJS middleware that reads `tenantId` from `req.user` and stores it in `AsyncLocalStorage`
    - Create `backend/src/tenant/prisma-tenant.middleware.ts` — Prisma `$use` middleware that injects `WHERE tenantId = ?` on all `findMany`, `findFirst`, `findUnique`, `create`, `update`, `delete` operations for tenant-scoped models
    - Skip tenant injection for Admin role and non-tenant-scoped models (e.g., `Tenant` itself)
    - Update `PrismaService` in `backend/src/prisma/prisma.service.ts` to register the tenant middleware on `$use`
    - _Requirements: 1.2, 1.5_

  - [ ]* 1.4 Write property tests for tenant-scoped query isolation
    - **Property 2: Tenant-scoped query isolation** — verify every list/query result only contains records with matching `tenantId`
    - **Validates: Requirements 1.2, 1.3, 3.3, 4.2**

- [x] 2. Tenant module and auth updates
  - [x] 2.1 Create Tenant module (CRUD service, controller, DTOs)
    - Create `backend/src/tenant/tenant.module.ts`, `tenant.service.ts`, `tenant.controller.ts`
    - Create DTOs: `CreateTenantDto` (name, type)
    - Implement `createTenant`, `findAll`, `findById`, `activate`, `deactivate`, `getUserCount`
    - Tenant deactivation should set `isActive = false`
    - _Requirements: 1.4, 21.1, 21.3_

  - [x] 2.2 Update auth module for multi-tenancy
    - Update `backend/src/auth/dto/register.dto.ts` to accept optional `tenantId` or tenant creation fields (name, type)
    - Update `backend/src/auth/auth.service.ts` registration flow: create a Tenant record when a Pharmacy or Clinic registers, assign `tenantId` to the new User
    - Update `backend/src/auth/strategies/jwt.strategy.ts` to include `tenantId` in the JWT payload and validate it
    - Update `backend/src/auth/auth.service.ts` login to include `tenantId` in the JWT token
    - Update `backend/src/auth/guards/jwt-auth.guard.ts` to check tenant `isActive` status; return 403 if tenant is deactivated
    - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 9.1, 9.2, 9.3_

  - [ ]* 2.3 Write property tests for JWT token claims
    - **Property 3: JWT token contains required claims** — verify JWT decodes to payload with `sub`, `email`, `role`, and `tenantId`
    - **Validates: Requirements 2.2, 9.2**

  - [x] 2.4 Apply TenantContextMiddleware globally and wire up AppModule
    - Register `TenantContextMiddleware` in `AppModule` for all routes
    - Import `TenantModule` in `AppModule`
    - Ensure middleware runs after JWT guard so `req.user` is populated
    - _Requirements: 1.2, 1.5_

- [x] 3. Checkpoint — Tenant infrastructure verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Doctor module — backend
  - [x] 4.1 Create Doctor module structure and patient management endpoints
    - Create `backend/src/doctor/doctor.module.ts`, `doctor.controller.ts`, `doctor.service.ts`
    - Create DTOs: `CreatePatientDto` (name, email, mobile, age, gender), patient query filters
    - Implement `POST /doctor/patients` — create patient within doctor's tenant
    - Implement `GET /doctor/patients` — list patients for doctor's tenant, sorted by `createdAt` desc
    - Validate patient email uniqueness within tenant
    - Register `DoctorModule` in `AppModule`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.2 Write property tests for patient email uniqueness
    - **Property 4: Patient email uniqueness within tenant** — same email in same tenant fails, same email in different tenant succeeds
    - **Validates: Requirements 3.2**

  - [x] 4.3 Implement allergy report endpoints
    - Create DTOs: `CreateAllergyReportDto` (patientId, allergyType, symptoms, severity, notes)
    - Implement `POST /doctor/allergy-reports` — create allergy report, verify patient belongs to doctor's tenant
    - Implement `GET /doctor/allergy-reports/:patientId` — list reports sorted by `createdAt` desc
    - Validate severity enum (LOW, MODERATE, HIGH, CRITICAL)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.4 Write property tests for allergy reports
    - **Property 5: Allergy report severity validation** — invalid severity rejected, valid severity accepted
    - **Property 6: Allergy report ordering** — results sorted by `createdAt` descending
    - **Validates: Requirements 4.3, 4.4**

  - [x] 4.5 Implement prescription creation and dispatch endpoints
    - Create DTOs: `CreatePrescriptionDto` (patientId, items with medicineName/dosage/frequency/quantity, optional targetPharmacyId)
    - Implement `POST /doctor/prescriptions` — create prescription with status PENDING, include dosage fields on PrescriptionItem
    - Implement `POST /doctor/prescriptions/:id/dispatch` — verify active DoctorPharmacyConnection exists, dispatch to pharmacy, create notification
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 4.6 Write property tests for prescriptions
    - **Property 7: Prescription creation defaults to PENDING** — every new prescription has status PENDING
    - **Property 8: Prescription dispatch requires active connection** — dispatch succeeds only with ACTIVE connection, fails with 400 otherwise
    - **Property 9: Prescription dispatch creates notification** — successful dispatch creates pharmacy notification
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [x] 4.7 Implement doctor-pharmacy connection endpoints
    - Create DTOs: `RequestConnectionDto` (pharmacyId)
    - Implement `POST /doctor/pharmacy-connections` — create connection with status PENDING
    - Implement `GET /doctor/pharmacy-connections` — list connections
    - Implement `GET /doctor/pharmacies` — list all pharmacies with connection status
    - Implement `DELETE /doctor/pharmacy-connections/:id` — terminate connection (set INACTIVE)
    - Add endpoint for pharmacy to accept connection (PATCH status to ACTIVE)
    - Enforce unique constraint on `[doctorId, pharmacyId]`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 4.8 Write property tests for pharmacy connections
    - **Property 10: Connection request defaults to PENDING** — new connection has status PENDING
    - **Property 11: Connection acceptance transitions to ACTIVE** — accepting PENDING connection results in ACTIVE
    - **Property 12: Duplicate connection prevention** — duplicate pair fails with 409
    - **Property 13: Connection termination prevents dispatches** — terminated connection becomes INACTIVE, subsequent dispatches fail
    - **Validates: Requirements 6.1, 6.2, 6.4, 6.5**

  - [x] 4.9 Implement appointment viewing and scheduling endpoints
    - Create DTOs: `SetAvailabilityDto` (slots per day of week), `BlockDateDto` (date), `SetMaxAppointmentsDto` (maxPerDay), appointment query filters
    - Implement `GET /doctor/appointments` — list appointments sorted by date asc, support status and date range filters
    - Implement `PUT /doctor/schedule` — set recurring availability (DoctorSchedule records)
    - Implement `POST /doctor/schedule/block` — block a date (create BlockedDate)
    - Implement `DELETE /doctor/schedule/block/:date` — unblock a date (delete BlockedDate)
    - Implement `PUT /doctor/schedule/max-appointments` — set max appointments per day
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.5_

  - [ ]* 4.10 Write property tests for appointments and scheduling
    - **Property 14: Appointment list filter correctness** — filtered results match status and date range criteria
    - **Property 15: Blocked date prevents bookings** — booking on blocked date fails with 409
    - **Property 16: Block-unblock round trip restores schedule** — blocking then unblocking restores original available slots
    - **Property 17: Max appointments per day enforcement** — (N+1)th booking fails when N is the max
    - **Validates: Requirements 7.1, 7.2, 8.2, 8.3, 8.5**

- [x] 5. Checkpoint — Doctor module verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Patient portal module — backend
  - [x] 6.1 Create Patient portal module with doctor discovery and appointment booking
    - Create `backend/src/patient-portal/patient-portal.module.ts`, `patient-portal.controller.ts`, `patient-portal.service.ts`
    - Create DTOs: `BookAppointmentDto` (doctorId, date, timeSlot), appointment query filters
    - Implement `GET /patient/doctors` — list all doctors with clinic name, specialization, availability
    - Implement `POST /patient/doctors/:id/connect` — create patient-doctor association
    - Implement `GET /patient/doctors/:id/slots` — get available slots for a doctor on a date (exclude booked and blocked)
    - Implement `POST /patient/appointments` — book appointment (check slot availability, enforce max per day, create SCHEDULED appointment, send notifications to both parties)
    - Implement `PATCH /patient/appointments/:id/cancel` — cancel appointment (set CANCELLED, free slot)
    - Implement `GET /patient/appointments` — list patient's appointments
    - Register `PatientPortalModule` in `AppModule`
    - _Requirements: 10.1, 10.2, 10.3, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 6.2 Write property tests for patient portal
    - **Property 18: Available slots exclude booked and blocked** — returned slots don't include booked or blocked slots
    - **Property 19: Appointment booking creates notifications for both parties** — both patient and doctor get notifications
    - **Property 20: Appointment cancellation frees slot** — cancelled appointment's slot becomes available again
    - **Validates: Requirements 11.2, 11.4, 11.5**

  - [x] 6.3 Implement patient prescription viewing endpoints
    - Implement `GET /patient/prescriptions` — list prescriptions assigned to patient, sorted by `createdAt` desc
    - Implement `GET /patient/prescriptions/:id` — full prescription detail with all PrescriptionItem records, doctor name, pharmacy info
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 7. Pharmacy module — backend
  - [x] 7.1 Create Pharmacy module with prescriptions and medicines tabs
    - Create `backend/src/pharmacy/pharmacy.module.ts`, `pharmacy.controller.ts`, `pharmacy.service.ts`
    - Create DTOs: `AddMedicineDto`, `UpdateMedicineDto`, prescription query filters, medicine query filters
    - Implement `GET /pharmacy/prescriptions` — list received prescriptions sorted by `createdAt` desc, support status and date range filters
    - Implement `PATCH /pharmacy/prescriptions/:id/dispense` — mark as DISPENSED, notify patient
    - Implement `GET /pharmacy/medicines` — list medicines with category filter and name/batch search
    - Implement `POST /pharmacy/medicines` — add medicine with batch number uniqueness validation within tenant
    - Implement `PUT /pharmacy/medicines/:id` — update medicine
    - Register `PharmacyModule` in `AppModule`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 7.2 Write property tests for pharmacy medicines
    - **Property 21: Medicine batch number uniqueness within tenant** — duplicate batch number in same tenant fails
    - **Property 22: Medicine search correctness** — every result contains search string in name or batchNumber
    - **Validates: Requirements 14.4, 14.5**

  - [x] 7.3 Implement inventory and purchase tabs
    - Create DTOs: `RecordPurchaseDto` (medicineId, batchNumber, quantity, unitCost, sellerName, sellerCompany, purchaseDate), purchase query filters
    - Implement `GET /pharmacy/inventory` — list medicine batches with quantity, expiry, stock status (LOW/NORMAL based on threshold)
    - Implement `GET /pharmacy/inventory/alerts` — return low-stock and near-expiry alerts
    - Implement `POST /pharmacy/purchases` — record purchase, update medicine batch quantity
    - Implement `GET /pharmacy/purchases` — list purchases sorted by date desc, support date range filters
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 16.1, 16.2, 16.3, 16.4, 16.5_

  - [ ]* 7.4 Write property tests for inventory and purchases
    - **Property 23: Stock status computation** — quantity below threshold → LOW, expiry within threshold → EXPIRING
    - **Property 24: Low stock notification after sale** — sale causing stock below threshold generates LOW_STOCK notification
    - **Property 25: Purchase increases medicine stock** — purchase of Q units increases stock by exactly Q
    - **Validates: Requirements 15.2, 15.3, 15.4, 16.5**

  - [x] 7.5 Enhance sales module with prescription checkout and financial calculations
    - Update existing `backend/src/sales/sales.service.ts` to add `tenantId` scoping
    - Create DTOs: `PrescriptionCheckoutDto` (prescriptionId)
    - Implement `POST /pharmacy/sales/prescription-checkout` — auto-populate bill from prescription, match medicines to inventory, flag unavailable items
    - Implement `POST /pharmacy/sales` — create sale with FIFO batch selection, stock deduction in single transaction, support CASH/CARD/ONLINE payment methods
    - Implement `GET /pharmacy/sales/:id/invoice` — return sale data formatted for invoice generation
    - Implement `POST /pharmacy/sales/:id/send-bill` — send invoice notification to patient
    - Link Sale to Prescription via `prescriptionId`, update prescription status to DISPENSED on completion
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 18.1, 18.2, 18.3, 18.4_

  - [ ]* 7.6 Write property tests for sales and financial calculations
    - **Property 26: Financial calculation correctness** — verify subtotal, discount, tax, and finalAmount arithmetic for random item sets
    - **Property 27: FIFO batch selection and stock deduction** — earliest-expiry batch selected, quantity decremented correctly
    - **Property 28: Insufficient stock rejection** — sale exceeding available stock returns 422
    - **Property 29: Prescription checkout auto-population** — bill contains entries for available medicines, flags unavailable ones
    - **Property 30: Prescription checkout links sale and updates status** — sale has prescriptionId, prescription becomes DISPENSED
    - **Validates: Requirements 17.2, 17.3, 17.4, 17.5, 18.1, 18.2, 18.3, 18.4**

  - [x] 7.7 Implement reports tab endpoints
    - Implement `GET /pharmacy/reports/daily` — today's total sales count, revenue, items sold
    - Implement `GET /pharmacy/reports/top-medicines` — top 10 medicines by quantity sold in date range
    - Implement `GET /pharmacy/reports/weekly-summary` — weekly revenue, purchase cost, net margin
    - Implement `GET /pharmacy/reports/payment-breakdown` — count and revenue per payment method for selected period
    - All report endpoints support custom date range filtering
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [ ]* 7.8 Write property tests for reports
    - **Property 31: Daily report aggregation consistency** — totalSales = count, totalRevenue = sum of finalAmount, payment method breakdown sums match totals
    - **Property 32: Top medicines ranking** — sorted by quantity desc, limited to 10
    - **Property 33: Weekly summary consistency** — netMargin = totalRevenue - totalPurchaseCost
    - **Property 34: Date range filter correctness** — every record falls within [start, end] inclusive
    - **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5**

- [x] 8. Checkpoint — All backend modules verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Admin module — backend
  - [x] 9.1 Create Admin module with tenant and user management
    - Create `backend/src/admin/admin.module.ts`, `admin.controller.ts`, `admin.service.ts`
    - Create DTOs: tenant query filters, user query filters
    - Implement `GET /admin/tenants` — list all tenants with name, type, creation date, active user count
    - Implement `PATCH /admin/tenants/:id/activate` — activate tenant
    - Implement `PATCH /admin/tenants/:id/deactivate` — deactivate tenant, invalidate all active JWTs for that tenant's users
    - Implement `GET /admin/users` — list all users across tenants with role, tenant, and date filters
    - Implement `PATCH /admin/users/:id/activate` — activate user
    - Implement `PATCH /admin/users/:id/deactivate` — deactivate user
    - Admin endpoints bypass tenant filtering (admin role check in Prisma middleware)
    - Register `AdminModule` in `AppModule`
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [x] 10. TanStack Query frontend setup and hook layer
  - [x] 10.1 Install TanStack Query and configure QueryClientProvider
    - Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
    - Create `frontend/src/lib/query-client.ts` with `QueryClient` configuration (staleTime: 5min, retry: 2, refetchOnWindowFocus: false)
    - Create `frontend/src/providers/QueryProvider.tsx` wrapping app with `QueryClientProvider` + `ReactQueryDevtools`
    - Update `frontend/src/app/layout.tsx` to wrap with `QueryProvider`
    - Keep existing `apiFetch` as the underlying fetch adapter for all query functions
    - _Requirements: 22.1, 22.2, 22.5_

  - [x] 10.2 Create TanStack Query hooks for all modules
    - Create `frontend/src/hooks/useDoctorQueries.ts` — hooks for patients, allergy reports, prescriptions, pharmacy connections, appointments, scheduling
    - Create `frontend/src/hooks/usePatientQueries.ts` — hooks for doctor list, available slots, appointment booking/cancellation, prescriptions
    - Create `frontend/src/hooks/usePharmacyQueries.ts` — hooks for prescriptions, medicines, inventory, purchases, sales, prescription checkout, reports
    - Create `frontend/src/hooks/useAdminQueries.ts` — hooks for tenants, users
    - All `useQuery` hooks use `apiFetch` as fetcher; all `useMutation` hooks include cache invalidation
    - _Requirements: 22.3, 22.4, 22.5_

- [x] 11. Frontend — Doctor module UI
  - [x] 11.1 Create doctor dashboard pages
    - Create `frontend/src/app/dashboard/doctor/patients/page.tsx` — patient list with add patient form
    - Create `frontend/src/app/dashboard/doctor/allergy-reports/page.tsx` — allergy report management per patient
    - Create `frontend/src/app/dashboard/doctor/prescriptions/page.tsx` — prescription creation and dispatch
    - Create `frontend/src/app/dashboard/doctor/pharmacy-connections/page.tsx` — pharmacy connection management
    - Create `frontend/src/app/dashboard/doctor/appointments/page.tsx` — appointment list with status and date filters
    - Create `frontend/src/app/dashboard/doctor/schedule/page.tsx` — availability configuration and date blocking
    - All pages use TanStack Query hooks from `useDoctorQueries`
    - _Requirements: 3.1, 3.3, 4.1, 4.3, 5.1, 6.1, 6.3, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3_

- [x] 12. Frontend — Patient module UI
  - [x] 12.1 Create patient dashboard pages
    - Create `frontend/src/app/dashboard/patient/doctors/page.tsx` — doctor discovery and connection
    - Create `frontend/src/app/dashboard/patient/appointments/page.tsx` — slot selection, booking, cancellation
    - Create `frontend/src/app/dashboard/patient/prescriptions/page.tsx` — prescription list and detail view
    - All pages use TanStack Query hooks from `usePatientQueries`
    - _Requirements: 10.1, 10.2, 11.1, 11.2, 11.5, 12.1, 12.2, 12.3_

- [x] 13. Frontend — Pharmacy module UI
  - [x] 13.1 Create pharmacy tab pages (Prescriptions, Medicines, Inventory, Purchase)
    - Create `frontend/src/app/dashboard/pharmacy/prescriptions/page.tsx` — received prescriptions with status filters
    - Create `frontend/src/app/dashboard/pharmacy/medicines/page.tsx` — medicine catalog with category filter and search
    - Create `frontend/src/app/dashboard/pharmacy/inventory/page.tsx` — batch inventory with low-stock and near-expiry alerts
    - Create `frontend/src/app/dashboard/pharmacy/purchases/page.tsx` — purchase recording and history with date range filters
    - All pages use TanStack Query hooks from `usePharmacyQueries`
    - _Requirements: 13.1, 13.2, 13.4, 14.1, 14.2, 14.5, 15.1, 15.2, 15.3, 16.1, 16.2, 16.3, 16.4_

  - [x] 13.2 Create pharmacy Sales tab with optimized bill generation
    - Create `frontend/src/app/dashboard/pharmacy/sales/page.tsx` — sales list
    - Create `frontend/src/app/dashboard/pharmacy/sales/new/page.tsx` — bill generation interface
    - Implement debounced medicine search (200ms) with `useQuery` and `keepPreviousData: true`
    - Implement bill state with `useReducer` for local running totals (subtotal, discount, GST, final amount)
    - Implement prescription checkout flow — auto-populate bill from prescription, flag unavailable medicines
    - Implement optimistic submission with `useMutation` `onMutate` for instant feedback, rollback on error
    - Support CASH, CARD, ONLINE payment method selection
    - _Requirements: 17.1, 17.2, 17.3, 17.6, 18.1, 18.2_

  - [x] 13.3 Implement Invoice PDF generation and delivery
    - Install `@react-pdf/renderer` in frontend
    - Create `frontend/src/components/InvoicePDF.tsx` — PDF component with pharmacy name, address, invoice number, date, patient name, itemized medicines, subtotal, discount, GST, final amount, payment method
    - Support detailed and compact summary formats
    - Implement print functionality from sales interface
    - Implement send-bill-to-patient action (calls `POST /pharmacy/sales/:id/send-bill`)
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

  - [x] 13.4 Create pharmacy Reports tab
    - Create `frontend/src/app/dashboard/pharmacy/reports/page.tsx`
    - Display today's sales summary (count, revenue, items sold)
    - Display top 10 most-sold medicines chart/table for selected date range
    - Display weekly sales and purchase summaries with net margin
    - Display payment method breakdown (count and revenue per method)
    - Support custom date range selection (past week, past month, past quarter, custom)
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [x] 14. Frontend — Admin module UI
  - [x] 14.1 Create admin dashboard pages
    - Create `frontend/src/app/dashboard/admin/tenants/page.tsx` — tenant list with activate/deactivate actions
    - Create `frontend/src/app/dashboard/admin/users/page.tsx` — user list with role, tenant, and date filters, activate/deactivate actions
    - All pages use TanStack Query hooks from `useAdminQueries`
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

- [x] 15. Checkpoint — Full frontend verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Update dashboard layout and navigation
  - [x] 16.1 Update dashboard layout for role-based navigation
    - Update `frontend/src/app/dashboard/layout.tsx` to show role-specific sidebar navigation
    - Doctor role: Patients, Allergy Reports, Prescriptions, Pharmacy Connections, Appointments, Schedule
    - Patient role: Doctors, Appointments, Prescriptions
    - Pharmacy role: Prescriptions, Medicines, Inventory, Purchases, Sales, Reports
    - Admin role: Tenants, Users
    - Update `frontend/src/app/dashboard/page.tsx` to redirect to role-appropriate default page
    - _Requirements: 2.1, 9.1, 13.1, 21.1_

- [x] 17. Pharmacy sub-module documentation
  - [x] 17.1 Create documentation files for all six pharmacy sub-modules
    - Create `docs/pharmacy-prescriptions.md` — module overview, user flow, API endpoints, database schema, business rules
    - Create `docs/pharmacy-medicines.md` — module overview, user flow, API endpoints, database schema, business rules
    - Create `docs/pharmacy-inventory.md` — module overview, user flow, API endpoints, database schema, business rules
    - Create `docs/pharmacy-purchases.md` — module overview, user flow, API endpoints, database schema, business rules
    - Create `docs/pharmacy-sales.md` — module overview, user flow, API endpoints, database schema, business rules
    - Create `docs/pharmacy-reports.md` — module overview, user flow, API endpoints, database schema, business rules
    - Each file includes: module overview, user flow description, API endpoint specifications, database schema (relevant Prisma models and relations), and business rules
    - _Requirements: 23.1, 23.2, 23.3_

- [x] 18. Final checkpoint — Full platform verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate the 34 correctness properties defined in the design using `fast-check`
- The existing `apiFetch` function is preserved as the TanStack Query fetch adapter
- All backend modules use the Prisma tenant middleware for automatic tenant scoping
- The Sales tab is specifically optimized for speed with debounced search, local state management, and optimistic updates
