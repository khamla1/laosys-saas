"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  MessageSquare, LayoutDashboard, Package, ShoppingCart, Users, ClipboardList, BookUser, 
  Settings, Store, Ticket, AlertTriangle, CreditCard, LayoutTemplate, 
  LayoutGrid, ChefHat, ListPlus, CalendarDays, ChevronDown, 
  Utensils, Calculator, Warehouse, UserCog, 
  Shield, Tags, Truck, Gift,
  FileText, History, Target, Ruler, 
  Wrench, Repeat, Timer, Star, Gamepad2, Watch, Activity, Map,
  Crown, SplitSquareHorizontal, TrendingUp, Building, BarChart3, DollarSign, Image, Sparkles,
  PackageOpen, UserPen, TicketPercent, DatabaseZap, BadgePercent, Receipt, Smartphone
} from "lucide-react";

import { hasModule } from "@/lib/modules";
import { getScreenById, getScreenByPath } from "@/lib/screens";

type NavItem = {
  name: string;
  href: string;
  icon: any;
  module?: string;
  badge?: number;
};

type NavGroup = {
  label: string;
  icon: any;
  items: NavItem[];
  defaultOpen?: boolean;
};

function AppSidebarInner({ 
  isAdmin, 
  isCashier,
  orgRole,
  t, 
  activeModules = [],
  businessType = "GENERIC",
  pendingSubscriptionCount = 0
}: { 
  isAdmin: boolean, 
  isCashier?: boolean,
  orgRole?: string | null,
  t: any, 
  activeModules?: string[],
  businessType?: string,
  pendingSubscriptionCount?: number
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track browser window location in client state
  const [currentWinPath, setCurrentWinPath] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentWinPath(window.location.pathname);
    }
  }, [pathname, searchParams]);

  // Robust effective path resolution:
  // Handles standard Next.js routes (/dashboard/customers),
  // Screen ID short URLs (/CRM000001), and query params (?screenId=CRM000001)
  const effectivePath = useMemo(() => {
    let rawPath = pathname || "";

    // If pathname is directly a screenId like /CRM000001 or /DSH000001
    if (rawPath.startsWith("/")) {
      const candidateId = rawPath.replace(/^\//, "").toUpperCase();
      const byId = getScreenById(candidateId);
      if (byId) return byId.path;
    }

    // Check query parameter ?screenId=...
    const queryScreenId = searchParams?.get("screenId");
    if (queryScreenId) {
      const byId = getScreenById(queryScreenId);
      if (byId) return byId.path;
    }

    // Check browser window.location.pathname if available
    if (currentWinPath && currentWinPath.startsWith("/")) {
      const winId = currentWinPath.replace(/^\//, "").toUpperCase();
      const byId = getScreenById(winId);
      if (byId) return byId.path;
    }

    return rawPath.split("?")[0].split("#")[0];
  }, [pathname, searchParams, currentWinPath]);

  // Track open accordion groups with persistence across navigation
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("laosys_sidebar_open_groups");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  const updateOpenGroups = (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => {
    setOpenGroups((prev) => {
      const next = updater(prev);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("laosys_sidebar_open_groups", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const isNavItemActive = (itemHref: string, allHrefsList: string[] = []) => {
    if (!effectivePath) return false;
    const [hrefPath, hrefQuery] = itemHref.split("?");

    if (hrefQuery) {
      const params = new URLSearchParams(hrefQuery);
      let queryMatches = true;
      params.forEach((val, key) => {
        if (key === "screenId") return;
        if (searchParams?.get(key) !== val) {
          queryMatches = false;
        }
      });
      return effectivePath === hrefPath && queryMatches;
    }

    if (itemHref === "/dashboard") {
      return effectivePath === "/dashboard";
    }

    if (itemHref === "/dashboard/pos") {
      return effectivePath === "/dashboard/pos" && !searchParams?.get("action");
    }

    if (effectivePath === itemHref) {
      return true;
    }

    if (effectivePath.startsWith(itemHref + "/")) {
      const hasMoreSpecificItem = allHrefsList.some((otherHref) => {
        if (otherHref === itemHref) return false;
        const [otherPath] = otherHref.split("?");
        return (
          (effectivePath === otherPath || effectivePath.startsWith(otherPath + "/")) &&
          otherPath.length > itemHref.length
        );
      });
      return !hasMoreSpecificItem;
    }

    return false;
  };

  const isGroupOpen = (label: string, defaultOpen: boolean = false, hasActiveChild: boolean = false) => {
    // 1. User manual toggle takes highest precedence
    if (openGroups[label] !== undefined) return openGroups[label];
    // 2. If it contains the active menu item, keep it OPEN
    if (hasActiveChild) return true;
    return defaultOpen;
  };

  // Manual toggle: Toggles only this group, NEVER closes or folds other groups ("ຈົນກວ່າຈະພັບເອງ")
  const toggleGroup = (label: string, defaultOpen: boolean = false, hasActiveChild: boolean = false) => {
    const currentlyOpen = isGroupOpen(label, defaultOpen, hasActiveChild);
    updateOpenGroups(prev => ({ ...prev, [label]: !currentlyOpen }));
  };

  const closeSidebar = () => {
    const checkbox = document.getElementById("sidebar-toggle") as HTMLInputElement;
    if (checkbox) checkbox.checked = false;
  };

  // ─── Top-level quick links (always visible) ───
  const quickLinks: NavItem[] = [
    { name: t?.dashboard || "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  if (activeModules.includes("POS")) {
    quickLinks.push({ name: t?.pointOfSale || "POS", href: "/dashboard/pos", icon: Store });
  }

  quickLinks.push({ name: t?.orders || "Orders", href: "/dashboard/orders", icon: ShoppingCart });

  // ─── Build grouped sections ───
  const menuGroups: NavGroup[] = [];
  const bottomLinks: NavItem[] = [];

  if (isCashier || orgRole === "CASHIER") {
    return (
      <nav className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} suppressHydrationWarning>
        <div className="space-y-1">
          {[
            { name: t?.pointOfSale || "POS", href: "/dashboard/pos", icon: Store },
            { name: t?.orders || "Orders", href: "/dashboard/orders", icon: ShoppingCart },
            { name: t?.clockInOut || "ลงเวลา", href: "/dashboard/attendance", icon: ClipboardList },
          ].map((item) => {
            const cashierHrefs = ["/dashboard/pos", "/dashboard/orders", "/dashboard/attendance"];
            const isActive = isNavItemActive(item.href, cashierHrefs);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} prefetch={false} onClick={closeSidebar}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:justify-center ${
                  isActive 
                    ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-extrabold shadow-lg shadow-blue-600/40 border border-blue-400/60 ring-1 ring-blue-400/30" 
                    : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white font-medium"
                }`} suppressHydrationWarning>
                {isActive && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee,0_0_20px_#06b6d4]" />
                )}
                <Icon size={17} className={`shrink-0 transition-all duration-200 ${isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ml-0.5" : "text-zinc-400 group-hover:text-zinc-200"}`} />
                <span className={`text-sm group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden flex-1 truncate ${isActive ? "text-white font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : ""}`}>{item.name}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] shrink-0 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  if (orgRole === "KITCHEN") {
    return (
      <nav className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} suppressHydrationWarning>
        <div className="space-y-1">
          <Link href="/dashboard/restaurant/kitchen" prefetch={false} onClick={closeSidebar}
            className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-extrabold shadow-lg shadow-blue-600/40 border border-blue-400/60 ring-1 ring-blue-400/30" suppressHydrationWarning>
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee,0_0_20px_#06b6d4]" />
            <ChefHat size={17} className="shrink-0 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ml-0.5" />
            <span className="text-sm font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden">{t?.kitchenDisplay || "Kitchen Display"}</span>
            <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] shrink-0 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden animate-pulse" />
          </Link>
        </div>
      </nav>
    );
  }

  if (orgRole === "ACCOUNTANT") {
    menuGroups.push({
      label: t?.accountingGroup || "ບັນຊີ",
      icon: Calculator,
      items: [
        { name: t?.chartOfAccounts || "ຜັງບັນຊີ", href: "/dashboard/accounting/chart-of-accounts", icon: BookUser },
        { name: t?.journals || "ບັນທຶກປະຈຳວັນ", href: "/dashboard/accounting/journals", icon: ClipboardList },
        { name: t?.invoices || "ໃບແຈ້ງໜີ້", href: "/dashboard/accounting/invoices", icon: Ticket },
      ]
    });
    quickLinks.push({ name: t?.reports || "ລາຍງານ", href: "/dashboard/reports", icon: ClipboardList });
  } else {
    // ─── 1. POS & ຂາຍໜ້າຮ້ານ ───
    const posItems: NavItem[] = [];
    if (hasModule(activeModules, "POS")) {
      posItems.push(
        { name: "ຈັດການບິນ & ແຄດເຊຍ (Cashier)", href: "/dashboard/restaurant/cashier", icon: Receipt }
      );
    }
    if (hasModule(activeModules, "RESTAURANT")) {
      posItems.push(
        { name: "ໂຊນ & ໂຕ໊ະ (Zones)", href: "/dashboard/restaurant/zones", icon: LayoutGrid },
        { name: "ຄົວ (Kitchen Display)", href: "/dashboard/restaurant/kitchen", icon: ChefHat },
        { name: "ຕົວເລືອກເພີ່ມ (Modifiers)", href: "/dashboard/restaurant/modifiers", icon: ListPlus },
        { name: "ຄັງວັດຖຸດິບ (Recipe Costing)", href: "/dashboard/restaurant/recipes", icon: Utensils }
      );
    }
    if (posItems.length > 0) {
      menuGroups.push({
        label: "POS & ຂາຍໜ້າຮ້ານ",
        icon: Store,
        defaultOpen: false,
        items: posItems
      });
    }

    // ─── 2. ຄັງສິນຄ້າ & ສະຕັອກ ───
    const inventoryItems: NavItem[] = [];
    if (hasModule(activeModules, "INVENTORY")) {
      inventoryItems.push(
        { name: "ສິນຄ້າ (Products)", href: "/dashboard/products", icon: Package },
        { name: "ໝວດໝູ່ສິນຄ້າ (Categories)", href: "/dashboard/categories", icon: Tags },
        { name: "ຄັງສິນຄ້າ & ສະຕັອກ (Inventory)", href: "/dashboard/inventory", icon: Warehouse }
      );
    }
    if (hasModule(activeModules, "CONSIGNMENT")) {
      inventoryItems.push(
        { name: "ສາງສິນຄ້າມືສອງ", href: "/dashboard/tradein/inventory", icon: Repeat }
      );
    }
    if (inventoryItems.length > 0) {
      menuGroups.push({
        label: "ຄັງສິນຄ້າ & ສະຕັອກ",
        icon: Warehouse,
        defaultOpen: false,
        items: inventoryItems
      });
    }

    // ─── 3. ຮ້ານອອນລາຍ & ຂົນສົ່ງ ───
    if (hasModule(activeModules, "ECOMMERCE")) {
      menuGroups.push({
        label: "ຮ້ານອອນລາຍ & ຂົນສົ່ງ",
        icon: LayoutTemplate,
        defaultOpen: false,
        items: [
          { name: "ຮ້ານຄ້າອອນລາຍ (Storefront)", href: "/dashboard/settings/storefront", icon: LayoutTemplate },
          { name: "ຈັດການອໍເດີອອນລາຍ", href: "/dashboard/orders/online", icon: ShoppingCart },
          { name: "ເຊື່ອຕໍ່ຂົນສົ່ງ (Logistics)", href: "/dashboard/shipping", icon: Truck }
        ]
      });
    }

    // ─── 4. ບໍລິການ & ການຈອງ ───
    const serviceItems: NavItem[] = [];
    if (hasModule(activeModules, "BOOKING")) {
      serviceItems.push(
        { name: "ປະຕິທິນຈອງນັດໝາຍ", href: "/dashboard/booking/appointments", icon: CalendarDays },
        { name: "ຈັດການສະໜາມ ແລະ ຄອດ", href: "/dashboard/facilities/book", icon: Map }
      );
    }
    if (hasModule(activeModules, "COACHING")) {
      serviceItems.push({ name: "ຫ້ອງຮຽນ / ໂຄດຊິ້ງ", href: "/dashboard/coaching/classes", icon: Target });
    }
    if (hasModule(activeModules, "FITTING")) {
      serviceItems.push({ name: "ບໍລິການຟິດຕິ້ງ (Size)", href: "/dashboard/fitting/measure", icon: Ruler });
    }
    if (hasModule(activeModules, "RENTALS")) {
      serviceItems.push({ name: "ລະບົບເຊົ່າອຸປະກອນ", href: "/dashboard/rental/equipment", icon: Timer });
    }
    if (hasModule(activeModules, "REPAIRS")) {
      serviceItems.push(
        { name: "ສູນສ້ອມແປງອຸປະກອນ", href: "/dashboard/repairs/tickets", icon: Wrench },
        { name: "ລະບົບຮັບປະກັນສິນຄ້າ", href: "/dashboard/repairs/warranty", icon: Shield }
      );
    }
    if (hasModule(activeModules, "BOOKING")) {
      serviceItems.push(
        { name: "ປະຫວັດການປິ່ນປົວ (Clinic)", href: "/dashboard/clinic/history", icon: Activity },
        { name: "ອອກໃບຮັບຮອງແພດ", href: "/dashboard/clinic/certificates", icon: FileText }
      );
    }
    if (hasModule(activeModules, "TECH")) {
      serviceItems.push({ name: "ອຸປະກອນອັດສະລິຍະ", href: "/dashboard/tech/sync", icon: Watch });
    }
    if (serviceItems.length > 0) {
      menuGroups.push({
        label: "ບໍລິການ & ການຈອງ",
        icon: CalendarDays,
        defaultOpen: false,
        items: serviceItems
      });
    }

    // ─── 5. ການຕະຫຼາດ & CRM ───
    const crmItems: NavItem[] = [
      { name: "ລູກຄ້າ (Customers)", href: "/dashboard/customers", icon: Users },
      { name: "ລະບົບສະມາຊິກ & ແຕ້ມ", href: "/dashboard/customers/loyalty", icon: Gift },
      { name: "ໂປຣໂມຊັ່ນ & ຄູປອງ (Marketing)", href: "/dashboard/marketing/promotions", icon: BadgePercent },
    ];
    if (hasModule(activeModules, "AMBASSADORS")) {
      crmItems.push({ name: "ຈັດການຕົວແທນຈຳໜ່າຍ", href: "/dashboard/ambassadors/athletes", icon: Star });
    }
    if (hasModule(activeModules, "COMMUNITY")) {
      crmItems.push({ name: "ຄອມມູນິຕີ້", href: "/dashboard/community/members", icon: Users });
    }
    if (hasModule(activeModules, "TEAM")) {
      crmItems.push({ name: "ຊຸມລົມ & ທີມ", href: "/dashboard/community/events", icon: Gamepad2 });
    }
    menuGroups.push({
      label: "ການຕະຫຼາດ & CRM",
      icon: Crown,
      defaultOpen: false,
      items: crmItems
    });

    // ─── 6. ລາຍງານ & ການເງິນ ───
    menuGroups.push({
      label: "ລາຍງານ & ການເງິນ",
      icon: BarChart3,
      defaultOpen: false,
      items: [
        { name: "ລາຍງານຍອດຂາຍ & ກຳໄລ", href: "/dashboard/reports/sales", icon: BarChart3 },
        { name: "ສິນຄ້າຂາຍດີ", href: "/dashboard/reports/trending", icon: TrendingUp },
        { name: "ລະບົບບັນຊີ / ລາຍການຊື້", href: "/dashboard/accounting/purchases", icon: DollarSign },
        { name: "ອອກໃບສະເໜີລາຄາ", href: "/dashboard/accounting/quotations", icon: FileText },
        { name: "ລະບົບຜ່ອນຊຳລະ", href: "/dashboard/accounting/installments", icon: CreditCard },
        { name: "ຄິດໄລ່ຄອມມິດຊັ່ນ", href: "/dashboard/accounting/commissions", icon: Calculator },
      ]
    });

    // ─── 7. ຈັດການຫຼັງບ້ານ ───
    menuGroups.push({
      label: "ຈັດການຫຼັງບ້ານ",
      icon: UserCog,
      defaultOpen: false,
      items: [
        { name: "ພະນັກງານ / ແພດ / ຊ່າງ", href: "/dashboard/hr/employees", icon: UserCog },
        { name: "ຈັດການສາຂາ", href: "/dashboard/settings/branches", icon: Building },
        { name: "ຮູບພາບ / ສື່ອຸປະກອນ", href: "/dashboard/media/gallery", icon: Image },
        { name: "API & ແອັບມືຖື", href: "/dashboard/settings/api-hub", icon: Smartphone },
        { name: "ປະຫວັດການແກ້ໄຂ (Audit Logs)", href: "/dashboard/audit-logs", icon: History },
      ]
    });

    // ─── 8. ຈັດການຂໍ້ມູນ (Data Editor) ───
    if (isAdmin || hasModule(activeModules, "DATA_EDITOR" as any)) {
      menuGroups.push({
        label: "ຈັດການຂໍ້ມູນ (Data Editor)",
        icon: DatabaseZap,
        defaultOpen: false,
        items: [
          { name: "ແກ້ໄຂອໍເດີ / ໃບບິນ", href: "/dashboard/data-editor/orders", icon: ClipboardList },
          { name: "ແກ້ໄຂສິນຄ້າ / ລາຄາ", href: "/dashboard/data-editor/products", icon: PackageOpen },
          { name: "ແກ້ໄຂຂໍ້ມູນຄັງສິນຄ້າ", href: "/dashboard/data-editor/stock", icon: Warehouse },
          { name: "ແກ້ໄຂຂໍ້ມູນລູກຄ້າ", href: "/dashboard/data-editor/customers", icon: UserPen },
          { name: "ແກ້ໄຂຄູປອງ / ໂປຣໂມຊັ່ນ", href: "/dashboard/data-editor/coupons", icon: TicketPercent },
          { name: "ແກ້ໄຂທຸລະກຳການເງິນ", href: "/dashboard/data-editor/transactions", icon: DollarSign },
          { name: "ແກ້ໄຂຂໍ້ມູນຜູ້ສະໜອງ", href: "/dashboard/data-editor/suppliers", icon: Truck },
          { name: "ປະຫວັດການແກ້ໄຂ (Audit Logs)", href: "/dashboard/audit-logs", icon: History },
        ]
      });
    }

    bottomLinks.push({ name: "ການຕັ້ງຄ່າຮ້ານຄ້າ", href: "/dashboard/settings", icon: Settings });
  }

  // 🛡️ 9. ຜູ້ເບິ່ງແຍງລະບົບ (Admin)
  if (isAdmin) {
    menuGroups.push({
      label: t?.adminGroup || "ບໍລິຫານ",
      icon: Shield,
      defaultOpen: false,
      items: [
        { name: t?.manageSellers || "ຜູ້ຂາຍ", href: "/admin/users", icon: Users },
        { name: t?.accountRequests || "ຄຳຂໍເປີດຮ້ານ", href: "/admin/requests", icon: ClipboardList },
        { name: t?.subscriptionRequests || "ຄຳຂໍແພັກເກັດ", href: "/admin/subscription-requests", icon: ClipboardList, badge: pendingSubscriptionCount },
        { name: t?.packages || "ແພັກເກັດ", href: "/admin/packages", icon: Package },
        { name: "ໜ້າຮ້ານອອນລາຍ", href: "/admin/storefronts", icon: LayoutTemplate },
        { name: "API & Mobile App Hub", href: "/admin/api-docs", icon: Smartphone },
        { name: "Discord Webhooks", href: "/admin/discord", icon: MessageSquare },
        { name: "ສຳຮອງ & ກູ້ຄືນຂໍ້ມູນ (Backups)", href: "/admin/backups", icon: DatabaseZap },
        { name: t?.pendingDeletes || "ລໍຖ້າລົບ", href: "/admin/pending-deletes", icon: AlertTriangle },
        { name: t?.auditLogs || "Audit Logs", href: "/admin/logs", icon: ClipboardList },
      ],
    });
  }

  const allHrefsList = [
    ...quickLinks,
    ...menuGroups.flatMap((g) => g.items),
    ...bottomLinks,
  ].map((item) => item.href);

  // ─── Ensure parent group stays open when navigating to any item ("ໄມໄຫ້ພັບກັບດ້ວຍ ຈົນກວ່າຈະພັບເອງ") ───
  useEffect(() => {
    if (!effectivePath) return;

    // Check which group currently has the active route
    const activeGroup = menuGroups.find((g) =>
      g.items.some((item) => isNavItemActive(item.href, allHrefsList))
    );

    if (activeGroup) {
      // Ensure active group is opened, and KEEP all other currently opened groups open!
      updateOpenGroups((prev) => {
        if (prev[activeGroup.label] === true) return prev;
        return {
          ...prev,
          [activeGroup.label]: true,
        };
      });
    }
  }, [effectivePath]);

  return (
    <nav className="flex-1 overflow-y-auto p-2 pb-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} suppressHydrationWarning>
      {/* ── Quick Links ── */}
      <div className="space-y-1 mb-2">
        {quickLinks.map((item) => {
          const isActive = isNavItemActive(item.href, allHrefsList);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} prefetch={false} onClick={closeSidebar}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:justify-center ${
                isActive 
                  ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-extrabold shadow-lg shadow-blue-600/40 border border-blue-400/60 ring-1 ring-blue-400/30" 
                  : "text-zinc-400 hover:bg-zinc-800/70 hover:text-white font-medium"
              }`} suppressHydrationWarning>
              {isActive && (
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee,0_0_20px_#06b6d4]" />
              )}
              <Icon size={17} className={`shrink-0 transition-all duration-200 ${isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ml-0.5" : "text-zinc-400 group-hover:text-zinc-200"}`} />
              <span className={`text-sm group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden flex-1 truncate ${isActive ? "text-white font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : ""}`}>{item.name}</span>
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] shrink-0 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="h-px bg-zinc-800/60 mx-2 mb-2" />

      {/* ── Accordion Groups ── */}
      <div className="space-y-1">
        {menuGroups.map((group) => {
          const hasActiveChild = group.items.some((item) =>
            isNavItemActive(item.href, allHrefsList)
          );
          const isOpen = isGroupOpen(group.label, group.defaultOpen, hasActiveChild);
          const GroupIcon = group.icon;

          return (
            <div key={group.label} className="my-0.5">
              <button
                type="button"
                onClick={() => toggleGroup(group.label, group.defaultOpen, hasActiveChild)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] tracking-wide transition-all duration-200 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden ${
                  hasActiveChild 
                    ? "text-blue-200 font-black bg-gradient-to-r from-blue-950/80 via-blue-900/40 to-zinc-900 border-2 border-blue-500/70 shadow-[0_0_18px_rgba(59,130,246,0.35)]" 
                    : isOpen
                    ? "text-zinc-200 font-bold bg-zinc-900/90 border border-zinc-800"
                    : "text-zinc-400 font-semibold hover:text-zinc-100 hover:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GroupIcon size={16} className={`shrink-0 transition-all duration-200 ${hasActiveChild ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : isOpen ? "text-zinc-300" : "text-zinc-500"}`} />
                  <span className="truncate">{group.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasActiveChild && (
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                      <span>Active</span>
                    </span>
                  )}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "" : "-rotate-90"} ${hasActiveChild ? "text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]" : "text-zinc-500"}`} />
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[2000px] opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                <div className={`ml-2 pl-2.5 border-l-2 space-y-1 pb-2 pt-0.5 transition-colors duration-300 ${hasActiveChild ? "border-l-blue-500 shadow-[-2px_0_12px_rgba(59,130,246,0.4)]" : "border-zinc-800/60"}`}>
                  {group.items.map((item) => {
                    const isActive = isNavItemActive(item.href, allHrefsList);
                    const Icon = item.icon;

                    return (
                      <Link key={item.href} href={item.href} prefetch={false} onClick={closeSidebar}
                        className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:justify-center text-[13px] ${
                          isActive 
                            ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-extrabold shadow-lg shadow-blue-600/40 border border-blue-400/60 ring-1 ring-blue-400/30" 
                            : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100 font-medium"
                        }`} suppressHydrationWarning>
                        {isActive && (
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee,0_0_20px_#06b6d4]" />
                        )}
                        <Icon size={16} className={`shrink-0 transition-all duration-200 ${isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ml-0.5" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                        <span className={`group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden flex-1 truncate ${isActive ? "text-white font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : ""}`}>{item.name}</span>
                        {item.badge && item.badge > 0 ? (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden shadow-sm shadow-red-500/50">
                            {item.badge}
                          </span>
                        ) : isActive ? (
                          <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] shrink-0 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden animate-pulse" />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* ── Bottom Quick Links ── */}
      {bottomLinks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-800/50 space-y-1">
          {bottomLinks.map((item) => {
            const isActive = isNavItemActive(item.href, allHrefsList);
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} prefetch={false} onClick={closeSidebar}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:justify-center ${
                  isActive 
                    ? "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-extrabold shadow-lg shadow-blue-600/40 border border-blue-400/60 ring-1 ring-blue-400/30" 
                    : "text-zinc-400 hover:bg-zinc-800/70 hover:text-white font-medium"
                }`} suppressHydrationWarning>
                {isActive && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee,0_0_20px_#06b6d4]" />
                )}
                <Icon size={17} className={`shrink-0 transition-all duration-200 ${isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ml-0.5" : "text-zinc-400 group-hover:text-zinc-200"}`} />
                <span className={`text-sm group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden flex-1 truncate ${isActive ? "text-white font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : ""}`}>{item.name}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] shrink-0 group-has-[#desktop-sidebar-toggle:checked]/sidebar:md:hidden animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

export function AppSidebar(props: React.ComponentProps<typeof AppSidebarInner>) {
  return (
    <Suspense fallback={<div className="flex-1 p-4 space-y-3"><div className="h-8 bg-zinc-800/40 rounded-xl animate-pulse" /><div className="h-8 bg-zinc-800/40 rounded-xl animate-pulse" /><div className="h-8 bg-zinc-800/40 rounded-xl animate-pulse" /></div>}>
      <AppSidebarInner {...props} />
    </Suspense>
  );
}
