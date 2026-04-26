# Pharmacy Inventory Sub-Module

## Module Overview

The Inventory tab provides a real-time view of medicine stock levels with alert indicators for low-stock and near-expiry conditions. It reads from the same `Medicine` model as the Medicines tab but presents the data through an inventory lens — focusing on batch quantities, expiry dates, and stock health. A dedicated alerts endpoint surfaces medicines that need immediate attention.

## User Flow

1. Pharmacy operator navigates to the **Inventory** tab.
2. The system loads all medicine batches for the pharmacy's tenant, each annotated with a computed `stockStatus` (LOW or NORMAL) and `nearExpiry` flag.
3. Operator optionally filters by **stock status** (LOW or NORMAL) or searches by **name/batch number**.
4. Medicines with LOW stock or near-expiry dates are visually highlighted.
5. Operator clicks **View Alerts** to see a dedicated panel with two lists:
   - **Low Stock:** medicines with quantity below the threshold (default: 10 units), sorted by quantity ascending.
   - **Near Expiry:** medicines expiring within the threshold (default: 30 days), sorted by expiry date ascending.

## API Endpoint Specifications

### List Inventory

```
GET /pharmacy/inventory
```

**Auth:** JWT required, role = PHARMACY

**Query Parameters:**

| Parameter   | Type   | Required | Description                                    |
|-------------|--------|----------|------------------------------------------------|
| search      | string | No       | Case-insensitive search on name or batchNumber |
| stockStatus | string | No       | Filter: `LOW` or `NORMAL`                      |
| page        | number | No       | Page number (default: 1)                       |
| limit       | number | No       | Items per page (default: 10, max: 100)         |

**Response (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Amoxicillin 500mg",
      "batchNumber": "BATCH-2025-001",
      "expiryDate": "2025-02-20T00:00:00.000Z",
      "quantity": 5,
      "supplier": "PharmaCorp",
      "category": "Antibiotics",
      "unitPrice": "12.50",
      "tenantId": "uuid",
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-01-10T08:00:00.000Z",
      "stockStatus": "LOW",
      "nearExpiry": true
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10
}
```

### Get Inventory Alerts

```
GET /pharmacy/inventory/alerts
```

**Auth:** JWT required, role = PHARMACY

**Response (200):**

```json
{
  "lowStock": [
    {
      "id": "uuid",
      "name": "Paracetamol 500mg",
      "batchNumber": "BATCH-2025-010",
      "expiryDate": "2026-03-01T00:00:00.000Z",
      "quantity": 3,
      "supplier": "MedSupply",
      "category": "Analgesics",
      "unitPrice": "5.00",
      "tenantId": "uuid",
      "createdAt": "2025-01-05T08:00:00.000Z",
      "updatedAt": "2025-01-18T14:00:00.000Z",
      "stockStatus": "LOW"
    }
  ],
  "nearExpiry": [
    {
      "id": "uuid",
      "name": "Amoxicillin 500mg",
      "batchNumber": "BATCH-2025-001",
      "expiryDate": "2025-02-10T00:00:00.000Z",
      "quantity": 50,
      "supplier": "PharmaCorp",
      "category": "Antibiotics",
      "unitPrice": "12.50",
      "tenantId": "uuid",
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-01-10T08:00:00.000Z",
      "nearExpiry": true
    }
  ]
}
```

## Database Schema

The Inventory tab reads from the `Medicine` model. No separate inventory table exists — stock status is computed at query time.

### Medicine (relevant fields)

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

  @@index([quantity])
  @@index([quantity, expiryDate])
  @@index([expiryDate])
  @@index([tenantId])
  @@index([tenantId, name])
}
```

## Business Rules

1. **Stock status computation:**
   - `LOW` — medicine `quantity < LOW_STOCK_THRESHOLD` (default: 10 units).
   - `NORMAL` — medicine `quantity >= LOW_STOCK_THRESHOLD`.
2. **Near-expiry computation:**
   - `nearExpiry: true` — medicine `expiryDate <= now + NEAR_EXPIRY_DAYS` (default: 30 days).
   - `nearExpiry: false` — medicine expiry is more than 30 days away.
3. **Tenant scoping:** The inventory list endpoint explicitly filters by `tenantId` from the authenticated user. The alerts endpoint also filters by `tenantId`.
4. **Stock status filter:** When `stockStatus=LOW` is passed, the query adds `quantity: { lt: LOW_STOCK_THRESHOLD }`. When `stockStatus=NORMAL`, it adds `quantity: { gte: LOW_STOCK_THRESHOLD }`.
5. **Alerts sorting:**
   - Low-stock medicines are sorted by `quantity` ascending (most critical first).
   - Near-expiry medicines are sorted by `expiryDate` ascending (soonest expiry first).
6. **Thresholds are constants:** `LOW_STOCK_THRESHOLD = 10` and `NEAR_EXPIRY_DAYS = 30` are hardcoded in the service. They are not configurable per tenant at this time.
7. **Notifications:** When a sale causes stock to drop below the low-stock threshold, a `LOW_STOCK` notification is generated for the pharmacy operator (handled in the Sales module, not here). Near-expiry notifications are generated by a scheduled job (`expiry-check.scheduler.ts`).
