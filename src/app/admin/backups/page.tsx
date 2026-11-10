"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  DatabaseZap,
  Upload,
  Download,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Lock,
  Unlock,
  Search,
  Sparkles,
  HardDrive,
  Clock,
  Store,
  FileArchive,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SkipForward,
  Image as ImageIcon,
  FolderArchive,
  CheckSquare,
  Square,
  Info,
  X,
  Layers,
  FolderUp,
  Bot,
  User,
  MessageSquare,
  AlertCircle,
  Globe,
  FileText
} from "lucide-react";

interface BackupOrganizationSummary {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  orderCount: number;
}

interface BackupFileSummary {
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

interface BackupSystemConfig {
  autoBackupEnabled: boolean;
  retentionDays: number;
  lastAutoBackupDate: string;
  lastBackupAt: string;
  pinnedFiles: string[];
}

interface ScanItemPreview {
  id: string;
  title: string;
  subtitle?: string;
  organizationId?: string;
  organizationName?: string;
  status: "MISSING" | "SOFT_DELETED" | "MODIFIED";
  detail: string;
}

interface CollectionScanResult {
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

interface BackupScanReport {
  backupMeta: {
    backupId: string;
    createdAt: string;
    dateKey: string;
    triggerType: string;
    note?: string;
    organizations: BackupOrganizationSummary[];
    stats: {
      totalCollections: number;
      totalDocuments: number;
      totalUploads: number;
      organizationCount: number;
    };
  };
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

export default function AdminBackupsPage() {
  const [files, setFiles] = useState<BackupFileSummary[]>([]);
  const [folderTab, setFolderTab] = useState<"ALL" | "SYSTEM_BACKUP" | "UPLOADED_UPDATE">("ALL");
  const [config, setConfig] = useState<BackupSystemConfig>({
    autoBackupEnabled: true,
    retentionDays: 2,
    lastAutoBackupDate: "",
    lastBackupAt: "",
    pinnedFiles: [],
  });
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [manualNote, setManualNote] = useState("");
  const [bannerMessage, setBannerMessage] = useState<{
    type: "success" | "error" | "info";
    title: string;
    text: string;
  } | null>(null);

  // Smart Scan & Restore state
  const [activeScanFilename, setActiveScanFilename] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [scanReport, setScanReport] = useState<BackupScanReport | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("ALL");
  const [restoreMode, setRestoreMode] = useState<"MISSING_ONLY" | "OVERWRITE_MODIFIED">("MISSING_ONLY");
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [restoreUploads, setRestoreUploads] = useState<boolean>(true);
  const [expandedCol, setExpandedCol] = useState<string | null>(null);
  const [restoreResultSummary, setRestoreResultSummary] = useState<any | null>(null);

  // Custom Popup Modals for every action button
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
  const [deleteTargetFile, setDeleteTargetFile] = useState<BackupFileSummary | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);
  const [showCreateBackupModal, setShowCreateBackupModal] = useState(false);
  const [pinTargetFile, setPinTargetFile] = useState<BackupFileSummary | null>(null);
  const [togglingPin, setTogglingPin] = useState(false);
  const [pendingConfigUpdate, setPendingConfigUpdate] = useState<{
    autoBackupEnabled: boolean;
    retentionDays: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanSectionRef = useRef<HTMLDivElement | null>(null);

  const notify = (type: "success" | "error" | "info", title: string, text: string) => {
    setBannerMessage({ type, title, text });
  };

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/backups");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ");
      setFiles(data.files || []);
      if (data.config) setConfig(data.config);
      if (data.autoCreatedToday) {
        notify(
          "success",
          "Auto-Backup ປະຈຳວັນສຳເລັດ!",
          "ລະບົບໄດ້ທຳການສຳຮອງຂໍ້ມູນປະຈຳວັນນີ້ລົງໃນໂຟນເດີ /backups ໃຫ້ອັດຕະໂນມັດຮຽບຮ້ອຍແລ້ວ."
        );
      }
    } catch (err: any) {
      notify("error", "ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ", err.message || "ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const executeCreateManualBackup = async () => {
    try {
      setCreatingBackup(true);
      setBannerMessage(null);
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_MANUAL",
          note: manualNote.trim() || "ສຳຮອງຂໍ້ມູນດ່ວນໂດຍ Super Admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ສ້າງ Backup ບໍ່ສຳເລັດ");
      setFiles(data.files || []);
      if (data.config) setConfig(data.config);
      setManualNote("");
      setShowCreateBackupModal(false);
      notify("success", "ສ້າງໄຟລ໌ Backup ສຳເລັດ!", data.message);
    } catch (err: any) {
      notify("error", "ສ້າງໄຟລ໌ Backup ບໍ່ສຳເລັດ", err.message);
    } finally {
      setCreatingBackup(false);
    }
  };

  const executeSaveConfig = async () => {
    if (!pendingConfigUpdate) return;
    try {
      setSavingConfig(true);
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_CONFIG",
          autoBackupEnabled: pendingConfigUpdate.autoBackupEnabled,
          retentionDays: pendingConfigUpdate.retentionDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ບັນທຶກການຕັ້ງຄ່າບໍ່ສຳເລັດ");
      setFiles(data.files || []);
      if (data.config) setConfig(data.config);
      setPendingConfigUpdate(null);
      notify("success", "ບັນທຶກການຕັ້ງຄ່າສຳເລັດ", data.message);
    } catch (err: any) {
      notify("error", "ບັນທຶກການຕັ້ງຄ່າບໍ່ສຳເລັດ", err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const executeTogglePin = async () => {
    if (!pinTargetFile) return;
    try {
      setTogglingPin(true);
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_PIN", filename: pinTargetFile.filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFiles(data.files || []);
      if (data.config) setConfig(data.config);
      setPinTargetFile(null);
      notify("info", "ອັບເດດສະຖານະປັກໝຸດແລ້ວ", data.message);
    } catch (err: any) {
      notify("error", "ບໍ່ສາມາດປັກໝຸດໄດ້", err.message);
    } finally {
      setTogglingPin(false);
    }
  };

  const confirmDeleteFile = async () => {
    if (!deleteTargetFile) return;
    try {
      setDeletingFile(true);
      const filename = deleteTargetFile.filename;
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_FILE", filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFiles(data.files || []);
      if (activeScanFilename === filename) {
        setScanReport(null);
        setActiveScanFilename("");
      }
      setDeleteTargetFile(null);
      notify("info", "ລຶບໄຟລ໌ Backup ສຳເລັດ", data.message);
    } catch (err: any) {
      notify("error", "ລຶບໄຟລ໌ບໍ່ສຳເລັດ", err.message);
    } finally {
      setDeletingFile(false);
    }
  };

  const runSmartScanOnServerFile = async (filename: string, orgFilter = selectedOrgId) => {
    try {
      setScanning(true);
      setRestoreResultSummary(null);
      setActiveScanFilename(filename);
      const res = await fetch("/api/admin/backups/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          organizationId: orgFilter === "ALL" ? null : orgFilter,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ສະແກນໄຟລ໌ບໍ່ສຳເລັດ");

      const report: BackupScanReport = data.report;
      setScanReport(report);

      // Select ONLY collections with missing items by default; if none are missing, leave checkboxes unchecked or only missing ones
      const colsWithMissing = report.collections
        .filter((c) => c.restorableCount > 0)
        .map((c) => c.collection);
      setSelectedCollections(colsWithMissing);

      setTimeout(() => {
        scanSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err: any) {
      notify("error", "ສະແກນໄຟລ໌ບໍ່ສຳເລັດ", err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleUploadFileAndScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScanning(true);
      setRestoreResultSummary(null);
      notify(
        "info",
        "ກຳລັງອັບໂຫຼດເຂົ້າໂຟນເດີ /backups/update ແລະ ສະແກນ...",
        `ກຳລັງກວດສອບໄຟລ໌ "${file.name}" ທຽບກັບຖານຂໍ້ມູນປັດຈຸບັນ ກະລຸນາລໍຖ້າຈັກໜ່ອຍ.`
      );

      const formData = new FormData();
      formData.append("file", file);
      formData.append("organizationId", selectedOrgId);

      const res = await fetch("/api/admin/backups/scan", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ອັບໂຫຼດ ແລະ ສະແກນບໍ່ສຳເລັດ");

      setActiveScanFilename(data.filename);
      setScanReport(data.report);

      const colsWithMissing = (data.report.collections as CollectionScanResult[])
        .filter((c) => c.restorableCount > 0)
        .map((c) => c.collection);
      setSelectedCollections(colsWithMissing);

      await fetchBackups();
      notify(
        "success",
        "ອັບໂຫຼດລົງໂຟນເດີ /backups/update & ສະແກນສຳເລັດ!",
        `ບັນທຶກໄຟລ໌ແຍກໄວ້ໃນໂຟນເດີຍ່ອຍ /backups/update ຮຽບຮ້ອຍແລ້ວ. ລາຍການໃດທີ່ຫາຍໄປຈະຂຶ້ນໄຮໄລ້ສີແດງດ້ານລຸ່ມ.`
      );

      setTimeout(() => {
        scanSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err: any) {
      notify("error", "ອັບໂຫຼດໄຟລ໌ບໍ່ສຳເລັດ", err.message);
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const executeConfirmedRestore = async () => {
    if (!activeScanFilename || !scanReport) return;

    try {
      setRestoring(true);
      const targetCols =
        selectedCollections.length > 0
          ? selectedCollections
          : scanReport.collections.map((c) => c.collection);

      const res = await fetch("/api/admin/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: activeScanFilename,
          mode: restoreMode,
          organizationId: selectedOrgId === "ALL" ? null : selectedOrgId,
          selectedCollections: targetCols,
          restoreUploads,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ກູ້ຄືນຂໍ້ມູນບໍ່ສຳເລັດ");

      setShowRestoreConfirmModal(false);
      setRestoreResultSummary(data.result);
      if (data.report) {
        setScanReport(data.report);
        const remainingMissing = (data.report.collections as CollectionScanResult[])
          .filter((c) => c.restorableCount > 0)
          .map((c) => c.collection);
        setSelectedCollections(remainingMissing);
      }
      notify("success", "ກູ້ຄືນຂໍ້ມູນອັດສະລິຍະສຳເລັດ!", data.message);
    } catch (err: any) {
      notify("error", "ກູ້ຄືນຂໍ້ມູນບໍ່ສຳເລັດ", err.message);
    } finally {
      setRestoring(false);
    }
  };

  const handleQuickRestoreSingleCollection = (colName: string) => {
    setSelectedCollections([colName]);
    setShowRestoreConfirmModal(true);
  };

  const toggleCollectionCheckbox = (colName: string) => {
    setSelectedCollections((prev) =>
      prev.includes(colName) ? prev.filter((c) => c !== colName) : [...prev, colName]
    );
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("lo-LA", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const selectedOrgName =
    selectedOrgId === "ALL"
      ? "ທຸກຮ້ານຄ້າທັງໝົດໃນລະບົບ"
      : scanReport?.backupMeta?.organizations?.find((o) => o.id === selectedOrgId)?.name || selectedOrgId;

  const missingTotalCount = scanReport
    ? scanReport.summary.totalMissingRestorable + scanReport.summary.totalSoftDeletedRestorable
    : 0;

  const systemBackupFiles = files.filter((f) => f.folderType !== "UPLOADED_UPDATE");
  const uploadedUpdateFiles = files.filter((f) => f.folderType === "UPLOADED_UPDATE");
  const displayedFiles =
    folderTab === "SYSTEM_BACKUP"
      ? systemBackupFiles
      : folderTab === "UPLOADED_UPDATE"
      ? uploadedUpdateFiles
      : files;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 space-y-6">
      {/* ── FLOATING PREMIUM NOTIFICATION TOAST ── */}
      {bannerMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
              bannerMessage.type === "success"
                ? "bg-zinc-900/95 border-emerald-500/40 shadow-emerald-500/10"
                : bannerMessage.type === "error"
                ? "bg-zinc-900/95 border-red-500/40 shadow-red-500/10"
                : "bg-zinc-900/95 border-blue-500/40 shadow-blue-500/10"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  bannerMessage.type === "success"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : bannerMessage.type === "error"
                    ? "bg-red-500/15 text-red-400"
                    : "bg-blue-500/15 text-blue-400"
                }`}
              >
                {bannerMessage.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : bannerMessage.type === "error" ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-extrabold text-white">{bannerMessage.title}</div>
                <div className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{bannerMessage.text}</div>
              </div>
              <button
                onClick={() => setBannerMessage(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 1. HEADER & ACTION BAR ── */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-zinc-900/90 to-zinc-950 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <DatabaseZap className="w-3.5 h-3.5" />
              <span>LAOSYS ENTERPRISE SMART BACKUP & DEDUPLICATION VAULT</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              ສູນສຳຮອງຂໍ້ມູນລາຍວັນ & ກູ້ຄືນອັດສະລິຍະ (Smart Backup & Restore)
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              ລວມຢູ່ໃນໂຟນເດີຫຼັກ <code className="text-white bg-zinc-900 px-1.5 py-0.5 rounded">/backups</code> ແລະ ແຍກໂຟນເດີຍ່ອຍທາງໃນຊັດເຈນລະຫວ່າງ{" "}
              <code className="text-emerald-400 bg-zinc-900 px-1.5 py-0.5 rounded">/backups/backup</code> (ໄຟລ໌ສຳຮອງລາຍວັນຂອງລະບົບ) ກັບ{" "}
              <code className="text-purple-400 bg-zinc-900 px-1.5 py-0.5 rounded">/backups/update</code> (ໄຟລ໌ທີ່ອັບໂຫຼດເຂົ້າມາອັບເດດ/ກູ້ຄືນ).
              ເມື່ອສະແກນແລ້ວ <strong className="text-red-400">ລາຍການໃດທີ່ຫາຍໄປຈະໄຮໄລ້ສີແດງໃຫ້ກົດກູ້ກັບຄືນທັນທີ</strong> ສ່ວນລາຍການທີ່ຄົບຖ້ວນຈະບໍ່ມີສີລົບກວນສາຍຕາ!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".gz,.json"
              onChange={handleUploadFileAndScan}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{scanning ? "ກຳລັງສະແກນ..." : "ອັບໂຫຼດໄຟລ໌ Backup & ສະແກນຂໍ້ມູນຊ້ຳ"}</span>
            </button>

            <button
              onClick={fetchBackups}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-all cursor-pointer"
              title="ໂຫຼດຂໍ້ມູນໃໝ່"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>ຣີເຟຣຊ</span>
            </button>
          </div>
        </div>

        {/* Manual Snapshot Bar */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              placeholder="ໝາຍເຫດການ Backup (ເຊັ່ນ: ສຳຮອງກ່ອນປັບລາຄາສິນຄ້າໃໝ່)..."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={() => setShowCreateBackupModal(true)}
            disabled={creatingBackup}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${creatingBackup ? "animate-spin" : ""}`} />
            <span>{creatingBackup ? "ກຳລັງສ້າງໄຟລ໌ Backup..." : "ສ້າງ Backup ທັງລະບົບດຽວນີ້"}</span>
          </button>
        </div>
      </div>

      {/* ── 2. AUTO-BACKUP CONFIG & SEPARATED FOLDERS OVERVIEW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>ຕັ້ງຄ່າ Auto-Backup & ມື້ເກັບຍ້ອນຫຼັງ</span>
            </div>
            <p className="text-xs text-zinc-400">
              ເກັບສະເພາະວັນລ່າສຸດ ແລະ ລຶບວັນເກົ່າອັດຕະໂນມັດ (ຍົກເວັ້ນໄຟລ໌ປັກໝຸດລັອກ).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoBackupEnabled}
                onChange={(e) => {
                  setPendingConfigUpdate({
                    autoBackupEnabled: e.target.checked,
                    retentionDays: config.retentionDays,
                  });
                }}
                className="rounded accent-emerald-500"
              />
              <span>Auto-Backup ທຸກມື້</span>
            </label>

            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5">
              <span className="text-xs text-zinc-400">ເກັບຍ້ອນຫຼັງ:</span>
              <select
                value={config.retentionDays}
                disabled={savingConfig}
                onChange={(e) => {
                  const days = Number(e.target.value);
                  setPendingConfigUpdate({
                    autoBackupEnabled: config.autoBackupEnabled,
                    retentionDays: days,
                  });
                }}
                className="bg-zinc-900 text-emerald-400 font-bold text-xs rounded-lg px-2 py-1 focus:outline-none border border-zinc-800"
              >
                <option value={1}>1 ວັນລ່າສຸດ</option>
                <option value={2}>2 ວັນລ່າສຸດ (ແນະນຳ)</option>
                <option value={3}>3 ວັນລ່າສຸດ</option>
                <option value={7}>7 ວັນລ່າສຸດ</option>
                <option value={14}>14 ວັນລ່າສຸດ</option>
                <option value={30}>30 ວັນລ່າສຸດ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subfolder 1: /backups/backup */}
        <div className="rounded-2xl border border-emerald-500/25 bg-zinc-900/60 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <FolderArchive className="w-4 h-4" />
              <span>ໂຟນເດີຍ່ອຍທີ 1: ໄຟລ໌ Backup ລະບົບລາຍວັນ</span>
            </div>
            <div className="text-sm font-mono font-bold text-white">backups\backup\</div>
            <div className="text-[11px] text-zinc-400">
              ມີ <strong className="text-emerald-400">{systemBackupFiles.length} ໄຟລ໌</strong> • ບໍ່ປົນກັບໄຟລ໌ອັບໂຫຼດ
            </div>
          </div>
          <HardDrive className="w-8 h-8 text-emerald-500/40 shrink-0" />
        </div>

        {/* Subfolder 2: /backups/update */}
        <div className="rounded-2xl border border-purple-500/25 bg-zinc-900/60 p-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-purple-400 font-semibold flex items-center gap-1.5">
              <FolderUp className="w-4 h-4" />
              <span>ໂຟນເດີຍ່ອຍທີ 2: ໄຟລ໌ທີ່ອັບໂຫຼດມາອັບເດດ/ກູ້ຄືນ</span>
            </div>
            <div className="text-sm font-mono font-bold text-white">backups\update\</div>
            <div className="text-[11px] text-zinc-400">
              ມີ <strong className="text-purple-400">{uploadedUpdateFiles.length} ໄຟລ໌</strong> • ແຍກຢູ່ທາງໃນ /backups
            </div>
          </div>
          <Upload className="w-8 h-8 text-purple-500/40 shrink-0" />
        </div>
      </div>

      {/* ── 3. SAVED BACKUPS LIST (SEPARATED BY FOLDER TABS) ── */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileArchive className="w-5 h-5 text-emerald-400" />
              <span>ລາຍການໄຟລ໌ Backup & ໄຟລ໌ອັບໂຫຼດ ({displayedFiles.length} ໄຟລ໌)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              ກົດປຸ່ມ <strong className="text-blue-400">&ldquo;ສະແກນ & ກູ້ຄືນ&rdquo;</strong> ເພື່ອກວດສອບລາຍການທີ່ຫາຍໄປ (ລາຍການທີ່ຫາຍຈະຂຶ້ນສີແດງ)
            </p>
          </div>

          {/* Folder Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setFolderTab("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                folderTab === "ALL"
                  ? "bg-zinc-800 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              ທັງໝົດ ({files.length})
            </button>
            <button
              type="button"
              onClick={() => setFolderTab("SYSTEM_BACKUP")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                folderTab === "SYSTEM_BACKUP"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-zinc-400 hover:text-emerald-300"
              }`}
            >
              backups/backup ({systemBackupFiles.length})
            </button>
            <button
              type="button"
              onClick={() => setFolderTab("UPLOADED_UPDATE")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                folderTab === "UPLOADED_UPDATE"
                  ? "bg-purple-600 text-white shadow"
                  : "text-zinc-400 hover:text-purple-300"
              }`}
            >
              backups/update ({uploadedUpdateFiles.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-sm">ກຳລັງໂຫຼດລາຍການໄຟລ໌ Backup...</div>
        ) : displayedFiles.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-zinc-400 text-sm">ຍັງບໍ່ມີໄຟລ໌ໃນໂຟນເດີນີ້</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {displayedFiles.map((file) => {
              const isSelected = activeScanFilename === file.filename;
              return (
                <div
                  key={file.filename}
                  className={`p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isSelected ? "bg-blue-500/10 border-l-4 border-l-blue-500" : "hover:bg-zinc-800/30"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {file.folderType === "UPLOADED_UPDATE" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          backups/update ({file.dateKey})
                        </span>
                      ) : file.triggerType === "AUTO_DAILY" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          backups/backup • ອັດຕະໂນມັດລາຍວັນ ({file.dateKey})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          backups/backup • ສຳຮອງໂດຍ Admin ({file.dateKey})
                        </span>
                      )}

                      {file.pinned && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          ປັກໝຸດ (ບໍ່ລຶບອັດຕະໂນມັດ)
                        </span>
                      )}

                      <span className="font-mono text-sm font-semibold text-white">{file.filename}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      <span>ເວລາ: {formatDateTime(file.createdAt)}</span>
                      <span>
                        ຂະໜາດ: <strong className="text-zinc-200">{formatBytes(file.sizeBytes)}</strong>
                      </span>
                      {file.stats && (
                        <>
                          <span>
                            ຮ້ານຄ້າ: <strong className="text-emerald-400">{file.stats.organizationCount} ຮ້ານ</strong>
                          </span>
                          <span>
                            ຂໍ້ມູນ: <strong className="text-zinc-200">{file.stats.totalDocuments.toLocaleString()} ລາຍການ</strong> ({file.stats.totalCollections} ຕາຕະລາງ)
                          </span>
                          <span>
                            ຮູບພາບ: <strong className="text-zinc-200">{file.stats.totalUploads} ໄຟລ໌</strong>
                          </span>
                        </>
                      )}
                    </div>

                    {file.note && (
                      <div className="text-xs text-zinc-500 italic">ໝາຍເຫດ: &ldquo;{file.note}&rdquo;</div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => runSmartScanOnServerFile(file.filename)}
                      disabled={scanning}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30"
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isSelected && scanning ? "ກຳລັງສະແກນ..." : "ສະແກນ & ກູ້ຄືນ (Smart Scan)"}</span>
                    </button>

                    <a
                      href={`/api/admin/backups?download=${encodeURIComponent(file.filename)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all"
                      title="ດາວໂຫຼດໄຟລ໌ Backup ລົງຄອມພິວເຕີ"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ດາວໂຫຼດ</span>
                    </a>

                    <button
                      onClick={() => setPinTargetFile(file)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        file.pinned
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      }`}
                      title={file.pinned ? "ປົດໝຸດ" : "ປັກໝຸດໄຟລ໌ນີ້ບໍ່ໃຫ້ຖືກລຶບອັດຕະໂນມັດ"}
                    >
                      {file.pinned ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{file.pinned ? "ປັກໝຸດແລ້ວ" : "ປັກໝຸດ"}</span>
                    </button>

                    <button
                      onClick={() => setDeleteTargetFile(file)}
                      disabled={file.pinned}
                      className="inline-flex items-center gap-1 p-2 rounded-xl bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 disabled:opacity-30 transition-all cursor-pointer"
                      title="ລຶບໄຟລ໌ Backup"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. SMART DEDUPLICATION SCANNER & RESTORE CONSOLE ── */}
      {scanReport && (
        <div
          ref={scanSectionRef}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 md:p-8 space-y-6 shadow-2xl"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ຜົນການສະແກນປຽບທຽບກ່ອນກູ້ຄືນ (SMART DEDUPLICATION SCANNER)</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                ໄຟລ໌ທີ່ກຳລັງກວດສອບ: <span className="text-emerald-400 font-mono">{activeScanFilename}</span>
              </h3>
              <p className="text-xs text-zinc-400">
                ໝວດໝູ່ໃດທີ່ <strong className="text-red-400">ຂໍ້ມູນຫາຍໄປຈະໄຮໄລ້ສີແດງ</strong> ໃຫ້ກົດກູ້ກັບຄືນທັນທີ • ສ່ວນໝວດໝູ່ທີ່ຂໍ້ມູນຄົບຖ້ວນແລ້ວຈະເປັນສີປົກກະຕິ (ບໍ່ມີສີ)
              </p>
            </div>

            {/* Store Filter (All Stores vs Single Store) */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2">
                <Store className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-400">ຂອບເຂດຮ້ານຄ້າ:</span>
                <select
                  value={selectedOrgId}
                  onChange={(e) => {
                    const nextOrg = e.target.value;
                    setSelectedOrgId(nextOrg);
                    runSmartScanOnServerFile(activeScanFilename, nextOrg);
                  }}
                  className="bg-zinc-900 text-white font-semibold text-xs rounded-lg px-2.5 py-1 border border-zinc-800 focus:outline-none"
                >
                  <option value="ALL">
                    ທຸກຮ້ານຄ້າທັງໝົດໃນລະບົບ ({scanReport.backupMeta.organizations?.length || 0} ຮ້ານ)
                  </option>
                  {(scanReport.backupMeta.organizations || []).map((org) => (
                    <option key={org.id} value={org.id}>
                      ສະເພາະຮ້ານ: {org.name} ({org.slug})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4 Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-1">
              <div className="text-xs text-zinc-400">ຂໍ້ມູນທັງໝົດໃນໄຟລ໌ Backup</div>
              <div className="text-2xl font-extrabold text-white">
                {scanReport.summary.totalItemsInBackup.toLocaleString()}{" "}
                <span className="text-xs font-normal text-zinc-400">ລາຍການ</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                ຈາກທັງໝົດ {scanReport.collections.length} ຕາຕະລາງຂໍ້ມູນ
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-1">
              <div className="text-xs text-zinc-400 flex items-center gap-1.5 font-semibold">
                <SkipForward className="w-3.5 h-3.5" />
                <span>ຊ້ຳກັບປັດຈຸບັນ (ຂ້າມອັດຕະໂນມັດ)</span>
              </div>
              <div className="text-2xl font-extrabold text-zinc-200">
                {scanReport.summary.totalDuplicatesSkipped.toLocaleString()}{" "}
                <span className="text-xs font-normal text-zinc-400">ລາຍການ</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                ມີຢູ່ໃນລະບົບແລ້ວ — ບໍ່ເອົາຂໍ້ມູນຊ້ຳ
              </div>
            </div>

            {/* Highlighted RED ONLY when missingTotalCount > 0 */}
            <div
              className={`rounded-2xl p-4 space-y-1 transition-all ${
                missingTotalCount > 0
                  ? "border-2 border-red-500 bg-red-500/15 shadow-lg shadow-red-500/15"
                  : "border border-zinc-800 bg-zinc-950/70"
              }`}
            >
              <div
                className={`text-xs flex items-center gap-1.5 font-bold ${
                  missingTotalCount > 0 ? "text-red-300" : "text-zinc-400"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>ຂໍ້ມູນທີ່ຫາຍໄປ / ຖືກລຶບ (ກູ້ຄືນ)</span>
              </div>
              <div
                className={`text-2xl font-extrabold ${
                  missingTotalCount > 0 ? "text-red-400" : "text-zinc-300"
                }`}
              >
                {missingTotalCount.toLocaleString()}{" "}
                <span className="text-xs font-normal">ລາຍການ</span>
              </div>
              <div className={`text-[11px] ${missingTotalCount > 0 ? "text-red-300" : "text-zinc-500"}`}>
                {missingTotalCount > 0
                  ? `ລຶບຖາວອນ ${scanReport.summary.totalMissingRestorable} • ໃນຖັງຂີ້ເຫຍື້ອ ${scanReport.summary.totalSoftDeletedRestorable}`
                  : "ບໍ່ມີຂໍ້ມູນຫາຍໄປ (ຄົບຖ້ວນ 100%)"}
              </div>
            </div>

            <div
              className={`rounded-2xl p-4 space-y-1 transition-all ${
                scanReport.summary.uploadsMissingRestorable > 0
                  ? "border-2 border-red-500 bg-red-500/15"
                  : "border border-zinc-800 bg-zinc-950/70"
              }`}
            >
              <div
                className={`text-xs flex items-center gap-1.5 font-semibold ${
                  scanReport.summary.uploadsMissingRestorable > 0 ? "text-red-300" : "text-zinc-400"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>ໄຟລ໌ຮູບພາບ & ສື່ອັບໂຫຼດ</span>
              </div>
              <div
                className={`text-2xl font-extrabold ${
                  scanReport.summary.uploadsMissingRestorable > 0 ? "text-red-400" : "text-zinc-300"
                }`}
              >
                {scanReport.summary.uploadsMissingRestorable}{" "}
                <span className="text-xs font-normal">ໄຟລ໌ທີ່ຫາຍໄປ</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                ມີຢູ່ແລ້ວ {scanReport.summary.uploadsDuplicateSkipped} ໄຟລ໌ (ຂ້າມອັດຕະໂນມັດ)
              </div>
            </div>
          </div>

          {/* Restore Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRestoreMode("MISSING_ONLY")}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                restoreMode === "MISSING_ONLY"
                  ? "border-zinc-500 bg-zinc-800/80 shadow-lg"
                  : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">
                  ໂໝດທີ 1 (ແນະນຳ): ກູ້ຄືນສະເພາະລາຍການສີແດງທີ່ຫາຍໄປ — ຖ້າຊ້ຳກັນບໍ່ເອົາ!
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-200 font-semibold">
                  ປອດໄພ 100%
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                ຂໍ້ມູນໃດທີ່ຍັງມີຢູ່ໃນລະບົບປັດຈຸບັນຈະບໍ່ຖືກແຕະຕ້ອງເດັດຂາດ. ລະບົບຈະດຶງກັບມາສະເພາະລາຍການທີ່ຂຶ້ນໄຮໄລ້ສີແດງເທົ່ານັ້ນ.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRestoreMode("OVERWRITE_MODIFIED")}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                restoreMode === "OVERWRITE_MODIFIED"
                  ? "border-amber-500 bg-amber-500/15 shadow-lg"
                  : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-200">
                  ໂໝດທີ 2: ກູ້ຄືນສ່ວນທີ່ຫາຍ + ຍ້ອນຄ່າຂໍ້ມູນທີ່ຖືກແກ້ໄຂ ({scanReport.summary.totalModified} ລາຍການ)
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold">
                  ຍ້ອນເວລາ
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                ນອກຈາກດຶງລາຍການທີ່ຫາຍໄປກັບມາແລ້ວ, ຖ້າສິນຄ້າ ຫຼື ຂໍ້ມູນໃດຖືກແກ້ໄຂລາຄາ/ສະຕ໊ອກຜິດ ກໍຈະຍ້ອນກັບໄປໃຊ້ຄ່າຂອງວັນທີ່ Backup.
              </p>
            </button>
          </div>

          {/* Collection Breakdown Table (RED Highlight ONLY if missing > 0; NO color if missing === 0) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
            <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-bold text-white">
                ລາຍການກວດສອບແຍກຕາມໝວດໝູ່ (ໝວດທີ່ຂໍ້ມູນຫາຍຈະຂຶ້ນ <span className="text-red-400">ໄຮໄລ້ສີແດງ</span> • ໝວດທີ່ຄົບຖ້ວນຈະບໍ່ມີສີ)
              </div>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCollections(scanReport.collections.map((c) => c.collection))}
                  className="text-zinc-400 hover:text-white hover:underline cursor-pointer"
                >
                  ເລືອກທັງໝົດ
                </button>
                <span className="text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCollections(
                      scanReport.collections.filter((c) => c.restorableCount > 0).map((c) => c.collection)
                    )
                  }
                  className="text-red-400 hover:underline font-bold cursor-pointer"
                >
                  ເລືອກສະເພາະລາຍການສີແດງທີ່ຫາຍໄປ
                </button>
              </div>
            </div>

            <div className="divide-y divide-zinc-800/50">
              {scanReport.collections.map((col) => {
                const isMissing = col.restorableCount > 0;
                const isChecked = selectedCollections.includes(col.collection);
                const isExpanded = expandedCol === col.collection || isMissing;

                return (
                  <div
                    key={col.collection}
                    className={`p-4 transition-all ${
                      isMissing
                        ? "bg-red-500/15 border-l-4 border-l-red-500 border-y border-r border-red-500/40"
                        : "bg-transparent hover:bg-zinc-900/30"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleCollectionCheckbox(col.collection)}
                          className="cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare
                              className={`w-5 h-5 ${isMissing ? "text-red-400" : "text-zinc-400"}`}
                            />
                          ) : (
                            <Square
                              className={`w-5 h-5 ${isMissing ? "text-red-400/70" : "text-zinc-700"}`}
                            />
                          )}
                        </button>
                        <div>
                          <div
                            className={`text-sm font-bold flex items-center gap-2 ${
                              isMissing ? "text-red-200" : "text-zinc-300"
                            }`}
                          >
                            {isMissing && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />}
                            <span>{col.labelLao}</span>
                            <span className="text-[11px] font-mono text-zinc-500">({col.collection})</span>
                          </div>
                          <div
                            className={`text-xs flex flex-wrap items-center gap-3 mt-0.5 ${
                              isMissing ? "text-red-300" : "text-zinc-500"
                            }`}
                          >
                            <span>ໃນ Backup: {col.totalInBackup}</span>
                            <span>• ຊ້ຳກັນ (ຂ້າມ): {col.duplicateSkippedCount}</span>
                            <span className={isMissing ? "text-red-400 font-extrabold" : "text-zinc-500"}>
                              • ຫາຍໄປ/ພ້ອມກູ້ຄືນ: {col.restorableCount}
                            </span>
                            {col.modifiedCount > 0 && (
                              <span>• ຂໍ້ມູນປ່ຽນແປງ: {col.modifiedCount}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isMissing ? (
                          <>
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-600/25 text-red-300 border border-red-500/50 animate-pulse">
                              ບໍ່ມີລາຍການນີ້ໃນລະບົບ ({col.restorableCount} ລາຍການ)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickRestoreSingleCollection(col.collection)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>ກູ້ກັບຄືນທັນທີ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedCol(expandedCol === col.collection ? "__HIDE__" : col.collection)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900/60 border border-red-500/30 text-xs text-red-200 cursor-pointer"
                            >
                              <span>ລາຍຊື່</span>
                              {isExpanded && expandedCol !== "__HIDE__" ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-500">
                            ຂໍ້ມູນຄົບຖ້ວນ (ຊ້ຳທັງໝົດ)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded Preview of Missing Items in RED */}
                    {isMissing && expandedCol !== "__HIDE__" && col.missingPreviews.length > 0 && (
                      <div className="mt-3 ml-8 p-4 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-2">
                        <div className="text-xs font-extrabold text-red-300">
                          ລາຍຊື່ຂໍ້ມູນທີ່ຫາຍໄປຈາກລະບົບ ({col.restorableCount} ລາຍການ — ກົດກູ້ກັບຄືນໄດ້ທັນທີ):
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {col.missingPreviews.map((item) => (
                            <div
                              key={item.id}
                              className="p-2.5 rounded-xl bg-zinc-950/90 border border-red-500/40 flex items-start justify-between gap-2"
                            >
                              <div>
                                <div className="text-xs font-bold text-red-200">{item.title}</div>
                                <div className="text-[11px] text-zinc-400">{item.subtitle}</div>
                                {item.organizationName && (
                                  <div className="text-[10px] text-red-300 mt-0.5">
                                    ຮ້ານ: {item.organizationName}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600/30 text-red-200 border border-red-500/40 shrink-0">
                                {item.status === "SOFT_DELETED" ? "ຢູ່ໃນຖັງຂີ້ເຫຍື້ອ" : "ຫາຍໄປ / ຖືກລຶບ"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Uploads Restore Toggle + Open Custom Restore Modal Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={restoreUploads}
                onChange={(e) => setRestoreUploads(e.target.checked)}
                className="rounded accent-red-500 w-4 h-4"
              />
              <span>
                ກູ້ຄືນໄຟລ໌ຮູບພາບໃນ <code className="text-zinc-200">public/uploads</code> ທີ່ຫາຍໄປນຳ ({scanReport.summary.uploadsMissingRestorable} ໄຟລ໌, ຂ້າມໄຟລ໌ຮູບທີ່ມີຢູ່ແລ້ວ {scanReport.summary.uploadsDuplicateSkipped} ໄຟລ໌)
              </span>
            </label>

            <button
              type="button"
              onClick={() => setShowRestoreConfirmModal(true)}
              disabled={restoring}
              className={`inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-white font-extrabold text-sm shadow-xl transition-all disabled:opacity-50 cursor-pointer ${
                missingTotalCount > 0
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/30"
                  : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              <RotateCcw className={`w-5 h-5 ${restoring ? "animate-spin" : ""}`} />
              <span>
                {restoring
                  ? "ກຳລັງກູ້ຄືນຂໍ້ມູນເຂົ້າລະບົບ..."
                  : missingTotalCount > 0
                  ? `ກູ້ກັບຄືນລາຍການສີແດງທີ່ຫາຍໄປ (${missingTotalCount} ລາຍການ)`
                  : "ຢືນຢັນອັບໂຫຼດ & ກູ້ຄືນຂໍ້ມູນ"}
              </span>
            </button>
          </div>

          {/* Post-Restore Result Breakdown */}
          {restoreResultSummary && (
            <div className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 space-y-2">
              <div className="text-sm font-extrabold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>ສະຫຼຸບຜົນການກູ້ຄືນຂໍ້ມູນສຳເລັດຮຽບຮ້ອຍ!</span>
              </div>
              <div className="text-xs text-zinc-200 flex flex-wrap gap-6">
                <span>
                  ດຶງຂໍ້ມູນທີ່ຖືກລຶບກັບມາ: <strong>{restoreResultSummary.restoredDocumentsCount}</strong> ລາຍການ
                </span>
                <span>
                  ກູ້ຄືນຈາກຖັງຂີ້ເຫຍື້ອ: <strong>{restoreResultSummary.reactivatedSoftDeletedCount}</strong> ລາຍການ
                </span>
                <span>
                  ຍ້ອນຄ່າຂໍ້ມູນທີ່ປ່ຽນແປງ: <strong>{restoreResultSummary.overwrittenModifiedCount}</strong> ລາຍການ
                </span>
                <span>
                  ຂ້າມຂໍ້ມູນຊ້ຳ (ບໍ່ເອົາ): <strong>{restoreResultSummary.skippedDuplicateCount}</strong> ລາຍການ
                </span>
                <span>
                  ກູ້ຄືນຮູບພາບ: <strong>{restoreResultSummary.restoredUploadsCount}</strong> ໄຟລ໌
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 5. POPUP MODAL 1: CREATE MANUAL BACKUP CONFIRMATION ── */}
      {showCreateBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">ຢືນຢັນການສ້າງໄຟລ໌ Backup ດຽວນີ້</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  ລະບົບຈະສຳຮອງຖານຂໍ້ມູນທັງໝົດ 52 ຕາຕະລາງ ແລະ ໄຟລ໌ຮູບພາບລົງໃນໂຟນເດີ{" "}
                  <code className="text-emerald-400">/backups</code> ທັນທີ.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1 text-xs">
              <div className="text-zinc-400">ໝາຍເຫດການ Backup:</div>
              <div className="font-semibold text-white">
                {manualNote.trim() || "ສຳຮອງຂໍ້ມູນດ່ວນໂດຍ Super Admin"}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={creatingBackup}
                onClick={() => setShowCreateBackupModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-all cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                disabled={creatingBackup}
                onClick={executeCreateManualBackup}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{creatingBackup ? "ກຳລັງສ້າງ..." : "ຢືນຢັນສ້າງ Backup"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. POPUP MODAL 2: PIN / UNPIN CONFIRMATION ── */}
      {pinTargetFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-amber-500/40 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                {pinTargetFile.pinned ? (
                  <Unlock className="w-6 h-6 text-amber-400" />
                ) : (
                  <Lock className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">
                  {pinTargetFile.pinned ? "ຢືນຢັນການປົດໝຸດໄຟລ໌ Backup" : "ຢືນຢັນການປັກໝຸດໄຟລ໌ Backup"}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {pinTargetFile.pinned
                    ? "ເມື່ອປົດໝຸດແລ້ວ ໄຟລ໌ນີ້ຈະຖືກລຶບອັດຕະໂນມັດເມື່ອໝົດກຳນົດວັນເກັບຍ້ອນຫຼັງ."
                    : "ເມື່ອປັກໝຸດໄວ້ ລະບົບຈະເກັບໄຟລ໌ນີ້ໄວ້ຖາວອນ ແລະ ບໍ່ລຶບອອກອັດຕະໂນມັດ."}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300 break-all">
              {pinTargetFile.filename}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={togglingPin}
                onClick={() => setPinTargetFile(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-all cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                disabled={togglingPin}
                onClick={executeTogglePin}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {pinTargetFile.pinned ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{togglingPin ? "ກຳລັງບັນທຶກ..." : "ຢືນຢັນ"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. POPUP MODAL 3: UPDATE RETENTION / AUTO-BACKUP CONFIG ── */}
      {pendingConfigUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-blue-500/40 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">ຢືນຢັນການປ່ຽນແປງຕັ້ງຄ່າ Backup</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  ທ່ານຕ້ອງການບັນທຶກການຕັ້ງຄ່າການສຳຮອງຂໍ້ມູນອັດຕະໂນມັດນີ້ແທ້ບໍ່?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">ສະຖານະ Auto-Backup ທຸກມື້:</span>
                <strong className={pendingConfigUpdate.autoBackupEnabled ? "text-emerald-400" : "text-red-400"}>
                  {pendingConfigUpdate.autoBackupEnabled ? "ເປີດໃຊ້ງານ" : "ປິດໃຊ້ງານ"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">ຈຳນວນວັນເກັບຍ້ອນຫຼັງ:</span>
                <strong className="text-blue-400">{pendingConfigUpdate.retentionDays} ວັນລ່າສຸດ</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={savingConfig}
                onClick={() => setPendingConfigUpdate(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-all cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                disabled={savingConfig}
                onClick={executeSaveConfig}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{savingConfig ? "ກຳລັງບັນທຶກ..." : "ຢືນຢັນບັນທຶກຕັ້ງຄ່າ"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. POPUP MODAL 4: SMART RESTORE CONFIRMATION ── */}
      {showRestoreConfirmModal && scanReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 p-6 md:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => !restoring && setShowRestoreConfirmModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {restoreMode === "MISSING_ONLY" ? "ໂໝດປອດໄພ 100% (ຊ້ຳບໍ່ເອົາ)" : "ໂໝດກູ້ຄືນ + ຍ້ອນຄ່າເກົ່າ"}
                </span>
                <h3 className="text-xl font-extrabold text-white">ຢືນຢັນການກູ້ຄືນຂໍ້ມູນອັດສະລິຍະ</h3>
                <p className="text-xs text-zinc-400">
                  ໄຟລ໌ຕົ້ນທາງ: <span className="text-emerald-400 font-mono font-semibold">{activeScanFilename}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Store className="w-4 h-4 text-blue-400" />
                <span>ຂອບເຂດຮ້ານຄ້າ:</span>
                <strong className="text-white">{selectedOrgName}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  ເລືອກ {selectedCollections.length || scanReport.collections.length} ໝວດໝູ່
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>ຂໍ້ມູນຊ້ຳ (ຂ້າມອັດຕະໂນມັດ)</span>
                </div>
                <div className="text-2xl font-extrabold text-zinc-200">
                  {scanReport.summary.totalDuplicatesSkipped.toLocaleString()}
                </div>
                <div className="text-[11px] text-zinc-500">ລາຍການທີ່ມີຢູ່ແລ້ວ (ບໍ່ເອົາ)</div>
              </div>

              <div
                className={`p-4 rounded-2xl space-y-1 ${
                  missingTotalCount > 0
                    ? "bg-red-500/15 border border-red-500/40"
                    : "bg-zinc-950 border border-zinc-800"
                }`}
              >
                <div
                  className={`text-[11px] font-bold flex items-center gap-1 ${
                    missingTotalCount > 0 ? "text-red-300" : "text-zinc-400"
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ດຶງຂໍ້ມູນທີ່ຫາຍກັບຄືນ</span>
                </div>
                <div
                  className={`text-2xl font-extrabold ${
                    missingTotalCount > 0 ? "text-red-400" : "text-zinc-200"
                  }`}
                >
                  {(
                    missingTotalCount +
                    (restoreMode === "OVERWRITE_MODIFIED" ? scanReport.summary.totalModified : 0)
                  ).toLocaleString()}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {restoreMode === "OVERWRITE_MODIFIED"
                    ? `ຫາຍໄປ ${missingTotalCount} + ຍ້ອນຄ່າ ${scanReport.summary.totalModified}`
                    : "ລາຍການທີ່ຖືກລຶບ/ຫາຍໄປ"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>ກູ້ຄືນຮູບພາບທີ່ຫາຍໄປ</span>
                </div>
                <div className="text-2xl font-extrabold text-zinc-200">
                  {restoreUploads ? scanReport.summary.uploadsMissingRestorable : 0}
                </div>
                <div className="text-[11px] text-zinc-500">
                  ຂ້າມຮູບທີ່ມີແລ້ວ {scanReport.summary.uploadsDuplicateSkipped} ໄຟລ໌
                </div>
              </div>
            </div>

            {missingTotalCount === 0 &&
              scanReport.summary.uploadsMissingRestorable === 0 &&
              restoreMode === "MISSING_ONLY" && (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    <strong className="text-white block mb-0.5">
                      ຂໍ້ມູນທັງໝົດໃນລະບົບປັດຈຸບັນຄົບຖ້ວນ 100% ແລ້ວ!
                    </strong>
                    ບໍ່ພົບລາຍການໃດທີ່ຫາຍໄປເລີຍ (ຂໍ້ມູນທັງ{" "}
                    {scanReport.summary.totalDuplicatesSkipped.toLocaleString()} ລາຍການ ມີຢູ່ຄົບຖ້ວນແລ້ວ).
                  </div>
                </div>
              )}

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={restoring}
                onClick={() => setShowRestoreConfirmModal(false)}
                className="px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-all cursor-pointer"
              >
                ຍົກເລີກ (Cancel)
              </button>
              <button
                type="button"
                disabled={restoring}
                onClick={executeConfirmedRestore}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className={`w-4 h-4 ${restoring ? "animate-spin" : ""}`} />
                <span>
                  {restoring ? "ກຳລັງດຳເນີນການກູ້ຄືນ..." : "ຢືນຢັນການກູ້ຄືນຂໍ້ມູນດຽວນີ້"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. POPUP MODAL 5: DELETE FILE CONFIRMATION ── */}
      {deleteTargetFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-red-500/40 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">ຢືນຢັນການລຶບໄຟລ໌ Backup</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  ທ່ານຕ້ອງການລຶບໄຟລ໌ນີ້ອອກຈາກໂຟນເດີ{" "}
                  <code className="text-red-300">/{deleteTargetFile.folderName || "backups"}</code> ແທ້ບໍ່?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1 text-xs">
              <div className="font-mono font-bold text-red-300 break-all">{deleteTargetFile.filename}</div>
              <div className="text-zinc-400">
                ວັນທີສ້າງ: {formatDateTime(deleteTargetFile.createdAt)} • ຂະໜາດ: {formatBytes(deleteTargetFile.sizeBytes)}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deletingFile}
                onClick={() => setDeleteTargetFile(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-all cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                disabled={deletingFile}
                onClick={confirmDeleteFile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingFile ? "ກຳລັງລຶບ..." : "ຢືນຢັນລຶບໄຟລ໌"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
