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

    const items = await prisma.loyaltyReward.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    // Cross-link with Orders to enrich customerPhone
    const orders = await prisma.order.findMany({
      where: { organizationId, customerPhone: { not: null } },
      select: { customerName: true, customerPhone: true },
    });
    const phoneMap = new Map<string, string>();
    for (const o of orders) {
      if (o.customerName && o.customerPhone && !phoneMap.has(o.customerName.toLowerCase().trim())) {
        phoneMap.set(o.customerName.toLowerCase().trim(), o.customerPhone);
      }
    }

    const enriched = items.map((item: any) => ({
      ...item,
      phone: (item as any).phone || phoneMap.get((item.customerName || "").toLowerCase().trim()) || null,
    }));

    return NextResponse.json(enriched);
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
    const { customerName, points, tier } = body;

    if (!customerName) {
      return NextResponse.json({ error: "customerName is required" }, { status: 400 });
    }

    const newItem = await prisma.loyaltyReward.create({
      data: {
        customerName,
        points: Number(points) || 0,
        tier: tier || "BRONZE",
        organizationId,
      },
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
