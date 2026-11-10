import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Mail, Shield, Trash2, CalendarDays } from "lucide-react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { AddStaffModal } from "@/components/AddStaffModal";
import { DeleteStaffButton } from "./DeleteStaffButton";
import { StaffTableClient } from "@/components/StaffTableClient";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  
  if (role === "CASHIER") {
    redirect("/dashboard/pos");
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "la";
  const { dashboard: t } = getDictionary(locale);

  // Fetch staff assigned to this seller's organization
  const organizationId = (session.user as any).organizationId;
  if (!organizationId) {
    redirect("/dashboard");
  }

  const staffOrgs = await prisma.userOrganization.findMany({
    where: { 
      organizationId: organizationId,
      role: {
        not: "OWNER" // Don't show the owner in the staff list
      }
    },
    include: {
      user: true
    },
    orderBy: { createdAt: "desc" }
  });

  const staff = staffOrgs.map(org => ({
    ...org.user,
    orgRole: org.role
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">{t.manageSellersBtn || "ຈັດການພະນັກງານ"}</h2>
          <p className="text-zinc-400 mt-1">
            ສ້າງ ແລະ ຈັດການບັນຊີພະນັກງານຂາຍ (Cashier) ສຳລັບຮ້ານຄ້າຂອງທ່ານ.
          </p>
        </div>
        <AddStaffModal t={t} />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
        <Card className="group relative overflow-hidden bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl ring-1 ring-white/5 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all duration-500">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-500/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-zinc-200">ບັນຊີພະນັກງານ (Staff Accounts)</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <StaffTableClient staff={staff} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
