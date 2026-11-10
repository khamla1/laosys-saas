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

    // Get active kitchen tickets for this org
    const tickets = await prisma.kitchenTicket.findMany({
      where: {
        order: {
          organizationId
        },
        status: {
          in: ["PENDING", "PREPARING"]
        }
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true
              }
            },
            table: true
          }
        }
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("[KITCHEN_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
