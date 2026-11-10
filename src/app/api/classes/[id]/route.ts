import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/classes/[id] - Public class information
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "ລະຫັດຄລາສຮຽນບໍ່ຖືກຕ້ອງ" }, { status: 400 });
    }

    const coachingClass = await prisma.coachingClass.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            slug: true,
          },
        },
      },
    });

    if (!coachingClass) {
      return NextResponse.json({ error: "ບໍ່ພົບຂໍ້ມູນຄລາສຮຽນນີ້" }, { status: 404 });
    }

    return NextResponse.json(coachingClass);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ" }, { status: 500 });
  }
}

// POST /api/classes/[id] - Public self-enrollment by student
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "ລະຫັດຄລາສຮຽນບໍ່ຖືກຕ້ອງ" }, { status: 400 });
    }

    const body = await req.json();
    const { studentName, studentPhone, note } = body;

    if (!studentName?.trim() || !studentPhone?.trim()) {
      return NextResponse.json({ error: "ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທຕິດຕໍ່ໃຫ້ຄົບຖ້ວນ" }, { status: 400 });
    }

    const coachingClass = await prisma.coachingClass.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!coachingClass) {
      return NextResponse.json({ error: "ບໍ່ພົບຂໍ້ມູນຄລາສຮຽນນີ້" }, { status: 404 });
    }

    if (coachingClass.status !== "OPEN") {
      return NextResponse.json({ error: "ຂໍອະໄພ, ຄລາສຮຽນນີ້ປິດຮັບສະໝັກແລ້ວ" }, { status: 400 });
    }

    if (coachingClass.currentStudents >= coachingClass.maxStudents) {
      return NextResponse.json({ error: "ຂໍອະໄພ, ຄລາສຮຽນນີ້ມີນັກຮຽນເຕັມແລ້ວ" }, { status: 400 });
    }

    const newStudentCount = coachingClass.currentStudents + 1;
    const isNowFull = newStudentCount >= coachingClass.maxStudents;

    // Update class student count
    const updatedClass = await prisma.coachingClass.update({
      where: { id },
      data: {
        currentStudents: newStudentCount,
        status: isNowFull ? "FULL" : "OPEN",
      },
    });

    // Create ClassEnrollment record in database
    const newEnrollment = await prisma.classEnrollment.create({
      data: {
        classId: coachingClass.id,
        className: coachingClass.name,
        studentName: studentName.trim(),
        studentPhone: studentPhone.trim(),
        note: note?.trim() || null,
        price: coachingClass.price || 0,
        status: "CONFIRMED",
        enrolledAt: new Date(),
        organizationId: coachingClass.organizationId,
      },
    });

    // Create system notification for organization admin
    try {
      await prisma.notification.create({
        data: {
          organizationId: coachingClass.organizationId,
          title: `ມີນັກຮຽນລົງທະບຽນໃໝ່: ${studentName.trim()}`,
          message: `ລົງທະບຽນເຂົ້າຄລາສ "${coachingClass.name}" - ເບີໂທ: ${studentPhone.trim()}${note?.trim() ? ` (ໝາຍເຫດ: ${note.trim()})` : ""}`,
          type: "CLASS_ENROLLMENT",
          link: "/dashboard/coaching/classes",
        },
      });
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "ລົງທະບຽນສຳເລັດແລ້ວ!",
      class: updatedClass,
      enrollment: {
        id: newEnrollment.id,
        receiptNo: `ENR-${newEnrollment.id.slice(-6).toUpperCase()}`,
        studentName: newEnrollment.studentName,
        studentPhone: newEnrollment.studentPhone,
        note: newEnrollment.note,
        price: newEnrollment.price,
        status: newEnrollment.status,
        enrolledAt: newEnrollment.enrolledAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ເກີດຂໍ້ຜິດພາດໃນການລົງທະບຽນ" }, { status: 500 });
  }
}
