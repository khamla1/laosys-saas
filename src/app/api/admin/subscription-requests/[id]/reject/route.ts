import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const req = await prisma.subscriptionRequest.findUnique({
      where: { id }
    });

    if (!req) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (req.paymentStatus !== "PENDING") {
      return new NextResponse("Only pending requests can be rejected", { status: 400 });
    }

    // Reject the request
    await prisma.subscriptionRequest.update({
      where: { id },
      data: { 
        paymentStatus: "REJECTED",
        adminNote: body.reason || "Payment could not be verified."
      }
    });

    // Revert the User's subscriptionStatus to ACTIVE (or FREE) if they were just PENDING
    // But maybe they had an old active plan. For simplicity, we just clear PENDING.
    const org = await prisma.organization.findUnique({ where: { id: req.organizationId }});
    if (org && org.subscriptionStatus === "PENDING") {
      await prisma.organization.update({
        where: { id: req.organizationId },
        data: {
          subscriptionStatus: "ACTIVE" // Fallback
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
