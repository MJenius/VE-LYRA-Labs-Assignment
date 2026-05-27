import { SmartDiningApp } from "@/components/SmartDiningApp";

export default async function TablePage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  return <SmartDiningApp tableId={tableId} />;
}
