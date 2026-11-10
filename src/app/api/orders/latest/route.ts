import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get("since");
    const currentServerTime = new Date().toISOString();

    if (!sinceParam) {
      return NextResponse.json({ orders: [], serverTime: currentServerTime });
    }

    const sinceDate = new Date(sinceParam);
    if (isNaN(sinceDate.getTime())) {
      return NextResponse.json({ orders: [], serverTime: currentServerTime });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";

    let organizationId = (session.user as any).organizationId;
    if (!organizationId && !isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizations: { take: 1, select: { organizationId: true } } }
      });
      organizationId = user?.organizations?.[0]?.organizationId;
    }

    if (!organizationId && !isAdmin) {
      return NextResponse.json({ orders: [], serverTime: currentServerTime }); // No org, no orders
    }

    const whereClause: any = {
      createdAt: { gt: sinceDate },
      ...(isAdmin ? {} : { organizationId })
    };

    const newOrders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: { 
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                price: true,
              }
            } 
          }
        },
        table: {
          select: { id: true, name: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ 
      orders: newOrders,
      serverTime: currentServerTime
    });
  } catch (error: any) {
    console.error("Fetch latest orders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
