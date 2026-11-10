import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  loadBackupFromDisk,
  parseBackupBuffer,
  saveUploadedBackupToSeparateDir,
  scanBackupPayload,
} from "@/lib/backup-engine";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";
    let payload;
    let organizationId: string | null = null;
    let resolvedFilename = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      organizationId = (formData.get("organizationId") as string) || null;
      if (organizationId === "ALL") organizationId = null;

      if (!file) {
        return NextResponse.json({ error: "ກະລຸນາເລືອກໄຟລ໌ Backup (.json.gz ຫຼື .json) ເພື່ອອັບໂຫຼດ" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      payload = parseBackupBuffer(buffer);

      // Save uploaded backup file into the SEPARATE /backups-uploaded folder (never mixed with /backups)
      resolvedFilename = saveUploadedBackupToSeparateDir(file.name, buffer, payload);
    } else {
      const body = await request.json();
      const filename = String(body.filename || "").trim();
      organizationId = body.organizationId && body.organizationId !== "ALL" ? String(body.organizationId) : null;

      if (!filename) {
        return NextResponse.json({ error: "ກະລຸນາລະບຸຊື່ໄຟລ໌ Backup ທີ່ຕ້ອງການສະແກນ" }, { status: 400 });
      }
      resolvedFilename = path.basename(filename);
      payload = loadBackupFromDisk(resolvedFilename);
    }

    const report = await scanBackupPayload(payload, { organizationId });

    return NextResponse.json({
      success: true,
      filename: resolvedFilename,
      report,
    });
  } catch (error: any) {
    console.error("[SCAN_BACKUP_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "ເກີດຂໍ້ຜິດພາດໃນການສະແກນໄຟລ໌ Backup" },
      { status: 500 }
    );
  }
}
