import { Metadata } from 'next';
import SalesList from '../../../../components/sales/SalesList';

export const metadata: Metadata = {
  title: 'Sales | Healthcare Platform',
  description: 'View and manage sales transactions',
};

export default function SalesPage() {
  return <SalesList />;
}