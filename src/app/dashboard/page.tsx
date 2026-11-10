import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Package, FileText, Settings, Ticket, Server, Activity, ArrowRight, CreditCard, UserPlus, Trash2, ChefHat, LayoutGrid, ListPlus, Banknote, Warehouse, Globe, HeartHandshake, Utensils, CalendarDays, Map, Timer, Repeat, Clock, Store, Tags, Sparkles, CheckCircle, History } from "lucide-react";
import { AppLauncherGrid, AppLauncherItem } from "@/components/AppLauncherGrid";
import { getActiveModules, hasModule } from "@/lib/modules";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) return redirect("/login");

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "la";
  const { dashboard: t } = getDictionary(locale);

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const isAdmin = role === "ADMIN";

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (isAdmin) {
    const [totalRevenueData, todayRevData, sellersCount, ordersCount] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ["PAID", "COMPLETED", "SHIPPED"] } },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ["PAID", "COMPLETED", "SHIPPED"] }, createdAt: { gte: startOfDay } },
      }),
      prisma.user.count({ where: { role: "SELLER" } }),
      prisma.order.count(),
    ]);

    const totalRev = totalRevenueData._sum.totalAmount || 0;
    const todayRev = todayRevData._sum.totalAmount || 0;

    const adminLauncherItems: AppLauncherItem[] = [
      {
        name: "ຈັດການຮ້ານຄ້າ (Sellers)",
        description: "ດູແລແລະຈັດການຮ້ານຄ້າທັງໝົດໃນລະບົບ",
        href: "/admin/users",
        icon: Users,
        colorClasses: {
          bgGlow: "bg-blue-500/20",
          iconBg: "bg-blue-500/10",
          iconBgHover: "group-hover:bg-blue-500/20",
          iconBorder: "border-blue-500/20",
          iconBorderHover: "group-hover:border-blue-500/40",
          iconColor: "text-blue-400",
          iconColorHover: "group-hover:text-blue-300",
          cardBorderHover: "hover:border-blue-500/50"
        }
      },
      {
        name: "ແພັກເກດ (Packages)",
        description: "ຈັດການແພັກເກດ ແລະ ລາຄາຕ່າງໆ",
        href: "/admin/packages",
        icon: Package,
        colorClasses: {
          bgGlow: "bg-purple-500/20",
          iconBg: "bg-purple-500/10",
          iconBgHover: "group-hover:bg-purple-500/20",
          iconBorder: "border-purple-500/20",
          iconBorderHover: "group-hover:border-purple-500/40",
          iconColor: "text-purple-400",
          iconColorHover: "group-hover:text-purple-300",
          cardBorderHover: "hover:border-purple-500/50"
        }
      },
      {
        name: "ຄຳຂໍເປີດບັນຊີ (Account Requests)",
        description: "ຈັດການຄຳຂໍລົງທະບຽນເປີດຮ້ານຄ້າໃໝ່",
        href: "/admin/requests",
        icon: FileText,
        colorClasses: {
          bgGlow: "bg-cyan-500/20",
          iconBg: "bg-cyan-500/10",
          iconBgHover: "group-hover:bg-cyan-500/20",
          iconBorder: "border-cyan-500/20",
          iconBorderHover: "group-hover:border-cyan-500/40",
          iconColor: "text-cyan-400",
          iconColorHover: "group-hover:text-cyan-300",
          cardBorderHover: "hover:border-cyan-500/50"
        }
      },
      {
        name: "ຄຳຂໍອັບເກຣດ (Requests)",
        description: "ອະນຸມັດຫຼັກຖານການໂອນເງິນຕໍ່ອາຍຸ",
        href: "/admin/subscription-requests",
        icon: Ticket,
        colorClasses: {
          bgGlow: "bg-amber-500/20",
          iconBg: "bg-amber-500/10",
          iconBgHover: "group-hover:bg-amber-500/20",
          iconBorder: "border-amber-500/20",
          iconBorderHover: "group-hover:border-amber-500/40",
          iconColor: "text-amber-400",
          iconColorHover: "group-hover:text-amber-300",
          cardBorderHover: "hover:border-amber-500/50"
        }
      },
      {
        name: "ຕັ້ງຄ່າແພລັດຟອມ (Settings)",
        description: "ຕັ້ງຄ່າບັນຊີຮັບເງິນ ແລະ ລະບົບແພລັດຟອມ",
        href: "/dashboard/settings",
        icon: DollarSign,
        colorClasses: {
          bgGlow: "bg-emerald-500/20",
          iconBg: "bg-emerald-500/10",
          iconBgHover: "group-hover:bg-emerald-500/20",
          iconBorder: "border-emerald-500/20",
          iconBorderHover: "group-hover:border-emerald-500/40",
          iconColor: "text-emerald-400",
          iconColorHover: "group-hover:text-emerald-300",
          cardBorderHover: "hover:border-emerald-500/50"
        }
      },
      {
        name: "ບັນທຶກລະບົບ (System Logs)",
        description: "ກວດສອບການເຄື່ອນໄຫວໃນລະບົບທັງໝົດ",
        href: "/admin/logs",
        icon: Activity,
        colorClasses: {
          bgGlow: "bg-rose-500/20",
          iconBg: "bg-rose-500/10",
          iconBgHover: "group-hover:bg-rose-500/20",
          iconBorder: "border-rose-500/20",
          iconBorderHover: "group-hover:border-rose-500/40",
          iconColor: "text-rose-400",
          iconColorHover: "group-hover:text-rose-300",
          cardBorderHover: "hover:border-rose-500/50"
        }
      },
      {
        name: "ລຶບບັນຊີ (Pending Deletes)",
        description: "ກວດສອບການຮ້ອງຂໍລຶບຮ້ານຄ້າ",
        href: "/admin/pending-deletes",
        icon: Trash2,
        colorClasses: {
          bgGlow: "bg-red-500/20",
          iconBg: "bg-red-500/10",
          iconBgHover: "group-hover:bg-red-500/20",
          iconBorder: "border-red-500/20",
          iconBorderHover: "group-hover:border-red-500/40",
          iconColor: "text-red-400",
          iconColorHover: "group-hover:text-red-300",
          cardBorderHover: "hover:border-red-500/50"
        }
      },
      {
        name: "ລາຍງານ (Reports)",
        description: "ເບິ່ງສະຖິຕິຍອດຂາຍຂອງແພລັດຟອມທັງໝົດ",
        href: "/dashboard/reports",
        icon: Activity,
        colorClasses: {
          bgGlow: "bg-sky-500/20",
          iconBg: "bg-sky-500/10",
          iconBgHover: "group-hover:bg-sky-500/20",
          iconBorder: "border-sky-500/20",
          iconBorderHover: "group-hover:border-sky-500/40",
          iconColor: "text-sky-400",
          iconColorHover: "group-hover:text-sky-300",
          cardBorderHover: "hover:border-sky-500/50"
        }
      },
      {
        name: "ປະຫວັດການແກ້ໄຂ (Audit Logs)",
        description: "ກວດສອບການແກ້ໄຂບິນ, ອໍເດີ, ສິນຄ້າ ແລະ ລາຄາທັງໝົດ",
        href: "/dashboard/audit-logs",
        icon: History,
        colorClasses: {
          bgGlow: "bg-indigo-500/20",
          iconBg: "bg-indigo-500/10",
          iconBgHover: "group-hover:bg-indigo-500/20",
          iconBorder: "border-indigo-500/20",
          iconBorderHover: "group-hover:border-indigo-500/40",
          iconColor: "text-indigo-400",
          iconColorHover: "group-hover:text-indigo-300",
          cardBorderHover: "hover:border-indigo-500/50"
        }
      }
    ];

    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">{t.platformOverview || "Admin Dashboard"}</h2>
          <p className="text-zinc-400 mt-1">ສະຫຼຸບພາບລວມຂອງແພລັດຟອມ ແລະ ການຈັດການລະບົບ</p>
        </div>

        {/* Admin Quick Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-400">ຍອດຂາຍມື້ນີ້</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">₭{todayRev.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-400">ຍອດຂາຍລວມ (Lifetime)</CardTitle>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">₭{totalRev.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-400">ຮ້ານຄ້າທັງໝົດ</CardTitle>
              <Users className="w-4 h-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{sellersCount} ຮ້ານ</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950/50 border-zinc-800/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-400">ອໍເດີລວມ</CardTitle>
              <ShoppingCart className="w-4 h-4 text-sky-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{ordersCount} ອໍເດີ</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin App Launcher */}
        <div>
          <h3 className="text-xl font-bold text-white mt-10 mb-2">ເມນູການຈັດການ (Admin Tools)</h3>
          <AppLauncherGrid items={adminLauncherItems} />
        </div>
      </div>
    );
  }

  // Fetch stats for SELLER / CASHIER
  const organizationId = (session.user as any).organizationId;
  const whereClause = organizationId ? { organizationId } : { organizationId: "__NO_ORG__" };

  const [todayRevData, todayOrdersCount, orgData] = await Promise.all([
    organizationId
      ? prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { ...whereClause, status: { in: ["PAID", "COMPLETED", "SHIPPED"] }, createdAt: { gte: startOfDay } },
        })
      : Promise.resolve({ _sum: { totalAmount: 0 } }),
    organizationId
      ? prisma.order.count({
          where: { ...whereClause, createdAt: { gte: startOfDay } },
        })
      : Promise.resolve(0),
    organizationId
      ? prisma.organization.findUnique({
          where: { id: organizationId },
          select: { businessType: true, enabledModules: true, name: true }
        })
      : Promise.resolve(null)
  ]);

  const todayRev = todayRevData._sum.totalAmount || 0;
  const businessType = orgData?.businessType || "GENERIC";
  const orgModules = orgData?.enabledModules || [];
  const activeModules = getActiveModules(businessType, orgModules);

  const isRestaurant = businessType === "RESTAURANT" || hasModule(activeModules, "RESTAURANT");
  const isSportsClub = businessType === "SPORTS_CLUB" || hasModule(activeModules, "BOOKING") || hasModule(activeModules, "RENTALS");

  let sellerLauncherItems: AppLauncherItem[] = [];
  let suiteBadgeText = "ລະບົບຂາຍໜ້າຮ້ານ & E-Commerce (Smart Retail Suite)";
  let suiteIcon = Store;
  let suiteBadgeStyle = "bg-purple-500/20 text-purple-300 border-purple-500/30";

  if (isRestaurant) {
    suiteBadgeText = "ລະບົບຮ້ານອາຫານ & ຄາເຟ່ຄົບວົງຈອນ (Restaurant Suite)";
    suiteIcon = ChefHat;
    suiteBadgeStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

    sellerLauncherItems = [
      {
        name: "ຂາຍໜ້າຮ້ານ (POS)",
        description: "ເປີດໜ້າຈໍຂາຍສິນຄ້າ ແລະ ສັ່ງອາຫານ",
        href: "/dashboard/pos",
        icon: ShoppingCart,
        colorClasses: {
          bgGlow: "bg-emerald-500/20",
          iconBg: "bg-emerald-500/10",
          iconBgHover: "group-hover:bg-emerald-500/20",
          iconBorder: "border-emerald-500/20",
          iconBorderHover: "group-hover:border-emerald-500/40",
          iconColor: "text-emerald-400",
          iconColorHover: "group-hover:text-emerald-300",
          cardBorderHover: "hover:border-emerald-500/50"
        }
      },
      {
        name: "ຈັດການບິນ (Cashier)",
        description: "ໜ້າຈໍຄິດເງິນ, ພິມໃບເສັດ ແລະ ຈັດການບິນ",
        href: "/dashboard/restaurant/cashier",
        icon: Banknote,
        colorClasses: {
          bgGlow: "bg-green-500/20",
          iconBg: "bg-green-500/10",
          iconBgHover: "group-hover:bg-green-500/20",
          iconBorder: "border-green-500/20",
          iconBorderHover: "group-hover:border-green-500/40",
          iconColor: "text-green-400",
          iconColorHover: "group-hover:text-green-300",
          cardBorderHover: "hover:border-green-500/50"
        }
      },
      {
        name: "ໂຊນ & ໂຕະ (Zones & Tables)",
        description: "ຈັດການໂຊນ, ໂຕະອາຫານ ແລະ QR ປະຈຳໂຕະ",
        href: "/dashboard/restaurant/zones",
        icon: LayoutGrid,
        colorClasses: {
          bgGlow: "bg-blue-500/20",
          iconBg: "bg-blue-500/10",
          iconBgHover: "group-hover:bg-blue-500/20",
          iconBorder: "border-blue-500/20",
          iconBorderHover: "group-hover:border-blue-500/40",
          iconColor: "text-blue-400",
          iconColorHover: "group-hover:text-blue-300",
          cardBorderHover: "hover:border-blue-500/50"
        }
      },
      {
        name: "ໜ້າຈໍຄົວ (Kitchen - KDS)",
        description: "ເບິ່ງອໍເດີໃນຄົວ ແລະ ແຈ້ງສະຖານະອາຫານ",
        href: "/dashboard/restaurant/kitchen",
        icon: ChefHat,
        colorClasses: {
          bgGlow: "bg-orange-500/20",
          iconBg: "bg-orange-500/10",
          iconBgHover: "group-hover:bg-orange-500/20",
          iconBorder: "border-orange-500/20",
          iconBorderHover: "group-hover:border-orange-500/40",
          iconColor: "text-orange-400",
          iconColorHover: "group-hover:text-orange-300",
          cardBorderHover: "hover:border-orange-500/50"
        }
      },
      {
        name: "ເມນູອາຫານ (Menu Items)",
        description: "ເພີ່ມ-ແກ້ໄຂເມນູອາຫານ, ລາຄາ ແລະ ຮູບພາບ",
        href: "/dashboard/products",
        icon: Utensils,
        colorClasses: {
          bgGlow: "bg-indigo-500/20",
          iconBg: "bg-indigo-500/10",
          iconBgHover: "group-hover:bg-indigo-500/20",
          iconBorder: "border-indigo-500/20",
          iconBorderHover: "group-hover:border-indigo-500/40",
          iconColor: "text-indigo-400",
          iconColorHover: "group-hover:text-indigo-300",
          cardBorderHover: "hover:border-indigo-500/50"
        }
      },
      {
        name: "ຕົວເລືອກເພີ່ມ (Modifiers)",
        description: "ຕັ້ງຄ່າຕົວເລືອກເສີມ, ລະດັບຄວາມຫວານ, ທັອບປິ້ງ",
        href: "/dashboard/restaurant/modifiers",
        icon: ListPlus,
        colorClasses: {
          bgGlow: "bg-purple-500/20",
          iconBg: "bg-purple-500/10",
          iconBgHover: "group-hover:bg-purple-500/20",
          iconBorder: "border-purple-500/20",
          iconBorderHover: "group-hover:border-purple-500/40",
          iconColor: "text-purple-400",
          iconColorHover: "group-hover:text-purple-300",
          cardBorderHover: "hover:border-purple-500/50"
        }
      },
      {
        name: "ສູດອາຫານ & ຕົ້ນທຶນ (Recipes)",
        description: "ຄິດໄລ່ຕົ້ນທຶນວັດຖຸດິບ ແລະ ກຳໄລແຕ່ລະເມນູ",
        href: "/dashboard/restaurant/recipes",
        icon: Sparkles,
        colorClasses: {
          bgGlow: "bg-amber-500/20",
          iconBg: "bg-amber-500/10",
          iconBgHover: "group-hover:bg-amber-500/20",
          iconBorder: "border-amber-500/20",
          iconBorderHover: "group-hover:border-amber-500/40",
          iconColor: "text-amber-400",
          iconColorHover: "group-hover:text-amber-300",
          cardBorderHover: "hover:border-amber-500/50"
        }
      },
      {
        name: "ສະຕັອກວັດຖຸດິບ (Inventory)",
        description: "ຈັດການສາງ, ຕັດສະຕັອກ ແລະ ແຈ້ງເຕືອນໃກ້ໝົດ",
        href: "/dashboard/inventory",
        icon: Warehouse,
        colorClasses: {
          bgGlow: "bg-cyan-500/20",
          iconBg: "bg-cyan-500/10",
          iconBgHover: "group-hover:bg-cyan-500/20",
          iconBorder: "border-cyan-500/20",
          iconBorderHover: "group-hover:border-cyan-500/40",
          iconColor: "text-cyan-400",
          iconColorHover: "group-hover:text-cyan-300",
          cardBorderHover: "hover:border-cyan-500/50"
        }
      },
      {
        name: "ປະຫວັດອໍເດີ (All Orders)",
        description: "ກວດສອບປະຫວັດຄຳສັ່ງຊື້ ແລະ ສະຖານະການຈ່າຍ",
        href: "/dashboard/orders",
        icon: FileText,
        colorClasses: {
          bgGlow: "bg-sky-500/20",
          iconBg: "bg-sky-500/10",
          iconBgHover: "group-hover:bg-sky-500/20",
          iconBorder: "border-sky-500/20",
          iconBorderHover: "group-hover:border-sky-500/40",
          iconColor: "text-sky-400",
          iconColorHover: "group-hover:text-sky-300",
          cardBorderHover: "hover:border-sky-500/50"
        }
      },
      {
        name: "ຮ້ານອອນລາຍ (QR Menu)",
        description: "ຈັດການເວັບໄຊທ໌ສັ່ງອາຫານອອນລາຍ",
        href: "/dashboard/ecommerce",
        icon: Globe,
        colorClasses: {
          bgGlow: "bg-fuchsia-500/20",
          iconBg: "bg-fuchsia-500/10",
          iconBgHover: "group-hover:bg-fuchsia-500/20",
          iconBorder: "border-fuchsia-500/20",
          iconBorderHover: "group-hover:border-fuchsia-500/40",
          iconColor: "text-fuchsia-400",
          iconColorHover: "group-hover:text-fuchsia-300",
          cardBorderHover: "hover:border-fuchsia-500/50"
        }
      },
      {
        name: "CRM & ສະມາຊິກ (Loyalty)",
        description: "ລະບົບສະສົມແຕ້ມ, ສ່ວນຫຼຸດ ແລະ ສະມາຊິກ",
        href: "/dashboard/crm",
        icon: HeartHandshake,
        colorClasses: {
          bgGlow: "bg-pink-500/20",
          iconBg: "bg-pink-500/10",
          iconBgHover: "group-hover:bg-pink-500/20",
          iconBorder: "border-pink-500/20",
          iconBorderHover: "group-hover:border-pink-500/40",
          iconColor: "text-pink-400",
          iconColorHover: "group-hover:text-pink-300",
          cardBorderHover: "hover:border-pink-500/50"
        }
      },
      {
        name: "ລູກຄ້າ (Customers)",
        description: "ຖານຂໍ້ມູນລູກຄ້າ ແລະ ປະຫວັດການໃຊ້ຈ່າຍ",
        href: "/dashboard/customers",
        icon: Users,
        colorClasses: {
          bgGlow: "bg-orange-500/20",
          iconBg: "bg-orange-500/10",
          iconBgHover: "group-hover:bg-orange-500/20",
          iconBorder: "border-orange-500/20",
          iconBorderHover: "group-hover:border-orange-500/40",
          iconColor: "text-orange-400",
          iconColorHover: "group-hover:text-orange-300",
          cardBorderHover: "hover:border-orange-500/50"
        }
      },
      {
        name: "ຄູປ໋ອງສ່ວນຫຼຸດ (Coupons)",
        description: "ສ້າງໂປຣໂມຊັ່ນ ແລະ ຄູປ໋ອງສ່ວນຫຼຸດ",
        href: "/dashboard/coupons",
        icon: Ticket,
        colorClasses: {
          bgGlow: "bg-violet-500/20",
          iconBg: "bg-violet-500/10",
          iconBgHover: "group-hover:bg-violet-500/20",
          iconBorder: "border-violet-500/20",
          iconBorderHover: "group-hover:border-violet-500/40",
          iconColor: "text-violet-400",
          iconColorHover: "group-hover:text-violet-300",
          cardBorderHover: "hover:border-violet-500/50"
        }
      },
      {
        name: "ລາຍງານຍອດຂາຍ (Reports)",
        description: "ສະຖິຕິຍອດຂາຍ, ກຳໄລ ແລະ ເມນູຂາຍດີ",
        href: "/dashboard/reports",
        icon: Activity,
        colorClasses: {
          bgGlow: "bg-blue-500/20",
          iconBg: "bg-blue-500/10",
          iconBgHover: "group-hover:bg-blue-500/20",
          iconBorder: "border-blue-500/20",
          iconBorderHover: "group-hover:border-blue-500/40",
          iconColor: "text-blue-400",
          iconColorHover: "group-hover:text-blue-300",
          cardBorderHover: "hover:border-blue-500/50"
        }
      },
      {
        name: "ພະນັກງານ (Staff)",
        description: "ຈັດການຜູ້ໃຊ້, ພະນັກງານເສີບ ແລະ ສິດການເຂົ້າເຖິງ",
        href: "/dashboard/staff",
        icon: UserPlus,
        colorClasses: {
          bgGlow: "bg-teal-500/20",
          iconBg: "bg-teal-500/10",
          iconBgHover: "group-hover:bg-teal-500/20",
          iconBorder: "border-teal-500/20",
          iconBorderHover: "group-hover:border-teal-500/40",
          iconColor: "text-teal-400",
          iconColorHover: "group-hover:text-teal-300",
          cardBorderHover: "hover:border-teal-500/50"
        }
      },
      {
        name: "ຕັ້ງຄ່າຮ້ານ (Settings)",
        description: "ຈັດການຂໍ້ມູນຮ້ານ, ພາສີ, ໃບເສັດ ແລະ ການຈ່າຍເງິນ",
        href: "/dashboard/settings",
        icon: Settings,
        colorClasses: {
          bgGlow: "bg-zinc-500/20",
          iconBg: "bg-zinc-500/10",
          iconBgHover: "group-hover:bg-zinc-500/20",
          iconBorder: "border-zinc-500/20",
          iconBorderHover: "group-hover:border-zinc-500/40",
          iconColor: "text-zinc-400",
          iconColorHover: "group-hover:text-zinc-300",
          cardBorderHover: "hover:border-zinc-500/50"
        }
      },
      {
        name: "ປະຫວັດການແກ້ໄຂ (Audit Logs)",
        description: "ກວດສອບການແກ້ໄຂບິນ, ອໍເດີ, ໂຕະ ແລະ ລາຍການຂໍ້ມູນ",
        href: "/dashboard/audit-logs",
        icon: History,
        colorClasses: {
          bgGlow: "bg-indigo-500/20",
          iconBg: "bg-indigo-500/10",
          iconBgHover: "group-hover:bg-indigo-500/20",
          iconBorder: "border-indigo-500/20",
          iconBorderHover: "group-hover:border-indigo-500/40",
          iconColor: "text-indigo-400",
          iconColorHover: "group-hover:text-indigo-300",
          cardBorderHover: "hover:border-indigo-500/50"
        }
      }
    ];
  } else if (isSportsClub) {
    suiteBadgeText = "ລະບົບຈອງສະໜາມ & ເຊົ່າອຸປະກອນ (Sports & Booking Suite)";
    suiteIcon = CalendarDays;
    suiteBadgeStyle = "bg-blue-500/20 text-blue-300 border-blue-500/30";

    sellerLauncherItems = [
      {
        name: "ຈອງສະໜາມ (Appointments)",
        description: "ຕາຕະລາງຈອງສະໜາມ ແລະ ນັດໝາຍ",
        href: "/dashboard/booking/appointments",
        icon: CalendarDays,
        colorClasses: {
          bgGlow: "bg-blue-500/20",
          iconBg: "bg-blue-500/10",
          iconBgHover: "group-hover:bg-blue-500/20",
          iconBorder: "border-blue-500/20",
          iconBorderHover: "group-hover:border-blue-500/40",
          iconColor: "text-blue-400",
          iconColorHover: "group-hover:text-blue-300",
          cardBorderHover: "hover:border-blue-500/50"
        }
      },
      {
        name: "ສະໜາມ & ຊັບພະຍາກອນ",
        description: "ຈັດການສະໜາມ ແລະ ຄອດກິລາ",
        href: "/dashboard/booking/courts",
        icon: Map,
        colorClasses: {
          bgGlow: "bg-cyan-500/20",
          iconBg: "bg-cyan-500/10",
          iconBgHover: "group-hover:bg-cyan-500/20",
          iconBorder: "border-cyan-500/20",
          iconBorderHover: "group-hover:border-cyan-500/40",
          iconColor: "text-cyan-400",
          iconColorHover: "group-hover:text-cyan-300",
          cardBorderHover: "hover:border-cyan-500/50"
        }
      },
      {
        name: "ເຊົ່າອຸປະກອນ (Equipment)",
        description: "ຈັດການອຸປະກອນໃຫ້ເຊົ່າ",
        href: "/dashboard/rental/equipment",
        icon: Timer,
        colorClasses: {
          bgGlow: "bg-amber-500/20",
          iconBg: "bg-amber-500/10",
          iconBgHover: "group-hover:bg-amber-500/20",
          iconBorder: "border-amber-500/20",
          iconBorderHover: "group-hover:border-amber-500/40",
          iconColor: "text-amber-400",
          iconColorHover: "group-hover:text-amber-300",
          cardBorderHover: "hover:border-amber-500/50"
        }
      },
      {
        name: "ປ່ອຍເຊົ່າ (Issue Rentals)",
        description: "ບັນທຶກການປ່ອຍເຊົ່າ ແລະ ກຳນົດຄືນ",
        href: "/dashboard/rental/issue",
        icon: Repeat,
        colorClasses: {
          bgGlow: "bg-emerald-500/20",
          iconBg: "bg-emerald-500/10",
          iconBgHover: "group-hover:bg-emerald-500/20",
          iconBorder: "border-emerald-500/20",
          iconBorderHover: "group-hover:border-emerald-500/40",
          iconColor: "text-emerald-400",
          iconColorHover: "group-hover:text-emerald-300",
          cardBorderHover: "hover:border-emerald-500/50"
        }
      },
      {
        name: "ລາຍການເກີນກຳນົດ (Overdue)",
        description: "ຕິດຕາມອຸປະກອນທີ່ເກີນກຳນົດຄືນ",
        href: "/dashboard/rental/overdue",
        icon: Clock,
        colorClasses: {
          bgGlow: "bg-red-500/20",
          iconBg: "bg-red-500/10",
          iconBgHover: "group-hover:bg-red-500/20",
          iconBorder: "border-red-500/20",
          iconBorderHover: "group-hover:border-red-500/40",
          iconColor: "text-red-400",
          iconColorHover: "group-hover:text-red-300",
          cardBorderHover: "hover:border-red-500/50"
        }
      },
      {
        name: "ຄ່າປັບໃໝ (Fines)",
        description: "ຈັດການຄ່າປັບໃໝ ແລະ ຄ່າເສຍຫາຍ",
        href: "/dashboard/rental/fines",
        icon: DollarSign,
        colorClasses: {
          bgGlow: "bg-orange-500/20",
          iconBg: "bg-orange-500/10",
          iconBgHover: "group-hover:bg-orange-500/20",
          iconBorder: "border-orange-500/20",
          iconBorderHover: "group-hover:border-orange-500/40",
          iconColor: "text-orange-400",
          iconColorHover: "group-hover:text-orange-300",
          cardBorderHover: "hover:border-orange-500/50"
        }
      },
      {
        name: "ຂາຍໜ້າຮ້ານ (POS)",
        description: "ຂາຍສິນຄ້າ ແລະ ຄິດເງິນໜ້າຮ້ານ",
        href: "/dashboard/pos",
        icon: ShoppingCart,
        colorClasses: {
          bgGlow: "bg-emerald-500/20",
          iconBg: "bg-emerald-500/10",
          iconBgHover: "group-hover:bg-emerald-500/20",
          iconBorder: "border-emerald-500/20",
          iconBorderHover: "group-hover:border-emerald-500/40",
          iconColor: "text-emerald-400",
          iconColorHover: "group-hover:text-emerald-300",
          cardBorderHover: "hover:border-emerald-500/50"
        }
      },
      {
        name: "ສິນຄ້າ & ອຸປະກອນ (Products)",
        description: "ຈັດການລາຍການສິນຄ້າ ແລະ ສະຕັອກ",
        href: "/dashboard/products",
        icon: Package,
        colorClasses: {
          bgGlow: "bg-indigo-500/20",
          iconBg: "bg-indigo-500/10",
          iconBgHover: "group-hover:bg-indigo-500/20",
          iconBorder: "border-indigo-500/20",
          iconBorderHover: "group-hover:border-indigo-500/40",
          iconColor: "text-indigo-400",
          iconColorHover: "group-hover:text-indigo-300",
          cardBorderHover: "hover:border-indigo-500/50"
        }
      },
      {
        name: "ຄັງສິນຄ້າ (Inventory)",
        description: "ຈັດການສະຕັອກ ແລະ ຄັງສາງ",
        href: "/dashboard/inventory",
        icon: Warehouse,
        colorClasses: {
          bgGlow: "bg-teal-500/20",
          iconBg: "bg-teal-500/10",
          iconBgHover: "group-hover:bg-teal-500/20",
          iconBorder: "border-teal-500/20",
          iconBorderHover: "group-hover:border-teal-500/40",
          iconColor: "text-teal-400",
          iconColorHover: "group-hover:text-teal-300",
          cardBorderHover: "hover:border-teal-500/50"
        }
      },
      {
        name: "ປະຫວັດອໍເດີ (Orders)",
        description: "ກວດສອບປະຫວັດຄຳສັ່ງຊື້",
        href: "/dashboard/orders",
        icon: FileText,
        colorClasses: {
          bgGlow: "bg-sky-500/20",
          iconBg: "bg-sky-500/10",
          iconBgHover: "group-hover:bg-sky-500/20",
          iconBorder: "border-sky-500/20",
          iconBorderHover: "group-hover:border-sky-500/40",
          iconColor: "text-sky-400",
          iconColorHover: "group-hover:text-sky-300",
          cardBorderHover: "hover:border-sky-500/50"
        }
      },
      {
        name: "ລູກຄ້າ & ສະມາຊິກ",
        description: "ຖານຂໍ້ມູນລູກຄ້າ ແລະ ສະມາຊິກ",
        href: "/dashboard/customers",
        icon: Users,
        colorClasses: {
          bgGlow: "bg-pink-500/20",
          iconBg: "bg-pink-500/10",
          iconBgHover: "group-hover:bg-pink-500/20",
          iconBorder: "border-pink-500/20",
          iconBorderHover: "group-hover:border-pink-500/40",
          iconColor: "text-pink-400",
          iconColorHover: "group-hover:text-pink-300",
          cardBorderHover: "hover:border-pink-500/50"
        }
      },
      {
        name: "ຄູປ໋ອງສ່ວນຫຼຸດ (Coupons)",
        description: "ສ້າງໂປຣໂມຊັ່ນ ແລະ ສ່ວນຫຼຸດ",
        href: "/dashboard/coupons",
        icon: Ticket,
        colorClasses: {
          bgGlow: "bg-fuchsia-500/20",
          iconBg: "bg-fuchsia-500/10",
          iconBgHover: "group-hover:bg-fuchsia-500/20",
          iconBorder: "border-fuchsia-500/20",
          iconBorderHover: "group-hover:border-fuchsia-500/40",
          iconColor: "text-fuchsia-400",
          iconColorHover: "group-hover:text-fuchsia-300",
          cardBorderHover: "hover:border-fuchsia-500/50"
        }
      },
      {
        name: "ລາຍງານຍອດຂາຍ (Reports)",
        description: "ສະຖິຕິຍອດຂາຍ ແລະ ປະສິດທິພາບ",
        href: "/dashboard/reports",
        icon: Activity,
        colorClasses: {
          bgGlow: "bg-blue-500/20",
          iconBg: "bg-blue-500/10",
          iconBgHover: "group-hover:bg-blue-500/20",
          iconBorder: "border-blue-500/20",
          iconBorderHover: "group-hover:border-blue-500/40",
          iconColor: "text-blue-400",
          iconColorHover: "group-hover:text-blue-300",
          cardBorderHover: "hover:border-blue-500/50"
        }
      },
      {
        name: "ພະນັກງານ (Staff)",
        description: "ຈັດການຜູ້ໃຊ້ ແລະ ສິດການເຂົ້າເຖິງ",
        href: "/dashboard/staff",
        icon: UserPlus,
        colorClasses: {
          bgGlow: "bg-cyan-500/20",
          iconBg: "bg-cyan-500/10",
          iconBgHover: "group-hover:bg-cyan-500/20",
          iconBorder: "border-cyan-500/20",
          iconBorderHover: "group-hover:border-cyan-500/40",
          iconColor: "text-cyan-400",
          iconColorHover: "group-hover:text-cyan-300",
          cardBorderHover: "hover:border-cyan-500/50"
        }
      },
      {
        name: "ຕັ້ງຄ່າຮ້ານ (Settings)",
        description: "ຈັດການຂໍ້ມູນຮ້ານ, ການຊຳລະເງິນ",
        href: "/dashboard/settings",
        icon: Settings,
        colorClasses: {
          bgGlow: "bg-zinc-500/20",
          iconBg: "bg-zinc-500/10",
          iconBgHover: "group-hover:bg-zinc-500/20",
          iconBorder: "border-zinc-500/20",
          iconBorderHover: "group-hover:border-zinc-500/40",
          iconColor: "text-zinc-400",
          iconColorHover: "group-hover:text-zinc-300",
          cardBorderHover: "hover:border-zinc-500/50"
        }
      },
      {
        name: "ປະຫວັດການແກ້ໄຂ (Audit Logs)",
        description: "ກວດສອບການແກ້ໄຂບິນ, ອໍເດີ ແລະ ການປ່ຽນແປງຂໍ້ມູນ",
        href: "/dashboard/audit-logs",
        icon: History,
        colorClasses: {
          bgGlow: "bg-indigo-500/20",
          iconBg: "bg-indigo-500/10",
          iconBgHover: "group-hover:bg-indigo-500/20",
          iconBorder: "border-indigo-500/20",
          iconBorderHover: "group-hover:border-indigo-500/40",
          iconColor: "text-indigo-400",
          iconColorHover: "group-hover:text-indigo-300",
          cardBorderHover: "hover:border-indigo-500/50"
        }
      }
    ];
  } else {
    // RETAIL / SERVICE / GENERIC SUITE
    suiteBadgeText = "ລະບົບຂາຍໜ້າຮ້ານ & E-Commerce (Smart Retail Suite)";
    suiteIcon = Store;
    suiteBadgeStyle = "bg-purple-500/20 text-purple-300 border-purple-500/30";

    sellerLauncherItems = [
      {
        name: "ຂາຍໜ້າຮ້ານ (POS)",
        description: "ເປີດໜ້າຈໍຂາຍສິນຄ້າ ແລະ ຄິດເງິນດ່ວນ",
        href: "/dashboard/pos",
        icon: ShoppingCart,
        colorClasses: {
          bgGlow: "bg-emerald-500/20",
          iconBg: "bg-emerald-500/10",
          iconBgHover: "group-hover:bg-emerald-500/20",
          iconBorder: "border-emerald-500/20",
          iconBorderHover: "group-hover:border-emerald-500/40",
          iconColor: "text-emerald-400",
          iconColorHover: "group-hover:text-emerald-300",
          cardBorderHover: "hover:border-emerald-500/50"
        }
      },
      {
        name: "ສິນຄ້າ & ຕົວເລືອກ (Products)",
        description: "ເພີ່ມ-ແກ້ໄຂສິນຄ້າ, ຕົວເລືອກ ແລະ ສະຕັອກ",
        href: "/dashboard/products",
        icon: Package,
        colorClasses: {
          bgGlow: "bg-indigo-500/20",
          iconBg: "bg-indigo-500/10",
          iconBgHover: "group-hover:bg-indigo-500/20",
          iconBorder: "border-indigo-500/20",
          iconBorderHover: "group-hover:border-indigo-500/40",
          iconColor: "text-indigo-400",
          iconColorHover: "group-hover:text-indigo-300",
          cardBorderHover: "hover:border-indigo-500/50"
        }
      },
      {
        name: "ຄັງສິນຄ້າ (Inventory)",
        description: "ຈັດການສະຕັອກ, ສາງສິນຄ້າ ແລະ ແຈ້ງເຕືອນ",
        href: "/dashboard/inventory",
        icon: Warehouse,
        colorClasses: {
          bgGlow: "bg-blue-500/20",
          iconBg: "bg-blue-500/10",
          iconBgHover: "group-hover:bg-blue-500/20",
          iconBorder: "border-blue-500/20",
          iconBorderHover: "group-hover:border-blue-500/40",
          iconColor: "text-blue-400",
          iconColorHover: "group-hover:text-blue-300",
          cardBorderHover: "hover:border-blue-500/50"
        }
      },
      {
        name: "ໝວດໝູ່ສິນຄ້າ (Categories)",
        description: "ຈັດການໝວດໝູ່ ແລະ ປ້າຍກຳກັບສິນຄ້າ",
        href: "/dashboard/categories",
        icon: Tags,
        colorClasses: {
          bgGlow: "bg-cyan-500/20",
          iconBg: "bg-cyan-500/10",
          iconBgHover: "group-hover:bg-cyan-500/20",
          iconBorder: "border-cyan-500/20",
          iconBorderHover: "group-hover:border-cyan-500/40",
          iconColor: "text-cyan-400",
          iconColorHover: "group-hover:text-cyan-300",
          cardBorderHover: "hover:border-cyan-500/50"
        }
      },
      {
        name: "ປະຫວັດອໍເດີ (Orders)",
        description: "ຈັດການລາຍການສັ່ງຊື້ ແລະ ສະຖານະ",
        href: "/dashboard/orders",
        icon: FileText,
        colorClasses: {
          bgGlow: "bg-sky-500/20",
          iconBg: "bg-sky-500/10",
          iconBgHover: "group-hover:bg-sky-500/20",
          iconBorder: "border-sky-500/20",
          iconBorderHover: "group-hover:border-sky-500/40",
          iconColor: "text-sky-400",
          iconColorHover: "group-hover:text-sky-300",
          cardBorderHover: "hover:border-sky-500/50"
        }
      },
      {
        name: "ຮ້ານອອນລາຍ (Online Store)",
        description: "ຈັດການໜ້າຮ້ານ Ecommerce ແລະ ສັ່ງຊື້",
        href: "/dashboard/ecommerce",
        icon: Globe,
        colorClasses: {
          bgGlow: "bg-purple-500/20",
          iconBg: "bg-purple-500/10",
          iconBgHover: "group-hover:bg-purple-500/20",
          iconBorder: "border-purple-500/20",
          iconBorderHover: "group-hover:border-purple-500/40",
          iconColor: "text-purple-400",
          iconColorHover: "group-hover:text-purple-300",
          cardBorderHover: "hover:border-purple-500/50"
        }
      },
      {
        name: "CRM & ສະມາຊິກ (CRM)",
        description: "ລະບົບສະສົມແຕ້ມ ແລະ ສ່ວນຫຼຸດລູກຄ້າ",
        href: "/dashboard/crm",
        icon: HeartHandshake,
        colorClasses: {
          bgGlow: "bg-pink-500/20",
          iconBg: "bg-pink-500/10",
          iconBgHover: "group-hover:bg-pink-500/20",
          iconBorder: "border-pink-500/20",
          iconBorderHover: "group-hover:border-pink-500/40",
          iconColor: "text-pink-400",
          iconColorHover: "group-hover:text-pink-300",
          cardBorderHover: "hover:border-pink-500/50"
        }
      },
      {
        name: "ລູກຄ້າ (Customers)",
        description: "ຖານຂໍ້ມູນລູກຄ້າ ແລະ ປະຫວັດການຊື້",
        href: "/dashboard/customers",
        icon: Users,
        colorClasses: {
          bgGlow: "bg-orange-500/20",
          iconBg: "bg-orange-500/10",
          iconBgHover: "group-hover:bg-orange-500/20",
          iconBorder: "border-orange-500/20",
          iconBorderHover: "group-hover:border-orange-500/40",
          iconColor: "text-orange-400",
          iconColorHover: "group-hover:text-orange-300",
          cardBorderHover: "hover:border-orange-500/50"
        }
      },
      {
        name: "ຄູປ໋ອງ (Coupons)",
        description: "ສ້າງຄູປ໋ອງສ່ວນຫຼຸດ ແລະ ໂປຣໂມຊັ່ນ",
        href: "/dashboard/coupons",
        icon: Ticket,
        colorClasses: {
          bgGlow: "bg-fuchsia-500/20",
          iconBg: "bg-fuchsia-500/10",
          iconBgHover: "group-hover:bg-fuchsia-500/20",
          iconBorder: "border-fuchsia-500/20",
          iconBorderHover: "group-hover:border-fuchsia-500/40",
          iconColor: "text-fuchsia-400",
          iconColorHover: "group-hover:text-fuchsia-300",
          cardBorderHover: "hover:border-fuchsia-500/50"
        }
      },
      {
        name: "ລາຍງານ (Reports)",
        description: "ເບິ່ງສະຖິຕິ ແລະ ຍອດຂາຍຢ່າງລະອຽດ",
        href: "/dashboard/reports",
        icon: Activity,
        colorClasses: {
          bgGlow: "bg-sky-500/20",
          iconBg: "bg-sky-500/10",
          iconBgHover: "group-hover:bg-sky-500/20",
          iconBorder: "border-sky-500/20",
          iconBorderHover: "group-hover:border-sky-500/40",
          iconColor: "text-sky-400",
          iconColorHover: "group-hover:text-sky-300",
          cardBorderHover: "hover:border-sky-500/50"
        }
      },
      {
        name: "ພະນັກງານ (Staff)",
        description: "ຈັດການຜູ້ໃຊ້ ແລະ ສິດການເຂົ້າເຖິງ",
        href: "/dashboard/staff",
        icon: UserPlus,
        colorClasses: {
          bgGlow: "bg-cyan-500/20",
          iconBg: "bg-cyan-500/10",
          iconBgHover: "group-hover:bg-cyan-500/20",
          iconBorder: "border-cyan-500/20",
          iconBorderHover: "group-hover:border-cyan-500/40",
          iconColor: "text-cyan-400",
          iconColorHover: "group-hover:text-cyan-300",
          cardBorderHover: "hover:border-cyan-500/50"
        }
      },
      {
        name: "ຕັ້ງຄ່າຮ້ານ (Settings)",
        description: "ຈັດການຂໍ້ມູນຮ້ານ, ພາສີ, ການຊຳລະເງິນ",
        href: "/dashboard/settings",
        icon: Settings,
        colorClasses: {
          bgGlow: "bg-zinc-500/20",
          iconBg: "bg-zinc-500/10",
          iconBgHover: "group-hover:bg-zinc-500/20",
          iconBorder: "border-zinc-500/20",
          iconBorderHover: "group-hover:border-zinc-500/40",
          iconColor: "text-zinc-400",
          iconColorHover: "group-hover:text-zinc-300",
          cardBorderHover: "hover:border-zinc-500/50"
        }
      },
      {
        name: "ແພັກເກດ (Billing)",
        description: "ຕໍ່ອາຍຸ, ອັບເກຣດ ແລະ ປະຫວັດການຈ່າຍເງິນ",
        href: "/dashboard/billing",
        icon: CreditCard,
        colorClasses: {
          bgGlow: "bg-amber-500/20",
          iconBg: "bg-amber-500/10",
          iconBgHover: "group-hover:bg-amber-500/20",
          iconBorder: "border-amber-500/20",
          iconBorderHover: "group-hover:border-amber-500/40",
          iconColor: "text-amber-400",
          iconColorHover: "group-hover:text-amber-300",
          cardBorderHover: "hover:border-amber-500/50"
        }
      },
      {
        name: "ປະຫວັດການແກ້ໄຂ (Audit Logs)",
        description: "ກວດສອບການແກ້ໄຂບິນ, ອໍເດີ, ສິນຄ້າ ແລະ ລາຄາທັງໝົດ",
        href: "/dashboard/audit-logs",
        icon: History,
        colorClasses: {
          bgGlow: "bg-indigo-500/20",
          iconBg: "bg-indigo-500/10",
          iconBgHover: "group-hover:bg-indigo-500/20",
          iconBorder: "border-indigo-500/20",
          iconBorderHover: "group-hover:border-indigo-500/40",
          iconColor: "text-indigo-400",
          iconColorHover: "group-hover:text-indigo-300",
          cardBorderHover: "hover:border-indigo-500/50"
        }
      }
    ];
  }

  const SuiteIconComponent = suiteIcon;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Welcome Banner with Suite Badge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-800/60 p-6 rounded-3xl border border-zinc-800 shadow-xl backdrop-blur-xl">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3.5 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 shadow-sm ${suiteBadgeStyle}`}>
              <SuiteIconComponent className="w-3.5 h-3.5" />
              {suiteBadgeText}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              ພ້ອມໃຊ້ງານ 100%
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{orgData?.name || t.storeOverview || "ຍິນດີຕ້ອນຮັບສູ່ຮ້ານຂອງທ່ານ"}</h2>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
            ເລືອກເມນູທີ່ຕ້ອງການໃຊ້ງານດ້າງລຸ່ມນີ້ ເພື່ອຈັດການຮ້ານຄ້າຂອງທ່ານ. ທຸກຟີເຈີໃນໜ້າຫຼັກຖືກອອກແບບໃຫ້ໃຊ້ງານງ່າຍ ແລະ ຮອງຮັບທຸກໜ້າຈໍທັງຄອມພິວເຕີ, ແທັບເລັດ ແລະ ມືຖື.
          </p>
        </div>
      </div>

      {/* Today's Stats Strip */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 via-zinc-900/60 to-emerald-900/10 border-emerald-500/25 backdrop-blur-xl relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg">
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10">
            <DollarSign className="w-14 h-14 sm:w-24 sm:h-24 text-emerald-500" />
          </div>
          <CardHeader className="p-3.5 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-emerald-400 truncate">ຍອດຂາຍມື້ນີ້ (Today&apos;s Revenue)</CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-4xl font-black text-white">₭{todayRev.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 via-zinc-900/60 to-blue-900/10 border-blue-500/25 backdrop-blur-xl relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg">
          <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10">
            <ShoppingCart className="w-14 h-14 sm:w-24 sm:h-24 text-blue-500" />
          </div>
          <CardHeader className="p-3.5 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-400 truncate">ຈຳນວນອໍເດີມື້ນີ້ (Today&apos;s Orders)</CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-4xl font-black text-white">{todayOrdersCount} ລາຍການ</div>
          </CardContent>
        </Card>
      </div>

      {/* Main App Launcher Grid */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xl font-extrabold text-white">ແອັບພລິເຄຊັນ & ເຄື່ອງມືທັງໝົດ (All Applications)</h3>
            <p className="text-xs text-zinc-400 mt-0.5">ຄລິກທີ່ໄອຄອນເພື່ອເຂົ້າໃຊ້ງານລະບົບທີ່ຕ້ອງການ</p>
          </div>
          <div className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 w-fit">
            {sellerLauncherItems.length} ເຄື່ອງມືຄົບຊຸດ (Complete Suite)
          </div>
        </div>
        <AppLauncherGrid items={sellerLauncherItems} />
      </div>

    </div>
  );
}
