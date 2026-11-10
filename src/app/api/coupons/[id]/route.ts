import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  const isAdmin = (session.user as any).role === "ADMIN";
  const { id } = params;
  const data = await req.json();

  try {
    const existing = await prisma.coupon.findUnique({
      where: isAdmin ? { id } : { id, organizationId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        isActive: data.isActive !== undefined ? data.isActive : undefined,
        code: data.code ? data.code.toUpperCase().trim() : undefined,
        type: data.type || undefined,
        value: data.value !== undefined ? parseFloat(data.value) : undefined,
        minOrderVal: data.minOrderVal !== undefined ? parseFloat(data.minOrderVal) : undefined,
        maxDiscount: data.maxDiscount !== undefined ? parseFloat(data.maxDiscount) : undefined,
        maxUsage: data.maxUsage !== undefined ? parseInt(data.maxUsage) : undefined,
        expiresAt: data.expiresAt !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : undefined,
        applicableProductIds: Array.isArray(data.applicableProductIds) ? data.applicableProductIds : undefined,
      }
    });

    return NextResponse.json({ success: true, coupon: updated });
  } catch (error: any) {
    console.error("Error updating coupon:", error);
    return NextResponse.json({ error: error.message || "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = (session.user as any).organizationId;
  const isAdmin = (session.user as any).role === "ADMIN";
  const { id } = params;

  try {
    const existing = await prisma.coupon.findUnique({
      where: isAdmin ? { id } : { id, organizationId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    await prisma.coupon.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json({ error: error.message || "Failed to delete coupon" }, { status: 500 });
  }
}
