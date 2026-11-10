import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

export default function ReportsLoading() {
  return <DashboardSkeleton cardsCount={3} showChart={true} tableRows={8} />;
}
