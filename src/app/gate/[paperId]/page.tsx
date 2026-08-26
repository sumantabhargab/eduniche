import GateDashboardClient from "./client";

export default async function GatePaperPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  return <GateDashboardClient params={params} />;
}
