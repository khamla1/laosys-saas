import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

export default function POSLoading() {
  return <DashboardSkeleton cardsCount={0} showChart={false} tableRows={12} />;
}
