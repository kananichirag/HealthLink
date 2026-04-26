# Pharmacy Sales Sub-Module

## Module Overview

The Sales tab is the core billing interface for pharmacy operators. It supports two workflows: manual bill creation (operator searches and adds medicines) and prescription-based checkout (auto-populates a bill from a dispatched prescription). The module handles financial calculations (subtotal, discount, tax, final amount), FIFO batch selection for stock deduction, invoice generation, and bill delivery to patients. It is optimized for speed during rush hours with debounced search, local state management, and optimistic submission on the frontend.

## User Flow

### Manual Sale

1. Pharmacy operator navigates to **Sales > New Sale**.
2. Operator searches for medicines by name (debounced 200ms input).
3. Operator adds medicines to the bill, specifying quantity and price per unit.
4. The frontend computes running totals locally: subtotal, discount, GST, and final amount.
5. Operator selects a payment method (CASH, CARD, or ONLINE) and optionally applies a discount (flat or percentage).
6. Operator submits the bill.
7. The backend performs FIFO batch selection (earliest-expiry non-expired batch with sufficient stock), deducts stock, and creates the Sale record — all within a single database transaction.
8. If any medicine has insufficient stock, the transaction is rolled back and HTTP 422 is returned.

### Prescription Checkout

1. Operator selects a received prescription and clicks **Checkout**.
2. The system auto-populates the bill by matching each prescribed medicine to available inventory (FIFO: earliest expiry, non-expired, sufficient stock).
3. Medicines not available in inventory are flagged as unavailable.
4. Operator reviews, adjusts if needed, and submits.
5. On completion, the Sale is linked to the Prescription via `prescriptionId`, and the prescription status is updated to DISPENSED.

### Invoice & Delivery

1. After a sale, operator can view the invoice (formatted for PDF generation on the frontend).
2. Operator can send the bill to the patient via the notification system.

## API Endpoint Specifications

### Prescription Checkout (Auto-Populate Bill)

```
POST /pharmacy/sales/prescription-checkout
```

**Auth:** JWT required, role = PHARMACY

**Request Body:**

| Field          | Type   | Required | Description        |
|----------------|--------|----------|--------------------|
| prescriptionId | string | Yes      | UUID of prescription |

**Response (200):**

```json
{
  "prescriptionId": "uuid",
  "patientName": "John Doe",
  "doctorName": "Dr. Smith",
  "items": [
    {
      "prescriptionItemId": "uuid",
      "medicineId": "uuid",
      "medicineName": "Amoxicillin 500mg",
      "prescribedQuantity": 30,
      "availableQuantity": 250,
      "available": true,
      "pricePerUnit": 12.50,
      "batchNumber": "BATCH-2025-001",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "duration": "7 days"
    },
    {
      "prescriptionItemId": "uuid",
      "medicineId": "uuid",
      "medicineName": "Unavailable Drug",
      "prescribedQuantity": 10,
      "availableQuantity": 0,
      "available": false,
      "pricePerUnit": 0,
      "batchNumber": null,
      "dosage": "100mg",
      "frequency": "Once daily",
      "duration": "5 days"
    }
  ],
  "allAvailable": false
}
```

**Error Responses:**

| Status | Condition                                                |
|--------|----------------------------------------------------------|
| 404    | Prescription not found or not targeted to this pharmacy  |

### Create Sale

```
POST /pharmacy/sales
```

**Auth:** JWT required, role = PHARMACY

**Request Body:**

| Field          | Type   | Required | Description                                    |
|----------------|--------|----------|------------------------------------------------|
| customerName   | string | Yes      | Customer/patient name (max 255 chars)          |
| prescriptionId | string | No       | UUID linking sale to a prescription            |
| paymentMethod  | enum   | Yes      | CASH, CARD, or ONLINE                          |
| discountType   | enum   | No       | FLAT or PERCENTAGE (default: FLAT)             |
| discount       | number | No       | Discount value (≥ 0)                           |
| taxRate        | number | No       | Tax rate percentage (0–100)                    |
| items          | array  | Yes      | Array of sale items (see below)                |

**Sale Item:**

| Field        | Type   | Required | Description                  |
|--------------|--------|----------|------------------------------|
| medicineId   | string | Yes      | UUID of the medicine         |
| quantity     | number | Yes      | Quantity to sell (integer ≥ 1) |
| pricePerUnit | number | Yes      | Price per unit (≥ 0)         |

**Response (201):**

```json
{
  "id": "uuid",
  "customerName": "John Doe",
  "prescriptionId": "uuid or null",
  "paymentMethod": "CASH",
  "discountType": "FLAT",
  "subtotal": 375.00,
  "discount": 25.00,
  "tax": 35.00,
  "finalAmount": 385.00,
  "createdBy": "uuid",
  "createdAt": "2025-01-20T14:30:00.000Z",
  "items": [
    {
      "id": "uuid",
      "saleId": "uuid",
      "medicineId": "uuid",
      "medicineName": "Amoxicillin 500mg",
      "batchNumber": "BATCH-2025-001",
      "quantity": 30,
      "pricePerUnit": 12.50,
      "totalPrice": 375.00,
      "createdAt": "2025-01-20T14:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

| Status | Condition                                                    |
|--------|--------------------------------------------------------------|
| 404    | Medicine or prescription not found                           |
| 422    | Insufficient stock or expired medicine for a requested item  |

### List Sales

```
GET /pharmacy/sales
```

**Auth:** JWT required, role = PHARMACY

**Query Parameters:**

| Parameter | Type   | Required | Description                                  |
|-----------|--------|----------|----------------------------------------------|
| page      | number | No       | Page number (default: 1)                     |
| limit     | number | No       | Items per page (default: 20)                 |
| startDate | string | No       | ISO 8601 date, inclusive lower bound on createdAt |
| endDate   | string | No       | ISO 8601 date, inclusive upper bound on createdAt |

**Response (200):**

```json
{
  "sales": [
    {
      "id": "uuid",
      "customerName": "John Doe",
      "paymentMethod": "CASH",
      "subtotal": 375.00,
      "discount": 25.00,
      "tax": 35.00,
      "finalAmount": 385.00,
      "createdAt": "2025-01-20T14:30:00.000Z",
      "itemCount": 3
    }
  ],
  "total": 120
}
```

### Get Sale Detail

```
GET /pharmacy/sales/:id
```

**Auth:** JWT required, role = PHARMACY

**Response (200):** Full `SaleResponseDto` with items including medicine names.

### Get Invoice

```
GET /pharmacy/sales/:id/invoice
```

**Auth:** JWT required, role = PHARMACY

**Response (200):**

```json
{
  "pharmacyName": "City Pharmacy",
  "pharmacyAddress": "123 Main St",
  "invoiceNumber": "uuid (sale ID)",
  "invoiceDate": "2025-01-20T14:30:00.000Z",
  "customerName": "John Doe",
  "paymentMethod": "CASH",
  "items": [
    {
      "medicineName": "Amoxicillin 500mg",
      "batchNumber": "BATCH-2025-001",
      "quantity": 30,
      "pricePerUnit": 12.50,
      "totalPrice": 375.00
    }
  ],
  "subtotal": 375.00,
  "discountAmount": 25.00,
  "taxAmount": 35.00,
  "finalAmount": 385.00
}
```

### Send Bill to Patient

```
POST /pharmacy/sales/:id/send-bill
```

**Auth:** JWT required, role = PHARMACY

**Response (200):**

```json
{
  "message": "Bill sent to patient successfully",
  "saleId": "uuid"
}
```

**Error Responses:**

| Status | Condition                                                |
|--------|----------------------------------------------------------|
| 404    | Sale not found, or no patient user account found         |

## Database Schema

### Sale

```prisma
model Sale {
  id             String            @id @default(uuid())
  customerName   String
  prescriptionId String?
  paymentMethod  SalePaymentMethod
  discountType   DiscountType      @default(FLAT)
  subtotal       Decimal
  discount       Decimal           @default(0)
  tax            Decimal           @default(0)
  finalAmount    Decimal
  createdBy      String?
  tenantId       String?
  createdAt      DateTime          @default(now())

  prescription Prescription? @relation(fields: [prescriptionId], references: [id])
  creator      User?         @relation("UserSales", fields: [createdBy], references: [id])
  items        SaleItem[]

  @@index([createdAt])
  @@index([createdBy])
  @@index([prescriptionId])
  @@index([paymentMethod])
  @@index([createdAt, paymentMethod])
  @@index([tenantId])
  @@index([tenantId, createdAt])
}

enum SalePaymentMethod {
  CASH
  CARD
  ONLINE
}

enum DiscountType {
  FLAT
  PERCENTAGE
}
```

### SaleItem

```prisma
model SaleItem {
  id           String   @id @default(uuid())
  saleId       String
  medicineId   String
  batchNumber  String
  quantity     Int
  pricePerUnit Decimal
  totalPrice   Decimal
  tenantId     String?
  createdAt    DateTime @default(now())

  sale     Sale     @relation(fields: [saleId], references: [id])
  medicine Medicine @relation(fields: [medicineId], references: [id])

  @@index([saleId])
  @@index([medicineId])
  @@index([tenantId])
}
```

## Business Rules

1. **Financial calculation formula:**
   - `subtotal = Σ(pricePerUnit × quantity)` for all items.
   - `discountAmount`: if `discountType = FLAT`, then `discountAmount = discount`; if `PERCENTAGE`, then `discountAmount = subtotal × (discount / 100)`, rounded to 2 decimal places.
   - Discount cannot exceed subtotal (returns 422 if it does).
   - `taxAmount = (subtotal - discountAmount) × (taxRate / 100)`, rounded to 2 decimal places.
   - `finalAmount = subtotal - discountAmount + taxAmount`, rounded to 2 decimal places.

2. **FIFO batch selection:** For each sale item, the system selects the medicine batch with the earliest `expiryDate` that is not expired (`expiryDate > now`) and has sufficient stock (`quantity >= requested`). Only one batch is selected per item (no cross-batch splitting).

3. **Atomic transaction:** All stock deductions and the sale record creation happen within a single Prisma `$transaction`. If any item fails (insufficient stock, expired), the entire transaction rolls back.

4. **Insufficient stock:** Returns HTTP 422 with a message identifying the specific medicine and reason (expired or insufficient stock).

5. **Prescription checkout matching:** Each prescribed medicine is matched to inventory by `name` (not ID), looking for non-expired batches with stock > 0, ordered by expiry ascending (FIFO). Unavailable medicines are flagged with `available: false`.

6. **Prescription status update:** When a sale with a `prescriptionId` is completed, the linked prescription's status is updated to DISPENSED.

7. **Invoice data:** The invoice endpoint returns pharmacy name and address from server configuration (`pharmacy.name`, `pharmacy.address` in config). The invoice number is the sale's UUID.

8. **Send bill:** The system finds the patient's user account by matching the prescription's patient email to a User record. A notification of type `INVOICE` is created with an itemized summary and total. Returns 404 if no patient user account is found.

9. **Near-expiry events:** After a sale completes, the system checks if any sold medicine batch is within 30 days of expiry and emits a `sale.near_expiry_medicine` event for notification handling.
