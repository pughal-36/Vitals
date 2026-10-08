import ScanEntry from "@/components/ScanEntry";
export default async function ReadoutEntry({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan } = await searchParams;
  return <ScanEntry destination="readout" requestedScan={scan} />;
}
