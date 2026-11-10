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

    const items = await prisma.promotion.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const body = await req.json();
    const { name, code, discountValue, type, startDate, endDate, status, applicableProductIds } = body;

    if (!name || discountValue === undefined) {
      return NextResponse.json({ error: "name and discountValue are required" }, { status: 400 });
    }

    const cleanCode = code ? String(code).trim().toUpperCase() : null;

    const newItem = await prisma.promotion.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        discountValue: Number(discountValue) || 0,
        type: type || "PERCENTAGE",
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: status || "ACTIVE",
        applicableProductIds: Array.isArray(applicableProductIds) ? applicableProductIds : [],
        organizationId,
      },
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
