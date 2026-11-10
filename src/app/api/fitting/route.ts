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

    const items = await (prisma as any).fittingProfile.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[FITTING_GET]", error);
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
    const { customerName, customerPhone, sportType, equipmentName, specifications, notes } = body;

    const profile = await (prisma as any).fittingProfile.create({
      data: {
        customerName,
        customerPhone,
        sportType,
        equipmentName,
        specifications: specifications || {},
        notes,
        organizationId,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[FITTING_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
