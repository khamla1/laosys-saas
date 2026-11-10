import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
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

    const existingModifier = await prisma.modifier.findUnique({
      where: { id },
      include: { group: true }
    });

    if (!existingModifier || existingModifier.group.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const price = body.price !== undefined ? parseFloat(body.price) : (body.priceAdjustment !== undefined ? parseFloat(body.priceAdjustment) : existingModifier.price);

    const updated = await prisma.modifier.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : existingModifier.name,
        price: isNaN(price) ? 0 : price,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[MODIFIER_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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

    const existingModifier = await prisma.modifier.findUnique({
      where: { id },
      include: { group: true }
    });

    if (!existingModifier || existingModifier.group.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.modifier.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MODIFIER_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
