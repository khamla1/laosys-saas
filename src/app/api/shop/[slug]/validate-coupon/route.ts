import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeLaoPhone } from "@/lib/laoPhone";
import { getOrUpsertStoreCustomer } from "@/lib/storeCustomer";

export async function POST(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const { slug } = params;
    const body = await request.json();
    const { code, totalAmount, customerPhone } = body;

    if (!code) {
      return NextResponse.json({ error: "ກະລຸນາປ້ອນລະຫັດຄູປອງ (Please enter coupon code)" }, { status: 400 });
    }

    const cleanCode = String(code).trim().toUpperCase();

    const organization = await prisma.organization.findUnique({
      where: { slug }
    });

    if (!organization) {
      return NextResponse.json({ error: "ບໍ່ພົບຮ້ານຄ້າ (Store not found)" }, { status: 404 });
    }

    // Enforce Customer Phone Login so 1 customer can only use each coupon 1 time per store
    if (!customerPhone) {
      return NextResponse.json(
        {
          error: "ກະລຸນາເຂົ້າສູ່ລະບົບດ້ວຍເບີໂທລະສັບກ່ອນໃຊ້ຄູປອງ (ຈຳກັດ 1 ເບີ / 1 ຄັ້ງ)",
          requireLogin: true,
        },
        { status: 401 }
      );
    }

    const parsedPhone = normalizeLaoPhone(customerPhone);
    if (!parsedPhone.isValid) {
      return NextResponse.json(
        { error: parsedPhone.error || "ຮູບແບບເບີໂທລະສັບບໍ່ຖືກຕ້ອງ" },
        { status: 400 }
      );
    }

    const customer = await getOrUpsertStoreCustomer(
      organization.id,
      parsedPhone.normalized
    );

    if (customer.usedCoupons.includes(cleanCode)) {
      return NextResponse.json(
        {
          error: `ເບີໂທ ${customer.displayPhone} ໄດ້ໃຊ້ສິດຄູປອງ ${cleanCode} ໄປແລ້ວ (ຈຳກັດ 1 ເບີ / 1 ຄັ້ງ)`,
        },
        { status: 409 }
      );
    }

    let coupon = await prisma.coupon.findUnique({
      where: {
        organizationId_code: {
          organizationId: organization.id,
          code: cleanCode,
        },
      },
    });

    // Auto-seed store welcome coupons if not yet in database
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

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "ລະຫັດຄູປອງບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ (Invalid or inactive coupon)" }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: "ຄູປອງນີ້ໝົດອາຍຸແລ້ວ (Coupon has expired)" }, { status: 400 });
    }

    if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
      return NextResponse.json({ error: "ຄູປອງນີ້ຖືກໃຊ້ຄົບຈຳນວນແລ້ວ (Coupon usage limit reached)" }, { status: 400 });
    }

    if (totalAmount < coupon.minOrderVal) {
      return NextResponse.json({
        error: `ຄູປອງນີ້ໃຊ້ໄດ້ກັບຍອດສັ່ງຊື້ຂັ້ນຕ່ຳ ₭${coupon.minOrderVal.toLocaleString()}`
      }, { status: 400 });
    }

    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = Math.round((totalAmount * coupon.value) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.round(coupon.value);
    }

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountAmount,
        type: coupon.type,
        value: coupon.value,
      }
    });
  } catch (error: any) {
    console.error("Error validating shop coupon:", error);
    return NextResponse.json({ error: "ເກີດຂໍ້ຜິດພາດໃນການກວດສອບຄູປອງ" }, { status: 500 });
  }
}
