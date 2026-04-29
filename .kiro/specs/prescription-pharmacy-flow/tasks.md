# Implementation Plan: Prescription–Pharmacy Flow

## Overview

This plan implements the complete prescription-pharmacy workflow on top of the existing HealthLink infrastructure. The work is organized into four phases: (1) backend service hardening and new endpoints, (2) new frontend hooks, (3) frontend page and component changes, and (4) property-based tests. No Prisma schema changes are needed — all models already exist.

**Key facts from codebase exploration:**
- `fast-check` is already installed in `backend/devDependencies`
- `DoctorService.acceptConnection` already enforces `pharmacyId` match; the `@Roles(Role.PHARMACY)` override on the controller route is already in place
- `PharmacyService.listPrescriptions` already filters by `targetPharmacyId`
- `PharmacyService.prescriptionCheckout` and `useCreateSale` / `usePrescriptionCheckout` hooks already exist
- `DoctorService.createPrescription` does **not** yet validate active connection or pharmacy role — this must be added
- The doctor prescriptions page has mock recent prescriptions and no connection gate — both must be replaced

---

## Tasks

- [x] 1. Harden `DoctorService.createPrescription` with connection and role validation
  - [x] 1.1 Add active-connection validation to `DoctorService.createPrescription`
    - In `backend/src/doctor/doctor.service.ts`, inside `createPrescription`, after the patient tenant check and before the medicine resolution loop, add: if `dto.targetPharmacyId` is present, query `doctorPharmacyConnection` for `{ doctorId, pharmacyId: dto.targetPharmacyId, status: 'ACTIVE' }`; if not found, throw `BadRequestException('No active connection exists with the specified pharmacy')`
    - _Requirements: 12.1, 12.2_

  - [x] 1.2 Add pharmacy-role validation to `DoctorService.createPrescription`
    - After the active-connection check, query `prisma.user.findFirst({ where: { id: dto.targetPharmacyId, role: 'PHARMACY' } })`; if not found, throw `BadRequestException('Target pharmacy not found or is not a pharmacy account')`
    - Skip both checks when `dto.targetPharmacyId` is absent (draft path)
    - _Requirements: 12.3, 12.4_

  - [ ]* 1.3 Write property tests for `createPrescription` validation
    - **Property 20: Prescription dispatch requires active connection** — for any `(doctorId, targetPharmacyId)` pair with no ACTIVE connection, `createPrescription` SHALL throw `BadRequestException`
    - **Property 21: Draft prescription bypasses connection validation** — for any payload without `targetPharmacyId`, `createPrescription` SHALL succeed regardless of connection state
    - **Property 22: Prescription dispatch validates pharmacy role** — for any `targetPharmacyId` referencing a non-PHARMACY user, `createPrescription` SHALL throw `BadRequestException`
    - **Property 5: Prescription creation sets correct status and target** — for any valid payload with an ACTIVE connection, the created record SHALL have `status = PENDING` and `targetPharmacyId` equal to the submitted value
    - Write tests in `backend/src/doctor/doctor.service.spec.ts` using `fast-check`; tag each with `// Feature: prescription-pharmacy-flow, Property N:`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 5.1_

- [x] 2. Add `getRecentPrescriptions` and `getPatientPrescriptions` to `DoctorService`
  - [x] 2.1 Implement `DoctorService.getRecentPrescriptions(doctorId, limit)`
    - Add method to `backend/src/doctor/doctor.service.ts`
    - Query: `prisma.prescription.findMany({ where: { doctorId }, take: limit, orderBy: { createdAt: 'desc' }, include: { patient: { select: { id, name } }, items: { include: { medicine: { select: { id, name } } } } } })`
    - Return `{ data: prescriptions, total: count, limit }`; run a separate `count` query for `total`
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 2.2 Implement `DoctorService.getPatientPrescriptions(patientId, doctorId, tenantId)`
    - Add method to `backend/src/doctor/doctor.service.ts`
    - First verify patient belongs to doctor's tenant: `prisma.patient.findFirst({ where: { id: patientId, tenantId } })`; throw `ForbiddenException('Patient does not belong to your tenant')` if not found
    - Query: `prisma.prescription.findMany({ where: { patientId, doctorId }, orderBy: { createdAt: 'desc' }, include: { items: { include: { medicine: { select: { id, name } } } }, targetPharmacy: { select: { id, name } } } })`
    - Note: `targetPharmacy` is not a named relation on `Prescription` — use `prisma.user.findUnique` for the pharmacy name in a post-query enrichment step, or add a raw include via `doctor` relation alias; check schema — `Prescription` has `targetPharmacyId String?` with no explicit relation defined, so fetch pharmacy name separately with a `prisma.user.findUnique` call per prescription (or a single `findMany` with `id: { in: pharmacyIds }`)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 13.1, 13.2, 13.3, 13.4_

  - [ ]* 2.3 Write property tests for `getPatientPrescriptions`
    - **Property 10: Patient prescription history scoped to doctor and patient** — for any `(doctorId, patientId)` pair, every returned prescription SHALL have `doctorId` and `patientId` matching the inputs
    - **Property 23: Patient prescription history enforces tenant isolation** — for any `patientId` where `patient.tenantId !== doctor.tenantId`, the method SHALL throw `ForbiddenException`
    - **Property 8: Recent prescriptions ordered by createdAt descending** — for any list of prescriptions returned by `getRecentPrescriptions`, adjacent pairs SHALL satisfy `items[i].createdAt >= items[i+1].createdAt`
    - Write tests in `backend/src/doctor/doctor.service.spec.ts`
    - _Requirements: 7.1, 7.3, 13.1, 13.3, 13.4_

  - [ ]* 2.4 Write property tests for `getRecentPrescriptions` response shape
    - **Property 9: Recent prescriptions response includes required fields** — for any prescription returned, the object SHALL include `patient.name`, `createdAt`, `items` array, and `status`
    - Write tests in `backend/src/doctor/doctor.service.spec.ts`
    - _Requirements: 6.2_

- [x] 3. Add new DTOs and controller routes to `DoctorController`
  - [x] 3.1 Create `RecentPrescriptionsQueryDto` in `backend/src/doctor/dto/`
    - New file `backend/src/doctor/dto/recent-prescriptions-query.dto.ts`
    - Fields: `@IsOptional() @IsInt() @Min(1) @Max(50) limit?: number = 5`
    - Export from `backend/src/doctor/dto/index.ts`
    - _Requirements: 6.1_

  - [x] 3.2 Add `GET /doctor/prescriptions` route to `DoctorController`
    - In `backend/src/doctor/doctor.controller.ts`, add a `@Get('prescriptions')` handler before the existing `@Post('prescriptions')` handler
    - Inject `RecentPrescriptionsQueryDto` via `@Query` with `ValidationPipe`
    - Call `this.doctorService.getRecentPrescriptions(req.user.sub, query.limit ?? 5)`
    - Route is already protected by class-level `@Roles(Role.DOCTOR)` — no additional guard needed
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 3.3 Add `GET /doctor/patients/:patientId/prescriptions` route to `DoctorController`
    - In `backend/src/doctor/doctor.controller.ts`, add a `@Get('patients/:patientId/prescriptions')` handler
    - Call `this.doctorService.getPatientPrescriptions(patientId, req.user.sub, req.user.tenantId)`
    - _Requirements: 7.5, 13.1, 13.2, 13.3, 13.4_

- [x] 4. Add `listDoctorConnections` to `PharmacyService` and new route to `PharmacyController`
  - [x] 4.1 Create `ConnectionQueryDto` in `backend/src/pharmacy/dto/`
    - New file `backend/src/pharmacy/dto/connection-query.dto.ts`
    - Fields: `@IsOptional() @IsEnum(ConnectionStatus) status?: ConnectionStatus`
    - Import `ConnectionStatus` from `@prisma/client`
    - Export from `backend/src/pharmacy/dto/index.ts`
    - _Requirements: 14.3_

  - [x] 4.2 Implement `PharmacyService.listDoctorConnections(pharmacyUserId, status?)`
    - Add method to `backend/src/pharmacy/pharmacy.service.ts`
    - Build `where` clause: `{ pharmacyId: pharmacyUserId }`, add `status` filter if provided
    - Query: `prisma.doctorPharmacyConnection.findMany({ where, orderBy: { createdAt: 'desc' }, include: { doctor: { select: { id, name, email } } } })`
    - _Requirements: 8.1, 8.2, 14.1, 14.2, 14.3_

  - [x] 4.3 Add `GET /pharmacy/doctor-connections` route to `PharmacyController`
    - In `backend/src/pharmacy/pharmacy.controller.ts`, add a `@Get('doctor-connections')` handler
    - Inject `ConnectionQueryDto` via `@Query` with `ValidationPipe`
    - Call `this.pharmacyService.listDoctorConnections(req.user.sub, query.status)`
    - Route is already protected by class-level `@Roles(Role.PHARMACY)` — no additional guard needed
    - _Requirements: 14.1, 14.4_

  - [ ]* 4.4 Write property tests for `listDoctorConnections`
    - **Property 12: Pharmacy connections endpoint scoped to authenticated pharmacy** — for any pharmacy user P, every returned connection SHALL have `pharmacyId === P.id`
    - **Property 13: Pharmacy connections status filter is exact** — for any status S ∈ {PENDING, ACTIVE, INACTIVE}, every returned connection SHALL have `status === S`
    - **Property 14: Pharmacy connections response includes doctor details** — every returned connection SHALL include `doctor.id`, `doctor.name`, `doctor.email`
    - Write tests in `backend/src/pharmacy/pharmacy.service.spec.ts`
    - _Requirements: 8.1, 8.2, 14.1, 14.2, 14.3_

- [x] 5. Checkpoint — verify backend compiles and existing tests pass
  - Run `npm run build` in `backend/` to confirm no TypeScript errors
  - Run `npm test -- --testPathPattern="doctor.service|pharmacy.service"` in `backend/` to confirm existing tests still pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Add new TanStack Query hooks to `useDoctorQueries.ts`
  - [x] 6.1 Add `useRecentPrescriptions(limit?)` hook
    - In `frontend/src/hooks/useDoctorQueries.ts`, add a `useQuery` hook that calls `GET /doctor/prescriptions?limit={limit}`
    - Query key: `['doctor', 'prescriptions', 'recent', limit]`
    - Export the hook
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.2 Add `usePatientPrescriptions(patientId)` hook
    - In `frontend/src/hooks/useDoctorQueries.ts`, add a `useQuery` hook that calls `GET /doctor/patients/${patientId}/prescriptions`
    - Query key: `['doctor', 'patients', patientId, 'prescriptions']`
    - Set `enabled: !!patientId`
    - Export the hook
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 7. Add new TanStack Query hooks to `usePharmacyQueries.ts`
  - [x] 7.1 Add `useDoctorConnections(status?)` hook
    - In `frontend/src/hooks/usePharmacyQueries.ts`, add a `useQuery` hook that calls `GET /pharmacy/doctor-connections` with optional `status` query param
    - Query key: `['pharmacy', 'doctor-connections', status]`
    - Export the hook
    - _Requirements: 8.1, 8.2_

  - [x] 7.2 Add `useAcceptConnection()` mutation hook
    - In `frontend/src/hooks/usePharmacyQueries.ts`, add a `useMutation` hook that calls `PATCH /doctor/pharmacy-connections/${id}/accept`
    - On success, invalidate `['pharmacy', 'doctor-connections']`
    - Export the hook
    - _Requirements: 8.3, 8.4_

  - [x] 7.3 Add `useRejectConnection()` mutation hook
    - In `frontend/src/hooks/usePharmacyQueries.ts`, add a `useMutation` hook that calls `DELETE /doctor/pharmacy-connections/${id}`
    - On success, invalidate `['pharmacy', 'doctor-connections']`
    - Export the hook
    - _Requirements: 8.5, 8.6_

- [x] 8. Update `DoctorPrescriptionsPage` with connection gate, pharmacy dropdown, real recent prescriptions, and draft save
  - [x] 8.1 Add connection gate to the prescription form
    - In `frontend/src/app/dashboard/doctor/prescriptions/page.tsx`, import `usePharmacyConnections` (already imported) and derive `activeConnections = connections.filter(c => c.status === 'ACTIVE')`
    - When `activeConnections.length === 0`, render the message "Please connect with at least 1 pharmacy first" in the Pharmacy Selection section and disable the "Create & Send" button
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 8.2 Implement pharmacy auto-select and dropdown logic
    - When `activeConnections.length === 1`, set `targetPharmacyId` to `activeConnections[0].pharmacy?.id ?? activeConnections[0].pharmacyId` on mount/change (use a `useEffect` that runs when `activeConnections` changes)
    - When `activeConnections.length >= 2`, render a `<select>` dropdown listing all active connections; each option value is the pharmacy's user ID and label is the pharmacy name
    - Remove the hardcoded "City Pharmacy" placeholder option from the select
    - _Requirements: 3.4, 3.5_

  - [x] 8.3 Add client-side validation before submit
    - In `handleCreate`, before calling `createPrescription.mutate`, validate: (a) `patientId` is non-empty — show inline error "Please select a patient"; (b) `items` has at least one entry with a non-empty `medicineName` — show inline error "Please add at least one medicine"; (c) when `activeConnections.length >= 2`, `targetPharmacyId` is non-empty — show inline error "Please select a target pharmacy"
    - Display validation errors as red text below the relevant form section
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 8.4 Wire "Save as Draft" button
    - The existing "Save as Draft" button currently does nothing; wire it to call `createPrescription.mutate({ patientId, items, targetPharmacyId: undefined })` — omitting `targetPharmacyId` entirely
    - On success, reset the form (same reset logic as "Create & Send")
    - _Requirements: 5.4, 5.5_

  - [x] 8.5 Replace mock recent prescriptions with real data from `useRecentPrescriptions`
    - Import `useRecentPrescriptions` from `useDoctorQueries`
    - Replace the `recentPrescriptions` hardcoded array with data from the hook
    - Display: patient name, `createdAt` formatted as a date string, item count, and status badge
    - Show a loading skeleton or "Loading..." text while fetching; show "No recent prescriptions" when the list is empty
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 9. Add patient prescription history to the Doctor Patients page
  - [x] 9.1 Create `frontend/src/app/dashboard/doctor/patients/[id]/page.tsx` — patient detail page
    - Create a new Next.js dynamic route at `frontend/src/app/dashboard/doctor/patients/[id]/page.tsx`
    - The page receives `params.id` as the `patientId`
    - Fetch patient data from the existing patients list (or add a `usePatient(id)` hook that calls `GET /doctor/patients` and finds by id, or simply display the id and rely on the prescriptions data for context)
    - Import and call `usePatientPrescriptions(patientId)` from `useDoctorQueries`
    - _Requirements: 7.1_

  - [x] 9.2 Render prescription history section on the patient detail page
    - Display a "Prescription History" section listing all prescriptions returned by `usePatientPrescriptions`
    - Each row shows: `createdAt` formatted as date + time, item count (number of medicines), target pharmacy name (from `targetPharmacy.name` or "—" if draft), and a status badge
    - Order is already descending from the API; render in the order received
    - Show "No prescriptions on record" empty state when the list is empty
    - Show a loading state while fetching
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 9.3 Add "View Profile" navigation from the patients list
    - In `frontend/src/app/dashboard/doctor/patients/page.tsx`, make each patient row's action button (the three-dot menu or the row itself) navigate to `/dashboard/doctor/patients/${p.id}` using Next.js `<Link>` or `router.push`
    - _Requirements: 7.1_

- [x] 10. Create the Pharmacy Doctor Connections page
  - [x] 10.1 Create `frontend/src/app/dashboard/pharmacy/doctor-connections/page.tsx`
    - New page file; import `useDoctorConnections`, `useAcceptConnection`, `useRejectConnection` from `usePharmacyQueries`
    - Fetch connections with `useDoctorConnections('PENDING')` for the pending tab; also fetch all connections with `useDoctorConnections()` for the full list
    - _Requirements: 8.1, 8.7_

  - [x] 10.2 Render pending connection requests with Accept/Reject actions
    - For each pending connection, display the doctor's name and email
    - "Accept" button calls `useAcceptConnection().mutate(connection.id)`; on success the connection disappears from the pending list (query invalidation handles this)
    - "Reject" button calls `useRejectConnection().mutate(connection.id)`; on success the connection disappears from the pending list
    - Show loading state on the button while the mutation is pending
    - Show "No pending connection requests" empty state when the list is empty
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 11. Update `PharmacyPrescriptionsPage` — replace Dispense with Checkout flow
  - [x] 11.1 Create `frontend/src/components/CheckoutSummaryModal.tsx`
    - New component file
    - Props: `checkoutData` (the response from `POST /pharmacy/sales/prescription-checkout`), `onConfirm(saleData)`, `onClose`, `isSubmitting`
    - Render a modal overlay with a table of bill items: medicine name, prescribed quantity, available quantity, price per unit, subtotal per item, and an availability indicator (green check / red X based on `item.available`)
    - Include a payment method selector (`CASH` | `CARD` | `ONLINE`) as a radio group or select
    - "Confirm Sale" button calls `onConfirm` with the assembled `CreateSaleInput`; disabled while `isSubmitting`
    - "Cancel" button calls `onClose`
    - _Requirements: 10.3_

  - [x] 11.2 Wire Checkout button and modal into `PharmacyPrescriptionsPage`
    - In `frontend/src/app/dashboard/pharmacy/prescriptions/page.tsx`:
      - Import `usePrescriptionCheckout`, `useCreateSale` from `usePharmacyQueries`
      - Import `CheckoutSummaryModal`
      - Add state: `checkoutData` (null or the checkout response), `checkoutPrescriptionId` (string | null)
      - Replace the "Dispense" button with a "Checkout" button for prescriptions with `status === 'PENDING'`
      - On "Checkout" click: call `usePrescriptionCheckout().mutate(prescriptionId)` and on success set `checkoutData` and `checkoutPrescriptionId`
      - Render `<CheckoutSummaryModal>` when `checkoutData` is non-null
      - `onConfirm` calls `useCreateSale().mutate({ ...saleData, prescriptionId: checkoutPrescriptionId })`; on success close the modal and invalidate prescriptions query
      - Do not render "Checkout" for prescriptions with `status === 'DISPENSED'` or `status === 'CANCELLED'`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12. Checkpoint — verify frontend builds and renders correctly
  - Run `npm run build` in `frontend/` to confirm no TypeScript or Next.js build errors
  - Fix any type errors surfaced by the build
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Write property-based tests for backend service methods
  - [ ] 13.1 Write property tests for `DoctorService.createPrescription` (Properties 5, 20, 21, 22)
    - File: `backend/src/doctor/doctor.service.spec.ts`
    - Install `fast-check` is already present in `backend/devDependencies` — no install needed
    - **Property 5**: `fc.assert(fc.property(validPayloadArb, async (payload) => { /* setup active connection */ const result = await service.createPrescription(payload, doctorId, tenantId); expect(result.status).toBe('PENDING'); expect(result.targetPharmacyId).toBe(payload.targetPharmacyId); }), { numRuns: 100 })`
    - **Property 20**: for any `(doctorId, targetPharmacyId)` with no ACTIVE connection, `createPrescription` rejects with `BadRequestException`
    - **Property 21**: for any payload without `targetPharmacyId`, `createPrescription` succeeds regardless of connection state
    - **Property 22**: for any `targetPharmacyId` referencing a non-PHARMACY user, `createPrescription` rejects with `BadRequestException`
    - Tag each test: `// Feature: prescription-pharmacy-flow, Property N: <property_text>`
    - _Requirements: 5.1, 12.1, 12.2, 12.3, 12.4_

  - [ ] 13.2 Write property tests for `DoctorService.getPatientPrescriptions` (Properties 10, 23)
    - File: `backend/src/doctor/doctor.service.spec.ts`
    - **Property 10**: for any `(doctorId, patientId)` pair, every returned prescription has `doctorId` and `patientId` matching inputs
    - **Property 23**: for any `patientId` where `patient.tenantId !== doctor.tenantId`, the method throws `ForbiddenException`
    - _Requirements: 7.1, 13.1, 13.3_

  - [ ] 13.3 Write property tests for `DoctorService.getRecentPrescriptions` (Properties 8, 9)
    - File: `backend/src/doctor/doctor.service.spec.ts`
    - **Property 8**: for any list of prescriptions returned, adjacent pairs satisfy `items[i].createdAt >= items[i+1].createdAt`
    - **Property 9**: every returned prescription includes `patient.name`, `createdAt`, `items` array, and `status`
    - _Requirements: 6.2, 6.3_

  - [ ] 13.4 Write property tests for `PharmacyService.listDoctorConnections` (Properties 12, 13, 14)
    - File: `backend/src/pharmacy/pharmacy.service.spec.ts`
    - **Property 12**: for any pharmacy user P, every returned connection has `pharmacyId === P.id`
    - **Property 13**: for any status S, every returned connection has `status === S`
    - **Property 14**: every returned connection includes `doctor.id`, `doctor.name`, `doctor.email`
    - _Requirements: 8.1, 8.2, 14.1, 14.2, 14.3_

  - [ ] 13.5 Write property tests for `PharmacyService.listPrescriptions` (Properties 15, 16)
    - File: `backend/src/pharmacy/pharmacy.service.spec.ts`
    - **Property 15**: for any pharmacy user P, every returned prescription has `targetPharmacyId === P.id`
    - **Property 16**: every returned prescription includes `doctor.name`, `patient.name`, `createdAt`, `items`, and `status`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 13.6 Write property tests for `DoctorService.acceptConnection` (Properties 18, 19)
    - File: `backend/src/doctor/doctor.service.spec.ts`
    - **Property 18**: for any connection C and caller U where `U.id !== C.pharmacyId`, `acceptConnection` throws `ForbiddenException` (note: the service throws `NotFoundException` when the record is not found with that pharmacyId — verify the exact exception type matches the design spec and adjust if needed)
    - **Property 19**: for any connection C where `C.status !== PENDING`, `acceptConnection` throws `NotFoundException`
    - _Requirements: 11.1, 11.2, 11.3_

- [ ] 14. Write property-based tests for frontend gate logic (Properties 2, 3, 4)
  - [ ] 14.1 Write property tests for the prescription form gate logic (Properties 2, 3, 4)
    - File: `frontend/src/app/dashboard/doctor/prescriptions/prescriptions-gate.test.ts` (pure logic test, no React rendering needed)
    - Extract the gate computation into a pure function `computeGateState(connections)` that returns `{ disabled: boolean, showMessage: boolean, autoSelectedPharmacyId: string | null, dropdownOptions: Array<{id, name}> }`
    - **Property 2**: `fc.assert(fc.property(fc.array(connectionArb), (connections) => { const active = connections.filter(c => c.status === 'ACTIVE'); const state = computeGateState(connections); expect(state.disabled).toBe(active.length === 0); expect(state.showMessage).toBe(active.length === 0); }), { numRuns: 100 })`
    - **Property 3**: for any connections list with exactly one ACTIVE entry, `computeGateState` returns `autoSelectedPharmacyId` equal to that connection's pharmacyId and `dropdownOptions` is empty
    - **Property 4**: for any connections list with N ≥ 2 ACTIVE entries, `computeGateState` returns `dropdownOptions` with exactly N items
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 14.2 Write property tests for pharmacy prescriptions scoping (Property 15 — frontend filter)
    - File: `frontend/src/app/dashboard/pharmacy/prescriptions/prescriptions-filter.test.ts`
    - **Property 15 (frontend)**: for any list of prescriptions with mixed `targetPharmacyId` values, a filter function `filterForPharmacy(prescriptions, pharmacyId)` SHALL return only entries where `targetPharmacyId === pharmacyId`
    - _Requirements: 9.1, 9.2_

- [ ] 15. Final checkpoint — run all tests
  - Run `npm test -- --run` in `backend/` to confirm all backend tests pass
  - Run `npm test -- --run` in `frontend/` to confirm all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `fast-check` is already installed in `backend/devDependencies` — no additional install needed for backend PBTs
- `fast-check` is **not** yet installed in `frontend/devDependencies` — install it with `npm install --save-dev fast-check` in `frontend/` before running task 14
- The `Prescription` model has `targetPharmacyId String?` but no named Prisma relation to `User` — fetch pharmacy names via a separate `prisma.user.findMany({ where: { id: { in: pharmacyIds } } })` call in `getPatientPrescriptions`
- The `@Roles(Role.PHARMACY)` override on `acceptConnection` in `DoctorController` is already correct — no change needed
- `PharmacyService.listPrescriptions` already filters by `targetPharmacyId` — no changes needed to that method
- `PharmacyService.prescriptionCheckout` and `useCreateSale` / `usePrescriptionCheckout` hooks already exist — task 11 wires them into the UI only
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
