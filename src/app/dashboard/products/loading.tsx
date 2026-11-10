import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

export default function ProductsLoading() {
  return <DashboardSkeleton cardsCount={3} showChart={false} tableRows={10} />;
}
