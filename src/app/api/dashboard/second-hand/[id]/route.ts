import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existing = await prisma.secondHandItem.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.secondHandItem.update({
      where: { id },
      data: {
        itemCode: body.itemCode ?? existing.itemCode,
        name: body.name ?? existing.name,
        category: body.category ?? existing.category,
        image: body.image ?? existing.image,
        description: body.description ?? existing.description,
        condition: body.condition ?? existing.condition,
        buyPrice: body.buyPrice !== undefined ? Number(body.buyPrice) : existing.buyPrice,
        sellPrice: body.sellPrice !== undefined ? Number(body.sellPrice) : existing.sellPrice,
        status: body.status ?? existing.status,
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existing = await prisma.secondHandItem.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.secondHandItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
