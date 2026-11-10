import { redirect } from "next/navigation";

export default async function StockHistoryRedirectPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  redirect(`/dashboard/products/${id}?tab=stock`);
}
