import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { customerName, amount, dueDate, status } = body;

    if (!customerName || !amount) {
      return NextResponse.json({ error: "Customer name and amount are required" }, { status: 400 });
    }

    // Generate Invoice Number (INV-YYYYMMDD-XXXX)
    const count = await prisma.invoice.count({ where: { organizationId } });
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const invoiceNumber = `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerName,
        amount: parseFloat(amount),
        status: status || "PENDING",
        dueDate: dueDate ? new Date(dueDate) : null,
        organizationId
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
