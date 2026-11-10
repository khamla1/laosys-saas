import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { expiresAt } = body; // Can be a Date string or null

    const user = await prisma.user.findUnique({
      where: { id },
      include: { organizations: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.organizations && user.organizations.length > 0) {
      await prisma.organization.update({
        where: { id: user.organizations[0].organizationId },
        data: { 
          subscriptionExpiresAt: expiresAt ? new Date(expiresAt) : null 
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: "UPDATE_SUBSCRIPTION",
        details: `Admin updated subscription expiry for user ${user.email} to ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Lifetime'}.`,
        userId: (session.user as any).id,
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Renew Subscription Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
