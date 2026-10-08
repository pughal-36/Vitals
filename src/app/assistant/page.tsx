import ScanEntry from "@/components/ScanEntry";
export default async function AssistantEntry({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan } = await searchParams;
  return <ScanEntry destination="assistant" requestedScan={scan} />;
}
