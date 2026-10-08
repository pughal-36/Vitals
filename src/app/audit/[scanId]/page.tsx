import { redirect } from "next/navigation";

export default async function AuditRedirectPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  redirect(`/?scan=${encodeURIComponent(scanId)}`);
}
