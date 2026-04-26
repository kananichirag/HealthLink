# Pharmacy Purchases Sub-Module

## Module Overview

The Purchases tab allows pharmacy operators to record medicine stock purchases from suppliers and view purchase history. Each purchase is linked to an existing medicine record and automatically increments the medicine's stock quantity. Purchase records track batch number, quantity, unit cost, total cost, seller details, and purchase date. This module provides the procurement side of inventory management.

## User Flow

1. Pharmacy operator navigates to the **Purchases** tab.
2. The system loads all purchase records for the pharmacy's tenant, sorted by purchase date (newest first).
3. Operator optionally filters by **date range** (startDate, endDate).
4. Each purchase record shows: medicine name, batch number, quantity, unit cost, total cost, seller name, seller company, and purchase date.
5. To record a new purchase, operator fills in: medicine (selected from existing catalog), batch number, quantity, unit cost, seller name, seller company, and purchase date.
6. On submission, the system creates a `PurchaseRecord` and atomically increments the linked medicine's `quantity` by the purchased amount within a single database transaction.

## API Endpoint Specifications

### Record Purchase

```
POST /pharmacy/purchases
```

**Auth:** JWT required, role = PHARMACY

**Request Body:**

| Field         | Type   | Required | Description                              |
|---------------|--------|----------|------------------------------------------|
| medicineId    | string | Yes      | UUID of the existing medicine record     |
| batchNumber   | string | Yes      | Batch number for this purchase           |
| quantity      | number | Yes      | Quantity purchased (integer ≥ 1)         |
| unitCost      | number | Yes      | Cost per unit (≥ 0)                      |
| sellerName    | string | Yes      | Name of the seller/contact               |
| sellerCompany | string | Yes      | Company name of the supplier             |
| purchaseDate  | string | Yes      | ISO 8601 date string                     |

**Response (201):**

```json
{
  "id": "uuid",
  "medicineId": "uuid",
  "batchNumber": "BATCH-2025-002",
  "quantity": 100,
  "unitCost": "10.00",
  "totalCost": "1000.00",
  "sellerName": "John Supplier",
  "sellerCompany": "MedSupply Inc.",
  "purchaseDate": "2025-01-20T00:00:00.000Z",
  "tenantId": "uuid",
  "createdAt": "2025-01-20T09:30:00.000Z"
}
```

**Error Responses:**

| Status | Condition                                                  |
|--------|------------------------------------------------------------|
| 404    | Medicine not found within the pharmacy's tenant            |
| 400    | Validation failure (missing required fields, invalid data) |

### List Purchases

```
GET /pharmacy/purchases
```

**Auth:** JWT required, role = PHARMACY

**Query Parameters:**

| Parameter | Type   | Required | Description                                        |
|-----------|--------|----------|----------------------------------------------------|
| startDate | string | No       | ISO 8601 date, inclusive lower bound on purchaseDate |
| endDate   | string | No       | ISO 8601 date, inclusive upper bound on purchaseDate |
| page      | number | No       | Page number (default: 1)                           |
| limit     | number | No       | Items per page (default: 10, max: 100)             |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "medicineId": "uuid",
      "batchNumber": "BATCH-2025-002",
      "quantity": 100,
      "unitCost": "10.00",
      "totalCost": "1000.00",
      "sellerName": "John Supplier",
      "sellerCompany": "MedSupply Inc.",
      "purchaseDate": "2025-01-20T00:00:00.000Z",
      "tenantId": "uuid",
      "createdAt": "2025-01-20T09:30:00.000Z",
      "medicine": { "id": "uuid", "name": "Amoxicillin 500mg" }
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

## Database Schema

### PurchaseRecord

```prisma
model PurchaseRecord {
  id            String   @id @default(uuid())
  medicineId    String
  batchNumber   String
  quantity      Int
  unitCost      Decimal
  totalCost     Decimal
  sellerName    String
  sellerCompany String
  purchaseDate  DateTime
  tenantId      String
  createdAt     DateTime @default(now())

  medicine Medicine @relation(fields: [medicineId], references: [id])

  @@index([medicineId])
  @@index([tenantId])
  @@index([purchaseDate])
  @@index([tenantId, purchaseDate])
}
```

### Medicine (affected fields)

```prisma
model Medicine {
  id       String @id @default(uuid())
  quantity Int    -- incremented on purchase
  ...
  purchaseRecords PurchaseRecord[]
}
```

## Business Rules

1. **Medicine validation:** The medicine must exist within the pharmacy's tenant. The service queries `medicine.findFirst({ where: { id, tenantId } })` and returns 404 if not found.
2. **Total cost calculation:** `totalCost = quantity × unitCost`. This is computed server-side, not provided by the client.
3. **Atomic stock update:** The purchase record creation and medicine quantity increment happen within a single Prisma `$transaction`. If either operation fails, both are rolled back.
4. **Stock increment:** The medicine's `quantity` is incremented by exactly the purchased `quantity` using `{ increment: dto.quantity }`.
5. **Tenant scoping:** The `tenantId` is set from the authenticated user's JWT on creation. List queries filter by `tenantId`.
6. **Date range filtering:** When `startDate` and/or `endDate` are provided, the query filters on `purchaseDate` using `gte` and `lte` respectively.
7. **Ordering:** Purchase records are always sorted by `purchaseDate` descending (most recent first).
8. **Included relations:** The list endpoint includes the related medicine's `id` and `name` for display purposes.
