import { SmartDiningApp } from "@/components/SmartDiningApp";

export const metadata = {
  title: "Zara Smart Dining Assistant",
  description: "AI-first, multi-agent smart dining assistant with RAG recommendations and shared table ordering."
};

export default function HomePage() {
  // Render the demo table directly on home page
  return <SmartDiningApp tableId="T1" />;
}
