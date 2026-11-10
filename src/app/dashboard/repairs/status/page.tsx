import { redirect } from "next/navigation";

export const metadata = {
  title: "ຕິດຕາມສະຖານະການສ້ອມແປງ | Sports Complex",
};

export default function RepairStatusPage() {
  redirect("/dashboard/repairs/tickets");
}
