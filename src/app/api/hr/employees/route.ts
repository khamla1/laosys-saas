import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getEffectiveLimits } from "@/lib/saas";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staffOrgs = await prisma.userOrganization.findMany({
      where: { organizationId },
      include: {
        user: {
          include: { employeeProfile: true }
        }
      }
    });

    // Extract users, omit owner if needed, but HR usually includes everyone.
    const employees = staffOrgs.map(org => ({
      ...org.user,
      orgRole: org.role
    }));

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!session || !session.user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, department, position, salary, joinDate } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // SaaS Limits
    const limits = await getEffectiveLimits((session.user as any).id);
    const staffCount = await prisma.userOrganization.count({
      where: { organizationId }
    });

    if (staffCount >= limits.staffLimit) {
      return NextResponse.json({ 
        error: `Staff limit reached for ${limits.planName} plan. Please upgrade to add more.` 
      }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "CASHIER",
          organizations: {
            create: {
              organizationId,
              role: "STAFF"
            }
          },
          employeeProfile: {
            create: {
              organizationId,
              department,
              position,
              salary: salary ? parseFloat(salary) : 0,
              joinDate: joinDate ? new Date(joinDate) : new Date()
            }
          }
        },
        include: { employeeProfile: true }
      });
      return user;
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    console.error("Failed to create employee:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
