import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const records = await prisma.medicalCertificate.findMany({
      where: { organizationId },
      orderBy: { issueDate: 'desc' }
    });

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const user = session.user as any;
    const body = await req.json();
    let { 
      certificateNo, patientName, patientAge, patientGender, patientPhone,
      diagnosis, symptoms, doctorAdvice, doctorName, doctorLicense,
      fitnessStatus, status, leaveDays, leaveStartDate, leaveEndDate,
      hospitalName, issueDate
    } = body;

    if (!patientName || !diagnosis || !doctorName) {
      return NextResponse.json({ error: "ກະລຸນາປ້ອນຊື່ຄົນເຈັບ, ການວິນິດໄສ ແລະ ຊື່ແພດຜູ້ກວດ" }, { status: 400 });
    }

    if (!certificateNo) {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      certificateNo = `MC-${todayStr}-${randomSuffix}`;
    }

    const existing = await prisma.medicalCertificate.findUnique({ where: { certificateNo } });
    if (existing) {
      return NextResponse.json({ error: "ເລກທີໃບຢັ້ງຢືນນີ້ມີໃນລະບົບແລ້ວ" }, { status: 400 });
    }

    const currentStatus = status || "STANDARD";
    const initialHistory = [
      {
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: "ISSUE_CERTIFICATE",
        changedBy: {
          id: user.id || null,
          name: user.name || "Doctor",
          email: user.email || "",
          role: user.role || "DOCTOR"
        },
        changedAt: new Date().toISOString(),
        note: `ອອກໃບຢັ້ງຢືນການແພດເລກທີ ${certificateNo} ໃຫ້ແກ່ ${patientName}`
      }
    ];

    const record = await prisma.medicalCertificate.create({
      data: {
        certificateNo,
        patientName,
        patientAge: Number(patientAge) || 0,
        patientGender: patientGender || "ຊາຍ",
        patientPhone: patientPhone || null,
        diagnosis,
        symptoms: symptoms || null,
        doctorAdvice: doctorAdvice || null,
        doctorName,
        doctorLicense: doctorLicense || null,
        fitnessStatus: fitnessStatus || "FIT",
        status: currentStatus,
        leaveDays: leaveDays ? Number(leaveDays) : null,
        leaveStartDate: leaveStartDate ? new Date(leaveStartDate) : null,
        leaveEndDate: leaveEndDate ? new Date(leaveEndDate) : null,
        hospitalName: hospitalName || "Sports Complex Medical & Recovery Center",
        statusHistory: initialHistory,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        organizationId
      }
    });

    try {
      await (prisma as any).auditLog?.create({
        data: {
          action: "CREATE_MEDICAL_CERTIFICATE",
          entity: "MedicalCertificate",
          entityId: record.id,
          userId: user.id || "system",
          userName: user.name || "Doctor",
          organizationId,
          details: `ອອກໃບຢັ້ງຢືນເລກທີ ${certificateNo} (${patientName})`
        }
      });
    } catch (_) {}

    return NextResponse.json(record);
  } catch (error: any) {
    console.error("Certificate POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
