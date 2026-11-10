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

    const record = await prisma.clinicRecord.findUnique({ where: { id } });
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

    const existing = await prisma.clinicRecord.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const {
      patientName, patientAge, patientGender, patientPhone,
      bloodType, allergies, weight, height,
      chiefComplaint, diagnosis, treatment, medications,
      bloodPressure, temperature, pulse, oxygenSat,
      doctorNotes, doctorName, followUpDate, cost,
      status, auditNote
    } = body;

    const newStatus = status !== undefined ? status : existing.status;
    const currentHistory = Array.isArray(existing.statusHistory) ? existing.statusHistory : [];
    
    const newHistoryEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: newStatus !== existing.status ? "STATUS_CHANGE" : "UPDATE",
      fromStatus: existing.status,
      toStatus: newStatus,
      note: auditNote || (newStatus !== existing.status ? `ປ່ຽນສະຖານະຈາກ ${existing.status} ເປັນ ${newStatus}` : "ອັບເດດຂໍ້ມູນການປິ່ນປົວ"),
      changedBy: {
        id: user.id || null,
        name: user.name || "Staff",
        email: user.email || "",
        role: user.role || "USER"
      },
      changedAt: new Date().toISOString()
    };

    const updated = await prisma.clinicRecord.update({
      where: { id },
      data: {
        patientName: patientName !== undefined ? patientName : existing.patientName,
        patientAge: patientAge !== undefined ? parseInt(patientAge) : existing.patientAge,
        patientGender: patientGender !== undefined ? patientGender : existing.patientGender,
        patientPhone: patientPhone !== undefined ? patientPhone : existing.patientPhone,
        bloodType: bloodType !== undefined ? bloodType : existing.bloodType,
        allergies: allergies !== undefined ? allergies : existing.allergies,
        weight: weight !== undefined ? (weight ? parseFloat(weight) : null) : existing.weight,
        height: height !== undefined ? (height ? parseFloat(height) : null) : existing.height,
        chiefComplaint: chiefComplaint !== undefined ? chiefComplaint : existing.chiefComplaint,
        diagnosis: diagnosis !== undefined ? diagnosis : existing.diagnosis,
        treatment: treatment !== undefined ? treatment : existing.treatment,
        medications: medications !== undefined ? medications : existing.medications,
        bloodPressure: bloodPressure !== undefined ? bloodPressure : existing.bloodPressure,
        temperature: temperature !== undefined ? temperature : existing.temperature,
        pulse: pulse !== undefined ? pulse : existing.pulse,
        oxygenSat: oxygenSat !== undefined ? oxygenSat : existing.oxygenSat,
        doctorNotes: doctorNotes !== undefined ? doctorNotes : existing.doctorNotes,
        doctorName: doctorName !== undefined ? doctorName : existing.doctorName,
        followUpDate: followUpDate !== undefined ? (followUpDate ? new Date(followUpDate) : null) : existing.followUpDate,
        cost: cost !== undefined ? (cost ? parseFloat(cost) : 0) : existing.cost,
        status: newStatus,
        statusHistory: [...currentHistory, newHistoryEntry]
      }
    });

    try {
      await (prisma as any).auditLog?.create({
        data: {
          action: "UPDATE_CLINIC_RECORD",
          entity: "ClinicRecord",
          entityId: id,
          userId: user.id || "system",
          userName: user.name || "Staff",
          organizationId,
          details: `ອັບເດດປະຫວັດຄົນເຈັບ ${updated.patientName} (ສະຖານະ: ${newStatus})`
        }
      });
    } catch (_) {}

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Clinic PUT Error:", error);
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

    const record = await prisma.clinicRecord.findUnique({ where: { id } });
    if (!record || record.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.clinicRecord.delete({ where: { id } });

    try {
      await (prisma as any).auditLog?.create({
        data: {
          action: "DELETE_CLINIC_RECORD",
          entity: "ClinicRecord",
          entityId: id,
          userId: user.id || "system",
          userName: user.name || "Staff",
          organizationId,
          details: `ລົບປະຫວັດການປິ່ນປົວຂອງ ${record.patientName}`
        }
      });
    } catch (_) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
