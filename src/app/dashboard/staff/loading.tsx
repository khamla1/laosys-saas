import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

export default function StaffLoading() {
  return <DashboardSkeleton cardsCount={3} showChart={false} tableRows={6} />;
}
