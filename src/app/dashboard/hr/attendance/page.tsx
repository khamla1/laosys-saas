import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AttendanceClient } from "./AttendanceClient";
import { ClipboardList } from "lucide-react";

export default async function HRAttendancePage() {
  const session = await getServerSession(authOptions);
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId) {
    redirect("/");
  }

  const records = await prisma.attendance.findMany({
    where: {
      employee: { organizationId }
    },
    include: {
      employee: { include: { user: true } }
    },
    orderBy: { checkIn: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <ClipboardList size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">ບັນທຶກການເຂົ້າງານ (Attendance Log)</h1>
          <p className="text-sm text-zinc-400">ປະຫວັດການຕອກບັດເຂົ້າ-ອອກງານຂອງພະນັກງານ</p>
        </div>
      </div>

      <AttendanceClient records={records as any} />
    </div>
  );
}
