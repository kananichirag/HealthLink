# Requirements Document

## Introduction

This feature enhances the prescription flow between doctors and pharmacies in the HealthLink platform. The system already has foundational infrastructure: a `DoctorPharmacyConnection` model (with PENDING/ACTIVE/INACTIVE statuses), a `Prescription` model with a `targetPharmacyId` field, backend endpoints for requesting/accepting/terminating connections, and frontend pages for both doctor pharmacy-connections and prescriptions. This feature builds on that foundation to deliver a complete, production-ready workflow covering connection management, prescription creation with pharmacy targeting, and pharmacy-side prescription handling — including all UI states, validations, and per-patient prescription history.

## Glossary

- **Doctor**: A user with role `DOCTOR` in the system
- **Pharmacy**: A user with role `PHARMACY` in the system
- **Connection**: A `DoctorPharmacyConnection` record linking a Doctor to a Pharmacy with a status of PENDING, ACTIVE, or INACTIVE
- **Active Connection**: A `DoctorPharmacyConnection` record with status `ACTIVE`
- **Prescription**: A `Prescription` record created by a Doctor for a Patient, optionally targeting a specific Pharmacy via `targetPharmacyId`
- **Prescription_Item**: A `PrescriptionItem` record belonging to a Prescription, specifying a medicine, dosage, frequency, and quantity
- **Target Pharmacy**: The Pharmacy identified by `targetPharmacyId` on a Prescription — the only Pharmacy that should see and act on that Prescription
- **Checkout**: The pharmacy-side action of initiating the dispensing workflow for a Prescription
- **Draft**: A Prescription saved locally or server-side without being dispatched to a Pharmacy
- **Dashboard**: The role-specific web UI served at `/dashboard/doctor` or `/dashboard/pharmacy`
- **Pharmacy_Connection_Tab**: The tab in the Doctor's Dashboard for managing pharmacy connections
- **Prescriptions_Tab**: The tab in either the Doctor's or Pharmacy's Dashboard for managing prescriptions
- **Doctor_Connection_Tab**: The tab in the Pharmacy's Dashboard for managing incoming doctor connection requests
- **Patient_Profile**: The patient detail view accessible from the Doctor's patients list

---

## Requirements

### Requirement 1: Doctor — View All Available Pharmacies

**User Story:** As a doctor, I want to see all pharmacies registered on the platform so that I can choose which ones to connect with.

#### Acceptance Criteria

1. WHEN a Doctor navigates to the Pharmacy_Connection_Tab, THE Dashboard SHALL display every User with role `PHARMACY` registered on the platform.
2. THE Dashboard SHALL display each pharmacy's name and email address.
3. WHEN a pharmacy has no existing Connection with the Doctor, THE Dashboard SHALL display a "Connect" button for that pharmacy.
4. WHEN a pharmacy has an existing Connection with status `PENDING`, THE Dashboard SHALL display an "Awaiting Response" indicator instead of a "Connect" button for that pharmacy.
5. WHEN a pharmacy has an existing Connection with status `ACTIVE`, THE Dashboard SHALL display a "Connected" status badge and a "Disconnect" button for that pharmacy.
6. WHEN a pharmacy has an existing Connection with status `INACTIVE`, THE Dashboard SHALL display a "Re-Establish" button for that pharmacy.

---

### Requirement 2: Doctor — Request and Manage Pharmacy Connections

**User Story:** As a doctor, I want to send connection requests to pharmacies and manage those connections so that I can control which pharmacies receive my prescriptions.

#### Acceptance Criteria

1. WHEN a Doctor clicks the "Connect" button for a pharmacy, THE Dashboard SHALL call `POST /doctor/pharmacy-connections` with the selected `pharmacyId`.
2. WHEN the connection request is successfully created, THE Dashboard SHALL update the pharmacy's displayed status to "Awaiting Response" without requiring a page reload.
3. WHEN a Doctor clicks the "Disconnect" button for an Active Connection, THE Dashboard SHALL call `DELETE /doctor/pharmacy-connections/:id` for that connection.
4. WHEN the disconnection is successful, THE Dashboard SHALL update the pharmacy's displayed status to reflect the INACTIVE state without requiring a page reload.
5. IF a Doctor attempts to request a connection that already exists, THEN THE Dashboard SHALL display an error message indicating the connection already exists.
6. WHEN a Doctor clicks "Re-Establish" for an INACTIVE connection, THE Dashboard SHALL call `POST /doctor/pharmacy-connections` with the pharmacy's ID to create a new connection request.

---

### Requirement 3: Doctor — Prescription Creation Gate

**User Story:** As a doctor, I want the prescription creation form to enforce that I have at least one active pharmacy connection before sending, so that prescriptions are never sent into a void.

#### Acceptance Criteria

1. WHEN a Doctor navigates to the Prescriptions_Tab and has zero Active Connections, THE Dashboard SHALL display the message "Please connect with at least 1 pharmacy first" in the prescription form area.
2. WHILE a Doctor has zero Active Connections, THE Dashboard SHALL render the "Create & Send" button in a disabled state.
3. WHEN a Doctor has one or more Active Connections, THE Dashboard SHALL render the "Create & Send" button in an enabled state.
4. WHEN a Doctor has exactly one Active Connection, THE Dashboard SHALL pre-select that pharmacy as the target in the pharmacy selection field.
5. WHEN a Doctor has two or more Active Connections, THE Dashboard SHALL display a dropdown listing all Active Connection pharmacies for the Doctor to select a target pharmacy.

---

### Requirement 4: Doctor — Prescription Validation

**User Story:** As a doctor, I want the system to validate my prescription before submission so that incomplete prescriptions are never sent to a pharmacy.

#### Acceptance Criteria

1. WHEN a Doctor clicks "Create & Send" without adding any Prescription_Items, THE Dashboard SHALL display a validation message indicating that at least one medicine must be added.
2. WHEN a Doctor clicks "Create & Send" without selecting a patient, THE Dashboard SHALL display a validation message indicating that a patient must be selected.
3. WHEN a Doctor clicks "Create & Send" without selecting a target pharmacy (and multiple Active Connections exist), THE Dashboard SHALL display a validation message indicating that a pharmacy must be selected.
4. WHEN all required fields are valid, THE Dashboard SHALL call `POST /doctor/prescriptions` with `patientId`, `items`, and `targetPharmacyId`.
5. IF the backend returns an error for a prescription creation request, THEN THE Dashboard SHALL display the error message returned by the server.

---

### Requirement 5: Doctor — Create and Send Prescription

**User Story:** As a doctor, I want to create a prescription and send it directly to a connected pharmacy so that the pharmacy can prepare the medicines for my patient.

#### Acceptance Criteria

1. WHEN a Doctor submits a valid prescription via "Create & Send", THE Prescription_Service SHALL create a `Prescription` record with status `PENDING` and the selected `targetPharmacyId`.
2. WHEN the prescription is successfully created, THE Prescription_Service SHALL send a notification to the target Pharmacy user with the prescription details.
3. WHEN the prescription is successfully created, THE Dashboard SHALL display a success confirmation and reset the prescription form.
4. THE Dashboard SHALL display a "Save as Draft" button alongside "Create & Send".
5. WHEN a Doctor clicks "Save as Draft", THE Dashboard SHALL save the prescription without a `targetPharmacyId` and without triggering a pharmacy notification.

---

### Requirement 6: Doctor — Recent Prescriptions in Prescriptions Tab

**User Story:** As a doctor, I want to see my most recent prescriptions in the prescriptions tab so that I have quick context on what I've recently prescribed.

#### Acceptance Criteria

1. THE Dashboard SHALL display the 5 most recent Prescriptions created by the Doctor in the Prescriptions_Tab.
2. WHEN displaying recent prescriptions, THE Dashboard SHALL show the patient name, prescription creation date, number of medicines, and prescription status for each record.
3. THE Dashboard SHALL order recent prescriptions by `createdAt` descending (newest first).
4. WHEN the Doctor has no prescriptions, THE Dashboard SHALL display an empty state message in the recent prescriptions section.

---

### Requirement 7: Doctor — Per-Patient Prescription History

**User Story:** As a doctor, I want to view all prescriptions I have given to a specific patient inside that patient's profile so that I have a complete medication history per patient.

#### Acceptance Criteria

1. WHEN a Doctor opens a Patient_Profile, THE Dashboard SHALL display all Prescriptions created by that Doctor for that Patient.
2. WHEN displaying patient prescriptions, THE Dashboard SHALL show the prescription creation date, creation time, number of medicines, target pharmacy name, and prescription status for each record.
3. THE Dashboard SHALL order patient prescriptions by `createdAt` descending (newest first).
4. WHEN a patient has no prescriptions from the Doctor, THE Dashboard SHALL display an empty state message in the prescription history section.
5. THE Doctor_Service SHALL expose `GET /doctor/patients/:patientId/prescriptions` returning all Prescriptions where `doctorId` matches the authenticated Doctor and `patientId` matches the requested patient.

---

### Requirement 8: Pharmacy — Doctor Connection Request Management

**User Story:** As a pharmacy, I want to see all incoming doctor connection requests and accept or reject them so that I control which doctors can send me prescriptions.

#### Acceptance Criteria

1. WHEN a Pharmacy navigates to the Doctor_Connection_Tab, THE Dashboard SHALL display all DoctorPharmacyConnection records where `pharmacyId` matches the authenticated Pharmacy and status is `PENDING`.
2. WHEN displaying a pending connection request, THE Dashboard SHALL show the requesting doctor's name and email.
3. WHEN a Pharmacy clicks "Accept" on a pending request, THE Dashboard SHALL call `PATCH /doctor/pharmacy-connections/:id/accept`.
4. WHEN the acceptance is successful, THE Dashboard SHALL update the connection's displayed status to "Connected" without requiring a page reload.
5. WHEN a Pharmacy clicks "Reject" on a pending request, THE Dashboard SHALL call `DELETE /doctor/pharmacy-connections/:id` to remove the connection.
6. WHEN the rejection is successful, THE Dashboard SHALL remove the connection from the pending list without requiring a page reload.
7. WHEN a Pharmacy has no pending connection requests, THE Dashboard SHALL display an empty state message in the Doctor_Connection_Tab.
8. THE Doctor_Service SHALL restrict the `PATCH /doctor/pharmacy-connections/:id/accept` endpoint to users with role `PHARMACY` only.

---

### Requirement 9: Pharmacy — View Prescriptions Sent to This Pharmacy

**User Story:** As a pharmacy, I want to see only the prescriptions that connected doctors have sent specifically to my pharmacy so that I am not overwhelmed with prescriptions meant for other pharmacies.

#### Acceptance Criteria

1. WHEN a Pharmacy navigates to the Prescriptions_Tab, THE Dashboard SHALL display only Prescriptions where `targetPharmacyId` equals the authenticated Pharmacy's user ID.
2. THE Dashboard SHALL NOT display Prescriptions where `targetPharmacyId` is null or references a different Pharmacy.
3. WHEN displaying a prescription, THE Dashboard SHALL show the sending doctor's name, the patient's name, the prescription creation date, the list of medicines, and the prescription status.
4. THE Pharmacy_Service SHALL filter prescriptions by `targetPharmacyId` equal to the authenticated pharmacy's user ID when responding to `GET /pharmacy/prescriptions`.

---

### Requirement 10: Pharmacy — Prescription Checkout

**User Story:** As a pharmacy, I want a "Checkout" button on each prescription so that I can initiate the dispensing workflow for a patient's medicines.

#### Acceptance Criteria

1. WHEN a Pharmacy views a Prescription with status `PENDING`, THE Dashboard SHALL display a "Checkout" button for that prescription.
2. WHEN a Pharmacy clicks "Checkout", THE Dashboard SHALL call `POST /pharmacy/sales/prescription-checkout` with the `prescriptionId`.
3. WHEN the checkout is successful, THE Dashboard SHALL navigate to or display the checkout summary showing each medicine, available quantity, price per unit, and total.
4. WHEN a Prescription has status `DISPENSED`, THE Dashboard SHALL NOT display a "Checkout" button for that prescription.
5. WHEN a Prescription has status `CANCELLED`, THE Dashboard SHALL NOT display a "Checkout" button for that prescription.

---

### Requirement 11: Backend — Connection Acceptance Authorization

**User Story:** As a system, I want to ensure only the target pharmacy can accept a connection request so that doctors cannot accept their own requests.

#### Acceptance Criteria

1. WHEN `PATCH /doctor/pharmacy-connections/:id/accept` is called, THE Doctor_Service SHALL verify that the authenticated user's ID matches the `pharmacyId` on the DoctorPharmacyConnection record.
2. IF the authenticated user's ID does not match the `pharmacyId`, THEN THE Doctor_Service SHALL return a 403 Forbidden response.
3. IF the connection record does not exist or has a status other than `PENDING`, THEN THE Doctor_Service SHALL return a 404 Not Found response.
4. THE Doctor_Controller SHALL restrict the `PATCH /doctor/pharmacy-connections/:id/accept` route to users with role `PHARMACY` (not `DOCTOR`).

---

### Requirement 12: Backend — Prescription Dispatch Validation

**User Story:** As a system, I want to ensure a doctor can only send prescriptions to pharmacies they are actively connected to so that the connection requirement is enforced server-side.

#### Acceptance Criteria

1. WHEN `POST /doctor/prescriptions` is called with a `targetPharmacyId`, THE Doctor_Service SHALL verify that an Active Connection exists between the authenticated Doctor and the specified Pharmacy.
2. IF no Active Connection exists between the Doctor and the specified Pharmacy, THEN THE Doctor_Service SHALL return a 400 Bad Request response with a message indicating no active connection exists.
3. WHEN `POST /doctor/prescriptions` is called without a `targetPharmacyId`, THE Doctor_Service SHALL create the Prescription as a draft without connection validation.
4. THE Doctor_Service SHALL verify the `targetPharmacyId` refers to a User with role `PHARMACY` before creating the Prescription.

---

### Requirement 13: Backend — Patient Prescription History Endpoint

**User Story:** As a system, I want a dedicated endpoint for fetching a patient's prescriptions from a specific doctor so that the patient profile view can display accurate prescription history.

#### Acceptance Criteria

1. THE Doctor_Service SHALL expose `GET /doctor/patients/:patientId/prescriptions` returning all Prescriptions where `doctorId` equals the authenticated Doctor's ID and `patientId` equals the path parameter.
2. WHEN responding to `GET /doctor/patients/:patientId/prescriptions`, THE Doctor_Service SHALL include each prescription's `id`, `status`, `createdAt`, `targetPharmacyId`, and the list of `items` with medicine names.
3. IF the patient does not belong to the authenticated Doctor's tenant, THEN THE Doctor_Service SHALL return a 403 Forbidden response.
4. THE Doctor_Service SHALL order the results by `createdAt` descending.

---

### Requirement 14: Backend — Pharmacy Connection Listing for Pharmacy Role

**User Story:** As a system, I want the pharmacy to be able to list all incoming connection requests so that the Doctor_Connection_Tab can display them.

#### Acceptance Criteria

1. THE Pharmacy_Service SHALL expose `GET /pharmacy/doctor-connections` returning all DoctorPharmacyConnection records where `pharmacyId` equals the authenticated Pharmacy's user ID.
2. WHEN responding to `GET /pharmacy/doctor-connections`, THE Pharmacy_Service SHALL include the requesting doctor's `id`, `name`, and `email` for each connection record.
3. THE Pharmacy_Service SHALL support an optional `status` query parameter to filter connections by status (PENDING, ACTIVE, INACTIVE).
4. THE Pharmacy_Controller SHALL restrict `GET /pharmacy/doctor-connections` to users with role `PHARMACY`.
