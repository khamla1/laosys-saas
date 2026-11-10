import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const { id } = await params;
    const existing = await prisma.club.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.club.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        image: body.logo !== undefined ? body.logo : (body.image !== undefined ? body.image : existing.image),
        status: body.status !== undefined ? body.status : existing.status,
      },
    });

    const user = session.user as any;
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "CLUB",
        entityId: id,
        details: {
          updatedBy: user.name || user.email || "Unknown",
          role: user.role || "STAFF",
          name: updated.name,
          status: updated.status,
        },
        userId: user.id,
        organizationId,
      },
    }).catch(() => {});

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
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const { id } = await params;
    const existing = await prisma.club.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.club.delete({ where: { id } });

    const user = session.user as any;
    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entity: "CLUB",
        entityId: id,
        details: {
          deletedBy: user.name || user.email || "Unknown",
          role: user.role || "STAFF",
          name: existing.name,
        },
        userId: user.id,
        organizationId,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
