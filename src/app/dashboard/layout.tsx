import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { OrderNotificationClient } from "@/components/OrderNotificationClient";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarLogoutButton } from "@/components/SidebarLogoutButton";
import { ExitImpersonationButton } from "@/components/ExitImpersonationButton";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Menu, X, AlertTriangle, ChevronLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { AccountStatusWall } from "@/components/AccountStatusWall";
import { getActiveModules } from "@/lib/modules";
import { NotificationBell } from "@/components/NotificationBell";
import { InstallAppButton } from "@/components/InstallAppButton";
import { ConfirmModalProvider } from "@/components/ConfirmModalProvider";
import { ScreenIdBadge } from "@/components/ScreenIdBadge";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "la";
  const dicts = getDictionary(locale);
  const { dashboard: t, sidebar: sidebarDict, logoutModal } = dicts;

  if (!session) {
    redirect("/");
  }

  const role = (session.user as any).role;
  const orgRole = (session.user as any).orgRole;
  const isAdmin = role === "ADMIN";
  const isCashier = role === "CASHIER";
  const userId = (session.user as any).id;

  const sessionOrgId = (session.user as any).organizationId;

  // Fetch fresh user data — status, expiry, image
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      image: true,
      status: true,
      name: true,
      email: true,
    },
  });

  // Fetch fresh org data based on the session's active organizationId
  const org = sessionOrgId ? await prisma.organization.findUnique({
    where: { id: sessionOrgId },
    select: {
      name: true,
      subscriptionExpiresAt: true,
      businessType: true,
      enabledModules: true,
      package: {
        select: {
          enabledModules: true
        }
      }
    }
  }) : null;

  const orgExpiry = org?.subscriptionExpiresAt;
  
  // Calculate active modules
  let activeModules: string[] = [];
  if (org) {
    activeModules = getActiveModules(
      org.businessType,
      org.enabledModules,
      org.package?.enabledModules
    );
  }

  const now = new Date();
  const expiry = orgExpiry ? new Date(orgExpiry) : null;

  // ─── Account wall conditions (Admin is always exempt) ───────
  const isSuspended   = !isAdmin && user?.status === "SUSPENDED";
  const isBlocked     = !isAdmin && user?.status === "BLOCKED";
  const isExpired     = !isAdmin && expiry !== null && expiry < now;

  // Wall type: priority — BLOCKED > SUSPENDED > EXPIRED
  const wallType: "BLOCKED" | "SUSPENDED" | "EXPIRED" | null =
    isBlocked   ? "BLOCKED"   :
    isSuspended ? "SUSPENDED" :
    isExpired   ? "EXPIRED"   :
    null;

  const daysUntilExpiry =
    !isAdmin && expiry ? Math.ceil((expiry.getTime() - now.getTime()) / 86400000) : null;
  const isExpiringSoon = !wallType && daysUntilExpiry !== null && daysUntilExpiry <= 7;

  let pendingSubscriptionCount = 0;
  if (isAdmin) {
    pendingSubscriptionCount = await prisma.subscriptionRequest.count({
      where: { paymentStatus: "PENDING" }
    });
  }

  return (
    <ConfirmModalProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col md:flex-row relative">
        <input type="checkbox" id="sidebar-toggle" className="peer hidden" />

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between gap-1.5 px-2.5 py-2 sm:p-4 border-b border-zinc-800 bg-zinc-900/90 sticky top-0 z-30 backdrop-blur-md safe-area-top">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
          <img src="/logo-v2.svg" alt="LAOSYS Logo" width={48} height={48} fetchPriority="high" decoding="async" className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-2xl drop-shadow-[0_0_12px_rgba(0,242,254,0.3)] shrink-0 hover:scale-105 transition-all duration-300" />
          <h1 className="text-base sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-500 truncate">
            LAOSYS
          </h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <ScreenIdBadge />
          <NotificationBell />
          <label htmlFor="sidebar-toggle" className="p-2 cursor-pointer bg-zinc-800 hover:bg-zinc-700 rounded-lg shrink-0 flex items-center justify-center">
            <Menu size={22} className="text-white" />
          </label>
        </div>
      </div>

      {/* Mobile Overlay */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 bg-black/60 z-40 hidden peer-checked:block md:hidden cursor-pointer"
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-zinc-800 bg-zinc-950 md:bg-zinc-900/50 flex flex-col transform -translate-x-full peer-checked:translate-x-0 md:sticky md:top-0 md:h-screen md:translate-x-0 transition-[width,transform] duration-300 ease-in-out shrink-0 group/sidebar has-[#desktop-sidebar-toggle:checked]:md:w-[84px] overflow-x-hidden">
        <input type="checkbox" id="desktop-sidebar-toggle" className="hidden" />
        
        <div className="px-4 py-5 border-b border-zinc-800 flex justify-between items-center min-h-[80px]">
          <div className="flex items-center gap-2.5 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden min-w-0">
            <img src="/logo-v2.svg" alt="LAOSYS Logo" width={44} height={44} fetchPriority="high" decoding="async" className="w-11 h-11 object-contain rounded-2xl drop-shadow-[0_0_15px_rgba(0,242,254,0.35)] shrink-0 hover:scale-105 transition-all duration-300" />
            <div className="min-w-0 max-w-[160px]">
              <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-500 whitespace-nowrap truncate">
                {org?.name || "LAOSYS"}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5 whitespace-nowrap truncate">
                {isAdmin ? "Admin (Managing Store)" : isCashier ? "Cashier POS" : "Seller Dashboard"}
              </p>
            </div>
          </div>
          <div className="hidden md:block group-has-[#desktop-sidebar-toggle:checked]/sidebar:mx-auto">
            <label htmlFor="desktop-sidebar-toggle" className="p-2 cursor-pointer text-zinc-400 hover:text-white bg-zinc-800/30 hover:bg-zinc-800 rounded-lg flex items-center justify-center transition-all group-has-[#desktop-sidebar-toggle:checked]/sidebar:rotate-180">
              <ChevronLeft size={20} />
            </label>
          </div>
          <label htmlFor="sidebar-toggle" className="md:hidden p-2 -mr-2 cursor-pointer text-zinc-400 hover:text-white">
            <X size={20} />
          </label>
        </div>

        <AppSidebar 
          isAdmin={isAdmin} 
          isCashier={isCashier}
          orgRole={orgRole}
          t={sidebarDict} 
          activeModules={activeModules}
          businessType={org?.businessType || "GENERIC"}
          pendingSubscriptionCount={pendingSubscriptionCount}
        /> 
        <div className="p-4 border-t border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 px-2 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:justify-center">
            {user?.image ? (
              <img src={user.image} alt="Profile" className="w-8 h-8 rounded-full object-cover shadow-sm border border-zinc-700 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                {session.user?.name?.[0] || session.user?.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="text-sm truncate w-32 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden">
              <p className="font-medium whitespace-nowrap">{session.user?.name || "User"}</p>
              <p className="text-xs text-zinc-500 truncate">{session.user?.email}</p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-zinc-800/50 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden space-y-1">
            {isAdmin && org && (
              <ExitImpersonationButton />
            )}
            <SidebarLogoutButton t={logoutModal} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative w-full min-w-0">
        {/* Desktop Sticky Header */}
        {!wallType && (
          <div className="hidden md:flex sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 px-8 py-3 justify-between items-center gap-4">
            <ScreenIdBadge />
            <div className="flex items-center gap-3">
              <InstallAppButton />
              <NotificationBell />
            </div>
          </div>
        )}

        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

        {/* ── Account Status Wall (Suspended / Blocked / Expired) ── */}
        {wallType ? (
          <AccountStatusWall
            type={wallType}
            userName={user?.name || session.user?.name || "User"}
            userEmail={user?.email || session.user?.email || ""}
            expiredAt={expiry?.toISOString() ?? null}
          />
        ) : (
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 relative z-10">

            {/* Expiring Soon Banner */}
            {isExpiringSoon && (
              <div className="mb-6 bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-bold text-sm">
                    ສັນຍາໃກ້ຈະໝົດ — Subscription Expiring Soon
                  </p>
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    ສັນຍາຂອງທ່ານຈະໝົດພາຍໃນ{" "}
                    <span className="font-black text-amber-300">{daysUntilExpiry} ວັນ</span>{" "}
                    ({expiry?.toLocaleDateString("th-TH")}). ກະລຸນາຕິດຕໍ່ Admin ເພື່ອຕໍ່ສັນຍາ.
                  </p>
                </div>
              </div>
            )}
            {children}
          </div>
        )}
      </main>

      <Toaster position="bottom-right" />
      <OrderNotificationClient />
      </div>
    </ConfirmModalProvider>
  );
}
