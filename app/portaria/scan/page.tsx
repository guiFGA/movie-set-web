import ScannerContent from "./ScannerContent";

interface GateScannerPageProps {
  searchParams: Promise<{
    event?: string;
  }>;
}

export default async function GateScannerPage({
  searchParams,
}: GateScannerPageProps) {
  const { event } = await searchParams;

  return (
    <ScannerContent
      eventId={event ?? null}
    />
  );
}