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

    const organizationId = (session.user as any).organizationId || (session.user as any).id;

    const zones = await prisma.zone.findMany({
      where: { organizationId },
      include: {
        tables: {
          include: {
            orders: {
              where: { status: 'PENDING' },
              include: { items: { include: { product: true } } }
            }
          }
        }
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(zones);
  } catch (error) {
    console.error("[ZONES_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = (session.user as any).organizationId || (session.user as any).id;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const zone = await prisma.zone.create({
      data: {
        name,
        organizationId,
      },
    });

    return NextResponse.json(zone);
  } catch (error) {
    console.error("[ZONES_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
