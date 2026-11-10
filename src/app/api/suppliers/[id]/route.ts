import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, ctx: any) {
  try {
    // Await params to fix Next.js 15 breaking change where params is a Promise
    const resolvedParams = await ctx.params;
    const { id } = resolvedParams;

    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, contactName, email, phone, address, contactInfo } = body;

    const supplier = await prisma.supplier.updateMany({
      where: { id, organizationId },
      data: {
        name,
        contactName: contactName || contactInfo || undefined,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
      }
    });

    if (supplier.count === 0) {
      return NextResponse.json({ error: "Supplier not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update supplier:", error);
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

    // Ensure it belongs to the org
    const deleted = await prisma.supplier.deleteMany({
      where: { id, organizationId }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Supplier not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete supplier:", error);
    // Usually fails if linked to Purchase Orders due to Restrict relation
    if ((error as any).code === "P2014" || (error as any).code === "P2003") {
      return NextResponse.json({ error: "Cannot delete supplier because it is linked to purchase orders." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
