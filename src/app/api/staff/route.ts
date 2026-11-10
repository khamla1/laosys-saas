import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getEffectiveLimits } from "@/lib/saas";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const currentOrgRole = (session.user as any).orgRole;
    if (role === "CASHIER" || (currentOrgRole && !['OWNER', 'ADMIN', 'MANAGER'].includes(currentOrgRole))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, email, password, orgRole } = await req.json();

    if (!name || !email || !password || !orgRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "User has no organization" }, { status: 403 });
    }
    
    // SaaS Feature Enforcement: Check Subscription Plan and Staff Limits
    const limits = await getEffectiveLimits((session.user as any).id);

    const staffCount = await prisma.userOrganization.count({
      where: { organizationId }
    });

    if (staffCount >= limits.staffLimit) {
      return NextResponse.json({ 
        error: `Staff limit reached for ${limits.planName} plan. Please upgrade to add more.` 
      }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "SELLER", // Global role can just be SELLER or USER, we'll use SELLER to allow dashboard access
        organizations: {
          create: {
            organizationId: organizationId,
            role: orgRole
          }
        }
      }
    });

    return NextResponse.json({ success: true, staff: { id: staff.id, email: staff.email } });
  } catch (error: any) {
    console.error("Staff creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "User has no organization" }, { status: 403 });
    }

    // Verify ownership
    const userOrg = await prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId: id, organizationId } }
    });

    if (!userOrg) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Staff deletion error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
