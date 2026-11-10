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

    const existingGroup = await prisma.modifierGroup.findUnique({
      where: { id }
    });

    if (!existingGroup || existingGroup.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const group = await prisma.modifierGroup.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : existingGroup.name,
        isRequired: body.isRequired !== undefined ? Boolean(body.isRequired) : existingGroup.isRequired,
        minSelections: body.minSelections !== undefined ? parseInt(body.minSelections) : existingGroup.minSelections,
        maxSelections: body.maxSelections !== undefined ? (body.maxSelections === null || body.maxSelections === "" ? null : parseInt(body.maxSelections)) : existingGroup.maxSelections,
        productIds: Array.isArray(body.productIds) ? body.productIds : existingGroup.productIds,
      },
      include: {
        modifiers: {
          orderBy: { price: "asc" }
        },
        products: {
          select: { id: true, name: true, images: true, category: true }
        }
      }
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("[MODIFIER_GROUP_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: groupId } = params;
    const organizationId = (session.user as any).organizationId;
    const body = await request.json();

    const existingGroup = await prisma.modifierGroup.findUnique({
      where: { id: groupId }
    });

    if (!existingGroup || existingGroup.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const price = body.price !== undefined ? parseFloat(body.price) : (body.priceAdjustment !== undefined ? parseFloat(body.priceAdjustment) : 0);

    const modifier = await prisma.modifier.create({
      data: {
        name: body.name,
        price: isNaN(price) ? 0 : price,
        groupId,
      }
    });

    return NextResponse.json(modifier);
  } catch (error) {
    console.error("[MODIFIER_POST]", error);
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

    const existingGroup = await prisma.modifierGroup.findUnique({
      where: { id }
    });

    if (!existingGroup || existingGroup.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.modifierGroup.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MODIFIER_GROUP_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
