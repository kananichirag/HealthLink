# Pharmacy Prescriptions Sub-Module

## Module Overview

The Prescriptions tab allows pharmacy operators to view, filter, and manage prescriptions dispatched to their pharmacy by connected doctors. Pharmacies receive prescriptions via the Doctor-Pharmacy Connection system — only doctors with an ACTIVE connection can dispatch prescriptions to a given pharmacy. The pharmacy operator can review prescription details and mark them as DISPENSED once the medicines have been prepared and handed to the patient.

## User Flow

1. Pharmacy operator navigates to the **Prescriptions** tab.
2. The system loads all prescriptions where `targetPharmacyId` matches the logged-in pharmacy user, sorted by creation date (newest first).
3. Operator optionally filters by **status** (PENDING, DISPENSED, CANCELLED) and/or **date range** (startDate, endDate).
4. Operator clicks a prescription to view details: patient name, doctor name, and itemized medicines with dosage, frequency, duration, and quantity.
5. For a PENDING prescription, operator clicks **Dispense** to mark it as DISPENSED.
6. The system updates the prescription status and sends a `PRESCRIPTION_DISPENSED` notification to the patient's user account (matched by email).

## API Endpoint Specifications

### List Received Prescriptions

```
GET /pharmacy/prescriptions
```

**Auth:** JWT required, role = PHARMACY

**Query Parameters:**

| Parameter   | Type   | Required | Description                                  |
|-------------|--------|----------|----------------------------------------------|
| status      | enum   | No       | Filter by PrescriptionStatus (PENDING, DISPENSED, CANCELLED) |
| startDate   | string | No       | ISO 8601 date string, inclusive lower bound on createdAt |
| endDate     | string | No       | ISO 8601 date string, inclusive upper bound on createdAt |
| page        | number | No       | Page number (default: 1)                     |
| limit       | number | No       | Items per page (default: 10, max: 100)       |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "doctorId": "uuid",
      "status": "PENDING",
      "tenantId": "uuid",
      "targetPharmacyId": "uuid",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z",
      "patient": { "id": "uuid", "name": "John Doe" },
      "doctor": { "id": "uuid", "name": "Dr. Smith" },
      "items": [
        {
          "id": "uuid",
          "prescriptionId": "uuid",
          "medicineId": "uuid",
          "quantity": 30,
          "dosage": "500mg",
          "frequency": "Twice daily",
          "duration": "7 days",
          "createdAt": "2025-01-15T10:00:00.000Z",
          "medicine": { "id": "uuid", "name": "Amoxicillin" }
        }
      ]
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10
}
```

### Dispense Prescription

```
PATCH /pharmacy/prescriptions/:id/dispense
```

**Auth:** JWT required, role = PHARMACY

**Path Parameters:**

| Parameter | Type   | Description      |
|-----------|--------|------------------|
| id        | string | Prescription UUID |

**Response (200):** Returns the updated prescription object with status `DISPENSED`, including patient, doctor, and items.

**Error Responses:**

| Status | Condition                                |
|--------|------------------------------------------|
| 404    | Prescription not found or not targeted to this pharmacy |
| 400    | Prescription is already DISPENSED        |

## Database Schema

### Prescription

```prisma
model Prescription {
  id               String             @id @default(uuid())
  patientId        String
  doctorId         String
  status           PrescriptionStatus @default(PENDING)
  tenantId         String?
  targetPharmacyId String?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  patient Patient            @relation(fields: [patientId], references: [id])
  doctor  User               @relation("DoctorPrescriptions", fields: [doctorId], references: [id])
  items   PrescriptionItem[]
  order   Order?
  sales   Sale[]

  @@index([patientId])
  @@index([doctorId])
  @@index([status])
  @@index([createdAt])
  @@index([tenantId])
  @@index([tenantId, status])
}

enum PrescriptionStatus {
  PENDING
  DISPENSED
  CANCELLED
}
```

### PrescriptionItem

```prisma
model PrescriptionItem {
  id             String   @id @default(uuid())
  prescriptionId String
  medicineId     String
  quantity       Int
  dosage         String?
  frequency      String?
  duration       String?
  createdAt      DateTime @default(now())

  prescription Prescription @relation(fields: [prescriptionId], references: [id])
  medicine     Medicine     @relation(fields: [medicineId], references: [id])

  @@index([prescriptionId])
  @@index([medicineId])
}
```

## Business Rules

1. **Pharmacy scoping:** Only prescriptions where `targetPharmacyId` matches the authenticated pharmacy user's ID are returned.
2. **Tenant isolation:** All queries are automatically scoped by `tenantId` via Prisma middleware.
3. **Idempotent dispense guard:** A prescription that is already DISPENSED cannot be dispensed again (returns 400).
4. **Patient notification on dispense:** When a prescription is dispensed, the system looks up a User record matching the patient's email and creates a `PRESCRIPTION_DISPENSED` notification. If no matching user account exists, the dispense still succeeds but no notification is sent.
5. **Ordering:** Prescriptions are always returned sorted by `createdAt` descending (newest first).
6. **Connection prerequisite:** Prescriptions only arrive at a pharmacy if a doctor has an ACTIVE `DoctorPharmacyConnection` with that pharmacy. This is enforced at dispatch time in the Doctor module, not at query time in the Pharmacy module.
