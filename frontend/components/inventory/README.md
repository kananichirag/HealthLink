# Inventory Components

This directory contains the inventory management components for the healthcare SaaS platform.

## Components

### InventoryFilters

A comprehensive filtering component for the inventory system with the following features:

- **Search Input**: Debounced search (300ms) for filtering by medicine name, batch number, or supplier
- **Stock Status Filter**: Dropdown to filter by LOW or NORMAL stock levels
- **Expiry Status Filter**: Dropdown to filter by EXPIRED, EXPIRING, or NORMAL expiry status
- **Clear Filters**: Button to reset all filters at once
- **Active Filters Summary**: Visual badges showing currently active filters with individual remove buttons

#### Usage

```tsx
import InventoryFilters from './components/inventory/InventoryFilters';
import { GetInventoryQuery } from './lib/api';

function MyComponent() {
  const [filters, setFilters] = useState<GetInventoryQuery>({});

  const handleFiltersChange = (newFilters: GetInventoryQuery) => {
    setFilters(newFilters);
    // Fetch data with new filters
  };

  return (
    <InventoryFilters
      onFiltersChange={handleFiltersChange}
      initialFilters={filters}
    />
  );
}
```

#### Props

- `onFiltersChange: (filters: GetInventoryQuery) => void` - Callback fired when filters change
- `initialFilters?: GetInventoryQuery` - Initial filter values (optional)

### InventoryTable

A table component for displaying medicine inventory with sorting, pagination, and status indicators.

#### Features

- Color-coded status indicators (red for low stock/expired, yellow for expiring)
- Sortable columns (name, batch number, quantity, expiry date, status)
- Pagination controls
- Edit and delete actions
- Empty state handling
- Loading states

#### Usage

```tsx
import InventoryTable from './components/inventory/InventoryTable';
import { GetInventoryQuery, MedicineResponse } from './lib/api';

function MyComponent() {
  const [filters, setFilters] = useState<GetInventoryQuery>({});

  const handleEdit = (medicine: MedicineResponse) => {
    // Handle edit
  };

  const handleAdd = () => {
    // Handle add
  };

  return (
    <InventoryTable
      filters={filters}
      onEdit={handleEdit}
      onAdd={handleAdd}
    />
  );
}
```

#### Props

- `filters?: GetInventoryQuery` - Filter parameters to apply to the inventory query
- `onEdit?: (medicine: MedicineResponse) => void` - Callback for editing a medicine
- `onAdd?: () => void` - Callback for adding a new medicine

### InventoryDashboard

A dashboard component showing inventory statistics and recent medicines.

#### Features

- Statistics cards (total, low stock, expiring, expired)
- Recent medicines table
- Quick action buttons
- Navigation to filtered views

### MedicineForm

A modal form component for creating and editing medicines.

#### Features

- Create and update modes
- Client-side validation
- Date picker for expiry dates
- Quantity and supplier inputs

## Integration Example

Here's a complete example showing how to integrate all components:

```tsx
'use client';

import React, { useState } from 'react';
import InventoryFilters from './components/inventory/InventoryFilters';
import InventoryTable from './components/inventory/InventoryTable';
import MedicineForm from './components/inventory/MedicineForm';
import { GetInventoryQuery, MedicineResponse } from './lib/api';

export default function InventoryPage() {
  const [filters, setFilters] = useState<GetInventoryQuery>({});
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MedicineResponse | null>(null);

  const handleFiltersChange = (newFilters: GetInventoryQuery) => {
    setFilters(newFilters);
  };

  const handleEdit = (medicine: MedicineResponse) => {
    setEditingMedicine(medicine);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingMedicine(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMedicine(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory Management</h1>
      
      <InventoryFilters
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />
      
      <InventoryTable
        filters={filters}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />

      {showForm && (
        <MedicineForm
          medicine={editingMedicine}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
```

## Filter Query Parameters

The `GetInventoryQuery` interface supports the following parameters:

```typescript
interface GetInventoryQuery {
  page?: number;           // Page number for pagination
  limit?: number;          // Items per page
  search?: string;         // Search term for name, batch number, or supplier
  stockStatus?: 'LOW' | 'NORMAL';  // Filter by stock level
  expiryStatus?: 'EXPIRED' | 'EXPIRING' | 'NORMAL';  // Filter by expiry status
}
```

## Testing

All components have comprehensive unit tests. Run tests with:

```bash
npm test
```

To run tests for a specific component:

```bash
npm test -- InventoryFilters.test.tsx
npm test -- InventoryTable.test.tsx
```

## Styling

All components use Tailwind CSS for styling and are fully responsive. They follow the design system established in the application with:

- Consistent color scheme (blue for primary actions, red for warnings/errors, yellow for cautions)
- Proper spacing and typography
- Accessible form controls
- Mobile-responsive layouts
