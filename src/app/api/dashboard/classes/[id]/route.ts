import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const coachingClass = await prisma.coachingClass.findUnique({ where: { id } });
    if (!coachingClass || coachingClass.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.coachingClass.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const body = await req.json();
    const {
      name,
      description,
      coachName,
      maxStudents,
      scheduleInfo,
      price,
      status,
      action
    } = body;

    const coachingClass = await prisma.coachingClass.findUnique({ where: { id } });
    if (!coachingClass || coachingClass.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    let updatedData: any = {};

    if (action === "ENROLL") {
      if (coachingClass.currentStudents >= coachingClass.maxStudents) {
        return NextResponse.json({ error: "Class is full" }, { status: 400 });
      }
      const newCount = coachingClass.currentStudents + 1;
      updatedData.currentStudents = newCount;
      if (newCount >= coachingClass.maxStudents) {
        updatedData.status = "FULL";
      }
    } else if (action === "UNENROLL") {
      const newCount = Math.max(coachingClass.currentStudents - 1, 0);
      updatedData.currentStudents = newCount;
      if (coachingClass.status === "FULL" && newCount < coachingClass.maxStudents) {
        updatedData.status = "OPEN";
      }
    } else {
      if (name !== undefined) updatedData.name = name;
      if (description !== undefined) updatedData.description = description;
      if (coachName !== undefined) updatedData.coachName = coachName;
      if (maxStudents !== undefined) updatedData.maxStudents = parseInt(maxStudents);
      if (scheduleInfo !== undefined) updatedData.scheduleInfo = scheduleInfo;
      if (price !== undefined) updatedData.price = parseFloat(price) || 0;
      if (status !== undefined) updatedData.status = status;
    }

    const updated = await prisma.coachingClass.update({
      where: { id },
      data: updatedData
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
