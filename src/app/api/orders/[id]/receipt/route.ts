import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";
    const organizationId = (session.user as any).organizationId;

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: { include: { product: true } } }
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    if (!isAdmin && order.organizationId !== organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Mock PDF Generation
    // Real implementation would use something like `pdfkit` or `@react-pdf/renderer`
    // to generate a PDF buffer and return it with correct Content-Type.
    
    const mockPdfBuffer = Buffer.from("PDF Receipt Content Mockup for Order " + order.id);

    return new NextResponse(mockPdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${order.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[RECEIPT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
