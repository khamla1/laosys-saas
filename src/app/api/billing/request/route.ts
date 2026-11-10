import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { packageId, paymentSlipUrl } = body;

    if (!packageId || !paymentSlipUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify package exists
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Get User's Organization
    const userOrg = await prisma.userOrganization.findFirst({
      where: { userId },
      select: { organizationId: true }
    });

    if (!userOrg) {
      return NextResponse.json({ error: "User is not part of any organization" }, { status: 403 });
    }

    const organizationId = userOrg.organizationId;

    // Create Subscription Request
    const subscriptionRequest = await prisma.subscriptionRequest.create({
      data: {
        organizationId,
        packageId,
        paymentSlipUrl,
        paymentMethod: "MANUAL",
        paymentStatus: "PENDING"
      }
    });

    // Update Organization Status to PENDING
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionStatus: "PENDING"
      }
    });

    return NextResponse.json(subscriptionRequest);
  } catch (error) {
    console.error("Error creating subscription request:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
