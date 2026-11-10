import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as readline from "readline/promises";
import dotenv from "dotenv";

// Explicitly load .env from the project root
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const execAsync = promisify(exec);
const BASE_BACKUP_DIR = "C:\\LAOSYS_BACKUPS";
const LOG_FILE = path.join(BASE_BACKUP_DIR, "restore.log");

function appendLog(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  if (fs.existsSync(BASE_BACKUP_DIR)) {
    fs.appendFileSync(LOG_FILE, logMessage);
  }
}

async function runRestore() {
  try {
    const folderName = process.argv[2];
    if (!folderName) {
      console.error("Please provide a backup folder name. Example: npx tsx scripts/restore.ts 2026-06-18");
      process.exit(0);
    }

    const backupPath = path.join(BASE_BACKUP_DIR, folderName, "database.gz");
    if (!fs.existsSync(backupPath)) {
      console.error(`Backup file not found at: ${backupPath}`);
      process.exit(0);
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL is not set in .env");
    }

    // Require confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await rl.question("Are you sure? This will overwrite database (y/N): ");
    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log("Restore cancelled.");
      process.exit(0);
    }

    console.log(`Starting restore from ${backupPath}...`);

    // Run mongorestore with --drop to overwrite existing collections
    const mongorestorePath = fs.existsSync("C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongorestore.exe") 
      ? '"C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongorestore.exe"' 
      : "mongorestore";

    const command = `${mongorestorePath} --uri="${dbUrl}" --archive="${backupPath}" --gzip --drop`;
    
    await execAsync(command);

    appendLog(`[RESTORE SUCCESS] - Database restored from ${folderName}`);
    console.log("[RESTORE SUCCESS]");

  } catch (error: any) {
    appendLog(`[RESTORE FAILED] - ${error.message}`);
    console.error("[RESTORE FAILED]", error);
    process.exit(0); // Exit gracefully without crashing
  }
}

runRestore();
