import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  const isAdmin = (session.user as any).role === "ADMIN";

  const coupons = await prisma.coupon.findMany({
    where: isAdmin ? undefined : { organizationId },
    include: {
      organization: {
        select: { id: true, name: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  const data = await req.json();

  if (!data.code || !data.type || data.value === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Check if coupon code already exists for this seller
    const existing = await prisma.coupon.findUnique({
      where: {
        organizationId_code: {
          organizationId,
          code: data.code.toUpperCase().trim()
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists in your store" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase().trim(),
        type: data.type, // PERCENTAGE or FIXED
        value: parseFloat(data.value),
        minOrderVal: data.minOrderVal ? parseFloat(data.minOrderVal) : 0,
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
        maxUsage: data.maxUsage ? parseInt(data.maxUsage) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        applicableProductIds: Array.isArray(data.applicableProductIds) ? data.applicableProductIds : [],
        organizationId
      }
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error("Error creating coupon:", error);
    return NextResponse.json({ error: error.message || "Failed to create coupon" }, { status: 500 });
  }
}
