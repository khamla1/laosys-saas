import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, price, durationDays, productLimit, orderLimit, staffLimit, isActive, enabledModules } = body;

    const pkg = await prisma.package.update({
      where: { id },
      data: {
        name,
        price: Number(price),
        durationDays: Number(durationDays),
        productLimit: Number(productLimit),
        orderLimit: Number(orderLimit),
        staffLimit: Number(staffLimit),
        isActive,
        ...(Array.isArray(enabledModules) ? { enabledModules } : {})
      }
    });

    return NextResponse.json(pkg);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    await prisma.package.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
