import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    await prisma.subscriptionRequest.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    const req = await prisma.subscriptionRequest.findUnique({
      where: { id },
      include: { package: true }
    });

    if (!req) return new NextResponse("Not Found", { status: 404 });

    // Update status
    await prisma.subscriptionRequest.update({
      where: { id },
      data: { paymentStatus: status }
    });

    // If changing to APPROVED, update the user's subscription
    if (status === "APPROVED") {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + req.package.durationDays);

      await prisma.organization.update({
        where: { id: req.organizationId },
        data: {
          packageId: req.packageId,
          subscriptionStatus: "ACTIVE",
          subscriptionExpiresAt: expiresAt,
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
