import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeLaoPhone } from "@/lib/laoPhone";
import { getOrUpsertStoreCustomer } from "@/lib/storeCustomer";

export async function POST(request: Request, context: any) {
  const params = await context.params;
  try {
    const { slug } = params;
    const body = await request.json();
    const { code, cartTotal, items = [], customerPhone } = body;

    if (!code || !String(code).trim()) {
      return NextResponse.json(
        { error: "ກະລຸນາປ້ອນລະຫັດຄູປອງ" },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim().toUpperCase();
    const total = Number(cartTotal) || 0;

    const organization = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!organization) {
      return NextResponse.json({ error: "ບໍ່ພົບຮ້ານຄ້າ" }, { status: 404 });
    }

    // 1. Require valid customer phone to enforce 1-person-1-use rule
    if (!customerPhone) {
      return NextResponse.json(
        { error: "ກະລຸນາເຂົ້າສູ່ລະບົບດ້ວຍເບີໂທລະສັບກ່ອນໃຊ້ຄູປອງ (ຈຳກັດ 1 ຄົນ / 1 ສິດ)" },
        { status: 401 }
      );
    }

    const parsedPhone = normalizeLaoPhone(customerPhone);
    if (!parsedPhone.isValid) {
      return NextResponse.json(
        { error: parsedPhone.error || "ເບີໂທລະສັບບໍ່ຖືກຕ້ອງ" },
        { status: 400 }
      );
    }

    const customer = await getOrUpsertStoreCustomer(
      organization.id,
      parsedPhone.normalized
    );

    // 2. Check if this customer already used this coupon in this store
    if (customer.usedCoupons.includes(cleanCode)) {
      return NextResponse.json(
        {
          error: `ເບີໂທ ${customer.displayPhone} ໄດ້ໃຊ້ສິດຄູປອງ ${cleanCode} ໄປແລ້ວ (ຈຳກັດ 1 ເບີ / 1 ຄັ້ງ)`,
        },
        { status: 409 }
      );
    }

    // 3. Look up coupon in store database first
    let coupon = await prisma.coupon.findFirst({
      where: {
        organizationId: organization.id,
        code: { equals: cleanCode, mode: "insensitive" },
        isActive: true,
      },
    });

    // Built-in fallback store vouchers if store hasn't created custom ones yet
    if (!coupon && (cleanCode === "WELCOME10" || cleanCode === "VIP50K")) {
      const isWelcome = cleanCode === "WELCOME10";
      coupon = await prisma.coupon.upsert({
        where: {
          organizationId_code: {
            organizationId: organization.id,
            code: cleanCode,
          },
        },
        update: {},
        create: {
          organizationId: organization.id,
          code: cleanCode,
          type: isWelcome ? "PERCENTAGE" : "FIXED",
          value: isWelcome ? 10 : 50000,
          minOrderVal: isWelcome ? 50000 : 300000,
          isActive: true,
        },
      });
    }

    if (!coupon) {
      return NextResponse.json(
        { error: "ບໍ່ພົບລະຫັດຄູປອງນີ້ ຫຼື ຄູປອງໝົດອາຍຸແລ້ວ" },
        { status: 404 }
      );
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "ຄູປອງນີ້ໝົດອາຍຸການໃຊ້ງານແລ້ວ" },
        { status: 400 }
      );
    }

    if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
      return NextResponse.json(
        { error: "ຄູປອງນີ້ຖືກໃຊ້ຄົບຈຳນວນສິດທັງໝົດແລ້ວ" },
        { status: 400 }
      );
    }

    if (coupon.minOrderVal && total < coupon.minOrderVal) {
      return NextResponse.json(
        {
          error: `ຍອດສັ່ງຊື້ຂັ້ນຕ່ຳສຳລັບຄູປອງນີ້ແມ່ນ ₭${coupon.minOrderVal.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE" || coupon.type === "PERCENT") {
      discountAmount = Math.round((total * coupon.value) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    if (discountAmount > total) {
      discountAmount = total;
    }

    return NextResponse.json({
      valid: true,
      discountAmount,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
    });
  } catch (error: any) {
    console.error("[SHOP_COUPON_POST]", error);
    return NextResponse.json(
      { error: "ເກີດຂໍ້ຜິດພາດໃນການກວດສອບຄູປອງ" },
      { status: 500 }
    );
  }
}
