import prisma from "@/lib/prisma";
import { normalizeLaoPhone } from "@/lib/laoPhone";

export interface StoreCustomerRecord {
  phone: string;          // Canonical normalized phone e.g. "02055558888"
  displayPhone: string;   // Formatted e.g. "020 5555 8888"
  carrierHint: string;    // e.g. "Lao Telecom (M-Phone)"
  name: string;
  address: string;
  email?: string;
  claimedCoupons: string[]; // Uppercase coupon codes claimed by this user in this store
  usedCoupons: string[];    // Uppercase coupon codes already redeemed by this user in this store
  wishlist: string[];       // Product IDs
  points: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "VIP";
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  lastLoginAt: string;
}

const CUSTOMER_KEY_PREFIX = "customer:";

export function getCustomerSettingKey(normalizedPhone: string): string {
  return `${CUSTOMER_KEY_PREFIX}${normalizedPhone}`;
}

export function calculateCustomerTier(totalSpent: number): "BRONZE" | "SILVER" | "GOLD" | "VIP" {
  if (totalSpent >= 5000000) return "VIP";
  if (totalSpent >= 2000000) return "GOLD";
  if (totalSpent >= 500000) return "SILVER";
  return "BRONZE";
}

/**
 * Retrieves or initializes a store customer record strictly isolated to `organizationId`.
 * Automatically aggregates past orders and used coupons for that normalized phone number.
 */
export async function getOrUpsertStoreCustomer(
  organizationId: string,
  rawPhone: string,
  updates?: {
    name?: string;
    address?: string;
    email?: string;
    wishlist?: string[];
  }
): Promise<StoreCustomerRecord> {
  const parsed = normalizeLaoPhone(rawPhone);
  if (!parsed.isValid) {
    throw new Error(parsed.error || "ເບີໂທລະສັບບໍ່ຖືກຕ້ອງ");
  }

  const normalizedPhone = parsed.normalized;
  const settingKey = getCustomerSettingKey(normalizedPhone);

  // 1. Check existing Setting record for this store + phone
  const existingSetting = await prisma.setting.findUnique({
    where: {
      organizationId_key: {
        organizationId,
        key: settingKey,
      },
    },
  });

  let storedData: Partial<StoreCustomerRecord> = {};
  if (existingSetting?.value) {
    try {
      storedData = JSON.parse(existingSetting.value);
    } catch {
      storedData = {};
    }
  }

  // 2. Query past orders in this store to reconcile orderCount, totalSpent, and usedCoupons
  const storeOrders = await prisma.order.findMany({
    where: {
      organizationId,
      customerPhone: { not: null },
    },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      customerAddress: true,
      totalAmount: true,
      status: true,
      couponCode: true,
      metadata: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  let orderCount = 0;
  let totalSpent = 0;
  let latestOrderName = "";
  let latestOrderAddress = "";
  const usedFromOrders = new Set<string>(
    Array.isArray(storedData.usedCoupons)
      ? storedData.usedCoupons.map((c) => String(c).toUpperCase().trim())
      : []
  );

  for (const ord of storeOrders) {
    const ordPhoneParsed = normalizeLaoPhone(ord.customerPhone);
    const isSameCustomer =
      (ordPhoneParsed.isValid && ordPhoneParsed.normalized === normalizedPhone) ||
      (ord.customerPhone || "").replace(/\D/g, "") === normalizedPhone;

    if (!isSameCustomer) continue;

    if (ord.status !== "CANCELLED" && ord.status !== "REFUNDED") {
      orderCount += 1;
      totalSpent += Number(ord.totalAmount) || 0;

      if (ord.couponCode) {
        usedFromOrders.add(String(ord.couponCode).toUpperCase().trim());
      }
      const metaCoupon = (ord.metadata as any)?.couponCode;
      if (metaCoupon) {
        usedFromOrders.add(String(metaCoupon).toUpperCase().trim());
      }
    }

    if (!latestOrderName && ord.customerName) {
      latestOrderName = ord.customerName;
    }
    if (!latestOrderAddress && ord.customerAddress) {
      latestOrderAddress = ord.customerAddress;
    }
  }

  const usedCoupons = Array.from(usedFromOrders);
  const claimedSet = new Set<string>(
    Array.isArray(storedData.claimedCoupons)
      ? storedData.claimedCoupons.map((c) => String(c).toUpperCase().trim())
      : []
  );
  for (const u of usedCoupons) {
    claimedSet.add(u);
  }

  const nowIso = new Date().toISOString();
  const points = Math.floor(totalSpent / 10000);
  const tier = calculateCustomerTier(totalSpent);

  const finalRecord: StoreCustomerRecord = {
    phone: normalizedPhone,
    displayPhone: parsed.formatted,
    carrierHint: parsed.carrierHint,
    name:
      (updates?.name !== undefined ? updates.name.trim() : "") ||
      storedData.name ||
      latestOrderName ||
      `ລູກຄ້າ ${parsed.formatted.slice(-4)}`,
    address:
      (updates?.address !== undefined ? updates.address.trim() : "") ||
      storedData.address ||
      latestOrderAddress ||
      "",
    email: updates?.email ?? storedData.email ?? "",
    claimedCoupons: Array.from(claimedSet),
    usedCoupons,
    wishlist: Array.isArray(updates?.wishlist)
      ? updates!.wishlist
      : Array.isArray(storedData.wishlist)
      ? storedData.wishlist
      : [],
    points,
    tier,
    orderCount,
    totalSpent,
    createdAt: storedData.createdAt || nowIso,
    lastLoginAt: nowIso,
  };

  await prisma.setting.upsert({
    where: {
      organizationId_key: {
        organizationId,
        key: settingKey,
      },
    },
    update: {
      value: JSON.stringify(finalRecord),
    },
    create: {
      organizationId,
      key: settingKey,
      value: JSON.stringify(finalRecord),
    },
  });

  return finalRecord;
}

/**
 * Claims a coupon for a specific customer in a specific store (1 person / 1 time).
 */
export async function claimCouponForCustomer(
  organizationId: string,
  rawPhone: string,
  couponCode: string
): Promise<{
  success: boolean;
  alreadyClaimed?: boolean;
  alreadyUsed?: boolean;
  message: string;
  customer: StoreCustomerRecord;
}> {
  const cleanCode = couponCode.trim().toUpperCase();
  const customer = await getOrUpsertStoreCustomer(organizationId, rawPhone);

  if (customer.usedCoupons.includes(cleanCode)) {
    return {
      success: false,
      alreadyUsed: true,
      message: `ເບີໂທ ${customer.displayPhone} ໄດ້ໃຊ້ສິດຄູປອງ ${cleanCode} ໄປແລ້ວ (ຈຳກັດ 1 ຄົນ / 1 ຄັ້ງ)`,
      customer,
    };
  }

  if (customer.claimedCoupons.includes(cleanCode)) {
    return {
      success: false,
      alreadyClaimed: true,
      message: `ເບີໂທ ${customer.displayPhone} ໄດ້ເກັບຄູປອງ ${cleanCode} ໄວ້ແລ້ວ (ຈຳກັດ 1 ຄົນ / 1 ສິດ)`,
      customer,
    };
  }

  customer.claimedCoupons.push(cleanCode);

  const settingKey = getCustomerSettingKey(customer.phone);
  await prisma.setting.upsert({
    where: {
      organizationId_key: {
        organizationId,
        key: settingKey,
      },
    },
    update: {
      value: JSON.stringify(customer),
    },
    create: {
      organizationId,
      key: settingKey,
      value: JSON.stringify(customer),
    },
  });

  return {
    success: true,
    message: `ເກັບຄູປອງ ${cleanCode} ເຂົ້າບັນຊີ ${customer.displayPhone} ສຳເລັດ!`,
    customer,
  };
}

/**
 * Marks a coupon as used by a customer in a specific store.
 */
export async function markCouponUsedByCustomer(
  organizationId: string,
  rawPhone: string,
  couponCode: string,
  customerInfo?: { name?: string; address?: string }
): Promise<StoreCustomerRecord> {
  const cleanCode = couponCode.trim().toUpperCase();
  const customer = await getOrUpsertStoreCustomer(organizationId, rawPhone, customerInfo);

  if (!customer.claimedCoupons.includes(cleanCode)) {
    customer.claimedCoupons.push(cleanCode);
  }
  if (!customer.usedCoupons.includes(cleanCode)) {
    customer.usedCoupons.push(cleanCode);
  }

  const settingKey = getCustomerSettingKey(customer.phone);
  await prisma.setting.upsert({
    where: {
      organizationId_key: {
        organizationId,
        key: settingKey,
      },
    },
    update: {
      value: JSON.stringify(customer),
    },
    create: {
      organizationId,
      key: settingKey,
      value: JSON.stringify(customer),
    },
  });

  return customer;
}

/**
 * Fetches and merges all customers (both online registered members from `prisma.setting`
 * and order customers from `prisma.order`), isolated per `organizationId` (or across all stores for Admin).
 */
export async function getAllStoreCustomersMerged(options: {
  organizationId?: string;
  isAdmin?: boolean;
}) {
  const { organizationId, isAdmin = false } = options;
  const whereOrg = isAdmin ? {} : { organizationId };

  const [customerSettings, orders] = await Promise.all([
    prisma.setting.findMany({
      where: {
        ...whereOrg,
        key: { startsWith: CUSTOMER_KEY_PREFIX },
      },
    }),
    prisma.order.findMany({
      where: {
        ...whereOrg,
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        customerPhone: { not: null },
      },
      select: {
        id: true,
        customerPhone: true,
        customerName: true,
        customerEmail: true,
        customerAddress: true,
        organizationId: true,
        totalAmount: true,
        couponCode: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const groupedMap = new Map<string, any>();

  // 1. Seed from registered online storefront members
  for (const s of customerSettings) {
    try {
      const data: StoreCustomerRecord = JSON.parse(s.value);
      const parsed = normalizeLaoPhone(data.phone || s.key.replace(CUSTOMER_KEY_PREFIX, ""));
      const normPhone = parsed.isValid ? parsed.normalized : data.phone;
      if (!normPhone) continue;

      const groupKey = `${normPhone}::${s.organizationId}`;
      groupedMap.set(groupKey, {
        id: s.id,
        customerPhone: normPhone,
        displayPhone: parsed.isValid ? parsed.formatted : data.displayPhone || normPhone,
        customerName: data.name || `ລູກຄ້າ ${normPhone.slice(-4)}`,
        customerEmail: data.email || "",
        customerAddress: data.address || "",
        organizationId: s.organizationId,
        isOnlineMember: true,
        claimedCoupons: Array.isArray(data.claimedCoupons) ? data.claimedCoupons : [],
        usedCoupons: Array.isArray(data.usedCoupons) ? data.usedCoupons : [],
        points: data.points || 0,
        tier: data.tier || "BRONZE",
        lastLoginAt: data.lastLoginAt || null,
        _count: { id: 0 },
        _sum: { totalAmount: 0 },
      });
    } catch {
      // ignore malformed JSON
    }
  }

  // 2. Merge orders (normalized by Lao phone + organizationId)
  for (const order of orders) {
    if (!order.customerPhone || order.customerPhone.trim() === "") continue;
    const parsed = normalizeLaoPhone(order.customerPhone);
    const normPhone = parsed.isValid ? parsed.normalized : order.customerPhone.trim();
    const displayPhone = parsed.isValid ? parsed.formatted : order.customerPhone.trim();
    const groupKey = `${normPhone}::${order.organizationId}`;

    if (!groupedMap.has(groupKey)) {
      groupedMap.set(groupKey, {
        id: `${normPhone}-${order.organizationId}`,
        customerPhone: normPhone,
        displayPhone,
        customerName: order.customerName || `ລູກຄ້າ ${normPhone.slice(-4)}`,
        customerEmail: order.customerEmail || "",
        customerAddress: order.customerAddress || "",
        organizationId: order.organizationId,
        isOnlineMember: false,
        claimedCoupons: order.couponCode ? [order.couponCode.toUpperCase()] : [],
        usedCoupons: order.couponCode ? [order.couponCode.toUpperCase()] : [],
        points: 0,
        tier: "BRONZE",
        lastLoginAt: null,
        _count: { id: 0 },
        _sum: { totalAmount: 0 },
      });
    }

    const group = groupedMap.get(groupKey);
    group._count.id += 1;
    group._sum.totalAmount += Number(order.totalAmount) || 0;
    if ((!group.customerName || group.customerName.startsWith("ລູກຄ້າ ")) && order.customerName) {
      group.customerName = order.customerName;
    }
    if (!group.customerAddress && order.customerAddress) {
      group.customerAddress = order.customerAddress;
    }
    if (order.couponCode) {
      const codeUpper = order.couponCode.toUpperCase().trim();
      if (!group.usedCoupons.includes(codeUpper)) {
        group.usedCoupons.push(codeUpper);
      }
      if (!group.claimedCoupons.includes(codeUpper)) {
        group.claimedCoupons.push(codeUpper);
      }
    }
    group.points = Math.floor(group._sum.totalAmount / 10000);
    group.tier = calculateCustomerTier(group._sum.totalAmount);
  }

  let customers = Array.from(groupedMap.values()).sort((a, b) => {
    if (b._sum.totalAmount !== a._sum.totalAmount) {
      return b._sum.totalAmount - a._sum.totalAmount;
    }
    return (b.isOnlineMember ? 1 : 0) - (a.isOnlineMember ? 1 : 0);
  });

  // 3. Attach store names
  const orgIds = [...new Set(customers.map((c) => c.organizationId).filter(Boolean))] as string[];
  if (orgIds.length > 0) {
    const sellers = await prisma.organization.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true },
    });
    const sellerMap = sellers.reduce((acc, seller) => {
      acc[seller.id] = seller.name || "Unknown Store";
      return acc;
    }, {} as Record<string, string>);

    customers = customers.map((c) => ({
      ...c,
      name: c.customerName,
      phone: c.displayPhone || c.customerPhone,
      email: c.customerEmail || "",
      address: c.customerAddress || "",
      orderCount: c._count.id,
      storeName: c.organizationId ? sellerMap[c.organizationId as string] || "Unknown Store" : "Unknown Store",
    }));
  }

  return customers;
}
