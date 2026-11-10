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

    const req = await prisma.subscriptionRequest.findUnique({
      where: { id },
      include: { package: true }
    });

    if (!req) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (req.paymentStatus === "APPROVED") {
      return new NextResponse("Already approved", { status: 400 });
    }

    // Approve the request
    await prisma.subscriptionRequest.update({
      where: { id },
      data: { paymentStatus: "APPROVED" }
    });

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + req.package.durationDays);

    // Update the Organization's subscription
    await prisma.organization.update({
      where: { id: req.organizationId },
      data: {
        packageId: req.packageId,
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: expiresAt,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
