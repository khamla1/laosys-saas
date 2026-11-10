import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  loadBackupFromDisk,
  restoreFromBackupPayload,
  scanBackupPayload,
} from "@/lib/backup-engine";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const actorEmail = (session?.user as any)?.email || "SUPER_ADMIN";

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const filename = path.basename(String(body.filename || ""));
    const mode = body.mode === "OVERWRITE_MODIFIED" ? "OVERWRITE_MODIFIED" : "MISSING_ONLY";
    const organizationId = body.organizationId && body.organizationId !== "ALL" ? String(body.organizationId) : null;
    const selectedCollections = Array.isArray(body.selectedCollections) ? body.selectedCollections : undefined;
    const restoreUploads = body.restoreUploads !== false;

    if (!filename) {
      return NextResponse.json({ error: "ກະລຸນາເລືອກໄຟລ໌ Backup ທີ່ຕ້ອງການກູ້ຄືນ" }, { status: 400 });
    }

    const payload = loadBackupFromDisk(filename);
    const result = await restoreFromBackupPayload(payload, {
      mode,
      organizationId,
      selectedCollections,
      restoreUploads,
      actorEmail,
    });

    // Re-scan after restore so UI immediately updates with fresh state
    const updatedReport = await scanBackupPayload(payload, { organizationId });

    return NextResponse.json({
      success: true,
      message: `ກູ້ຄືນຂໍ້ມູນສຳເລັດ! (ດຶງຂໍ້ມູນທີ່ຫາຍກັບມາ ${result.restoredDocumentsCount + result.reactivatedSoftDeletedCount} ລາຍການ, ຂ້າມຂໍ້ມູນຊ້ຳ ${result.skippedDuplicateCount} ລາຍການ)`,
      result,
      report: updatedReport,
    });
  } catch (error: any) {
    console.error("[RESTORE_BACKUP_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "ເກີດຂໍ້ຜິດພາດໃນການກູ້ຄືນຂໍ້ມູນ" },
      { status: 500 }
    );
  }
}
