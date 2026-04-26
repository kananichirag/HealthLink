# Pharmacy Reports Sub-Module

## Module Overview

The Reports tab provides business analytics for pharmacy operators. It offers four report types: daily sales summary, top-selling medicines, weekly revenue/cost summary, and payment method breakdown. All reports are tenant-scoped and support custom date range filtering. The data is aggregated from `Sale`, `SaleItem`, and `PurchaseRecord` tables.

## User Flow

1. Pharmacy operator navigates to the **Reports** tab.
2. The dashboard displays **today's summary** by default: total sales count, total revenue, and total items sold.
3. Operator selects a report type:
   - **Daily Report** — sales metrics for a specific date.
   - **Top Medicines** — top 10 most-sold medicines in a date range.
   - **Weekly Summary** — revenue, purchase cost, and net margin for a week.
   - **Payment Breakdown** — count and revenue per payment method for a period.
4. Operator optionally adjusts the date range (past week, past month, past quarter, or custom start/end dates).
5. The system fetches and displays the selected report.

## API Endpoint Specifications

### Daily Report

```
GET /pharmacy/reports/daily
```

**Auth:** JWT required, role = PHARMACY

**Query Parameters:**

| Parameter | Type   | Required | Description                                         |
|-----------|--------|----------|-----------------------------------------------------|
| startDate | string | No       | ISO 8601 date for the target day (default: today)   |

**Response (200):**

```json
{
  "date": "2025-01-20",
  "totalSales": 15,
  "totalRevenue": 4250.75,
  "totalItemsSold": 87
}
```

**Computation:**
- `totalSales` = count of Sale records on the target date.
- `totalRevenue` = sum of `finalAmount` across all sales on the target date.
- `totalItemsSold` = sum of all `SaleItem.quantity` across all sales on the target date.

### Top Medicines

```
GET /pharmacy/reports/top-medicines
```

**Auth:** JWT required, role = PHARMACY

**Query Parameters:**

| Parameter | Type   | Required | Description                                        |
|-----------|--------|----------|----------------------------------------------------|
| startDate | string | No       | ISO 8601 date, inclusive lower bound on createdAt   |
| endDate   | string | No       | ISO 8601 date, inclusive upper bound on createdAt   |

**Response (200):**

```json
[
  {
    "medicineId": "uuid",
    "medicineName": "Paracetamol 500mg",
    "totalQuantity": 320
  },
  {
    "medicineId": "uuid",
    "medicineName": "Amoxicillin 500mg",
    "totalQuantity": 215
  }
]
```

**Computation:**
- Aggregates `SaleItem` records by `medicineId`, summing `quantity`.
- Sorts by `totalQuantity` descending.
- Returns the top 10 results.

### Weekly Summary

```
GET /pharmacy/reports/weekly-summary
```

**Auth:** JWT required, role = PHARMACY

**Query Parameters:**

| Parameter | Type   | Required | Description                                        |
|-----------|--------|----------|----------------------------------------------------|
| startDate | string | No       | ISO 8601 date, start of period                     |
| endDate   | string | No       | ISO 8601 date, end of period                       |

If no dates are provided, defaults to the current week (Monday through Sunday).

**Response (200):**

```json
{
  "startDate": "2025-01-13",
  "endDate": "2025-01-19",
  "totalRevenue": 28500.00,
  "totalPurchaseCost": 18200.00,
  "netMargin": 10300.00
}
```

**Computation:**
- `totalRevenue` = sum of `Sale.finalAmount` within the date range.
- `totalPurchaseCost` = sum of `PurchaseRecord.totalCost` within the date range.
- `netMargin` = `totalRevenue - totalPurchaseCost`.

### Payment Breakdown

```
GET /pharmacy/reports/payment-breakdown
```

**Auth:** JWT required, role = PHARMACY

**Query Parameters:**

| Parameter | Type   | Required | Description                                        |
|-----------|--------|----------|----------------------------------------------------|
| startDate | string | No       | ISO 8601 date, inclusive lower bound on createdAt   |
| endDate   | string | No       | ISO 8601 date, inclusive upper bound on createdAt   |

**Response (200):**

```json
{
  "CASH": { "count": 45, "revenue": 12500.00 },
  "CARD": { "count": 30, "revenue": 9800.00 },
  "ONLINE": { "count": 15, "revenue": 6200.00 }
}
```

**Computation:**
- Groups `Sale` records by `paymentMethod`.
- For each method: `count` = number of sales, `revenue` = sum of `finalAmount`.

## Database Schema

### Sale (relevant fields for reports)

```prisma
model Sale {
  id            String            @id @default(uuid())
  paymentMethod SalePaymentMethod
  finalAmount   Decimal
  tenantId      String?
  createdAt     DateTime          @default(now())
  items         SaleItem[]

  @@index([tenantId, createdAt])
  @@index([createdAt, paymentMethod])
}
```

### SaleItem (relevant fields for top medicines)

```prisma
model SaleItem {
  id         String @id @default(uuid())
  medicineId String
  quantity   Int
  tenantId   String?
  createdAt  DateTime @default(now())

  medicine Medicine @relation(fields: [medicineId], references: [id])

  @@index([medicineId])
  @@index([tenantId])
}
```

### PurchaseRecord (relevant fields for weekly summary)

```prisma
model PurchaseRecord {
  id           String   @id @default(uuid())
  totalCost    Decimal
  purchaseDate DateTime
  tenantId     String

  @@index([tenantId, purchaseDate])
}
```

## Business Rules

1. **Tenant scoping:** All report queries filter by `tenantId` from the authenticated user's JWT. Reports never include data from other tenants.

2. **Daily report date handling:** The `startDate` parameter selects the target day. The query covers the full 24-hour window: `00:00:00.000` to `23:59:59.999` of that date. If no date is provided, today is used.

3. **Top medicines limit:** Always returns at most 10 medicines, sorted by total quantity sold in descending order.

4. **Top medicines date filtering:** Filters on `SaleItem.createdAt`, not `Sale.createdAt`. Both are set at creation time so they are effectively equivalent.

5. **Weekly summary default range:** When no dates are provided, the system calculates the current week as Monday 00:00:00 through Sunday 23:59:59. The day-of-week calculation handles Sunday (JS day 0) by mapping it to offset 6.

6. **Net margin formula:** `netMargin = totalRevenue - totalPurchaseCost`. This is a simple profit calculation. A negative value indicates a loss for the period.

7. **Payment breakdown initialization:** All three payment methods (CASH, CARD, ONLINE) are always present in the response, even if their count and revenue are 0. This ensures consistent response structure.

8. **Revenue values:** All monetary values are returned as JavaScript numbers (converted from Prisma `Decimal` type using `Number()`). Precision is maintained to 2 decimal places in the database but may have floating-point representation in the response.
