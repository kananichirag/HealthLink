import { Metadata } from 'next';
import SaleDetail from '../../../../../components/sales/SaleDetail';
import InvoicePreview from '../../../../../components/sales/InvoicePreview';

export const metadata: Metadata = {
  title: 'Sale Details | Healthcare Platform',
  description: 'View sale details and invoice',
};

interface SaleDetailPageProps {
  params: {
    id: string;
  };
}

export default function SaleDetailPage({ params }: SaleDetailPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Sale Details */}
        <SaleDetail saleId={params.id} />

        {/* Invoice Preview */}
        <InvoicePreview saleId={params.id} />
      </div>
    </div>
  );
}