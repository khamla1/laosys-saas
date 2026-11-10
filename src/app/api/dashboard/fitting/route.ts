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

    const records = await prisma.fittingProfile.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(records);
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
    const { customerName, customerPhone, sportType, equipmentName, specifications, notes, price, status } = body;

    if (!customerName || !sportType || !equipmentName) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const profile = await prisma.fittingProfile.create({
      data: {
        customerName,
        customerPhone,
        sportType,
        equipmentName,
        specifications,
        notes,
        price: price !== undefined && price !== "" && price !== null ? Number(price) : null,
        status: status || "ACTIVE",
        organizationId
      }
    });

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
