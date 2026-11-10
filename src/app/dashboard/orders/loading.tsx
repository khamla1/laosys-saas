import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

export default function OrdersLoading() {
  return <DashboardSkeleton cardsCount={3} showChart={false} tableRows={5} />;
}
