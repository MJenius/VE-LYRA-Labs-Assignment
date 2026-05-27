import { SmartDiningApp } from "@/components/SmartDiningApp";

export async function generateStaticParams() {
  // Generate static params for sample table IDs for static export
  return [
    { tableId: "T1" },
    { tableId: "table-1" },
    { tableId: "table-2" },
    { tableId: "table-3" },
    { tableId: "table-4" },
    { tableId: "demo" }
  ];
}

export default async function TablePage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  return <SmartDiningApp tableId={tableId} />;
}
