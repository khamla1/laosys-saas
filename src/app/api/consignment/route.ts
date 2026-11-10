import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const organizationId = (session.user as any).organizationId;

    const items = await (prisma as any).consignmentItem.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[CONSIGNMENT_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const body = await request.json();
    const { itemName, description, condition, ownerName, ownerPhone, price, storeFeePct } = body;

    const item = await (prisma as any).consignmentItem.create({
      data: {
        itemName,
        description,
        condition,
        ownerName,
        ownerPhone,
        price: Number(price) || 0,
        storeFeePct: Number(storeFeePct) || 20,
        status: "FOR_SALE",
        organizationId,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("[CONSIGNMENT_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
