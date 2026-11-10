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

    const items = await (prisma as any).repairTicket.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[REPAIRS_GET]", error);
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
    const { customerName, customerPhone, itemName, issueDesc } = body;

    // Generate ticket number e.g. REP-20230501-1234
    const ticketNumber = `REP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const ticket = await (prisma as any).repairTicket.create({
      data: {
        ticketNumber,
        customerName,
        customerPhone,
        itemName,
        issueDesc,
        organizationId,
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[REPAIRS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
