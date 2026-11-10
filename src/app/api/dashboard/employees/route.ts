import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const staffOrgs = await prisma.userOrganization.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            employeeProfile: {
              select: { department: true, position: true, salary: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const employees = staffOrgs.map((org) => ({
      id: org.user.id,
      name: org.user.name || org.user.email || "Staff",
      email: org.user.email,
      role: org.user.role,
      department: org.user.employeeProfile?.department || "ທົ່ວໄປ",
      position: org.user.employeeProfile?.position || "ພະນັກງານ",
    }));

    return NextResponse.json(employees);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
