import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

export default function SettingsLoading() {
  return <DashboardSkeleton cardsCount={2} showChart={false} tableRows={6} />;
}
