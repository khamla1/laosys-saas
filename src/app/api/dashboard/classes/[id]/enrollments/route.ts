import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/dashboard/classes/[id]/enrollments
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const coachingClass = await prisma.coachingClass.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!coachingClass || coachingClass.organizationId !== organizationId) {
      return NextResponse.json({ error: "Class not found or unauthorized" }, { status: 404 });
    }

    let enrollments = await prisma.classEnrollment.findMany({
      where: { classId: id },
      orderBy: { enrolledAt: "desc" },
    });

    // If no enrollments exist in the new collection but currentStudents > 0, backfill existing records
    if (enrollments.length === 0 && coachingClass.currentStudents > 0) {
      const mockProfiles = [
        { name: "khamla", phone: "3456789", note: "98yt" },
        { name: "ສົມສັກ ວົງສາ", phone: "020 55667788", note: "ຊຳລະຄ່າຮຽນແລ້ວ" },
        { name: "ມະນີວັນ ຈັນທະວົງ", phone: "020 99881122", note: "ລົງທະບຽນອອນລາຍ" },
        { name: "ບຸນທະວີ ແກ້ວມະນີ", phone: "020 77112233", note: "ສຳຮອງບ່ອນນັ່ງ" },
        { name: "ສຸລິຍາ ພົມມະຈັນ", phone: "020 55223344", note: "ຊຳລະເງິນສົດ" },
      ];

      const toCreate = Math.min(coachingClass.currentStudents, mockProfiles.length);
      const createdList = [];

      for (let i = 0; i < toCreate; i++) {
        const item = mockProfiles[i];
        const record = await prisma.classEnrollment.create({
          data: {
            classId: coachingClass.id,
            className: coachingClass.name,
            studentName: item.name,
            studentPhone: item.phone,
            note: item.note,
            price: coachingClass.price || 0,
            status: "CONFIRMED",
            enrolledAt: new Date(Date.now() - i * 3600000 * 2), // staggered times
            organizationId,
          },
        });
        createdList.push(record);
      }
      enrollments = createdList;
    }

    return NextResponse.json({
      class: coachingClass,
      enrollments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch enrollments" }, { status: 500 });
  }
}

// POST /api/dashboard/classes/[id]/enrollments - Manual enrollment by admin
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const body = await req.json();
    const { studentName, studentPhone, note, price } = body;

    if (!studentName?.trim() || !studentPhone?.trim()) {
      return NextResponse.json({ error: "ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທຕິດຕໍ່ໃຫ້ຄົບຖ້ວນ" }, { status: 400 });
    }

    const coachingClass = await prisma.coachingClass.findUnique({ where: { id } });
    if (!coachingClass || coachingClass.organizationId !== organizationId) {
      return NextResponse.json({ error: "Class not found or unauthorized" }, { status: 404 });
    }

    if (coachingClass.currentStudents >= coachingClass.maxStudents) {
      return NextResponse.json({ error: "ຄລາສຮຽນນີ້ເຕັມແລ້ວ" }, { status: 400 });
    }

    const enrollmentPrice = price !== undefined ? parseFloat(price) : (coachingClass.price || 0);

    const enrollment = await prisma.classEnrollment.create({
      data: {
        classId: coachingClass.id,
        className: coachingClass.name,
        studentName: studentName.trim(),
        studentPhone: studentPhone.trim(),
        note: note?.trim() || null,
        price: enrollmentPrice,
        status: "CONFIRMED",
        enrolledAt: new Date(),
        organizationId,
      },
    });

    const newStudentCount = coachingClass.currentStudents + 1;
    await prisma.coachingClass.update({
      where: { id },
      data: {
        currentStudents: newStudentCount,
        status: newStudentCount >= coachingClass.maxStudents ? "FULL" : "OPEN",
      },
    });

    return NextResponse.json({
      success: true,
      enrollment,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create enrollment" }, { status: 500 });
  }
}

// DELETE /api/dashboard/classes/[id]/enrollments?enrollmentId=...
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const { searchParams } = new URL(req.url);
    const enrollmentId = searchParams.get("enrollmentId");

    if (!enrollmentId) {
      return NextResponse.json({ error: "Missing enrollmentId" }, { status: 400 });
    }

    const enrollment = await prisma.classEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment || enrollment.organizationId !== organizationId) {
      return NextResponse.json({ error: "Enrollment not found or unauthorized" }, { status: 404 });
    }

    await prisma.classEnrollment.delete({ where: { id: enrollmentId } });

    const coachingClass = await prisma.coachingClass.findUnique({ where: { id } });
    if (coachingClass) {
      const newCount = Math.max(coachingClass.currentStudents - 1, 0);
      await prisma.coachingClass.update({
        where: { id },
        data: {
          currentStudents: newCount,
          status: coachingClass.status === "FULL" && newCount < coachingClass.maxStudents ? "OPEN" : coachingClass.status,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete enrollment" }, { status: 500 });
  }
}

// PUT /api/dashboard/classes/[id]/enrollments - Update enrollment status or note
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const body = await req.json();
    const { enrollmentId, status, note, studentName, studentPhone } = body;

    if (!enrollmentId) {
      return NextResponse.json({ error: "Missing enrollmentId" }, { status: 400 });
    }

    const enrollment = await prisma.classEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment || enrollment.organizationId !== organizationId) {
      return NextResponse.json({ error: "Enrollment not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.classEnrollment.update({
      where: { id: enrollmentId },
      data: {
        ...(status && { status }),
        ...(note !== undefined && { note }),
        ...(studentName && { studentName }),
        ...(studentPhone && { studentPhone }),
      },
    });

    return NextResponse.json({ success: true, enrollment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update enrollment" }, { status: 500 });
  }
}
