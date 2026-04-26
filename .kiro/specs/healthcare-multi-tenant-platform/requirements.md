# Requirements Document

## Introduction

This document specifies the requirements for transforming the existing single-tenant healthcare SaaS application into a multi-tenant platform. The platform serves four primary user roles — Doctors (Clinics), Patients, Pharmacies, and Admins — each operating within tenant-isolated contexts. The existing NestJS/Prisma/PostgreSQL backend and Next.js frontend will be extended with multi-tenancy support, new domain models (appointments, allergy reports, doctor-pharmacy connections, purchase tracking, reporting), enhanced sales workflows (prescription checkout, PDF billing, mobile bill delivery), and a migration from the custom `apiFetch` wrapper to TanStack Query on the frontend. Separate documentation files will be produced for each pharmacy sub-module.

## Glossary

- **Platform**: The overall healthcare SaaS application comprising backend API, frontend UI, and database
- **Tenant**: An isolated organizational unit (a Pharmacy or Clinic) whose data is logically separated from other tenants via a `tenantId` foreign key in the database
- **Doctor_Module**: The subsystem that handles doctor registration, patient management, allergy reports, prescriptions, pharmacy connections, appointment viewing, and scheduling preferences
- **Patient_Module**: The subsystem that handles patient self-registration, doctor discovery, appointment booking, and prescription viewing
- **Pharmacy_Module**: The subsystem that handles pharmacy operations including prescriptions, medicines, inventory, purchases, sales, and reports
- **Admin_Module**: The subsystem that handles platform-wide administration including tenant management, user oversight, and system configuration
- **Appointment**: A scheduled time slot booked by a Patient with a specific Doctor, containing date, time slot, and status
- **Allergy_Report**: A clinical record created by a Doctor for a Patient documenting allergies, symptoms, and observations
- **Doctor_Pharmacy_Connection**: A many-to-many relationship allowing a Doctor to connect with one or more Pharmacies on the Platform
- **Prescription**: A medical document created by a Doctor for a Patient specifying medicines, dosages, and frequency
- **Slot**: A time window within a Doctor's schedule that a Patient can book for an Appointment
- **Purchase_Record**: A record of medicine stock purchased by a Pharmacy, including batch number, seller, date, and cost
- **Sale**: A billing transaction at a Pharmacy where medicines are sold to a Patient, with stock deducted in real time
- **Invoice_PDF**: A generated PDF document representing a Sale bill, including itemized medicines, discounts, GST, and totals
- **TanStack_Query**: The `@tanstack/react-query` library used for server-state management, caching, and data fetching on the frontend
- **GST**: Goods and Services Tax applied to medicine sales
- **FIFO**: First-In-First-Out batch selection strategy for medicine stock deduction during sales
- **Pharmacy_Sub_Module_Doc**: A standalone Markdown documentation file describing the flow, working, and database schemas for a specific pharmacy tab (Prescription, Medicines, Inventory, Purchase, Sales, Reports)

## Requirements

### Requirement 1: Multi-Tenant Data Isolation

**User Story:** As a platform operator, I want all data to be isolated per tenant, so that Pharmacies and Clinics cannot access each other's records.

#### Acceptance Criteria

1. THE Platform SHALL associate every Doctor, Patient, Medicine, Prescription, Appointment, Sale, Purchase_Record, and Allergy_Report record with exactly one `tenantId`
2. WHEN any authenticated user makes an API request, THE Platform SHALL filter all database queries by the `tenantId` extracted from the authenticated user's JWT token
3. IF a user attempts to access a resource belonging to a different tenant, THEN THE Platform SHALL return an HTTP 403 response with a descriptive error message
4. WHEN a new Pharmacy or Clinic registers, THE Platform SHALL create a new tenant record and assign the registering user as the tenant owner
5. THE Platform SHALL enforce tenant isolation at the Prisma query layer using a middleware or service-level filter so that no raw query can bypass tenant scoping

### Requirement 2: Doctor Registration and Authentication

**User Story:** As a doctor, I want to register and log in to the platform, so that I can manage my patients and prescriptions.

#### Acceptance Criteria

1. WHEN a doctor submits a registration form with name, email, password, and clinic details, THE Doctor_Module SHALL create a new User record with role DOCTOR and associate the user with the corresponding tenant
2. WHEN a doctor submits valid login credentials, THE Doctor_Module SHALL return a JWT token containing the user ID, email, role, and tenantId
3. IF a doctor submits a registration request with an email that already exists within the same tenant, THEN THE Doctor_Module SHALL return an HTTP 409 response indicating the email is already in use
4. THE Doctor_Module SHALL hash all passwords using bcrypt with a minimum salt round of 10 before storing them

### Requirement 3: Doctor Patient Management

**User Story:** As a doctor, I want to add and manage patients with their personal information, so that I can maintain accurate patient records.

#### Acceptance Criteria

1. WHEN a doctor submits patient information including name, email, mobile number, age, and gender, THE Doctor_Module SHALL create a new Patient record linked to the doctor's tenant
2. THE Doctor_Module SHALL validate that the patient email is unique within the tenant before creating the record
3. WHEN a doctor requests the patient list, THE Doctor_Module SHALL return only patients belonging to the doctor's tenant, sorted by creation date in descending order
4. THE Doctor_Module SHALL store patient contact information including mobile number and email as required fields

### Requirement 4: Allergy Report Management

**User Story:** As a doctor, I want to create allergy reports for my patients, so that I can track their allergies and symptoms for clinical reference.

#### Acceptance Criteria

1. WHEN a doctor submits an allergy report containing patient ID, allergy type, symptoms, severity, and notes, THE Doctor_Module SHALL create a new Allergy_Report record linked to the patient and the doctor's tenant
2. IF the specified patient does not belong to the doctor's tenant, THEN THE Doctor_Module SHALL return an HTTP 403 response
3. WHEN a doctor requests allergy reports for a patient, THE Doctor_Module SHALL return all Allergy_Report records for that patient within the doctor's tenant, sorted by creation date in descending order
4. THE Doctor_Module SHALL validate that the severity field contains one of the values: LOW, MODERATE, HIGH, or CRITICAL

### Requirement 5: Prescription Creation and Pharmacy Dispatch

**User Story:** As a doctor, I want to write prescriptions for patients and send them to a connected pharmacy, so that patients can collect their medicines.

#### Acceptance Criteria

1. WHEN a doctor submits a prescription containing patient ID, a list of medicine items (medicine name, dosage, frequency, quantity), and an optional target pharmacy ID, THE Doctor_Module SHALL create a new Prescription record with status PENDING
2. WHEN a doctor specifies a target pharmacy ID on a prescription, THE Doctor_Module SHALL verify that a Doctor_Pharmacy_Connection exists between the doctor and the specified pharmacy before dispatching
3. IF the specified pharmacy is not connected to the doctor, THEN THE Doctor_Module SHALL return an HTTP 400 response indicating no connection exists with the specified pharmacy
4. WHEN a prescription is dispatched to a pharmacy, THE Doctor_Module SHALL create a notification for the pharmacy containing the prescription ID, patient name, and doctor name
5. THE Doctor_Module SHALL include dosage instructions (medicine name, dosage amount, frequency, duration) in each PrescriptionItem record

### Requirement 6: Doctor-Pharmacy Connection

**User Story:** As a doctor, I want to connect with multiple pharmacies on the platform, so that I can send prescriptions to pharmacies where my patients can collect medicines.

#### Acceptance Criteria

1. WHEN a doctor sends a connection request to a pharmacy, THE Doctor_Module SHALL create a Doctor_Pharmacy_Connection record with status PENDING
2. WHEN a pharmacy accepts a connection request, THE Doctor_Module SHALL update the Doctor_Pharmacy_Connection status to ACTIVE
3. WHEN a doctor requests the list of available pharmacies, THE Doctor_Module SHALL return all pharmacies registered on the Platform with their connection status relative to the requesting doctor
4. IF a doctor attempts to create a duplicate connection with the same pharmacy, THEN THE Doctor_Module SHALL return an HTTP 409 response indicating the connection already exists
5. WHEN a doctor or pharmacy terminates a connection, THE Doctor_Module SHALL update the Doctor_Pharmacy_Connection status to INACTIVE and prevent further prescription dispatches to that pharmacy

### Requirement 7: Appointment Viewing for Doctors

**User Story:** As a doctor, I want to see all my appointments, so that I can manage my daily schedule.

#### Acceptance Criteria

1. WHEN a doctor requests the appointment list, THE Doctor_Module SHALL return all Appointment records for the doctor within the doctor's tenant, sorted by appointment date in ascending order
2. THE Doctor_Module SHALL support filtering appointments by status (SCHEDULED, COMPLETED, CANCELLED) and by date range
3. WHEN a doctor views an appointment, THE Doctor_Module SHALL display the patient name, appointment date, time slot, and current status

### Requirement 8: Doctor Scheduling Preferences

**User Story:** As a doctor, I want to set my availability slots and block dates when I am not available, so that patients can only book appointments during my available times.

#### Acceptance Criteria

1. WHEN a doctor configures availability, THE Doctor_Module SHALL accept a list of time slots per day of the week (e.g., Monday 09:00-09:30, Monday 09:30-10:00) and store them as the doctor's recurring schedule
2. WHEN a doctor blocks a specific date, THE Doctor_Module SHALL mark all slots on that date as unavailable and prevent new bookings for that date
3. WHEN a doctor unblocks a previously blocked date, THE Doctor_Module SHALL restore the slots to available status based on the recurring schedule
4. IF a patient attempts to book a slot that has been blocked or is already booked, THEN THE Doctor_Module SHALL return an HTTP 409 response indicating the slot is unavailable
5. THE Doctor_Module SHALL allow a doctor to set a maximum number of appointments per day as a configurable limit

### Requirement 9: Patient Self-Registration and Authentication

**User Story:** As a patient, I want to register myself and log in, so that I can access the platform and connect with doctors.

#### Acceptance Criteria

1. WHEN a patient submits a registration form with name, email, password, and mobile number, THE Patient_Module SHALL create a new User record with role PATIENT
2. WHEN a patient submits valid login credentials, THE Patient_Module SHALL return a JWT token containing the user ID, email, and role
3. IF a patient submits a registration request with an email that already exists, THEN THE Patient_Module SHALL return an HTTP 409 response indicating the email is already in use

### Requirement 10: Patient Doctor Discovery and Connection

**User Story:** As a patient, I want to see all available doctors and connect with any doctor, so that I can book appointments and receive prescriptions.

#### Acceptance Criteria

1. WHEN a patient requests the doctor list, THE Patient_Module SHALL return all registered doctors on the Platform with their clinic name, specialization, and availability status
2. WHEN a patient sends a connection request to a doctor, THE Patient_Module SHALL create a patient-doctor association record
3. THE Patient_Module SHALL allow a patient to connect with multiple doctors simultaneously

### Requirement 11: Patient Appointment Booking

**User Story:** As a patient, I want to book appointments with doctors by choosing a date and available time slot, so that I can schedule consultations.

#### Acceptance Criteria

1. WHEN a patient selects a doctor, date, and available time slot, THE Patient_Module SHALL create a new Appointment record with status SCHEDULED
2. THE Patient_Module SHALL display only available (unbooked and unblocked) time slots for the selected doctor and date
3. IF the selected time slot becomes unavailable between display and booking, THEN THE Patient_Module SHALL return an HTTP 409 response indicating the slot is no longer available
4. WHEN an appointment is successfully booked, THE Patient_Module SHALL send a notification to both the patient and the doctor confirming the appointment details
5. THE Patient_Module SHALL allow a patient to cancel a scheduled appointment, updating the status to CANCELLED and freeing the time slot

### Requirement 12: Patient Prescription Viewing

**User Story:** As a patient, I want to see all prescriptions assigned to me, so that I know which medicines to take and where to collect them.

#### Acceptance Criteria

1. WHEN a patient requests the prescription list, THE Patient_Module SHALL return all Prescription records assigned to the patient, sorted by creation date in descending order
2. THE Patient_Module SHALL display for each prescription: the prescribing doctor name, prescription date, list of medicines with dosage and frequency, prescription status, and the assigned pharmacy name and address (if dispatched)
3. WHEN a patient views a specific prescription, THE Patient_Module SHALL display the full prescription details including all PrescriptionItem records

### Requirement 13: Pharmacy Prescription Tab

**User Story:** As a pharmacy operator, I want to see all prescriptions sent by connected doctors, so that I can prepare medicines for patients.

#### Acceptance Criteria

1. WHEN a pharmacy operator opens the Prescription tab, THE Pharmacy_Module SHALL display all prescriptions dispatched to the pharmacy by connected doctors, sorted by creation date in descending order
2. THE Pharmacy_Module SHALL display for each prescription: the prescribing doctor name, patient name, list of prescribed medicines with quantities, and current status (PENDING, DISPENSED, CANCELLED)
3. WHEN a pharmacy operator marks a prescription as DISPENSED, THE Pharmacy_Module SHALL update the prescription status and send a notification to the patient
4. THE Pharmacy_Module SHALL support filtering prescriptions by status and by date range

### Requirement 14: Pharmacy Medicines Tab

**User Story:** As a pharmacy operator, I want to view and manage all medicines in my pharmacy, so that I can maintain an accurate medicine catalog.

#### Acceptance Criteria

1. WHEN a pharmacy operator opens the Medicines tab, THE Pharmacy_Module SHALL display all medicines belonging to the pharmacy's tenant with name, category, batch number, quantity, and expiry date
2. THE Pharmacy_Module SHALL support filtering medicines by category
3. WHEN a pharmacy operator adds a new medicine with name, category, batch number, expiry date, quantity, supplier, and unit price, THE Pharmacy_Module SHALL create a new Medicine record within the pharmacy's tenant
4. THE Pharmacy_Module SHALL validate that the batch number is unique within the pharmacy's tenant before creating the record
5. THE Pharmacy_Module SHALL support searching medicines by name or batch number

### Requirement 15: Pharmacy Inventory Tab

**User Story:** As a pharmacy operator, I want to track batch-based medicine stocks and receive alerts for near-expiry and low-stock medicines, so that I can manage inventory proactively.

#### Acceptance Criteria

1. WHEN a pharmacy operator opens the Inventory tab, THE Pharmacy_Module SHALL display all medicine batches with batch number, current quantity, expiry date, and stock status (LOW, NORMAL)
2. THE Pharmacy_Module SHALL display a visual alert indicator for medicines with quantity below the configurable low-stock threshold (default: 10 units)
3. THE Pharmacy_Module SHALL display a visual alert indicator for medicines expiring within the configurable near-expiry threshold (default: 30 days)
4. WHEN a medicine batch quantity falls below the low-stock threshold after a sale, THE Pharmacy_Module SHALL generate a LOW_STOCK notification for the pharmacy operator
5. WHEN a medicine batch is within the near-expiry threshold, THE Pharmacy_Module SHALL generate a NEAR_EXPIRY notification for the pharmacy operator
6. THE Pharmacy_Module SHALL display purchase records for each medicine batch including purchase date, batch number, seller name, and purchase cost

### Requirement 16: Pharmacy Purchase Tab

**User Story:** As a pharmacy operator, I want to record and view purchase history of medicine stock, so that I can track procurement and manage supplier relationships.

#### Acceptance Criteria

1. WHEN a pharmacy operator records a new purchase, THE Pharmacy_Module SHALL create a Purchase_Record containing medicine ID, batch number, quantity, unit cost, total cost, seller name, seller company, and purchase date within the pharmacy's tenant
2. WHEN a pharmacy operator opens the Purchase tab, THE Pharmacy_Module SHALL display all Purchase_Record entries sorted by purchase date in descending order
3. THE Pharmacy_Module SHALL support filtering purchase records by date range (past week, past month, custom range)
4. THE Pharmacy_Module SHALL display for each purchase record: medicine name, batch number, quantity purchased, unit cost, total cost, seller name, seller company, and purchase date
5. WHEN a new purchase is recorded, THE Pharmacy_Module SHALL update the corresponding medicine batch quantity by adding the purchased quantity to the existing stock

### Requirement 17: Pharmacy Sales Tab — Bill Generation

**User Story:** As a pharmacy operator, I want to generate bills for patients quickly during rush hours, so that I can serve customers without delays.

#### Acceptance Criteria

1. WHEN a pharmacy operator searches for a medicine by name or batch number in the sales interface, THE Pharmacy_Module SHALL return matching results within 200 milliseconds for up to 10,000 medicine records
2. WHEN a pharmacy operator adds medicines to a bill, THE Pharmacy_Module SHALL display a running total with subtotal, applicable discount, GST amount, and final amount updated in real time
3. WHEN a pharmacy operator applies a discount (flat amount or percentage), THE Pharmacy_Module SHALL recalculate the final amount as: (subtotal - discount) + GST
4. WHEN a pharmacy operator submits a completed bill, THE Pharmacy_Module SHALL create a Sale record, deduct sold quantities from medicine stock using FIFO batch selection, and return the sale confirmation within a single database transaction
5. IF a medicine has insufficient stock during bill submission, THEN THE Pharmacy_Module SHALL return an HTTP 422 response identifying the specific medicine with insufficient stock
6. THE Pharmacy_Module SHALL support CASH, CARD, and ONLINE payment methods for each sale

### Requirement 18: Pharmacy Sales Tab — Prescription Checkout

**User Story:** As a pharmacy operator, I want to auto-populate a bill from a prescription, so that I can quickly process prescription-based sales.

#### Acceptance Criteria

1. WHEN a pharmacy operator selects a prescription for checkout, THE Pharmacy_Module SHALL auto-populate the bill with all medicines listed in the prescription, matching each prescribed medicine to available stock in the pharmacy's inventory
2. IF a prescribed medicine is not available in the pharmacy's inventory, THEN THE Pharmacy_Module SHALL flag the unavailable medicine in the bill and allow the operator to proceed with available items or substitute
3. WHEN a prescription-based sale is completed, THE Pharmacy_Module SHALL update the prescription status to DISPENSED
4. THE Pharmacy_Module SHALL link the generated Sale record to the originating Prescription record via the `prescriptionId` field

### Requirement 19: Pharmacy Sales Tab — Invoice PDF and Delivery

**User Story:** As a pharmacy operator, I want to generate PDF invoices and send them to patients, so that patients have a record of their purchase.

#### Acceptance Criteria

1. WHEN a sale is completed, THE Pharmacy_Module SHALL generate an Invoice_PDF containing pharmacy name, pharmacy address, invoice number, date, patient name, itemized medicines (name, batch, quantity, unit price, total), subtotal, discount, GST, final amount, and payment method
2. THE Pharmacy_Module SHALL support generating the Invoice_PDF in at least two formats: a detailed format with full item breakdown and a compact summary format
3. WHEN a pharmacy operator requests to send a bill to a patient, THE Pharmacy_Module SHALL deliver the Invoice_PDF to the patient's registered mobile number via the notification system
4. THE Pharmacy_Module SHALL allow the pharmacy operator to print the Invoice_PDF directly from the sales interface

### Requirement 20: Pharmacy Reports Tab

**User Story:** As a pharmacy operator, I want to view sales and purchase reports, so that I can analyze business performance.

#### Acceptance Criteria

1. WHEN a pharmacy operator opens the Reports tab, THE Pharmacy_Module SHALL display today's total sales count, total revenue, and total items sold
2. THE Pharmacy_Module SHALL display a list of the top 10 most-sold medicines within a selected date range, ranked by total quantity sold
3. THE Pharmacy_Module SHALL display weekly sales and purchase summaries including total revenue, total purchase cost, and net margin
4. THE Pharmacy_Module SHALL support viewing reports for custom date ranges (past week, past month, past quarter, custom start and end dates)
5. THE Pharmacy_Module SHALL display a payment method breakdown showing count and revenue per payment method (CASH, CARD, ONLINE) for the selected period

### Requirement 21: Admin Module — Platform Administration

**User Story:** As a platform administrator, I want to manage tenants, users, and system configuration, so that I can oversee the entire platform.

#### Acceptance Criteria

1. WHEN an admin requests the tenant list, THE Admin_Module SHALL return all registered tenants with their name, type (PHARMACY or CLINIC), creation date, and active user count
2. WHEN an admin requests the user list, THE Admin_Module SHALL return all users across all tenants with filtering by role, tenant, and registration date
3. THE Admin_Module SHALL allow an admin to activate or deactivate a tenant, preventing all users of a deactivated tenant from accessing the Platform
4. THE Admin_Module SHALL allow an admin to activate or deactivate individual user accounts
5. WHEN an admin deactivates a tenant, THE Admin_Module SHALL invalidate all active JWT tokens for users belonging to that tenant

### Requirement 22: TanStack Query Frontend Integration

**User Story:** As a frontend developer, I want to replace the custom apiFetch wrapper with TanStack Query, so that the frontend has standardized server-state management with caching, background refetching, and optimistic updates.

#### Acceptance Criteria

1. THE Platform SHALL install and configure `@tanstack/react-query` and `@tanstack/react-query-devtools` as frontend dependencies
2. THE Platform SHALL wrap the Next.js application root with a `QueryClientProvider` configured with default stale time, retry count, and error handling
3. WHEN any frontend component fetches data from the API, THE Platform SHALL use TanStack_Query `useQuery` hooks instead of direct `apiFetch` calls for all GET requests
4. WHEN any frontend component mutates data via the API, THE Platform SHALL use TanStack_Query `useMutation` hooks with appropriate cache invalidation for all POST, PUT, PATCH, and DELETE requests
5. THE Platform SHALL retain the existing `apiFetch` function as the underlying fetch adapter passed to TanStack_Query query functions, preserving JWT attachment, retry logic, and error handling

### Requirement 23: Pharmacy Sub-Module Documentation

**User Story:** As a developer, I want separate documentation files for each pharmacy sub-module, so that I can understand the flow, working, and database schemas of each module independently.

#### Acceptance Criteria

1. THE Platform SHALL produce a Pharmacy_Sub_Module_Doc for each of the six pharmacy tabs: Prescription, Medicines, Inventory, Purchase, Sales, and Reports
2. Each Pharmacy_Sub_Module_Doc SHALL contain sections for: module overview, user flow description, API endpoint specifications, database schema (relevant Prisma models and relations), and business rules
3. THE Platform SHALL store each Pharmacy_Sub_Module_Doc as a separate Markdown file in the project documentation directory
