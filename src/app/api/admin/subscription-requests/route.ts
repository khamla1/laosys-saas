import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Clean invalid documents where organizationId is missing or null
    await prisma.$runCommandRaw({
      delete: "SubscriptionRequest",
      deletes: [
        { q: { organizationId: { $type: 10 } }, limit: 0 }, // $type: 10 is null
        { q: { organizationId: { $exists: false } }, limit: 0 }
      ]
    });

    const requests = await prisma.subscriptionRequest.findMany({
      include: {
        organization: { select: { name: true, id: true } },
        package: { select: { name: true, price: true, durationDays: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("ADMIN_SUBSCRIPTION_REQUEST_ERROR:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
