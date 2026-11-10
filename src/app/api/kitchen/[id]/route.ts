import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const organizationId = (session.user as any).organizationId;
    const body = await request.json();
    const { status } = body;

    const existingTicket = await prisma.kitchenTicket.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!existingTicket || existingTicket.order.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const ticket = await prisma.kitchenTicket.update({
      where: { id },
      data: {
        status,
      }
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[KITCHEN_PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
