import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request, context: any) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params; // userId

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        organizations: {
          take: 1,
          include: { organization: true }
        }
      }
    });

    if (!user || !user.organizations[0]?.organization) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const org = user.organizations[0].organization;

    return NextResponse.json({
      businessType: org.businessType,
      enabledModules: org.enabledModules
    });
  } catch (error: any) {
    console.error("Fetch Modules Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: any) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params; // userId
    const body = await req.json();
    const { businessType, enabledModules } = body;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        organizations: {
          take: 1,
          include: { organization: true }
        }
      }
    });

    if (!user || !user.organizations[0]?.organization) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const orgId = user.organizations[0].organization.id;

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        businessType,
        enabledModules
      }
    });

    return NextResponse.json({ success: true, organization: updatedOrg });
  } catch (error: any) {
    console.error("Update Modules Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
