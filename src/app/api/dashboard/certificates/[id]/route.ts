import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const { id } = await params;

    const record = await prisma.medicalCertificate.findUnique({ where: { id } });
    if (!record || record.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const user = session.user as any;
    const { id } = await params;

    const existing = await prisma.medicalCertificate.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const { 
      patientName, patientAge, patientGender, patientPhone,
      diagnosis, symptoms, doctorAdvice, doctorName, doctorLicense,
      fitnessStatus, status, leaveDays, leaveStartDate, leaveEndDate,
      hospitalName, auditNote
    } = body;

    const currentHistory = Array.isArray(existing.statusHistory) ? existing.statusHistory : [];
    const newHistoryEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: "UPDATE_CERTIFICATE",
      changedBy: {
        id: user.id || null,
        name: user.name || "Doctor",
        email: user.email || "",
        role: user.role || "DOCTOR"
      },
      changedAt: new Date().toISOString(),
      note: auditNote || "ອັບເດດຂໍ້ມູນໃບຢັ້ງຢືນການແພດ"
    };

    const updated = await prisma.medicalCertificate.update({
      where: { id },
      data: {
        patientName: patientName ?? existing.patientName,
        patientAge: patientAge !== undefined ? Number(patientAge) : existing.patientAge,
        patientGender: patientGender ?? existing.patientGender,
        patientPhone: patientPhone !== undefined ? patientPhone : existing.patientPhone,
        diagnosis: diagnosis ?? existing.diagnosis,
        symptoms: symptoms !== undefined ? symptoms : existing.symptoms,
        doctorAdvice: doctorAdvice !== undefined ? doctorAdvice : existing.doctorAdvice,
        doctorName: doctorName ?? existing.doctorName,
        doctorLicense: doctorLicense !== undefined ? doctorLicense : existing.doctorLicense,
        fitnessStatus: fitnessStatus ?? existing.fitnessStatus,
        status: status ?? existing.status,
        leaveDays: leaveDays !== undefined ? (leaveDays ? Number(leaveDays) : null) : existing.leaveDays,
        leaveStartDate: leaveStartDate !== undefined ? (leaveStartDate ? new Date(leaveStartDate) : null) : existing.leaveStartDate,
        leaveEndDate: leaveEndDate !== undefined ? (leaveEndDate ? new Date(leaveEndDate) : null) : existing.leaveEndDate,
        hospitalName: hospitalName ?? existing.hospitalName,
        statusHistory: [...currentHistory, newHistoryEntry]
      }
    });

    try {
      await (prisma as any).auditLog?.create({
        data: {
          action: "UPDATE_MEDICAL_CERTIFICATE",
          entity: "MedicalCertificate",
          entityId: id,
          userId: user.id || "system",
          userName: user.name || "Doctor",
          organizationId,
          details: `ອັບເດດໃບຢັ້ງຢືນເລກທີ ${updated.certificateNo}`
        }
      });
    } catch (_) {}

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Certificate PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const user = session.user as any;
    const { id } = await params;

    const existing = await prisma.medicalCertificate.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.medicalCertificate.delete({ where: { id } });

    try {
      await (prisma as any).auditLog?.create({
        data: {
          action: "DELETE_MEDICAL_CERTIFICATE",
          entity: "MedicalCertificate",
          entityId: id,
          userId: user.id || "system",
          userName: user.name || "Doctor",
          organizationId,
          details: `ລົບໃບຢັ້ງຢືນເລກທີ ${existing.certificateNo} ຂອງ ${existing.patientName}`
        }
      });
    } catch (_) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
