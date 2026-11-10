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

    const records = await prisma.clinicRecord.findMany({
      where: { organizationId },
      orderBy: { visitDate: 'desc' }
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
    const { 
      patientName, patientAge, patientGender, patientPhone,
      bloodType, allergies, weight, height,
      chiefComplaint, diagnosis, treatment, medications,
      bloodPressure, temperature, pulse, oxygenSat,
      doctorNotes, doctorName, followUpDate, cost,
      status, visitDate 
    } = body;

    if (!patientName || !patientAge || !chiefComplaint) {
      return NextResponse.json({ error: "ກະລຸນາປ້ອນຂໍ້ມູນຄົນເຈັບ ແລະ ອາການສຳຄັນ" }, { status: 400 });
    }

    const currentStatus = status || "COMPLETED";
    const initialStatusHistory = [
      {
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: "CREATE",
        fromStatus: null,
        toStatus: currentStatus,
        note: "ບັນທຶກປະຫວັດການປິ່ນປົວໃໝ່",
        changedBy: {
          id: user.id || null,
          name: user.name || "Staff",
          email: user.email || "",
          role: user.role || "USER"
        },
        changedAt: new Date().toISOString()
      }
    ];

    const record = await prisma.clinicRecord.create({
      data: {
        patientName,
        patientAge: parseInt(patientAge),
        patientGender: patientGender || "ຊາຍ",
        patientPhone: patientPhone || null,
        bloodType: bloodType || "O",
        allergies: allergies || null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        chiefComplaint,
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        medications: Array.isArray(medications) ? medications : [],
        bloodPressure: bloodPressure || null,
        temperature: temperature || null,
        pulse: pulse || null,
        oxygenSat: oxygenSat || null,
        doctorNotes: doctorNotes || null,
        doctorName: doctorName || user.name || "Doctor",
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        cost: cost ? parseFloat(cost) : 0,
        status: currentStatus,
        statusHistory: initialStatusHistory,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        organizationId
      }
    });

    try {
      await (prisma as any).auditLog?.create({
        data: {
          action: "CREATE_CLINIC_RECORD",
          entity: "ClinicRecord",
          entityId: record.id,
          userId: user.id || "system",
          userName: user.name || "Staff",
          organizationId,
          details: `ບັນທຶກປະຫວັດຄົນເຈັບ ${patientName} (${chiefComplaint})`
        }
      });
    } catch (_) {}

    return NextResponse.json(record);
  } catch (error: any) {
    console.error("Clinic POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
