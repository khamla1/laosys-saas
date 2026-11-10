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

    const existing = await prisma.installment.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const newPaid = body.paidAmount !== undefined ? Number(body.paidAmount) : existing.paidAmount;
    const newTotal = body.totalAmount !== undefined ? Number(body.totalAmount) : existing.totalAmount;
    let finalStatus = body.status !== undefined ? body.status : existing.status;
    if (newPaid >= newTotal && newTotal > 0) {
      finalStatus = "COMPLETED";
    }

    const updated = await prisma.installment.update({
      where: { id },
      data: {
        customerName: body.customerName !== undefined ? body.customerName : existing.customerName,
        totalAmount: newTotal,
        paidAmount: newPaid,
        status: finalStatus,
        dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
      },
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

    const existing = await prisma.installment.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.installment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
