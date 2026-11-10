import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ClockInOutClient } from "./ClockInOutClient";
import { Clock } from "lucide-react";

export default async function ClockInOutPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    redirect("/");
  }

  const employeeProfile = await prisma.employeeProfile.findUnique({
    where: { userId }
  });

  // Fetch today's records for this user
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let todaysRecords: any[] = [];
  if (employeeProfile) {
    todaysRecords = await prisma.attendance.findMany({
      where: {
        employeeId: employeeProfile.id,
        checkIn: { gte: today }
      },
      orderBy: { checkIn: "desc" }
    });
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pt-10">
      <div className="flex flex-col items-center justify-center text-center space-y-4 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
          <Clock size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white mb-2">ລົງເວລາເຂົ້າ-ອອກງານ</h1>
          <p className="text-zinc-400">ກະລຸນາກົດປຸ່ມດ້ານລຸ່ມເພື່ອບັນທຶກເວລາເຂົ້າງານ ຫຼື ອອກງານຂອງທ່ານ</p>
        </div>
      </div>

      {!employeeProfile ? (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
          <p className="text-red-400 font-medium">ຍັງບໍ່ມີຂໍ້ມູນພະນັກງານ (No Employee Profile)</p>
          <p className="text-sm text-red-400/80 mt-1">ກະລຸນາແຈ້ງຜູ້ຈັດການ ຫຼື เจ้าของร้านเพื่่อเพิ่มข้อมูลให้คุณในระบบ HR ก่อนทำการเข้ากะ</p>
        </div>
      ) : (
        <ClockInOutClient records={todaysRecords} />
      )}
    </div>
  );
}
