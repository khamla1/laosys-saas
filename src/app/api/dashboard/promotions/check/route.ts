import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const queryCode = (searchParams.get("code") || "").trim().toUpperCase();

    if (!queryCode) {
      return NextResponse.json({ error: "ກະລຸນາປ້ອນລະຫັດທີ່ຕ້ອງການກວດສອບ" }, { status: 400 });
    }

    const now = new Date();

    // 1. Search in Promotions
    const promotions = await prisma.promotion.findMany({
      where: {
        organizationId,
        OR: [
          { code: queryCode },
          { name: { equals: queryCode, mode: "insensitive" } },
        ],
      },
    });

    if (promotions.length > 0) {
      const p = promotions[0];
      const startDate = p.startDate ? new Date(p.startDate) : null;
      const endDate = p.endDate ? new Date(p.endDate) : null;

      const isStarted = !startDate || startDate <= now;
      const isExpired = Boolean(endDate && endDate < now);
      const isActive = p.status === "ACTIVE";

      let valid = false;
      let reason = "";

      if (!isActive) {
        reason = "ແຄມເປນນີ້ຖືກປິດໃຊ້ງານຊົ່ວຄາວ (Inactive)";
      } else if (!isStarted) {
        reason = `ແຄມເປນນີ້ຍັງບໍ່ທັນຮອດກຳນົດເລີ່ມ (ຈະເລີ່ມວັນທີ ${startDate?.toISOString().slice(0, 10)})`;
      } else if (isExpired) {
        reason = `ແຄມເປນນີ້ໝົດອາຍຸແລ້ວ (ໝົດອາຍຸວັນທີ ${endDate?.toISOString().slice(0, 10)})`;
      } else {
        valid = true;
        reason = "ແຄມເປນນີ້ພ້ອມໃຊ້ງານໄດ້ປົກກະຕິ (Valid & Active)";
      }

      let daysRemaining: number | null = null;
      if (endDate && endDate >= now) {
        daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      return NextResponse.json({
        found: true,
        valid,
        kind: "PROMOTION",
        id: p.id,
        name: p.name,
        code: (p as any).code || p.name,
        discountValue: p.discountValue,
        type: p.type,
        status: p.status,
        reason,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        daysRemaining,
        applicableProductIds: (p as any).applicableProductIds || [],
      });
    }

    // 2. Fallback: Search in Coupons
    const coupon = await prisma.coupon.findFirst({
      where: {
        organizationId,
        code: queryCode,
      },
    });

    if (coupon) {
      const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt) : null;
      const isExpired = Boolean(expiresAt && expiresAt < now);
      const isUsageExceeded = Boolean(coupon.maxUsage && coupon.usageCount >= coupon.maxUsage);
      const isActive = coupon.isActive;

      let valid = false;
      let reason = "";

      if (!isActive) {
        reason = "ລະຫັດຄູປອງນີ້ຖືກປິດໃຊ້ງານ (Inactive)";
      } else if (isExpired) {
        reason = `ລະຫັດຄູປອງນີ້ໝົດອາຍຸແລ້ວ (ໝົດອາຍຸ ${expiresAt?.toISOString().slice(0, 10)})`;
      } else if (isUsageExceeded) {
        reason = `ລະຫັດຄູປອງນີ້ຖືກໃຊ້ຄົບຈຳນວນສູງສຸດແລ້ວ (${coupon.usageCount}/${coupon.maxUsage} ຄັ້ງ)`;
      } else {
        valid = true;
        reason = "ລະຫັດຄູປອງພ້ອມໃຊ້ງານໄດ້ທັນທີ (Valid & Active)";
      }

      let daysRemaining: number | null = null;
      if (expiresAt && expiresAt >= now) {
        daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      return NextResponse.json({
        found: true,
        valid,
        kind: "COUPON",
        id: coupon.id,
        name: coupon.code,
        code: coupon.code,
        discountValue: coupon.value,
        type: coupon.type,
        status: coupon.isActive ? "ACTIVE" : "INACTIVE",
        reason,
        minOrderVal: coupon.minOrderVal,
        maxDiscount: coupon.maxDiscount,
        usageCount: coupon.usageCount,
        maxUsage: coupon.maxUsage,
        applicableProductIds: coupon.applicableProductIds || [],
        endDate: expiresAt ? expiresAt.toISOString() : null,
        daysRemaining,
      });
    }

    return NextResponse.json({
      found: false,
      valid: false,
      reason: `ບໍ່ພົບລະຫັດ "${queryCode}" ໃນລະບົບໂປຣໂມຊັ່ນ ຫຼື ຄູປອງ`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
