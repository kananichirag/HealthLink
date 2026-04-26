import PrescriptionDetail from '../../../../../components/prescriptions/PrescriptionDetail';

export default async function PrescriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PrescriptionDetail id={id} />;
}
