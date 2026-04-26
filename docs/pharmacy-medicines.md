# Pharmacy Medicines Sub-Module

## Module Overview

The Medicines tab provides a catalog management interface for pharmacy operators. It allows viewing, adding, updating, and searching medicines within the pharmacy's tenant. Each medicine record tracks name, category, batch number, expiry date, quantity, supplier, and unit price. Batch number uniqueness is enforced within the tenant to prevent duplicate entries.

## User Flow

1. Pharmacy operator navigates to the **Medicines** tab.
2. The system loads all medicines belonging to the pharmacy's tenant, sorted by creation date (newest first).
3. Operator optionally filters by **category** or searches by **name/batch number**.
4. To add a new medicine, operator fills in: name, category (optional), batch number, expiry date, quantity, supplier, and unit price (optional), then submits.
5. The system validates batch number uniqueness within the tenant and creates the medicine record.
6. To update an existing medicine, operator selects a medicine and modifies any fields (name, category, batch number, expiry date, quantity, supplier, unit price).
7. The system validates the update (including batch number uniqueness if changed) and saves.

## API Endpoint Specifications

### List Medicines

```
GET /pharmacy/medicines
```

**Auth:** JWT required, role = PHARMACY

**Query Parameters:**

| Parameter | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| category  | string | No       | Filter by medicine category                      |
| search    | string | No       | Case-insensitive search on name or batchNumber   |
| page      | number | No       | Page number (default: 1)                         |
| limit     | number | No       | Items per page (default: 10, max: 100)           |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Amoxicillin 500mg",
      "batchNumber": "BATCH-2025-001",
      "expiryDate": "2026-06-15T00:00:00.000Z",
      "quantity": 250,
      "supplier": "PharmaCorp",
      "category": "Antibiotics",
      "unitPrice": "12.50",
      "tenantId": "uuid",
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-01-10T08:00:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10
}
```

### Add Medicine

```
POST /pharmacy/medicines
```

**Auth:** JWT required, role = PHARMACY

**Request Body:**

| Field       | Type   | Required | Description                          |
|-------------|--------|----------|--------------------------------------|
| name        | string | Yes      | Medicine name                        |
| category    | string | No       | Medicine category                    |
| batchNumber | string | Yes      | Unique batch number within tenant    |
| expiryDate  | string | Yes      | ISO 8601 date string                 |
| quantity    | number | Yes      | Initial stock quantity (integer ≥ 0) |
| supplier    | string | Yes      | Supplier name                        |
| unitPrice   | number | No       | Price per unit (≥ 0)                 |

**Response (201):** Returns the created Medicine object.

**Error Responses:**

| Status | Condition                                          |
|--------|----------------------------------------------------|
| 409    | A medicine with this batch number already exists   |
| 400    | Validation failure (missing required fields, etc.) |

### Update Medicine

```
PUT /pharmacy/medicines/:id
```

**Auth:** JWT required, role = PHARMACY

**Path Parameters:**

| Parameter | Type   | Description   |
|-----------|--------|---------------|
| id        | string | Medicine UUID |

**Request Body (all fields optional):**

| Field       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| name        | string | Medicine name                        |
| category    | string | Medicine category                    |
| batchNumber | string | Batch number (uniqueness re-checked) |
| expiryDate  | string | ISO 8601 date string                 |
| quantity    | number | Stock quantity (integer ≥ 0)         |
| supplier    | string | Supplier name                        |
| unitPrice   | number | Price per unit (≥ 0)                 |

**Response (200):** Returns the updated Medicine object.

**Error Responses:**

| Status | Condition                                          |
|--------|----------------------------------------------------|
| 404    | Medicine not found                                 |
| 409    | A medicine with this batch number already exists   |

## Database Schema

### Medicine

```prisma
model Medicine {
  id          String   @id @default(uuid())
  name        String
  batchNumber String   @unique
  expiryDate  DateTime
  quantity    Int
  supplier    String
  category    String?
  unitPrice   Decimal?
  tenantId    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  prescriptionItems PrescriptionItem[]
  saleItems         SaleItem[]
  purchaseRecords   PurchaseRecord[]

  @@index([name])
  @@index([batchNumber])
  @@index([expiryDate])
  @@index([supplier])
  @@index([quantity])
  @@index([quantity, expiryDate])
  @@index([createdAt])
  @@index([tenantId])
  @@index([tenantId, name])
}
```

## Business Rules

1. **Batch number uniqueness:** The `batchNumber` field has a `@unique` constraint at the database level. Attempting to create or update a medicine with a duplicate batch number returns HTTP 409.
2. **Tenant scoping:** Medicines are automatically filtered by `tenantId` via Prisma middleware. The `tenantId` is set from the authenticated user's JWT on creation.
3. **Search behavior:** The `search` parameter performs a case-insensitive `contains` match against both `name` and `batchNumber` fields using Prisma's `OR` filter with `mode: 'insensitive'`.
4. **Category filter:** When `category` is provided, only medicines with an exact match on the `category` field are returned.
5. **Ordering:** Results are always sorted by `createdAt` descending.
6. **Partial updates:** The update endpoint accepts any subset of fields. Only provided fields are modified; omitted fields remain unchanged.
7. **Quantity is not stock-managed here:** The quantity field on Medicine represents current stock. It is modified by the Sales module (decremented on sale via FIFO) and the Purchases module (incremented on purchase). Direct edits via this endpoint are allowed but should be used for corrections only.
