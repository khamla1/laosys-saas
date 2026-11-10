import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, ctx: any) {
  try {
    const resolvedParams = await ctx.params;
    const { id: userId } = resolvedParams;

    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, department, position, salary, joinDate } = body;

    await prisma.$transaction(async (tx) => {
      // Update User name
      await tx.user.update({
        where: { id: userId },
        data: { name }
      });

      // Upsert EmployeeProfile
      await tx.employeeProfile.upsert({
        where: { userId },
        create: {
          userId,
          organizationId,
          department,
          position,
          salary: salary ? parseFloat(salary) : 0,
          joinDate: joinDate ? new Date(joinDate) : new Date()
        },
        update: {
          department,
          position,
          salary: salary ? parseFloat(salary) : 0,
          joinDate: joinDate ? new Date(joinDate) : undefined
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update employee:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: any) {
  try {
    const resolvedParams = await ctx.params;
    const { id: userId } = resolvedParams;

    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must be in the same org
    const userOrg = await prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId } }
    });

    if (!userOrg) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    // Delete user (cascade will delete employee profile and org links)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete employee:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
