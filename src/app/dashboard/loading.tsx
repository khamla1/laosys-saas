import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

export default function DashboardLoading() {
  return <DashboardSkeleton cardsCount={4} showChart={true} tableRows={5} />;
}
