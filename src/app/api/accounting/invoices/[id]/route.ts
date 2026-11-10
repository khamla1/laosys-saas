import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, ctx: any) {
  try {
    const resolvedParams = await ctx.params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id, organizationId }
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (existingInvoice.status === "PAID") {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
    }

    if (status === "PAID") {
      // Auto-posting Logic
      // Try to find default accounts
      const cashAccount = await prisma.chartOfAccount.findFirst({
        where: { organizationId, type: "ASSET", name: { contains: "Cash" } }
      });
      const revenueAccount = await prisma.chartOfAccount.findFirst({
        where: { organizationId, type: "REVENUE" }
      });

      await prisma.$transaction(async (tx) => {
        // Update Invoice
        await tx.invoice.update({
          where: { id },
          data: { status }
        });

        // Create Journal Entry if we found accounts
        if (cashAccount && revenueAccount) {
          await tx.journalEntry.create({
            data: {
              date: new Date(),
              description: `Payment received for Invoice ${existingInvoice.invoiceNumber}`,
              reference: existingInvoice.invoiceNumber,
              organizationId,
              lines: {
                create: [
                  { accountId: cashAccount.id, debit: existingInvoice.amount, credit: 0 },
                  { accountId: revenueAccount.id, debit: 0, credit: existingInvoice.amount }
                ]
              }
            }
          });
        }
      });

      return NextResponse.json({ success: true });
    }

    await prisma.invoice.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: any) {
  try {
    const resolvedParams = await ctx.params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.invoice.findUnique({
      where: { id, organizationId }
    });

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing.status === "PAID") {
      return NextResponse.json({ error: "Cannot delete a paid invoice" }, { status: 400 });
    }

    await prisma.invoice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
