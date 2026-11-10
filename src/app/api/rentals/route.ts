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

    const items = await (prisma as any).rentalOrder.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[RENTALS_GET]", error);
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
    const { customerName, customerPhone, itemName, quantity, rentDate, dueDate, rentalFee } = body;

    const rental = await (prisma as any).rentalOrder.create({
      data: {
        customerName,
        customerPhone,
        itemName,
        quantity: Number(quantity) || 1,
        rentDate: new Date(rentDate),
        dueDate: new Date(dueDate),
        rentalFee: Number(rentalFee) || 0,
        organizationId,
      },
    });

    return NextResponse.json(rental);
  } catch (error) {
    console.error("[RENTALS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
