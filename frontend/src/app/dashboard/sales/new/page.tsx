import { Metadata } from 'next';
import CreateSaleForm from '../../../../../components/sales/CreateSaleForm';

export const metadata: Metadata = {
  title: 'Create Sale | Healthcare Platform',
  description: 'Create a new sale transaction',
};

export default function CreateSalePage() {
  return <CreateSaleForm />;
}