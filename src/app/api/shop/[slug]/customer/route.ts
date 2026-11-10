import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeLaoPhone } from "@/lib/laoPhone";
import {
  getOrUpsertStoreCustomer,
  claimCouponForCustomer,
} from "@/lib/storeCustomer";

export async function GET(request: Request, context: any) {
  const params = await context.params;
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get("phone") || "";

    const parsed = normalizeLaoPhone(rawPhone);
    if (!parsed.isValid) {
      return NextResponse.json(
        { error: parsed.error || "ເບີໂທລະສັບບໍ່ຖືກຕ້ອງ" },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!organization) {
      return NextResponse.json({ error: "ບໍ່ພົບຮ້ານຄ້າ" }, { status: 404 });
    }

    const customer = await getOrUpsertStoreCustomer(organization.id, parsed.normalized);
    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error("[SHOP_CUSTOMER_GET]", error);
    return NextResponse.json(
      { error: error?.message || "ເກີດຂໍ້ຜິດພາດໃນລະບົບ" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: any) {
  const params = await context.params;
  try {
    const { slug } = params;
    const body = await request.json();
    const { action = "login", phone, name, address, couponCode, wishlist } = body;

    const parsed = normalizeLaoPhone(phone);
    if (!parsed.isValid) {
      return NextResponse.json(
        { error: parsed.error || "ຮູບແບບເບີໂທບໍ່ຖືກຕ້ອງ" },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!organization) {
      return NextResponse.json({ error: "ບໍ່ພົບຮ້ານຄ້າ" }, { status: 404 });
    }

    if (action === "claim_coupon") {
      if (!couponCode) {
        return NextResponse.json(
          { error: "ກະລຸນາລະບຸລະຫັດຄູປອງ" },
          { status: 400 }
        );
      }

      const result = await claimCouponForCustomer(
        organization.id,
        parsed.normalized,
        couponCode
      );

      if (!result.success) {
        return NextResponse.json(
          {
            error: result.message,
            alreadyClaimed: result.alreadyClaimed,
            alreadyUsed: result.alreadyUsed,
            customer: result.customer,
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        customer: result.customer,
      });
    }

    // Default: "login" or "update_profile"
    const customer = await getOrUpsertStoreCustomer(
      organization.id,
      parsed.normalized,
      {
        name: name !== undefined ? String(name) : undefined,
        address: address !== undefined ? String(address) : undefined,
        wishlist: Array.isArray(wishlist) ? wishlist : undefined,
      }
    );

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error: any) {
    console.error("[SHOP_CUSTOMER_POST]", error);
    return NextResponse.json(
      { error: error?.message || "ເກີດຂໍ້ຜິດພາດໃນລະບົບ" },
      { status: 500 }
    );
  }
}
