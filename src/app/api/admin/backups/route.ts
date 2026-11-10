import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  createSystemBackup,
  enforceBackupRetention,
  getBackupSystemConfig,
  getMetaSidecarPath,
  listBackupFiles,
  resolveBackupFilePath,
  saveBackupSystemConfig,
} from "@/lib/backup-engine";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const downloadFile = searchParams.get("download");

    if (downloadFile) {
      const safeName = path.basename(downloadFile);
      const { fullPath } = resolveBackupFilePath(safeName);
      if (!fs.existsSync(fullPath)) {
        return NextResponse.json({ error: "ບໍ່ພົບໄຟລ໌ Backup ທີ່ຕ້ອງການດາວໂຫຼດ" }, { status: 404 });
      }
      const fileBuffer = fs.readFileSync(fullPath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/gzip",
          "Content-Disposition": `attachment; filename="${safeName}"`,
          "Content-Length": String(fileBuffer.length),
        },
      });
    }

    const data = await listBackupFiles({ checkAutoDaily: true });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[GET_ADMIN_BACKUPS_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "ເກີດຂໍ້ຜິດພາດໃນການດຶງລາຍການ Backup" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const userEmail = (session?.user as any)?.email || "ADMIN";

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "CREATE_MANUAL") {
      const created = await createSystemBackup({
        triggerType: "MANUAL",
        note: body.note || "ສຳຮອງຂໍ້ມູນດ່ວນໂດຍ Super Admin",
        createdBy: userEmail,
      });
      const updated = await listBackupFiles({ checkAutoDaily: false });
      return NextResponse.json({
        success: true,
        message: `ສ້າງໄຟລ໌ Backup (${created.filename}) ລົງໂຟນເດີ /backups/backup ສຳເລັດແລ້ວ!`,
        created,
        ...updated,
      });
    }

    if (action === "UPDATE_CONFIG") {
      const retentionDays = Math.max(1, Math.min(90, Number(body.retentionDays) || 2));
      const autoBackupEnabled = body.autoBackupEnabled !== undefined ? Boolean(body.autoBackupEnabled) : true;

      await saveBackupSystemConfig({
        retentionDays,
        autoBackupEnabled,
      });
      const cleanup = await enforceBackupRetention();
      const updated = await listBackupFiles({ checkAutoDaily: false });

      return NextResponse.json({
        success: true,
        message: `ບັນທຶກການຕັ້ງຄ່າສຳເລັດ (ເກັບຍ້ອນຫຼັງ ${retentionDays} ວັນລ່າສຸດ${cleanup.deletedFiles.length > 0 ? `, ລຶບໄຟລ໌ເກົ່າອອກ ${cleanup.deletedFiles.length} ໄຟລ໌` : ""})`,
        deletedFiles: cleanup.deletedFiles,
        ...updated,
      });
    }

    if (action === "TOGGLE_PIN") {
      const filename = path.basename(String(body.filename || ""));
      const cfg = await getBackupSystemConfig();
      const pinnedSet = new Set(cfg.pinnedFiles || []);
      let isPinned = false;

      if (pinnedSet.has(filename)) {
        pinnedSet.delete(filename);
        isPinned = false;
      } else {
        pinnedSet.add(filename);
        isPinned = true;
      }

      await saveBackupSystemConfig({ pinnedFiles: Array.from(pinnedSet) });
      const updated = await listBackupFiles({ checkAutoDaily: false });
      return NextResponse.json({
        success: true,
        message: isPinned
          ? `ປັກໝຸດໄຟລ໌ ${filename} ແລ້ວ (ລະບົບຈະບໍ່ລຶບໄຟລ໌ນີ້ອັດຕະໂນມັດ)`
          : `ຍົກເລີກການປັກໝຸດໄຟລ໌ ${filename} ແລ້ວ`,
        ...updated,
      });
    }

    if (action === "DELETE_FILE") {
      const filename = path.basename(String(body.filename || ""));
      const cfg = await getBackupSystemConfig();
      if (cfg.pinnedFiles.includes(filename)) {
        return NextResponse.json(
          { error: "ໄຟລ໌ນີ້ຖືກປັກໝຸດ (🔒 Pinned) ໄວ້ ກະລຸນາປົດໝຸດກ່ອນລຶບ" },
          { status: 400 }
        );
      }

      const { fullPath, folderName } = resolveBackupFilePath(filename);
      const sidecarPath = getMetaSidecarPath(filename);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      if (fs.existsSync(sidecarPath)) fs.unlinkSync(sidecarPath);

      const updated = await listBackupFiles({ checkAutoDaily: false });
      return NextResponse.json({
        success: true,
        message: `ລຶບໄຟລ໌ ${filename} ອອກຈາກໂຟນເດີ /${folderName} ສຳເລັດແລ້ວ`,
        ...updated,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[POST_ADMIN_BACKUPS_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "ເກີດຂໍ້ຜິດພາດໃນການຈັດການ Backup" },
      { status: 500 }
    );
  }
}
