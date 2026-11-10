import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { EmployeesClient } from "./EmployeesClient";
import { Users } from "lucide-react";

export default async function HREmployeesPage() {
  const session = await getServerSession(authOptions);
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId) {
    redirect("/");
  }

  // Fetch all staff users in this org
  const staffOrgs = await prisma.userOrganization.findMany({
    where: { organizationId },
    include: {
      user: {
        include: { employeeProfile: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const employees = staffOrgs.map(org => ({
    id: org.user.id,
    name: org.user.name,
    email: org.user.email,
    role: org.user.role,
    orgRole: org.role,
    employeeProfile: org.user.employeeProfile
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
          <Users size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            ພະນັກງານ / ແພດ / ຊ່າງ
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
              Staff & Specialists
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">ຈັດການພະນັກງານ, ແພດ, ຊ່າງສ້ອມແປງ, ເງິນເດືອນ ແລະ ສາຂາປະຈຳການ</p>
        </div>
      </div>

      <EmployeesClient initialEmployees={employees as any} />
    </div>
  );
}
