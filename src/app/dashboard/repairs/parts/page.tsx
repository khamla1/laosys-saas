import { redirect } from "next/navigation";

export const metadata = {
  title: "ລາຍການອາໄຫຼ່ & ຊິ້ນສ່ວນ | Sports Complex",
};

export default function RepairPartsPage() {
  redirect("/dashboard/repairs/tickets");
}
