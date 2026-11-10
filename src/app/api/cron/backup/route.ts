import { NextResponse } from "next/server";
import { createSystemBackup, enforceBackupRetention, getBackupSystemConfig } from "@/lib/backup-engine";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow localhost internal calls or Bearer CRON_SECRET
  const host = request.headers.get("host") || "";
  const isLocalhost = host.startsWith("localhost:") || host.startsWith("127.0.0.1:");

  if (!isLocalhost && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const config = await getBackupSystemConfig();
    if (!config.autoBackupEnabled) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: "Auto-backup is currently disabled in settings.",
      });
    }

    const created = await createSystemBackup({
      triggerType: "AUTO_DAILY",
      note: "ສຳຮອງຂໍ້ມູນອັດຕະໂນມັດປະຈຳວັນ (Scheduled Daily Backup)",
      createdBy: "SYSTEM_SCHEDULER",
    });

    const cleanup = await enforceBackupRetention();

    return NextResponse.json({
      success: true,
      created,
      deletedOldFiles: cleanup.deletedFiles,
    });
  } catch (error: any) {
    console.error("[CRON_BACKUP_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
