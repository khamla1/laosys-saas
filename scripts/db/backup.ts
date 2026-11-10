import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Explicitly load .env from the project root
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BASE_BACKUP_DIR = "C:\\LAOSYS_BACKUPS";
const LOG_FILE = path.join(BASE_BACKUP_DIR, "backup.log");
const RETENTION_DAYS = 30;

function appendLog(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  if (fs.existsSync(BASE_BACKUP_DIR)) {
    fs.appendFileSync(LOG_FILE, logMessage);
  }
}

function getMongodumpPath(): string {
  const defaultPath = "C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongodump.exe";
  return fs.existsSync(defaultPath) ? `"${defaultPath}"` : "mongodump";
}

function runBackup() {
  try {
    // 1. Check if C:\LAOSYS_BACKUPS exists, if not -> create
    if (!fs.existsSync(BASE_BACKUP_DIR)) {
      fs.mkdirSync(BASE_BACKUP_DIR, { recursive: true });
    }

    const mongodumpPath = getMongodumpPath();

    // Extra Validation: Check mongodump exists
    try {
      execSync(`${mongodumpPath} --version`, { stdio: "ignore" });
    } catch (err) {
      appendLog("[MONGODUMP NOT INSTALLED]");
      console.error("[MONGODUMP NOT INSTALLED]");
      throw new Error("mongodump command failed or not installed");
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL is not set in .env");
    }

    // 2. Format YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const folderName = `${yyyy}-${mm}-${dd}`;
    
    // Also create daily folder
    const dailyBackupDir = path.join(BASE_BACKUP_DIR, folderName);
    if (!fs.existsSync(dailyBackupDir)) {
      fs.mkdirSync(dailyBackupDir, { recursive: true });
    }

    // Save backups as C:\LAOSYS_BACKUPS\YYYY-MM-DD\database.gz
    const backupPath = path.join(dailyBackupDir, "database.gz");

    // Correct command: --archive + --gzip
    const command = `${mongodumpPath} --uri="${dbUrl}" --archive="${backupPath}" --gzip`;
    
    // Use child_process execSync
    execSync(command, { stdio: "inherit" });

    // VERIFY BACKUP (CRITICAL)
    if (!fs.existsSync(backupPath)) {
      throw new Error("Backup file was not created");
    }

    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    if (stats.size === 0) {
      appendLog("[BACKUP FAILED: EMPTY FILE]");
      console.error("[BACKUP FAILED: EMPTY FILE]");
      throw new Error("Backup file is empty (0 KB)");
    }

    // Retention Policy: Keep only last 30 backups
    const items = fs.readdirSync(BASE_BACKUP_DIR, { withFileTypes: true });
    const now = Date.now();

    for (const item of items) {
      if (item.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(item.name)) {
        const folderPath = path.join(BASE_BACKUP_DIR, item.name);
        const folderStats = fs.statSync(folderPath);
        const diffDays = (now - folderStats.mtime.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays > RETENTION_DAYS) {
          // Delete older backups automatically
          fs.rmSync(folderPath, { recursive: true, force: true });
        }
      }
    }

    // Logging
    const successMsg = `[BACKUP SUCCESS] - File Size: ${fileSizeMB} MB`;
    appendLog(successMsg);
    console.log(successMsg);

  } catch (error: any) {
    appendLog(`[BACKUP FAILED] - ${error.message}`);
    console.error("[BACKUP FAILED]", error.message);
  }
}

runBackup();
