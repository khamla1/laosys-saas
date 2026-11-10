import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await prisma.attendance.findMany({
      where: {
        employee: { organizationId }
      },
      include: {
        employee: { include: { user: true } }
      },
      orderBy: { checkIn: "desc" },
      take: 100
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const organizationId = (session?.user as any)?.organizationId;

    if (!userId || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body; // "CLOCK_IN" or "CLOCK_OUT"

    const employeeProfile = await prisma.employeeProfile.findUnique({
      where: { userId }
    });

    if (!employeeProfile) {
      return NextResponse.json({ error: "Employee profile not found. Please contact admin to set up your profile." }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find if there's already an active check-in today
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employeeProfile.id,
        checkIn: { gte: today },
        checkOut: null
      }
    });

    if (action === "CLOCK_IN") {
      if (activeAttendance) {
        return NextResponse.json({ error: "You are already clocked in." }, { status: 400 });
      }
      
      const newRecord = await prisma.attendance.create({
        data: {
          employeeId: employeeProfile.id,
          checkIn: new Date(),
          status: "PRESENT"
        }
      });
      return NextResponse.json(newRecord);
    } 
    
    if (action === "CLOCK_OUT") {
      if (!activeAttendance) {
        return NextResponse.json({ error: "No active clock-in found for today." }, { status: 400 });
      }

      const updatedRecord = await prisma.attendance.update({
        where: { id: activeAttendance.id },
        data: { checkOut: new Date() }
      });
      return NextResponse.json(updatedRecord);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to process attendance:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
