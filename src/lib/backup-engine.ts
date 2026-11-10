import fs from "fs";
import path from "path";
import zlib from "zlib";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendDiscordEmbed } from "@/lib/discord";

// ============================================================================
// CONSTANTS & SEPARATED SUBDIRECTORY PATHS INSIDE /backups
// ============================================================================
// Main root folder: C:\Multi-Tenant SaaS\backups
export const BACKUP_ROOT_DIR = path.join(process.cwd(), "backups");

// 1. Subfolder strictly for system backups (Auto-daily & Manual snapshots): /backups/backup
export const BACKUP_SYSTEM_DIR = path.join(BACKUP_ROOT_DIR, "backup");

// 2. Subfolder strictly for user-uploaded backup/update files: /backups/update
export const BACKUP_UPLOADED_DIR = path.join(BACKUP_ROOT_DIR, "update");

// 3. Internal cache folder for metadata sidecars & deduplicated media vault
//    (Stored outside /backups so Windows Explorer stays 100% clean)
export const BACKUP_INTERNAL_CACHE_DIR = path.join(
  process.cwd(),
  "node_modules",
  ".cache",
  "laosys-backup-vault"
);
export const BACKUP_META_DIR = path.join(BACKUP_INTERNAL_CACHE_DIR, "metadata");
export const BACKUP_VAULT_DIR = path.join(BACKUP_INTERNAL_CACHE_DIR, "media-vault");

// 4. Live uploads folder
export const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export interface CollectionMetaInfo {
  name: string;
  labelLao: string;
  category: "CORE" | "COMMERCE" | "INVENTORY" | "FINANCE" | "SERVICES" | "SYSTEM";
  iconName: string;
}

export const COLLECTION_METADATA: Record<string, CollectionMetaInfo> = {
  Organization: { name: "Organization", labelLao: "ຮ້ານຄ້າ / ບໍລິສັດ (Organizations)", category: "CORE", iconName: "Store" },
  User: { name: "User", labelLao: "ບັນຊີຜູ້ໃຊ້ງານ (Users)", category: "CORE", iconName: "Users" },
  UserOrganization: { name: "UserOrganization", labelLao: "ສິດທິພະນັກງານໃນຮ້ານ (User Roles)", category: "CORE", iconName: "Shield" },
  Storefront: { name: "Storefront", labelLao: "ຕັ້ງຄ່າໜ້າຮ້ານອອນລາຍ (Storefronts)", category: "COMMERCE", iconName: "LayoutTemplate" },
  Category: { name: "Category", labelLao: "ໝວດໝູ່ສິນຄ້າ (Categories)", category: "INVENTORY", iconName: "Tags" },
  Product: { name: "Product", labelLao: "ສິນຄ້າ ແລະ ລາຄາ (Products)", category: "INVENTORY", iconName: "Package" },
  Order: { name: "Order", labelLao: "ອໍເດີ ແລະ ໃບບິນຂາຍ (Orders)", category: "COMMERCE", iconName: "ShoppingBag" },
  OrderItem: { name: "OrderItem", labelLao: "ລາຍການສິນຄ້າໃນໃບບິນ (Order Items)", category: "COMMERCE", iconName: "ListChecks" },
  Coupon: { name: "Coupon", labelLao: "ຄູປອງສ່ວນຫຼຸດ (Coupons)", category: "COMMERCE", iconName: "TicketPercent" },
  Promotion: { name: "Promotion", labelLao: "ໂປຣໂມຊັນ & Flash Sale (Promotions)", category: "COMMERCE", iconName: "Sparkles" },
  Setting: { name: "Setting", labelLao: "ການຕັ້ງຄ່າ & ສະມາຊິກອອນລາຍ (Settings & CRM)", category: "CORE", iconName: "Settings" },
  Transaction: { name: "Transaction", labelLao: "ທຸລະກຳການເງິນລາຍຮັບ-ຈ່າຍ (Transactions)", category: "FINANCE", iconName: "DollarSign" },
  Invoice: { name: "Invoice", labelLao: "ໃບແຈ້ງໜີ້ (Invoices)", category: "FINANCE", iconName: "FileText" },
  Quotation: { name: "Quotation", labelLao: "ໃບສະເໜີລາຄາ (Quotations)", category: "FINANCE", iconName: "FileSpreadsheet" },
  JournalEntry: { name: "JournalEntry", labelLao: "ບັນຊີລາຍວັນ (Journal Entries)", category: "FINANCE", iconName: "BookOpen" },
  ChartOfAccount: { name: "ChartOfAccount", labelLao: "ຜັງບັນຊີ (Chart of Accounts)", category: "FINANCE", iconName: "PieChart" },
  StockMovement: { name: "StockMovement", labelLao: "ປະຫວັດເຄື່ອນໄຫວສະຕ໊ອກ (Stock Movements)", category: "INVENTORY", iconName: "ArrowLeftRight" },
  Warehouse: { name: "Warehouse", labelLao: "ຄັງສິນຄ້າ (Warehouses)", category: "INVENTORY", iconName: "Warehouse" },
  Supplier: { name: "Supplier", labelLao: "ຜູ້ສະໜອງສິນຄ້າ (Suppliers)", category: "INVENTORY", iconName: "Truck" },
  PurchaseOrder: { name: "PurchaseOrder", labelLao: "ໃບສັ່ງຊື້ເຂົ້າສາງ (Purchase Orders)", category: "INVENTORY", iconName: "ClipboardList" },
  Package: { name: "Package", labelLao: "ແພັກເກດລະບົບ (SaaS Packages)", category: "SYSTEM", iconName: "Crown" },
  SubscriptionRequest: { name: "SubscriptionRequest", labelLao: "ຄຳຂໍຕໍ່ອາຍຸແພັກເກດ (Subscriptions)", category: "SYSTEM", iconName: "CreditCard" },
  Zone: { name: "Zone", labelLao: "ໂຊນໂຕະຮ້ານອາຫານ (Restaurant Zones)", category: "SERVICES", iconName: "MapPin" },
  Table: { name: "Table", labelLao: "ໂຕະອາຫານ (Tables)", category: "SERVICES", iconName: "Utensils" },
  ModifierGroup: { name: "ModifierGroup", labelLao: "ກຸ່ມຕົວເລືອກອາຫານ (Modifier Groups)", category: "SERVICES", iconName: "Sliders" },
  Modifier: { name: "Modifier", labelLao: "ຕົວເລືອກເພີ່ມເຕີມ (Modifiers)", category: "SERVICES", iconName: "PlusCircle" },
  KitchenTicket: { name: "KitchenTicket", labelLao: "ໃບສັ່ງອາຫານເຮືອນຄົວ (Kitchen Tickets)", category: "SERVICES", iconName: "ChefHat" },
  RepairTicket: { name: "RepairTicket", labelLao: "ໃບຮັບສ້ອມແປງ (Repair Tickets)", category: "SERVICES", iconName: "Wrench" },
  WarrantyRecord: { name: "WarrantyRecord", labelLao: "ຂໍ້ມູນຮັບປະກັນສິນຄ້າ (Warranties)", category: "SERVICES", iconName: "ShieldCheck" },
  RentalOrder: { name: "RentalOrder", labelLao: "ລາຍການເຊົ່າອຸປະກອນ (Rental Orders)", category: "SERVICES", iconName: "Timer" },
  EquipmentItem: { name: "EquipmentItem", labelLao: "ອຸປະກອນໃຫ້ເຊົ່າ (Equipment)", category: "SERVICES", iconName: "Box" },
  Appointment: { name: "Appointment", labelLao: "ນັດໝາຍ & ການຈອງ (Appointments)", category: "SERVICES", iconName: "Calendar" },
  FacilityBooking: { name: "FacilityBooking", labelLao: "ການຈອງເດີ່ນກິລາ (Court Bookings)", category: "SERVICES", iconName: "Trophy" },
  ClinicRecord: { name: "ClinicRecord", labelLao: "ປະຫວັດຄົນເຈັບຄລີນິກ (Clinic Records)", category: "SERVICES", iconName: "Activity" },
  MedicalCertificate: { name: "MedicalCertificate", labelLao: "ໃບຢັ້ງຢືນແພດ (Medical Certificates)", category: "SERVICES", iconName: "FileCheck" },
  EmployeeProfile: { name: "EmployeeProfile", labelLao: "ຂໍ້ມູນພະນັກງານ (Employees)", category: "CORE", iconName: "UserCheck" },
  Branch: { name: "Branch", labelLao: "ຂໍ້ມູນສາຂາ (Branches)", category: "CORE", iconName: "Building" },
  ShippingRoute: { name: "ShippingRoute", labelLao: "ເສັ້ນທາງຂົນສົ່ງ (Shipping Routes)", category: "COMMERCE", iconName: "Truck" },
  LoyaltyReward: { name: "LoyaltyReward", labelLao: "ຂອງລາງວັນສະສົມແຕ້ມ (Loyalty Rewards)", category: "COMMERCE", iconName: "Gift" },
  ProductVariant: { name: "ProductVariant", labelLao: "ຕົວເລືອກຍ່ອຍສິນຄ້າ ໄຊສ໌/ສີ (Product Variants)", category: "INVENTORY", iconName: "Layers" },
  ShareLink: { name: "ShareLink", labelLao: "ລິ້ງແຊຣ໌ສິນຄ້າດ່ວນ (Quick Share Links)", category: "COMMERCE", iconName: "Share2" },
  Customer: { name: "Customer", labelLao: "ຂໍ້ມູນລູກຄ້າສະມາຊິກ (CRM Customers)", category: "COMMERCE", iconName: "Users" },
  FittingProfile: { name: "FittingProfile", labelLao: "ຂໍ້ມູນວັດແທກໄຊສ໌ລູກຄ້າ (Fitting Profiles)", category: "SERVICES", iconName: "Ruler" },
  CoachingClass: { name: "CoachingClass", labelLao: "ຄລາສຮຽນ ແລະ ໂຄດຊິ້ງ (Coaching Classes)", category: "SERVICES", iconName: "GraduationCap" },
  ClassEnrollment: { name: "ClassEnrollment", labelLao: "ລາຍຊື່ຜູ້ລົງທະບຽນຮຽນ (Class Enrollments)", category: "SERVICES", iconName: "UserPlus" },
  ServiceResource: { name: "ServiceResource", labelLao: "ຊັບພະຍາກອນ/ຫ້ອງບໍລິການ (Service Resources)", category: "SERVICES", iconName: "DoorOpen" },
  Ingredient: { name: "Ingredient", labelLao: "ວັດຖຸດິບເຮືອນຄົວ (Ingredients)", category: "SERVICES", iconName: "Utensils" },
  RecipeItem: { name: "RecipeItem", labelLao: "ສູດອາຫານ & ຕົ້ນທຶນ (Recipe Items)", category: "SERVICES", iconName: "BookOpen" },
  Commission: { name: "Commission", labelLao: "ຄ່າຄອມມິດຊັນພະນັກງານ (Commissions)", category: "FINANCE", iconName: "Percent" },
  Installment: { name: "Installment", labelLao: "ລາຍການຜ່ອນຊຳລະ (Installments)", category: "FINANCE", iconName: "CalendarClock" },
  InventoryBarcode: { name: "InventoryBarcode", labelLao: "ລະຫັດບາໂຄ້ດສິນຄ້າ (Barcodes)", category: "INVENTORY", iconName: "Barcode" },
  InventoryExpiry: { name: "InventoryExpiry", labelLao: "ວັນໝົດອາຍຸສິນຄ້າ (Expiry Tracking)", category: "INVENTORY", iconName: "Clock" },
  SerialNumber: { name: "SerialNumber", labelLao: "ເລກ Serial ອຸປະກອນ (Serial Numbers)", category: "INVENTORY", iconName: "Hash" },
  ConsignmentItem: { name: "ConsignmentItem", labelLao: "ສິນຄ້າຝາກຂາຍ/ມືສອງ (Consignment)", category: "INVENTORY", iconName: "Repeat" },
  SecondHandItem: { name: "SecondHandItem", labelLao: "ຄັງສິນຄ້າມືສອງ (Second-Hand Inventory)", category: "INVENTORY", iconName: "PackageOpen" },
  MediaGallery: { name: "MediaGallery", labelLao: "ຄັງຮູບພາບ ແລະ ວິດີໂອ (Media Gallery)", category: "CORE", iconName: "Image" },
  Notification: { name: "Notification", labelLao: "ການແຈ້ງເຕືອນໃນລະບົບ (Notifications)", category: "SYSTEM", iconName: "Bell" },
  AuditLog: { name: "AuditLog", labelLao: "ປະຫວັດການກະທຳ (Audit Logs)", category: "SYSTEM", iconName: "History" },
};

const EPHEMERAL_COLLECTIONS = new Set(["Session", "VerificationToken"]);

export interface UploadFileManifestEntry {
  relativePath: string;
  size: number;
  mtime: string;
  sha256: string;
  embeddedBase64?: string;
}

export interface BackupOrganizationSummary {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  orderCount: number;
}

export interface BackupArchivePayload {
  meta: {
    system: "LAOSYS_ENTERPRISE_BACKUP";
    version: "2.0";
    backupId: string;
    createdAt: string;
    dateKey: string;
    triggerType: "AUTO_DAILY" | "MANUAL" | "PRE_RESTORE" | "UPLOADED";
    note?: string;
    createdBy?: string;
    checksum: string;
    stats: {
      totalCollections: number;
      totalDocuments: number;
      totalUploads: number;
      totalUploadBytes: number;
      organizationCount: number;
    };
    organizations: BackupOrganizationSummary[];
  };
  collections: Record<string, any[]>;
  uploadsManifest: UploadFileManifestEntry[];
}

export interface BackupFileSummary {
  filename: string;
  folderType: "SYSTEM_BACKUP" | "UPLOADED_UPDATE";
  folderName: "backups/backup" | "backups/update";
  sizeBytes: number;
  createdAt: string;
  dateKey: string;
  triggerType: "AUTO_DAILY" | "MANUAL" | "PRE_RESTORE" | "UPLOADED";
  note?: string;
  pinned: boolean;
  checksum?: string;
  stats?: {
    totalCollections: number;
    totalDocuments: number;
    totalUploads: number;
    totalUploadBytes: number;
    organizationCount: number;
  };
  organizations?: BackupOrganizationSummary[];
}

export interface BackupSystemConfig {
  autoBackupEnabled: boolean;
  retentionDays: number;
  lastAutoBackupDate: string;
  lastBackupAt: string;
  pinnedFiles: string[];
}

export interface ScanItemPreview {
  id: string;
  title: string;
  subtitle?: string;
  organizationId?: string;
  organizationName?: string;
  status: "MISSING" | "SOFT_DELETED" | "MODIFIED";
  detail: string;
}

export interface CollectionScanResult {
  collection: string;
  labelLao: string;
  category: string;
  totalInBackup: number;
  totalInLiveDb: number;
  duplicateSkippedCount: number;
  missingCount: number;
  softDeletedCount: number;
  modifiedCount: number;
  restorableCount: number;
  missingPreviews: ScanItemPreview[];
  modifiedPreviews: ScanItemPreview[];
}

export interface BackupScanReport {
  backupMeta: BackupArchivePayload["meta"];
  filterOrganizationId: string | null;
  scannedAt: string;
  summary: {
    totalItemsInBackup: number;
    totalDuplicatesSkipped: number;
    totalMissingRestorable: number;
    totalSoftDeletedRestorable: number;
    totalModified: number;
    uploadsInBackup: number;
    uploadsDuplicateSkipped: number;
    uploadsMissingRestorable: number;
    uploadsMissingList: Array<{ relativePath: string; size: number; availableInVault: boolean }>;
  };
  collections: CollectionScanResult[];
}

// ============================================================================
// HELPER UTILITIES & AUTO-MIGRATION OF LEGACY MIXED FILES
// ============================================================================
let hasMigratedLegacyDirs = false;

export function getMetaSidecarPath(filename: string): string {
  const safeName = path.basename(filename);
  return path.join(BACKUP_META_DIR, `${safeName}.meta.json`);
}

export function resolveBackupFilePath(filename: string): {
  fullPath: string;
  folderType: "SYSTEM_BACKUP" | "UPLOADED_UPDATE";
  folderName: "backups/backup" | "backups/update";
} {
  const safeName = path.basename(filename);
  const inSystemBackups = path.join(BACKUP_SYSTEM_DIR, safeName);
  const inUploaded = path.join(BACKUP_UPLOADED_DIR, safeName);

  if (fs.existsSync(inUploaded)) {
    return { fullPath: inUploaded, folderType: "UPLOADED_UPDATE", folderName: "backups/update" };
  }
  if (fs.existsSync(inSystemBackups)) {
    return { fullPath: inSystemBackups, folderType: "SYSTEM_BACKUP", folderName: "backups/backup" };
  }
  if (safeName.startsWith("uploaded-")) {
    return { fullPath: inUploaded, folderType: "UPLOADED_UPDATE", folderName: "backups/update" };
  }
  return { fullPath: inSystemBackups, folderType: "SYSTEM_BACKUP", folderName: "backups/backup" };
}

export function ensureBackupDirs() {
  for (const dir of [
    BACKUP_ROOT_DIR,
    BACKUP_SYSTEM_DIR,
    BACKUP_UPLOADED_DIR,
    BACKUP_INTERNAL_CACHE_DIR,
    BACKUP_META_DIR,
    BACKUP_VAULT_DIR,
    PUBLIC_UPLOADS_DIR,
  ]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // One-time automatic cleanup to consolidate everything inside /backups/{backup,update}
  if (!hasMigratedLegacyDirs) {
    hasMigratedLegacyDirs = true;
    try {
      // 1. Move any files from legacy root-level /backups-uploaded into /backups/update and remove /backups-uploaded
      const legacyRootUploaded = path.join(process.cwd(), "backups-uploaded");
      if (fs.existsSync(legacyRootUploaded)) {
        const upEntries = fs.readdirSync(legacyRootUploaded, { withFileTypes: true });
        for (const ue of upEntries) {
          if (ue.isFile()) {
            const src = path.join(legacyRootUploaded, ue.name);
            const dest = path.join(BACKUP_UPLOADED_DIR, ue.name);
            try {
              fs.copyFileSync(src, dest);
              fs.unlinkSync(src);
            } catch {}
          }
        }
        try {
          fs.rmdirSync(legacyRootUploaded);
        } catch {}
      }

      // 2. Move any loose files directly inside /backups into /backups/backup or /backups/update
      const rootEntries = fs.readdirSync(BACKUP_ROOT_DIR, { withFileTypes: true });
      for (const entry of rootEntries) {
        if (!entry.isFile()) continue;
        const srcPath = path.join(BACKUP_ROOT_DIR, entry.name);

        if (entry.name.endsWith(".meta.json")) {
          const targetMeta = path.join(BACKUP_META_DIR, entry.name);
          try {
            fs.copyFileSync(srcPath, targetMeta);
            fs.unlinkSync(srcPath);
          } catch {}
          continue;
        }

        if (entry.name.endsWith(".json.gz") || entry.name.endsWith(".backup.json")) {
          const destDir = entry.name.startsWith("uploaded-") ? BACKUP_UPLOADED_DIR : BACKUP_SYSTEM_DIR;
          const destPath = path.join(destDir, entry.name);
          try {
            fs.copyFileSync(srcPath, destPath);
            fs.unlinkSync(srcPath);
          } catch {}
        }
      }
    } catch (e) {
      console.warn("[BACKUP_DIR_MIGRATION_WARN]", e);
    }
  }
}

export function getVientianeDateString(date = new Date()): string {
  const offsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(date.getTime() + offsetMs);
  return local.toISOString().slice(0, 10);
}

export function getVientianeTimestampSlug(date = new Date()): string {
  const offsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(date.getTime() + offsetMs);
  return local.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

export function extractDocId(doc: any): string {
  if (!doc) return "";
  if (typeof doc._id === "string") return doc._id;
  if (doc._id && typeof doc._id === "object" && typeof doc._id.$oid === "string") {
    return doc._id.$oid;
  }
  if (typeof doc.id === "string") return doc.id;
  return "";
}

export function extractRefId(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && typeof val.$oid === "string") return val.$oid;
  return String(val);
}

export function extractDocOrgId(doc: any, collectionName: string): string {
  if (!doc) return "";
  if (collectionName === "Organization") {
    return extractDocId(doc);
  }
  if (doc.organizationId) {
    return extractRefId(doc.organizationId);
  }
  return "";
}

export function getHumanTitleForDoc(doc: any, collectionName: string): { title: string; subtitle: string } {
  const id = extractDocId(doc);
  const shortId = id.slice(-6).toUpperCase();

  switch (collectionName) {
    case "Organization":
      return { title: doc.name || `ຮ້ານຄ້າ #${shortId}`, subtitle: `Slug: ${doc.slug || "-"}` };
    case "Product":
      return {
        title: doc.name || `ສິນຄ້າ #${shortId}`,
        subtitle: `ລາຄາ: ₭${Number(doc.price || 0).toLocaleString()} • ສະຕ໊ອກ: ${doc.stock ?? 0}`,
      };
    case "Category":
      return { title: doc.name || `ໝວດໝູ່ #${shortId}`, subtitle: doc.description || `ID: #${shortId}` };
    case "Order":
      return {
        title: `ໃບບິນ #${shortId} (${doc.customerName || "ລູກຄ້າທົ່ວໄປ"})`,
        subtitle: `ຍອດ: ₭${Number(doc.totalAmount || 0).toLocaleString()} • ເບີ: ${doc.customerPhone || "-"} • ສະຖານະ: ${doc.status || "-"}`,
      };
    case "OrderItem":
      return {
        title: doc.productName || `ລາຍການສິນຄ້າໃນບິນ #${shortId}`,
        subtitle: `ຈຳນວນ: ${doc.quantity || 1} x ₭${Number(doc.price || 0).toLocaleString()}`,
      };
    case "Coupon":
      return {
        title: `ຄູປອງ: ${doc.code || shortId}`,
        subtitle: `ສ່ວນຫຼຸດ: ${doc.discountType === "PERCENTAGE" ? `${doc.discountValue}%` : `₭${Number(doc.discountValue || 0).toLocaleString()}`}`,
      };
    case "User":
      return { title: doc.name || doc.email || `ຜູ້ໃຊ້ #${shortId}`, subtitle: `Email: ${doc.email || "-"} (${doc.role || "USER"})` };
    case "Setting":
      return {
        title: `ຕັ້ງຄ່າ: ${doc.key || shortId}`,
        subtitle: typeof doc.value === "string" ? doc.value.slice(0, 60) : "JSON Setting",
      };
    case "Transaction":
      return {
        title: `${doc.type || "TX"} ₭${Number(doc.amount || 0).toLocaleString()}`,
        subtitle: doc.description || `ID: #${shortId}`,
      };
    default:
      return {
        title: doc.name || doc.title || doc.code || doc.key || doc.customerName || `${collectionName} #${shortId}`,
        subtitle: `ID: ${id}`,
      };
  }
}

// ============================================================================
// SETTINGS / CONFIG MANAGEMENT IN MONGODB
// ============================================================================
export async function getBackupSystemConfig(): Promise<BackupSystemConfig> {
  try {
    const res = await (prisma as any).$runCommandRaw({
      find: "Setting",
      filter: { key: { $regex: "^backup_sys_" } },
    });
    const rows = (res as any)?.cursor?.firstBatch || [];
    const map: Record<string, string> = {};
    for (const r of rows) {
      if (r.key) map[r.key] = String(r.value ?? "");
    }

    let pinnedFiles: string[] = [];
    if (map.backup_sys_pinned_files) {
      try {
        pinnedFiles = JSON.parse(map.backup_sys_pinned_files);
      } catch {
        pinnedFiles = [];
      }
    }

    const retentionDays = Math.max(1, Math.min(90, parseInt(map.backup_sys_retention_days || "2", 10) || 2));

    return {
      autoBackupEnabled: map.backup_sys_auto_enabled !== undefined ? map.backup_sys_auto_enabled === "true" : true,
      retentionDays,
      lastAutoBackupDate: map.backup_sys_last_auto_date || "",
      lastBackupAt: map.backup_sys_last_backup_at || "",
      pinnedFiles,
    };
  } catch (err) {
    console.error("[GET_BACKUP_SYS_CONFIG_ERROR]", err);
    return {
      autoBackupEnabled: true,
      retentionDays: 2,
      lastAutoBackupDate: "",
      lastBackupAt: "",
      pinnedFiles: [],
    };
  }
}

export async function saveBackupSystemConfig(partial: Partial<BackupSystemConfig>): Promise<BackupSystemConfig> {
  const current = await getBackupSystemConfig();
  const next: BackupSystemConfig = {
    ...current,
    ...partial,
  };

  const pairs = [
    { key: "backup_sys_auto_enabled", value: String(Boolean(next.autoBackupEnabled)) },
    { key: "backup_sys_retention_days", value: String(Math.max(1, Math.min(90, Number(next.retentionDays) || 2))) },
    { key: "backup_sys_last_auto_date", value: String(next.lastAutoBackupDate || "") },
    { key: "backup_sys_last_backup_at", value: String(next.lastBackupAt || "") },
    { key: "backup_sys_pinned_files", value: JSON.stringify(Array.from(new Set(next.pinnedFiles || []))) },
  ];

  for (const item of pairs) {
    await (prisma as any).$runCommandRaw({
      update: "Setting",
      updates: [
        {
          q: { key: item.key, organizationId: null },
          u: { $set: { key: item.key, value: item.value, organizationId: null, updatedAt: { $date: new Date().toISOString() } } },
          upsert: true,
        },
      ],
    });
  }

  return next;
}

// ============================================================================
// MEDIA VAULT & PUBLIC/UPLOADS SCANNER
// ============================================================================
function walkUploadsDir(dirPath: string, baseDir: string, results: UploadFileManifestEntry[] = []): UploadFileManifestEntry[] {
  if (!fs.existsSync(dirPath)) return results;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkUploadsDir(fullPath, baseDir, results);
    } else if (entry.isFile()) {
      try {
        const stat = fs.statSync(fullPath);
        const rel = path.relative(baseDir, fullPath).replace(/\\/g, "/");
        const buf = fs.readFileSync(fullPath);
        const sha256 = crypto.createHash("sha256").update(buf).digest("hex");

        const vaultFile = path.join(BACKUP_VAULT_DIR, `${sha256}.bin`);
        if (!fs.existsSync(vaultFile)) {
          fs.writeFileSync(vaultFile, buf);
        }

        const item: UploadFileManifestEntry = {
          relativePath: rel,
          size: stat.size,
          mtime: stat.mtime.toISOString(),
          sha256,
        };

        if (stat.size > 0 && stat.size <= 120 * 1024) {
          item.embeddedBase64 = buf.toString("base64");
        }

        results.push(item);
      } catch (e) {
        console.warn("[BACKUP_UPLOAD_FILE_SKIP]", fullPath, e);
      }
    }
  }
  return results;
}

// ============================================================================
// LIST ALL MONGODB COLLECTIONS & FETCH DOCUMENTS
// ============================================================================
export async function getAllMongoCollections(): Promise<string[]> {
  const discovered = new Set<string>(Object.keys(COLLECTION_METADATA));
  try {
    const res = await (prisma as any).$runCommandRaw({
      listCollections: 1,
      nameOnly: true,
    });
    const batch = (res as any)?.cursor?.firstBatch || [];
    for (const c of batch) {
      if (c?.name && typeof c.name === "string" && !c.name.startsWith("system.")) {
        discovered.add(c.name);
      }
    }
  } catch (e) {
    console.warn("[LIST_COLLECTIONS_FALLBACK]", e);
  }

  for (const ep of EPHEMERAL_COLLECTIONS) {
    discovered.delete(ep);
  }
  return Array.from(discovered);
}

export async function fetchCollectionDocuments(collectionName: string, organizationIdFilter?: string | null): Promise<any[]> {
  try {
    const res = await (prisma as any).$runCommandRaw({
      find: collectionName,
      filter: {},
      batchSize: 50000,
    });
    const docs: any[] = (res as any)?.cursor?.firstBatch || [];
    if (!organizationIdFilter) return docs;

    return docs.filter((doc) => {
      const docOrgId = extractDocOrgId(doc, collectionName);
      if (collectionName === "Organization") {
        return docOrgId === organizationIdFilter;
      }
      return docOrgId === organizationIdFilter;
    });
  } catch {
    return [];
  }
}

// ============================================================================
// CREATE SYSTEM BACKUP (.json.gz in /backups)
// ============================================================================
export async function createSystemBackup(options?: {
  triggerType?: "AUTO_DAILY" | "MANUAL" | "PRE_RESTORE";
  note?: string;
  createdBy?: string;
}): Promise<BackupFileSummary> {
  ensureBackupDirs();
  const triggerType = options?.triggerType || "MANUAL";
  const now = new Date();
  const dateKey = getVientianeDateString(now);
  const timeSlug = getVientianeTimestampSlug(now);

  const collectionNames = await getAllMongoCollections();
  const collectionsData: Record<string, any[]> = {};
  let totalDocuments = 0;

  for (const colName of collectionNames) {
    const docs = await fetchCollectionDocuments(colName);
    if (docs.length > 0 || COLLECTION_METADATA[colName]) {
      collectionsData[colName] = docs;
      totalDocuments += docs.length;
    }
  }

  const orgDocs = collectionsData["Organization"] || [];
  const productDocs = collectionsData["Product"] || [];
  const orderDocs = collectionsData["Order"] || [];

  const organizations: BackupOrganizationSummary[] = orgDocs.map((org) => {
    const orgId = extractDocId(org);
    const productCount = productDocs.filter((p) => extractDocOrgId(p, "Product") === orgId).length;
    const orderCount = orderDocs.filter((o) => extractDocOrgId(o, "Order") === orgId).length;
    return {
      id: orgId,
      name: org.name || "ຮ້ານຄ້າ",
      slug: org.slug || orgId,
      productCount,
      orderCount,
    };
  });

  const uploadsManifest = walkUploadsDir(PUBLIC_UPLOADS_DIR, PUBLIC_UPLOADS_DIR);
  const totalUploadBytes = uploadsManifest.reduce((sum, u) => sum + (u.size || 0), 0);

  const checksumSource = JSON.stringify({
    collectionsCount: Object.keys(collectionsData).length,
    totalDocuments,
    uploadsCount: uploadsManifest.length,
    createdAt: now.toISOString(),
  });
  const checksum = crypto.createHash("sha256").update(checksumSource).digest("hex");

  const backupId = `BKP-${dateKey.replace(/-/g, "")}-${checksum.slice(0, 6).toUpperCase()}`;
  const filename =
    triggerType === "AUTO_DAILY"
      ? `laosys-auto-backup-${dateKey}.json.gz`
      : `laosys-backup-${timeSlug}-${triggerType.toLowerCase()}.json.gz`;

  const payload: BackupArchivePayload = {
    meta: {
      system: "LAOSYS_ENTERPRISE_BACKUP",
      version: "2.0",
      backupId,
      createdAt: now.toISOString(),
      dateKey,
      triggerType,
      note:
        options?.note ||
        (triggerType === "AUTO_DAILY"
          ? `ສຳຮອງຂໍ້ມູນອັດຕະໂນມັດປະຈຳວັນ (${dateKey})`
          : "ສຳຮອງຂໍ້ມູນໂດຍຜູ້ດູແລລະບົບ"),
      createdBy: options?.createdBy || "SUPER_ADMIN",
      checksum,
      stats: {
        totalCollections: Object.keys(collectionsData).length,
        totalDocuments,
        totalUploads: uploadsManifest.length,
        totalUploadBytes,
        organizationCount: organizations.length,
      },
      organizations,
    },
    collections: collectionsData,
    uploadsManifest,
  };

  const jsonBuffer = Buffer.from(JSON.stringify(payload), "utf-8");
  const compressed = zlib.gzipSync(jsonBuffer, { level: 6 });

  // Write ONLY the .json.gz archive into /backups/backup
  const filePath = path.join(BACKUP_SYSTEM_DIR, filename);
  fs.writeFileSync(filePath, compressed);

  // Store .meta.json sidecar in BACKUP_META_DIR (outside /backups)
  const sidecarPath = getMetaSidecarPath(filename);
  fs.writeFileSync(
    sidecarPath,
    JSON.stringify(
      {
        filename,
        folderType: "SYSTEM_BACKUP",
        folderName: "backups/backup",
        sizeBytes: compressed.length,
        createdAt: payload.meta.createdAt,
        dateKey: payload.meta.dateKey,
        triggerType: payload.meta.triggerType,
        note: payload.meta.note,
        checksum: payload.meta.checksum,
        stats: payload.meta.stats,
        organizations: payload.meta.organizations,
      },
      null,
      2
    ),
    "utf-8"
  );

  const cfg = await getBackupSystemConfig();
  await saveBackupSystemConfig({
    lastBackupAt: now.toISOString(),
    lastAutoBackupDate: triggerType === "AUTO_DAILY" ? dateKey : cfg.lastAutoBackupDate || dateKey,
  });

  await enforceBackupRetention();

  sendDiscordEmbed("WEBHOOK_2", {
    title: "💾 ສຳຮອງຂໍ້ມູນລະບົບສຳເລັດ (System Backup Created)",
    description: `ໄຟລ໌ Backup **\`${filename}\`** ຖືກບັນທຶກລົງໂຟນເດີ \`/backups/backup\` ຮຽບຮ້ອຍແລ້ວ.`,
    color: 0x10b981,
    fields: [
      { name: "📌 ປະເພດ", value: triggerType === "AUTO_DAILY" ? "🤖 ອັດຕະໂນມັດລາຍວັນ" : "👨‍💻 ກົດສຳຮອງດ້ວຍຕົນເອງ", inline: true },
      { name: "📦 ຂະໜາດໄຟລ໌", value: `${(compressed.length / (1024 * 1024)).toFixed(2)} MB`, inline: true },
      { name: "🏪 ຈຳນວນຮ້ານຄ້າ", value: `${organizations.length} ຮ້ານ`, inline: true },
      { name: "🗄️ ຂໍ້ມູນ Database", value: `${totalDocuments.toLocaleString()} ລາຍການ (${Object.keys(collectionsData).length} ຕາຕະລາງ)`, inline: true },
      { name: "🖼️ ໄຟລ໌ຮູບພາບໃນ Vault", value: `${uploadsManifest.length.toLocaleString()} ໄຟລ໌`, inline: true },
    ],
    timestamp: now.toISOString(),
  }).catch(() => {});

  return {
    filename,
    folderType: "SYSTEM_BACKUP",
    folderName: "backups/backup",
    sizeBytes: compressed.length,
    createdAt: payload.meta.createdAt,
    dateKey: payload.meta.dateKey,
    triggerType: payload.meta.triggerType,
    note: payload.meta.note,
    pinned: cfg.pinnedFiles.includes(filename),
    checksum: payload.meta.checksum,
    stats: payload.meta.stats,
    organizations: payload.meta.organizations,
  };
}

// ============================================================================
// SAVE UPLOADED BACKUP FILE INTO SUBFOLDER /backups/update
// ============================================================================
export function saveUploadedBackupToSeparateDir(
  originalFileName: string,
  rawBuffer: Buffer,
  payload: BackupArchivePayload
): string {
  ensureBackupDirs();
  const gzBuffer =
    rawBuffer.length >= 2 && rawBuffer[0] === 0x1f && rawBuffer[1] === 0x8b
      ? rawBuffer
      : zlib.gzipSync(rawBuffer, { level: 6 });

  const cleanOrig = originalFileName
    .replace(/^uploaded-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  const resolvedFilename = cleanOrig.endsWith(".json.gz")
    ? `uploaded-${cleanOrig}`
    : `uploaded-${cleanOrig}.json.gz`;

  // Remove any older uploaded file with the same checksum so duplicates never pile up
  const existingEntries = fs.readdirSync(BACKUP_UPLOADED_DIR, { withFileTypes: true });
  for (const entry of existingEntries) {
    if (!entry.isFile()) continue;
    const sidecar = getMetaSidecarPath(entry.name);
    if (fs.existsSync(sidecar)) {
      try {
        const meta = JSON.parse(fs.readFileSync(sidecar, "utf-8"));
        if (meta.checksum && payload.meta.checksum && meta.checksum === payload.meta.checksum && entry.name !== resolvedFilename) {
          fs.unlinkSync(path.join(BACKUP_UPLOADED_DIR, entry.name));
          fs.unlinkSync(sidecar);
        }
      } catch {}
    }
  }

  const fullPath = path.join(BACKUP_UPLOADED_DIR, resolvedFilename);
  fs.writeFileSync(fullPath, gzBuffer);

  const sidecarPath = getMetaSidecarPath(resolvedFilename);
  fs.writeFileSync(
    sidecarPath,
    JSON.stringify(
      {
        filename: resolvedFilename,
        folderType: "UPLOADED_UPDATE",
        folderName: "backups/update",
        sizeBytes: gzBuffer.length,
        createdAt: new Date().toISOString(),
        dateKey: payload.meta.dateKey || getVientianeDateString(),
        triggerType: "UPLOADED",
        note: `ໄຟລ໌ອັບໂຫຼດເພື່ອກູ້ຄືນ/ອັບເດດ (${originalFileName})`,
        checksum: payload.meta.checksum,
        stats: payload.meta.stats,
        organizations: payload.meta.organizations,
      },
      null,
      2
    ),
    "utf-8"
  );

  return resolvedFilename;
}

// ============================================================================
// READ / PARSE BACKUP FILE (FROM /backups OR /backups-uploaded)
// ============================================================================
export function parseBackupBuffer(buffer: Buffer): BackupArchivePayload {
  let rawJsonStr: string;
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
    const unzipped = zlib.gunzipSync(buffer);
    rawJsonStr = unzipped.toString("utf-8");
  } else {
    rawJsonStr = buffer.toString("utf-8");
  }

  const parsed = JSON.parse(rawJsonStr);
  if (!parsed || parsed?.meta?.system !== "LAOSYS_ENTERPRISE_BACKUP" || !parsed.collections) {
    throw new Error("ໄຟລ໌ທີ່ອັບໂຫຼດບໍ່ແມ່ນໄຟລ໌ Backup ມາດຕະຖານຂອງລະບົບ LAOSYS (Invalid Backup Format)");
  }
  return parsed as BackupArchivePayload;
}

export function loadBackupFromDisk(filename: string): BackupArchivePayload {
  ensureBackupDirs();
  const { fullPath } = resolveBackupFilePath(filename);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`ບໍ່ພົບໄຟລ໌ Backup: ${path.basename(filename)}`);
  }
  const buf = fs.readFileSync(fullPath);
  return parseBackupBuffer(buf);
}

// ============================================================================
// LIST BACKUPS ACROSS BOTH SEPARATED FOLDERS (/backups & /backups-uploaded)
// ============================================================================
export async function listBackupFiles(options?: { checkAutoDaily?: boolean }): Promise<{
  files: BackupFileSummary[];
  config: BackupSystemConfig;
  autoCreatedToday: boolean;
}> {
  ensureBackupDirs();
  let config = await getBackupSystemConfig();
  let autoCreatedToday = false;

  const todayKey = getVientianeDateString();
  if (options?.checkAutoDaily !== false && config.autoBackupEnabled && config.lastAutoBackupDate !== todayKey) {
    const expectedAutoFile = path.join(BACKUP_SYSTEM_DIR, `laosys-auto-backup-${todayKey}.json.gz`);
    if (!fs.existsSync(expectedAutoFile)) {
      try {
        await createSystemBackup({
          triggerType: "AUTO_DAILY",
          note: `ສຳຮອງຂໍ້ມູນອັດຕະໂນມັດປະຈຳວັນ (${todayKey})`,
          createdBy: "SYSTEM_CRON",
        });
        autoCreatedToday = true;
        config = await getBackupSystemConfig();
      } catch (e) {
        console.error("[AUTO_DAILY_BACKUP_FAILED]", e);
      }
    }
  }

  const backupFiles: BackupFileSummary[] = [];

  const scanFolder = (
    dirPath: string,
    folderType: "SYSTEM_BACKUP" | "UPLOADED_UPDATE",
    folderName: "backups/backup" | "backups/update"
  ) => {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".json.gz") && !entry.name.endsWith(".backup.json")) continue;

      const fullPath = path.join(dirPath, entry.name);
      const sidecarPath = getMetaSidecarPath(entry.name);
      const stat = fs.statSync(fullPath);

      let metaInfo: any = null;
      if (fs.existsSync(sidecarPath)) {
        try {
          metaInfo = JSON.parse(fs.readFileSync(sidecarPath, "utf-8"));
        } catch {
          metaInfo = null;
        }
      }

      if (!metaInfo) {
        try {
          const parsed = parseBackupBuffer(fs.readFileSync(fullPath));
          metaInfo = {
            filename: entry.name,
            folderType,
            folderName,
            sizeBytes: stat.size,
            createdAt: parsed.meta.createdAt,
            dateKey: parsed.meta.dateKey || getVientianeDateString(stat.mtime),
            triggerType: folderType === "UPLOADED_UPDATE" ? "UPLOADED" : parsed.meta.triggerType || "MANUAL",
            note: parsed.meta.note,
            checksum: parsed.meta.checksum,
            stats: parsed.meta.stats,
            organizations: parsed.meta.organizations,
          };
          fs.writeFileSync(sidecarPath, JSON.stringify(metaInfo, null, 2), "utf-8");
        } catch {
          continue;
        }
      }

      backupFiles.push({
        filename: entry.name,
        folderType,
        folderName,
        sizeBytes: stat.size,
        createdAt: metaInfo.createdAt || stat.mtime.toISOString(),
        dateKey: metaInfo.dateKey || getVientianeDateString(stat.mtime),
        triggerType: folderType === "UPLOADED_UPDATE" ? "UPLOADED" : metaInfo.triggerType || "MANUAL",
        note: metaInfo.note || "",
        pinned: config.pinnedFiles.includes(entry.name),
        checksum: metaInfo.checksum,
        stats: metaInfo.stats,
        organizations: metaInfo.organizations,
      });
    }
  };

  scanFolder(BACKUP_SYSTEM_DIR, "SYSTEM_BACKUP", "backups/backup");
  scanFolder(BACKUP_UPLOADED_DIR, "UPLOADED_UPDATE", "backups/update");

  backupFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    files: backupFiles,
    config,
    autoCreatedToday,
  };
}

export async function enforceBackupRetention(): Promise<{ deletedFiles: string[] }> {
  ensureBackupDirs();
  const config = await getBackupSystemConfig();
  const retentionDays = Math.max(1, config.retentionDays || 2);
  const pinnedSet = new Set(config.pinnedFiles || []);

  const entries = fs.readdirSync(BACKUP_SYSTEM_DIR, { withFileTypes: true });
  const candidates: Array<{ name: string; createdAtMs: number; dateKey: string }> = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".json.gz") && !entry.name.endsWith(".backup.json")) continue;

    const fullPath = path.join(BACKUP_SYSTEM_DIR, entry.name);
    const sidecarPath = getMetaSidecarPath(entry.name);
    const stat = fs.statSync(fullPath);
    let createdAtMs = stat.mtime.getTime();
    let dateKey = getVientianeDateString(stat.mtime);

    if (fs.existsSync(sidecarPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(sidecarPath, "utf-8"));
        if (meta.createdAt) createdAtMs = new Date(meta.createdAt).getTime();
        if (meta.dateKey) dateKey = meta.dateKey;
      } catch {}
    }

    candidates.push({ name: entry.name, createdAtMs, dateKey });
  }

  candidates.sort((a, b) => b.createdAtMs - a.createdAtMs);

  const allowedDates = new Set<string>();
  const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  for (const c of candidates) {
    if (allowedDates.size < retentionDays) {
      allowedDates.add(c.dateKey);
    }
  }

  const deletedFiles: string[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (pinnedSet.has(c.name)) continue;

    const isWithinAllowedDate = allowedDates.has(c.dateKey) && c.createdAtMs >= cutoffMs - 12 * 3600 * 1000;
    const isTopN = i < retentionDays;

    if (!isWithinAllowedDate && !isTopN) {
      try {
        const fullPath = path.join(BACKUP_SYSTEM_DIR, c.name);
        const sidecarPath = getMetaSidecarPath(c.name);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        if (fs.existsSync(sidecarPath)) fs.unlinkSync(sidecarPath);
        deletedFiles.push(c.name);
      } catch (e) {
        console.warn("[RETENTION_DELETE_ERROR]", c.name, e);
      }
    }
  }

  return { deletedFiles };
}

// ============================================================================
// SMART SCAN & DEDUPLICATION COMPARATOR (ສະແກນປຽບທຽບກ່ອນກູ້ຄືນ - ຊ້ຳບໍ່ເອົາ!)
// ============================================================================
function normalizeForComparison(doc: any): string {
  if (!doc || typeof doc !== "object") return String(doc);
  const clone: Record<string, any> = {};
  const keys = Object.keys(doc)
    .filter((k) => k !== "updatedAt" && k !== "lastLoginAt")
    .sort();
  for (const k of keys) {
    clone[k] = doc[k];
  }
  return JSON.stringify(clone);
}

export async function scanBackupPayload(
  payload: BackupArchivePayload,
  options?: { organizationId?: string | null }
): Promise<BackupScanReport> {
  ensureBackupDirs();
  const filterOrgId = options?.organizationId || null;

  const orgNameMap = new Map<string, string>();
  for (const o of payload.meta.organizations || []) {
    orgNameMap.set(o.id, o.name);
  }
  const liveOrgs = await fetchCollectionDocuments("Organization");
  for (const o of liveOrgs) {
    const id = extractDocId(o);
    if (id && o.name) orgNameMap.set(id, o.name);
  }

  const orderToOrgMap = new Map<string, string>();
  for (const ord of payload.collections["Order"] || []) {
    const oid = extractDocId(ord);
    const orgId = extractDocOrgId(ord, "Order");
    if (oid && orgId) orderToOrgMap.set(oid, orgId);
  }

  const collectionResults: CollectionScanResult[] = [];
  let totalItemsInBackup = 0;
  let totalDuplicatesSkipped = 0;
  let totalMissingRestorable = 0;
  let totalSoftDeletedRestorable = 0;
  let totalModified = 0;

  const backupCollectionNames = Object.keys(payload.collections);

  for (const colName of backupCollectionNames) {
    if (EPHEMERAL_COLLECTIONS.has(colName)) continue;

    let backupDocs: any[] = payload.collections[colName] || [];
    if (filterOrgId) {
      backupDocs = backupDocs.filter((doc) => {
        const docOrgId = extractDocOrgId(doc, colName);
        if (docOrgId) return docOrgId === filterOrgId;
        if ((colName === "OrderItem" || colName === "KitchenTicket") && doc.orderId) {
          const refOrderId = extractRefId(doc.orderId);
          return orderToOrgMap.get(refOrderId) === filterOrgId;
        }
        return false;
      });
    }

    if (backupDocs.length === 0 && filterOrgId) continue;

    const liveDocs = await fetchCollectionDocuments(colName, filterOrgId);
    const liveById = new Map<string, any>();
    const liveByCompositeKey = new Map<string, any>();

    for (const ldoc of liveDocs) {
      const lid = extractDocId(ldoc);
      if (lid) liveById.set(lid, ldoc);

      if (colName === "Setting" && ldoc.key) {
        const orgKey = extractDocOrgId(ldoc, "Setting") || "GLOBAL";
        liveByCompositeKey.set(`${orgKey}::${ldoc.key}`, ldoc);
      } else if (colName === "Organization" && ldoc.slug) {
        liveByCompositeKey.set(`SLUG::${ldoc.slug}`, ldoc);
      } else if (colName === "User" && ldoc.email) {
        liveByCompositeKey.set(`EMAIL::${String(ldoc.email).toLowerCase()}`, ldoc);
      }
    }

    let duplicateSkippedCount = 0;
    let missingCount = 0;
    let softDeletedCount = 0;
    let modifiedCount = 0;
    const missingPreviews: ScanItemPreview[] = [];
    const modifiedPreviews: ScanItemPreview[] = [];

    for (const bdoc of backupDocs) {
      const bid = extractDocId(bdoc);
      if (!bid) continue;

      let matchedLive = liveById.get(bid);
      if (!matchedLive) {
        if (colName === "Setting" && bdoc.key) {
          const orgKey = extractDocOrgId(bdoc, "Setting") || "GLOBAL";
          matchedLive = liveByCompositeKey.get(`${orgKey}::${bdoc.key}`);
        } else if (colName === "Organization" && bdoc.slug) {
          matchedLive = liveByCompositeKey.get(`SLUG::${bdoc.slug}`);
        } else if (colName === "User" && bdoc.email) {
          matchedLive = liveByCompositeKey.get(`EMAIL::${String(bdoc.email).toLowerCase()}`);
        }
      }

      const docOrgId = extractDocOrgId(bdoc, colName) || (bdoc.orderId ? orderToOrgMap.get(extractRefId(bdoc.orderId)) : undefined);
      const orgName = docOrgId ? orgNameMap.get(docOrgId) : undefined;
      const { title, subtitle } = getHumanTitleForDoc(bdoc, colName);

      if (!matchedLive) {
        missingCount++;
        if (missingPreviews.length < 20) {
          missingPreviews.push({
            id: bid,
            title,
            subtitle,
            organizationId: docOrgId,
            organizationName: orgName,
            status: "MISSING",
            detail: "ຖືກລຶບອອກຈາກລະບົບແລ້ວ (ພ້ອມກູ້ຄືນ)",
          });
        }
        continue;
      }

      if (
        (matchedLive.status === "DELETED" || matchedLive.status === "PENDING_DELETE") &&
        bdoc.status === "ACTIVE"
      ) {
        softDeletedCount++;
        if (missingPreviews.length < 20) {
          missingPreviews.push({
            id: bid,
            title,
            subtitle,
            organizationId: docOrgId,
            organizationName: orgName,
            status: "SOFT_DELETED",
            detail: `ຢູ່ໃນຖັງຂີ້ເຫຍື້ອ (${matchedLive.status}) -> ພ້ອມກູ້ຄືນກັບມາເປີດໃຊ້ງານ`,
          });
        }
        continue;
      }

      const bNorm = normalizeForComparison(bdoc);
      const lNorm = normalizeForComparison(matchedLive);
      if (bNorm === lNorm) {
        duplicateSkippedCount++;
      } else {
        duplicateSkippedCount++;
        modifiedCount++;
        if (modifiedPreviews.length < 15) {
          modifiedPreviews.push({
            id: bid,
            title,
            subtitle,
            organizationId: docOrgId,
            organizationName: orgName,
            status: "MODIFIED",
            detail: "ມີຢູ່ໃນລະບົບແລ້ວ (ຂ້າມອັດຕະໂນມັດ ຫຼື ເລືອກຍ້ອນຄ່າເກົ່າໄດ້)",
          });
        }
      }
    }

    const meta = COLLECTION_METADATA[colName] || {
      name: colName,
      labelLao: `${colName}`,
      category: "SYSTEM",
      iconName: "Database",
    };

    totalItemsInBackup += backupDocs.length;
    totalDuplicatesSkipped += duplicateSkippedCount;
    totalMissingRestorable += missingCount;
    totalSoftDeletedRestorable += softDeletedCount;
    totalModified += modifiedCount;

    if (backupDocs.length > 0 || liveDocs.length > 0) {
      collectionResults.push({
        collection: colName,
        labelLao: meta.labelLao,
        category: meta.category,
        totalInBackup: backupDocs.length,
        totalInLiveDb: liveDocs.length,
        duplicateSkippedCount,
        missingCount,
        softDeletedCount,
        modifiedCount,
        restorableCount: missingCount + softDeletedCount,
        missingPreviews,
        modifiedPreviews,
      });
    }
  }

  collectionResults.sort((a, b) => {
    if (b.restorableCount !== a.restorableCount) return b.restorableCount - a.restorableCount;
    return b.totalInBackup - a.totalInBackup;
  });

  const uploadsManifest = payload.uploadsManifest || [];
  let uploadsDuplicateSkipped = 0;
  let uploadsMissingRestorable = 0;
  const uploadsMissingList: Array<{ relativePath: string; size: number; availableInVault: boolean }> = [];

  for (const item of uploadsManifest) {
    const targetPath = path.join(PUBLIC_UPLOADS_DIR, item.relativePath);
    if (fs.existsSync(targetPath)) {
      uploadsDuplicateSkipped++;
    } else {
      const vaultFile = path.join(BACKUP_VAULT_DIR, `${item.sha256}.bin`);
      const availableInVault = fs.existsSync(vaultFile) || Boolean(item.embeddedBase64);
      uploadsMissingRestorable++;
      uploadsMissingList.push({
        relativePath: item.relativePath,
        size: item.size,
        availableInVault,
      });
    }
  }

  return {
    backupMeta: payload.meta,
    filterOrganizationId: filterOrgId,
    scannedAt: new Date().toISOString(),
    summary: {
      totalItemsInBackup,
      totalDuplicatesSkipped,
      totalMissingRestorable,
      totalSoftDeletedRestorable,
      totalModified,
      uploadsInBackup: uploadsManifest.length,
      uploadsDuplicateSkipped,
      uploadsMissingRestorable,
      uploadsMissingList: uploadsMissingList.slice(0, 50),
    },
    collections: collectionResults,
  };
}

// ============================================================================
// SMART RESTORE ENGINE (ກູ້ຄືນສະເພາະສ່ວນທີ່ຫາຍ - ຖ້າຊ້ຳກັນຂ້າມທັນທີ!)
// ============================================================================
export interface SmartRestoreOptions {
  mode: "MISSING_ONLY" | "OVERWRITE_MODIFIED";
  organizationId?: string | null;
  selectedCollections?: string[];
  restoreUploads?: boolean;
  actorEmail?: string;
}

export interface SmartRestoreResult {
  success: boolean;
  mode: "MISSING_ONLY" | "OVERWRITE_MODIFIED";
  restoredDocumentsCount: number;
  reactivatedSoftDeletedCount: number;
  overwrittenModifiedCount: number;
  skippedDuplicateCount: number;
  restoredUploadsCount: number;
  collectionBreakdown: Array<{
    collection: string;
    labelLao: string;
    restored: number;
    skipped: number;
  }>;
}

export async function restoreFromBackupPayload(
  payload: BackupArchivePayload,
  options: SmartRestoreOptions
): Promise<SmartRestoreResult> {
  ensureBackupDirs();
  const mode = options.mode || "MISSING_ONLY";
  const filterOrgId = options.organizationId || null;
  const selectedSet =
    options.selectedCollections && options.selectedCollections.length > 0
      ? new Set(options.selectedCollections)
      : null;

  const orderToOrgMap = new Map<string, string>();
  for (const ord of payload.collections["Order"] || []) {
    const oid = extractDocId(ord);
    const orgId = extractDocOrgId(ord, "Order");
    if (oid && orgId) orderToOrgMap.set(oid, orgId);
  }

  let restoredDocumentsCount = 0;
  let reactivatedSoftDeletedCount = 0;
  let overwrittenModifiedCount = 0;
  let skippedDuplicateCount = 0;
  const collectionBreakdown: Array<{
    collection: string;
    labelLao: string;
    restored: number;
    skipped: number;
  }> = [];

  for (const colName of Object.keys(payload.collections)) {
    if (EPHEMERAL_COLLECTIONS.has(colName)) continue;
    if (selectedSet && !selectedSet.has(colName)) continue;

    let backupDocs: any[] = payload.collections[colName] || [];
    if (filterOrgId) {
      backupDocs = backupDocs.filter((doc) => {
        const docOrgId = extractDocOrgId(doc, colName);
        if (docOrgId) return docOrgId === filterOrgId;
        if ((colName === "OrderItem" || colName === "KitchenTicket") && doc.orderId) {
          const refOrderId = extractRefId(doc.orderId);
          return orderToOrgMap.get(refOrderId) === filterOrgId;
        }
        return false;
      });
    }

    if (backupDocs.length === 0) continue;

    const liveDocs = await fetchCollectionDocuments(colName, filterOrgId);
    const liveById = new Map<string, any>();
    const liveByCompositeKey = new Map<string, any>();

    for (const ldoc of liveDocs) {
      const lid = extractDocId(ldoc);
      if (lid) liveById.set(lid, ldoc);

      if (colName === "Setting" && ldoc.key) {
        const orgKey = extractDocOrgId(ldoc, "Setting") || "GLOBAL";
        liveByCompositeKey.set(`${orgKey}::${ldoc.key}`, ldoc);
      } else if (colName === "Organization" && ldoc.slug) {
        liveByCompositeKey.set(`SLUG::${ldoc.slug}`, ldoc);
      } else if (colName === "User" && ldoc.email) {
        liveByCompositeKey.set(`EMAIL::${String(ldoc.email).toLowerCase()}`, ldoc);
      }
    }

    let colRestored = 0;
    let colSkipped = 0;
    const updatesBatch: any[] = [];

    for (const bdoc of backupDocs) {
      const bid = extractDocId(bdoc);
      if (!bid) continue;

      let matchedLive = liveById.get(bid);
      if (!matchedLive) {
        if (colName === "Setting" && bdoc.key) {
          const orgKey = extractDocOrgId(bdoc, "Setting") || "GLOBAL";
          matchedLive = liveByCompositeKey.get(`${orgKey}::${bdoc.key}`);
        } else if (colName === "Organization" && bdoc.slug) {
          matchedLive = liveByCompositeKey.get(`SLUG::${bdoc.slug}`);
        } else if (colName === "User" && bdoc.email) {
          matchedLive = liveByCompositeKey.get(`EMAIL::${String(bdoc.email).toLowerCase()}`);
        }
      }

      if (!matchedLive) {
        const { _id, ...fieldsWithoutId } = bdoc;
        const targetId = _id || { $oid: bid };
        updatesBatch.push({
          q: { _id: targetId },
          u: { $set: fieldsWithoutId },
          upsert: true,
        });
        restoredDocumentsCount++;
        colRestored++;
      } else if (
        (matchedLive.status === "DELETED" || matchedLive.status === "PENDING_DELETE") &&
        bdoc.status === "ACTIVE"
      ) {
        const { _id, ...fieldsWithoutId } = bdoc;
        const targetId = matchedLive._id || _id || { $oid: bid };
        updatesBatch.push({
          q: { _id: targetId },
          u: { $set: fieldsWithoutId },
          upsert: true,
        });
        reactivatedSoftDeletedCount++;
        colRestored++;
      } else if (mode === "OVERWRITE_MODIFIED") {
        const bNorm = normalizeForComparison(bdoc);
        const lNorm = normalizeForComparison(matchedLive);
        if (bNorm !== lNorm) {
          const { _id, ...fieldsWithoutId } = bdoc;
          const targetId = matchedLive._id || _id || { $oid: bid };
          updatesBatch.push({
            q: { _id: targetId },
            u: { $set: fieldsWithoutId },
            upsert: true,
          });
          overwrittenModifiedCount++;
          colRestored++;
        } else {
          skippedDuplicateCount++;
          colSkipped++;
        }
      } else {
        skippedDuplicateCount++;
        colSkipped++;
      }
    }

    for (let i = 0; i < updatesBatch.length; i += 200) {
      const chunk = updatesBatch.slice(i, i + 200);
      await (prisma as any).$runCommandRaw({
        update: colName,
        updates: chunk,
        ordered: false,
      });
    }

    if (colRestored > 0 || colSkipped > 0) {
      collectionBreakdown.push({
        collection: colName,
        labelLao: COLLECTION_METADATA[colName]?.labelLao || colName,
        restored: colRestored,
        skipped: colSkipped,
      });
    }
  }

  let restoredUploadsCount = 0;
  if (options.restoreUploads !== false && Array.isArray(payload.uploadsManifest)) {
    for (const item of payload.uploadsManifest) {
      const targetPath = path.join(PUBLIC_UPLOADS_DIR, item.relativePath);
      if (fs.existsSync(targetPath)) continue;

      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      const vaultFile = path.join(BACKUP_VAULT_DIR, `${item.sha256}.bin`);
      if (fs.existsSync(vaultFile)) {
        fs.copyFileSync(vaultFile, targetPath);
        restoredUploadsCount++;
      } else if (item.embeddedBase64) {
        fs.writeFileSync(targetPath, Buffer.from(item.embeddedBase64, "base64"));
        restoredUploadsCount++;
      }
    }
  }

  const totalRestoredAll = restoredDocumentsCount + reactivatedSoftDeletedCount + overwrittenModifiedCount;
  try {
    await prisma.auditLog.create({
      data: {
        action: "SMART_BACKUP_RESTORE",
        details: `Smart Restore (${mode}) from backup ${payload.meta.backupId}: Restored ${totalRestoredAll} records, Skipped ${skippedDuplicateCount} duplicates, Restored ${restoredUploadsCount} files.`,
      },
    });
  } catch {}

  sendDiscordEmbed("WEBHOOK_2", {
    title: "♻️ ກູ້ຄືນຂໍ້ມູນອັດສະລິຍະສຳເລັດ (Smart Backup Restore Completed)",
    description: `ລະບົບໄດ້ສະແກນ ແລະ ກູ້ຄືນຂໍ້ມູນຈາກໄຟລ໌ Backup **\`${payload.meta.backupId}\`** (${payload.meta.dateKey}) ໂດຍຂ້າມຂໍ້ມູນທີ່ຊ້ຳກັນອັດຕະໂນມັດ.`,
    color: 0x3b82f6,
    fields: [
      { name: "🔍 ໂໝດການກູ້ຄືນ", value: mode === "MISSING_ONLY" ? "ກູ້ຄືນສະເພາະສ່ວນທີ່ຫາຍ (ຊ້ຳບໍ່ເອົາ)" : "ກູ້ຄືນ + ຍ້ອນຄ່າທີ່ຖືກແກ້ໄຂ", inline: true },
      { name: "✅ ກູ້ຄືນຂໍ້ມູນທີ່ຫາຍ", value: `${(restoredDocumentsCount + reactivatedSoftDeletedCount).toLocaleString()} ລາຍການ`, inline: true },
      { name: "⏭️ ຂ້າມຂໍ້ມູນຊ້ຳ (Skip)", value: `${skippedDuplicateCount.toLocaleString()} ລາຍການ`, inline: true },
      { name: "🖼️ ກູ້ຄືນຮູບພາບ", value: `${restoredUploadsCount} ໄຟລ໌`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  }).catch(() => {});

  return {
    success: true,
    mode,
    restoredDocumentsCount,
    reactivatedSoftDeletedCount,
    overwrittenModifiedCount,
    skippedDuplicateCount,
    restoredUploadsCount,
    collectionBreakdown,
  };
}
