"use client";

import { askConfirm } from "@/components/ConfirmModal";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  LayoutGrid,
  Coffee,
  QrCode,
  Printer,
  Banknote,
  ScanLine,
  Utensils,
  RefreshCw,
  Zap,
  ShoppingCart,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  SplitSquareHorizontal,
  X,
  Copy,
  Check,
  ExternalLink,
  Download
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { payTableOrder } from "@/app/actions/pos";
import { copyToClipboard } from "@/lib/utils";

export default function ZonesClient({ 
  orgSlug,
  paymentQrCode,
  promptPayId,
  paymentAccountInfo 
}: { 
  orgSlug?: string,
  paymentQrCode?: string,
  promptPayId?: string,
  paymentAccountInfo?: string
}) {
  const router = useRouter();
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [selectedTableForQr, setSelectedTableForQr] = useState<any>(null);
  
  const [editingZone, setEditingZone] = useState<any>(null);
  const [editingTable, setEditingTable] = useState<any>(null);
  
  const [zoneName, setZoneName] = useState("");
  
  // Table Dialog Form
  const [tableMode, setTableMode] = useState<"single" | "batch">("single");
  const [tableData, setTableData] = useState({ name: "", seats: "4", zoneId: "" });
  const [batchPrefix, setBatchPrefix] = useState("T-");
  const [batchCount, setBatchCount] = useState("5");
  
  const [isSaving, setIsSaving] = useState(false);
  const [batchLoadingZoneId, setBatchLoadingZoneId] = useState<string | null>(null);

  // Checkout and Print State
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [selectedTableForCheckout, setSelectedTableForCheckout] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchZones(false);

    // Auto-poll in background every 4 seconds when no dialogs are open
    const interval = setInterval(() => {
      if (!isCheckoutDialogOpen && !isTableDialogOpen && !isZoneDialogOpen && !isQrDialogOpen) {
        fetchZones(true);
      }
    }, 4000);

    const handleFocus = () => {
      fetchZones(true);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isCheckoutDialogOpen, isTableDialogOpen, isZoneDialogOpen, isQrDialogOpen]);

  const fetchZones = async (isBackground = false) => {
    try {
      const res = await fetch("/api/zones", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch (error) {
      if (!isBackground) toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໂຊນໄດ້ (Failed to load zones)");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleOpenZoneDialog = (zone: any = null) => {
    if (zone) {
      setEditingZone(zone);
      setZoneName(zone.name);
    } else {
      setEditingZone(null);
      setZoneName("");
    }
    setIsZoneDialogOpen(true);
  };

  const handleOpenTableDialog = (zoneId: string, table: any = null) => {
    if (table) {
      setEditingTable(table);
      setTableMode("single");
      setTableData({ name: table.name, seats: table.seats.toString(), zoneId });
    } else {
      setEditingTable(null);
      setTableMode("single");
      setTableData({ name: "", seats: "4", zoneId });
      setBatchPrefix("T-");
      setBatchCount("5");
    }
    setIsTableDialogOpen(true);
  };

  const [copiedTableLink, setCopiedTableLink] = useState(false);

  const handleOpenQrDialog = (table: any) => {
    setSelectedTableForQr(table);
    setCopiedTableLink(false);
    setIsQrDialogOpen(true);
  };

  const handleCopyTableUrl = async (url: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedTableLink(true);
      toast.success("ຄັດລອກລິ້ງສັ່ງອາຫານສຳເລັດແລ້ວ! (Link Copied)");
      setTimeout(() => setCopiedTableLink(false), 2500);
    } else {
      toast.error("ກະລຸນາຄລິກເລືອກຂໍ້ຄວາມໃນຊ່ອງເພື່ອຄັດລອກ");
    }
  };

  const handlePrintTableQr = () => {
    const svg = document.getElementById("table-qr-svg");
    if (!svg || !selectedTableForQr) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("ກະລຸນາອະນຸຍາດ Pop-up ເພື່ອພິມ QR Code");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table QR - ${selectedTableForQr.name}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Lao", sans-serif; 
              text-align: center; 
              padding: 40px 20px; 
              color: #000;
            }
            .card {
              display: inline-block;
              border: 3px solid #000;
              border-radius: 24px;
              padding: 30px;
              max-width: 320px;
              margin: 0 auto;
            }
            h1 { font-size: 32px; font-weight: 900; margin: 0 0 4px 0; }
            p { font-size: 13px; color: #555; margin: 0 0 20px 0; }
            .qr-wrapper { margin: 15px auto; }
            .footer { font-size: 11px; color: #777; margin-top: 15px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>ໂຕະ ${selectedTableForQr.name}</h1>
            <p>ສະແກນ QR ເພື່ອເບິ່ງເມນູ ແລະ ສັ່ງອາຫານ</p>
            <div class="qr-wrapper">${svg.outerHTML}</div>
            <div class="footer">Scan to Order • Self Service</div>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
                window.close(); 
              }, 300);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveZone = async () => {
    if (!zoneName.trim()) return toast.error("ກະລຸນາປ້ອນຊື່ໂຊນ (Zone name required)");
    setIsSaving(true);
    try {
      const url = editingZone ? `/api/zones/${editingZone.id}` : "/api/zones";
      const res = await fetch(url, {
        method: editingZone ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: zoneName.trim() }),
      });
      if (res.ok) {
        toast.success(editingZone ? "ແກ້ໄຂໂຊນສຳເລັດ" : "ເພີ່ມໂຊນສຳເລັດແລ້ວ");
        setIsZoneDialogOpen(false);
        fetchZones();
      } else {
        toast.error("ບັນທຶກໂຊນບໍ່ສຳເລັດ");
      }
    } catch (error) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກໂຊນ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!(await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໂຊນນີ້? ໂຕ໊ະທັງໝົດໃນໂຊນຈະຖືກລຶບອອກດ້ວຍ.", { variant: "destructive" }))) return;
    try {
      const res = await fetch(`/api/zones/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບໂຊນສຳເລັດແລ້ວ");
        fetchZones();
      } else {
        toast.error("ລຶບໂຊນບໍ່ສຳເລັດ");
      }
    } catch (error) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບໂຊນ");
    }
  };

  const handleSaveTable = async () => {
    setIsSaving(true);
    try {
      if (tableMode === "batch") {
        const count = parseInt(batchCount) || 5;
        const res = await fetch("/api/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            zoneId: tableData.zoneId,
            batchCount: count,
            prefix: batchPrefix || "T-",
            seats: tableData.seats || "4"
          }),
        });
        if (res.ok) {
          toast.success(`ສ້າງຊຸດ ${count} ໂຕ໊ະສຳເລັດແລ້ວ!`);
          setIsTableDialogOpen(false);
          fetchZones();
        } else {
          toast.error("ສ້າງຊຸດໂຕ໊ະບໍ່ສຳເລັດ");
        }
      } else {
        if (!tableData.name.trim()) {
          setIsSaving(false);
          return toast.error("ກະລຸນາປ້ອນຊື່ໂຕ໊ະ");
        }
        const url = editingTable ? `/api/tables/${editingTable.id}` : "/api/tables";
        const res = await fetch(url, {
          method: editingTable ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: tableData.name.trim(),
            seats: tableData.seats || "4",
            zoneId: tableData.zoneId
          }),
        });
        if (res.ok) {
          toast.success(editingTable ? "ແກ້ໄຂໂຕ໊ະສຳເລັດ" : "ເພີ່ມໂຕ໊ະສຳເລັດແລ້ວ");
          setIsTableDialogOpen(false);
          fetchZones();
        } else {
          toast.error("ບັນທຶກໂຕ໊ະບໍ່ສຳເລັດ");
        }
      }
    } catch (error) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກໂຕ໊ະ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickCreateBatchTables = async (zoneId: string, count = 5) => {
    setBatchLoadingZoneId(zoneId);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId,
          batchCount: count,
          prefix: "T-",
          seats: "4"
        }),
      });
      if (res.ok) {
        toast.success(`ສ້າງຊຸດ ${count} ໂຕ໊ະສຳເລັດແລ້ວ! ພ້ອມຮັບອໍເດີເລີຍ`);
        fetchZones();
      } else {
        toast.error("ບໍ່ສາມາດສ້າງຊຸດໂຕ໊ະໄດ້");
      }
    } catch (error) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການສ້າງຊຸດໂຕ໊ະ");
    } finally {
      setBatchLoadingZoneId(null);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!(await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໂຕ໊ະນີ້?", { variant: "destructive" }))) return;
    try {
      const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບໂຕ໊ະສຳເລັດແລ້ວ");
        fetchZones();
      } else {
        toast.error("ລຶບໂຕ໊ະບໍ່ສຳເລັດ");
      }
    } catch (error) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບໂຕ໊ະ");
    }
  };

  const handleUpdateTableStatus = async (tableId: string, newStatus: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const res = await fetch(`/api/tables/${tableId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`ປ່ຽນສະຖານະໂຕ໊ະເປັນ ${newStatus} ສຳເລັດ`);
        fetchZones(true);
      } else {
        toast.error("ປ່ຽນສະຖານະບໍ່ສຳເລັດ");
      }
    } catch (error) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການປ່ຽນສະຖານະ");
    }
  };

  const handlePrint = (table: any) => {
    const printHtml = `
      <html>
        <head>
          <title>Print Pre-Bill</title>
          <style>
            @page { margin: 5mm; size: 80mm auto; }
            body { font-family: monospace; color: black; background: white; font-size: 12px; margin: 0; padding: 10px; width: 100%; box-sizing: border-box; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-xl { font-size: 16px; margin: 0; }
            .text-lg { font-size: 14px; margin: 0; }
            .text-sm { font-size: 12px; margin: 0; }
            .text-xs { font-size: 10px; margin: 0; }
            .text-gray-500 { color: #666; }
            .mb-4 { margin-bottom: 16px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-1 { margin-bottom: 4px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .mt-3 { margin-top: 12px; }
            .mt-6 { margin-top: 24px; }
            .pb-10 { padding-bottom: 40px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .pb-3 { padding-bottom: 12px; }
            .border-y { border-top: 1px solid black; border-bottom: 1px solid black; }
            .border-b { border-bottom: 1px solid black; }
            .border-b-2 { border-bottom: 2px dashed black; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .uppercase { text-transform: uppercase; }
            .pr-2 { padding-right: 8px; }
            p { margin: 0; }
          </style>
        </head>
        <body>
          <div class="text-center mb-4">
            <h2 class="text-xl font-bold">LAOSYS</h2>
            <p class="text-xs">ສາຂາຫຼັກ (Main Branch)</p>
            <p class="text-xs mt-1">ໃບບິນ / ໃບແຈ້ງຍອດ (Pre-Bill)</p>
            <p class="font-bold mt-2 text-lg border-y py-1">ໂຕະ (Table): ${table.name}</p>
          </div>
          
          <div class="border-b py-2 mb-2">
            <div class="flex justify-between font-bold text-xs mb-2 uppercase">
              <span>ລາຍການ</span>
              <span>ລວມ</span>
            </div>
            ${table.orders?.[0]?.items?.map((item: any) => `
              <div class="flex justify-between text-xs mb-1">
                <span class="pr-2">${item.product?.name} x${item.quantity}</span>
                <span>${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            `).join('') || ''}
          </div>

          <div class="flex justify-between items-center font-bold text-sm mt-3 border-b-2 pb-3">
            <span>ຍອດລວມ (Total):</span>
            <span class="text-lg">₭${(table.orders?.[0]?.totalAmount || 0).toLocaleString()}</span>
          </div>
          
          <div class="text-center mt-6 text-xs pb-10">
            <p>ຂອບໃຈທີ່ໃຊ້ບໍລິການ</p>
            <p>Thank you for your visit</p>
            <p class="mt-2 text-xs text-gray-500">${new Date().toLocaleString('lo-LA')}</p>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    }
  };

  const handleOpenCheckout = (table: any) => {
    setSelectedTableForCheckout(table);
    setPaymentMethod("CASH");
    setCashReceived("");
    setIsCheckoutDialogOpen(true);
  };

  const handlePayBill = async () => {
    if (!selectedTableForCheckout) return;
    
    const activeOrder = selectedTableForCheckout.orders?.[0];
    if (!activeOrder) {
      toast.error("ບໍ່ພົບອໍເດີທີ່ເປີດຢູ່ສຳລັບໂຕ໊ະນີ້ (No active order found)");
      return;
    }

    const changeAmount = Number(cashReceived) - activeOrder.totalAmount;
    setIsProcessingPayment(true);
    
    const result = await payTableOrder({
      orderId: activeOrder.id,
      tableId: selectedTableForCheckout.id,
      paymentMethod,
      cashReceived: Number(cashReceived) || 0,
      changeAmount
    });

    setIsProcessingPayment(false);

    if (result.success) {
      setSuccess(true);
      setCashReceived("");
      fetchZones(true);
      
      setTimeout(() => {
        setSuccess(false);
        setIsCheckoutDialogOpen(false);
        setSelectedTableForCheckout(null);
        fetchZones(true);
      }, 1500);
    } else {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການຊຳລະເງິນ: " + result.error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm text-zinc-400">ກຳລັງໂຫຼດຂໍ້ມູນໂຊນ ແລະ ໂຕ໊ະ...</p>
      </div>
    );
  }

  const allTables = zones.flatMap((z) => z.tables || []);
  const availableCount = allTables.filter((t) => !t.status || t.status === "AVAILABLE").length;
  const occupiedCount = allTables.filter((t) => t.status === "OCCUPIED").length;
  const billRequestedCount = allTables.filter((t) => t.status === "BILL_REQUESTED").length;
  const maintenanceCount = allTables.filter((t) => t.status === "MAINTENANCE").length;

  const zonePresets = [
    "ຫ້ອງແອ (Indoor)",
    "ກາງແຈ້ງ (Outdoor)",
    "ຫ້ອງ VIP",
    "ຊັ້ນ 2 (Floor 2)",
    "ບາ (Bar)",
    "ໂຊນ A",
    "ໂຊນ B"
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* ── TOP BANNER & FAST CONTROLS ── */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-950 p-4 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                ໂຊນ ແລະ ໂຕ໊ະ <span className="text-zinc-500 font-normal text-sm sm:text-lg">(Zones & Tables)</span>
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>ອັບເດດສົດ 4 ວິນາທີ</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              ຈັດການໂຊນ, ເພີ່ມໂຕ໊ະໃໝ່ ແລະ ກົດສັ່ງຊື້ສິນຄ້າ / ອາຫານໃຫ້ແຕ່ລະໂຕ໊ະໄດ້ທັນທີ
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={() => {
                fetchZones(false);
                toast.success("ອັບເດດສະຖານະໂຕ໊ະແລ້ວ (Refreshed)");
              }} 
              className="border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs h-10 px-3.5"
              title="ຣີເຟຣຊຂໍ້ມູນ"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
              ຣີເຟຣຊ
            </Button>

            <Link
              href="/dashboard/restaurant/split-merge"
              className="h-10 px-3.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 hover:text-white font-bold text-xs border border-purple-500/30 transition-all flex items-center justify-center gap-1.5"
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5" />
              <span>ແຍກບິນ / ລວມບິນ</span>
            </Link>

            <Link
              href="/dashboard/pos"
              className="h-10 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-orange-400" />
              <span>POS ຂາຍໜ້າຮ້ານ</span>
            </Link>

            <Button 
              onClick={() => handleOpenZoneDialog()} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-4 shadow-lg shadow-emerald-950/40 transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" /> ເພີ່ມໂຊນໃໝ່ (Add Zone)
            </Button>
          </div>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 pt-1">
          {/* Available */}
          <div className="bg-zinc-950/60 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-3 sm:p-4 transition-all shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Coffee className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-emerald-400 truncate">
                ວ່າງ (AVAILABLE)
              </p>
            </div>
            <h3 className="text-2xl font-black text-white">
              {availableCount} <span className="text-xs font-normal text-zinc-400">ໂຕ໊ະ</span>
            </h3>
          </div>

          {/* Occupied */}
          <div className="bg-zinc-950/60 border border-blue-500/30 hover:border-blue-500/60 rounded-2xl p-3 sm:p-4 transition-all shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-blue-400 truncate">
                ກຳລັງໃຊ້ (OCCUPIED)
              </p>
            </div>
            <h3 className="text-2xl font-black text-white">
              {occupiedCount} <span className="text-xs font-normal text-zinc-400">ໂຕ໊ະ</span>
            </h3>
          </div>

          {/* Wait Bill */}
          <div className="bg-zinc-950/60 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-3 sm:p-4 transition-all shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Banknote className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-amber-400 truncate">
                ລໍຖ້າເຊັກບິນ (BILL)
              </p>
            </div>
            <h3 className="text-2xl font-black text-white">
              {billRequestedCount} <span className="text-xs font-normal text-zinc-400">ໂຕ໊ະ</span>
            </h3>
          </div>

          {/* Maintenance */}
          <div className="bg-zinc-950/60 border border-rose-500/30 hover:border-rose-500/60 rounded-2xl p-3 sm:p-4 transition-all shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                <Coffee className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-rose-400 truncate">
                ປິດປັບປຸງ (MAINT)
              </p>
            </div>
            <h3 className="text-2xl font-black text-white">
              {maintenanceCount} <span className="text-xs font-normal text-zinc-400">ໂຕ໊ະ</span>
            </h3>
          </div>
        </div>
      </div>

      {/* ── ZONES LIST ── */}
      {zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center border-2 border-zinc-800 border-dashed rounded-3xl bg-zinc-900/30 p-8">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 text-emerald-400">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">ຍັງບໍ່ທັນມີໂຊນໃນຮ້ານ (No zones yet)</h2>
          <p className="text-sm text-zinc-400 max-w-md mb-6">
            ເລີ່ມຕົ້ນດ້ວຍການເພີ່ມໂຊນທຳອິດ ເຊັ່ນ: ຫ້ອງແອ, ລະບຽງ, VIP ຫຼື ຊັ້ນ 2 ເພື່ອຈັດການໂຕ໊ະອາຫານ ແລະ ສັ່ງຊື້ສິນຄ້າ
          </p>
          <Button 
            onClick={() => handleOpenZoneDialog()} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-6 shadow-xl shadow-emerald-950/40"
          >
            <Plus className="w-5 h-5 mr-2" /> ສ້າງໂຊນທຳອິດ (Create First Zone)
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {zones.map((zone) => {
            const tables = zone.tables || [];
            const hasTables = tables.length > 0;
            const isBatchCreating = batchLoadingZoneId === zone.id;

            return (
              <Card key={zone.id} className="relative bg-zinc-900/50 border-zinc-800/80 backdrop-blur-xl shadow-xl overflow-hidden rounded-3xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/60 via-teal-500/40 to-transparent" />
                
                {/* Zone Header */}
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/60 bg-zinc-950/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shrink-0 text-emerald-400">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <CardTitle className="text-xl font-extrabold text-white">
                          {zone.name}
                        </CardTitle>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {tables.length} ໂຕ໊ະ
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {hasTables ? `ມີ ${tables.length} ໂຕ໊ະໃນໂຊນນີ້ ພ້ອມໃຫ້ບໍລິການ` : 'ຍັງບໍ່ມີໂຕ໊ະໃນໂຊນນີ້'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                    {/* Add Table Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenTableDialog(zone.id)} 
                      className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold h-9 px-3"
                    >
                      <Plus className="w-4 h-4 mr-1.5 text-emerald-400" /> ເພີ່ມໂຕ໊ະ (Add Table)
                    </Button>

                    {/* Quick Batch Generate 5 Tables */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isBatchCreating}
                      onClick={() => handleQuickCreateBatchTables(zone.id, 5)}
                      className="border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 text-xs font-bold h-9 px-3"
                      title="ສ້າງ 5 ໂຕ໊ະດ່ວນອັດຕະໂນມັດ: T-01 ຫາ T-05"
                    >
                      {isBatchCreating ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                      )}
                      <span>ສ້າງ 5 ໂຕ໊ະດ່ວນ</span>
                    </Button>

                    <div className="h-6 w-px bg-zinc-800 mx-1 hidden sm:block" />

                    {/* Edit Zone */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleOpenZoneDialog(zone)} 
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-9 w-9 p-0"
                      title="ແກ້ໄຂຊື່ໂຊນ"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    {/* Delete Zone */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteZone(zone.id)} 
                      className="text-zinc-400 hover:text-red-400 hover:bg-red-950/40 h-9 w-9 p-0"
                      title="ລຶບໂຊນ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Zone Content */}
                <CardContent className="p-4 sm:p-6">
                  {hasTables ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                      {tables.map((table: any) => {
                        const status = table.status || "AVAILABLE";
                        const activeOrder = table.orders?.[0];
                        const orderTotal = activeOrder?.totalAmount || 0;
                        const itemsCount = activeOrder?.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 0;

                        // Theme per status
                        let borderClass = "border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.12)]";
                        let bgGradient = "from-zinc-900/90 via-zinc-900 to-zinc-950";
                        let statusDotClass = "bg-emerald-400";
                        let statusText = "ວ່າງ (AVAILABLE)";
                        let statusBadgeClass = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";

                        if (status === "OCCUPIED") {
                          borderClass = "border-blue-500/40 hover:border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.15)]";
                          bgGradient = "from-blue-950/30 via-zinc-900 to-zinc-950";
                          statusDotClass = "bg-blue-400";
                          statusText = "ກຳລັງໃຊ້ (OCCUPIED)";
                          statusBadgeClass = "bg-blue-500/15 text-blue-300 border-blue-500/40";
                        } else if (status === "BILL_REQUESTED") {
                          borderClass = "border-amber-500/50 hover:border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]";
                          bgGradient = "from-amber-950/40 via-zinc-900 to-zinc-950";
                          statusDotClass = "bg-amber-400";
                          statusText = "ລໍຖ້າເຊັກບິນ (BILL)";
                          statusBadgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse";
                        } else if (status === "MAINTENANCE") {
                          borderClass = "border-rose-500/30 hover:border-rose-400";
                          bgGradient = "from-rose-950/20 via-zinc-900 to-zinc-950";
                          statusDotClass = "bg-rose-400";
                          statusText = "ປິດປັບປຸງ (MAINT)";
                          statusBadgeClass = "bg-rose-500/10 text-rose-300 border-rose-500/30";
                        }

                        return (
                          <div
                            key={table.id}
                            className={`group relative rounded-2xl border p-4 flex flex-col justify-between transition-all duration-300 bg-gradient-to-b ${bgGradient} ${borderClass}`}
                          >
                            {/* Card Top Row: Status badge & Utility buttons */}
                            <div className="flex items-center justify-between gap-1 mb-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
                                <span className="truncate">{statusText}</span>
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleOpenQrDialog(table); }}
                                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                  title="ສະແກນ QR ໂຕະ"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleOpenTableDialog(zone.id, table); }}
                                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                  title="ແກ້ໄຂໂຕ໊ະ"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id); }}
                                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-900/60 text-zinc-400 hover:text-red-300 transition-colors"
                                  title="ລຶບໂຕ໊ະ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Table Info Center */}
                            <div className="flex flex-col items-center text-center my-2">
                              <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mb-2 text-zinc-300 group-hover:scale-105 transition-transform">
                                <Coffee className="w-6 h-6 text-zinc-300" />
                              </div>
                              <h3 className="text-lg font-black text-white truncate max-w-full">
                                {table.name}
                              </h3>
                              <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                                <Users className="w-3 h-3 text-zinc-500" />
                                <span>{table.seats} ບ່ອນນັ່ງ</span>
                              </p>
                            </div>

                            {/* Active Order Summary (if OCCUPIED or BILL_REQUESTED) */}
                            {(status === "OCCUPIED" || status === "BILL_REQUESTED") && activeOrder && (
                              <div className="w-full my-2 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-center space-y-0.5">
                                <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                                  <span>ລາຍການ:</span>
                                  <span className="font-bold text-zinc-200">{itemsCount} ຢ່າງ</span>
                                </div>
                                <div className="text-sm font-black text-emerald-400 flex items-center justify-between">
                                  <span>ຍອດລວມ:</span>
                                  <span>₭{orderTotal.toLocaleString()}</span>
                                </div>
                              </div>
                            )}

                            {/* ── PRIMARY ACTION BUTTONS (ORDER / BUY FOR TABLE) ── */}
                            <div className="w-full mt-3 space-y-2">
                              {status === "AVAILABLE" && (
                                <button
                                  type="button"
                                  onClick={() => router.push(`/dashboard/pos?tableId=${table.id}`)}
                                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  <Utensils className="w-4 h-4" />
                                  <span>ສັ່ງອາຫານ / ຊື້ສິນຄ້າ</span>
                                </button>
                              )}

                              {status === "OCCUPIED" && (
                                <div className="space-y-1.5">
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/dashboard/pos?tableId=${table.id}`)}
                                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>ສັ່ງອາຫານເພີ່ມ</span>
                                  </button>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCheckout(table)}
                                      className="py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                                      title="ເຊັກບິນ ແລະ ຮັບເງິນ"
                                    >
                                      <Banknote className="w-3.5 h-3.5" />
                                      <span>ເຊັກບິນ</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handlePrint(table)}
                                      className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                                      title="ພິມໃບແຈ້ງຍອດ"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>ພິມບິນ</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {status === "BILL_REQUESTED" && (
                                <div className="space-y-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCheckout(table)}
                                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse"
                                  >
                                    <Banknote className="w-4 h-4" />
                                    <span>ຮັບເງິນ / ເຊັກບິນ</span>
                                  </button>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => router.push(`/dashboard/pos?tableId=${table.id}`)}
                                      className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold flex items-center justify-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>ສັ່ງເພີ່ມ</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handlePrint(table)}
                                      className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] font-bold flex items-center justify-center gap-1"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>ພິມບິນ</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {status === "MAINTENANCE" && (
                                <button
                                  type="button"
                                  onClick={(e) => handleUpdateTableStatus(table.id, "AVAILABLE", e)}
                                  className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <span>ເປີດໃຊ້ງານໂຕ໊ະຄືນ</span>
                                </button>
                              )}
                            </div>

                            {/* Quick Status Switcher Bar */}
                            <div className="w-full mt-3 pt-2.5 border-t border-zinc-800/60 grid grid-cols-4 gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleUpdateTableStatus(table.id, "AVAILABLE", e)}
                                className={`py-1 rounded text-[10px] font-bold transition-all ${
                                  status === "AVAILABLE"
                                    ? "bg-emerald-500 text-black shadow-sm font-extrabold"
                                    : "bg-zinc-950/60 text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800"
                                }`}
                                title="ປ່ຽນເປັນ ວ່າງ (AVAILABLE)"
                              >
                                ວ່າງ
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleUpdateTableStatus(table.id, "OCCUPIED", e)}
                                className={`py-1 rounded text-[10px] font-bold transition-all ${
                                  status === "OCCUPIED"
                                    ? "bg-blue-500 text-white shadow-sm font-extrabold"
                                    : "bg-zinc-950/60 text-zinc-400 hover:text-blue-300 hover:bg-zinc-800"
                                }`}
                                title="ປ່ຽນເປັນ ກຳລັງໃຊ້ (OCCUPIED)"
                              >
                                ໃຊ້ຢູ່
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleUpdateTableStatus(table.id, "BILL_REQUESTED", e)}
                                className={`py-1 rounded text-[10px] font-bold transition-all ${
                                  status === "BILL_REQUESTED"
                                    ? "bg-amber-500 text-black shadow-sm font-extrabold"
                                    : "bg-zinc-950/60 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800"
                                }`}
                                title="ປ່ຽນເປັນ ລໍຖ້າເຊັກບິນ (BILL)"
                              >
                                ບິນ
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleUpdateTableStatus(table.id, "MAINTENANCE", e)}
                                className={`py-1 rounded text-[10px] font-bold transition-all ${
                                  status === "MAINTENANCE"
                                    ? "bg-rose-500 text-white shadow-sm font-extrabold"
                                    : "bg-zinc-950/60 text-zinc-400 hover:text-rose-300 hover:bg-zinc-800"
                                }`}
                                title="ປ່ຽນເປັນ ປິດປັບປຸງ (MAINTENANCE)"
                              >
                                ປິດ
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── EMPTY ZONE STATE (Solves user's screenshot confusion!) ── */
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-zinc-800/80 border-dashed rounded-2xl bg-zinc-950/30">
                      <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-3 text-zinc-500">
                        <Coffee className="w-7 h-7 text-zinc-400" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">
                        ຍັງບໍ່ທັນມີໂຕ໊ະໃນໂຊນນີ້ (No tables in this zone)
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-md mb-5 leading-relaxed">
                        ທ່ານສາມາດເພີ່ມໂຕ໊ະດ່ຽວ ຫຼື ກົດສ້າງຊຸດ 5 ໂຕ໊ະອັດຕະໂນມັດ (T-01 ຫາ T-05) ເພື່ອເລີ່ມຕົ້ນຂາຍ ແລະ ສັ່ງຊື້ສິນຄ້າໄດ້ທັນທີ
                      </p>
                      
                      <div className="flex items-center gap-3 flex-wrap justify-center">
                        <Button
                          disabled={isBatchCreating}
                          onClick={() => handleQuickCreateBatchTables(zone.id, 5)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-5 shadow-lg shadow-emerald-950/40"
                        >
                          {isBatchCreating ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4 mr-2 text-yellow-300" />
                          )}
                          <span>ສ້າງ 5 ໂຕ໊ະດ່ວນ (Quick 5 Tables)</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleOpenTableDialog(zone.id)}
                          className="border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 text-xs font-bold h-10 px-5"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          <span>ເພີ່ມໂຕ໊ະໃໝ່ (Add Table)</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── ZONE DIALOG (WITH FAST PRESETS) ── */}
      <Dialog open={isZoneDialogOpen} onOpenChange={setIsZoneDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingZone ? 'ແກ້ໄຂໂຊນ (Edit Zone)' : 'ເພີ່ມໂຊນໃໝ່ (Add New Zone)'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">ຊື່ໂຊນ (Zone Name) *</Label>
              <Input 
                value={zoneName} 
                onChange={e => setZoneName(e.target.value)} 
                placeholder="ຕົວຢ່າງ: ຫ້ອງແອ, ລະບຽງ, VIP, ຊັ້ນ 2"
                className="bg-zinc-950 border-zinc-800 text-white h-11" 
                autoFocus
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">ເລືອກຊື່ດ່ວນ (Quick Presets):</Label>
              <div className="flex flex-wrap gap-1.5">
                {zonePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setZoneName(preset)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleSaveZone} 
              disabled={isSaving || !zoneName.trim()} 
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold mt-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              ບັນທຶກໂຊນ (Save Zone)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── TABLE DIALOG (SINGLE OR BATCH CREATION) ── */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingTable ? 'ແກ້ໄຂໂຕ໊ະ (Edit Table)' : 'ເພີ່ມໂຕ໊ະໃນໂຊນ (Add Table)'}
            </DialogTitle>
          </DialogHeader>

          {/* Mode Switch (Single vs Batch) */}
          {!editingTable && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setTableMode("single")}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  tableMode === "single"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ເພີ່ມໂຕ໊ະດ່ຽວ (Single)
              </button>
              <button
                type="button"
                onClick={() => setTableMode("batch")}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  tableMode === "batch"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ສ້າງຊຸດຫຼາຍໂຕ໊ະ (Batch)
              </button>
            </div>
          )}

          <div className="space-y-4 py-2">
            {tableMode === "single" ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">ຊື່ໂຕ໊ະ (Table Name) *</Label>
                  <Input 
                    value={tableData.name} 
                    onChange={e => setTableData({...tableData, name: e.target.value})} 
                    placeholder="ຕົວຢ່າງ: T-01, VIP-1, ໂຕະ 1"
                    className="bg-zinc-950 border-zinc-800 text-white h-11" 
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">ຈຳນວນທີ່ນັ່ງ (Seats)</Label>
                  <Input 
                    type="number"
                    min="1"
                    max="50"
                    value={tableData.seats} 
                    onChange={e => setTableData({...tableData, seats: e.target.value})} 
                    className="bg-zinc-950 border-zinc-800 text-white h-11" 
                  />
                  <div className="flex gap-1.5 pt-1">
                    {[2, 4, 6, 8, 10].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTableData({...tableData, seats: s.toString()})}
                        className={`px-3 py-1 rounded-md text-xs border ${
                          tableData.seats === s.toString()
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white"
                        }`}
                      >
                        {s} ທີ່ນັ່ງ
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">ຄຳນຳໜ້າຊື່ໂຕ໊ະ (Prefix)</Label>
                  <Input 
                    value={batchPrefix} 
                    onChange={e => setBatchPrefix(e.target.value)} 
                    placeholder="ຕົວຢ່າງ: T-, VIP-"
                    className="bg-zinc-950 border-zinc-800 text-white h-11" 
                  />
                  <p className="text-[11px] text-zinc-500">ລະບົບຈະຕື່ມຕົວເລກອັດຕະໂນມັດ ເຊັ່ນ: {batchPrefix}01, {batchPrefix}02, ...</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">ຈຳນວນໂຕ໊ະທີ່ຕ້ອງການສ້າງ</Label>
                    <Input 
                      type="number"
                      min="1"
                      max="30"
                      value={batchCount} 
                      onChange={e => setBatchCount(e.target.value)} 
                      className="bg-zinc-950 border-zinc-800 text-white h-11" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">ທີ່ນັ່ງຕໍ່ໂຕ໊ະ</Label>
                    <Input 
                      type="number"
                      min="1"
                      max="50"
                      value={tableData.seats} 
                      onChange={e => setTableData({...tableData, seats: e.target.value})} 
                      className="bg-zinc-950 border-zinc-800 text-white h-11" 
                    />
                  </div>
                </div>
              </>
            )}

            <Button 
              onClick={handleSaveTable} 
              disabled={isSaving || (tableMode === "single" && !tableData.name.trim())} 
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold mt-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {tableMode === "batch" ? `ຢືນຢັນສ້າງ ${batchCount} ໂຕ໊ະ` : 'ບັນທຶກໂຕ໊ະ (Save Table)'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── QR CODE DIALOG ── */}
      <Dialog open={isQrDialogOpen} onOpenChange={(open) => {
        setIsQrDialogOpen(open);
        if (!open) setCopiedTableLink(false);
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-black text-lg text-white">QR Code ສຳລັບໂຕ໊ະ (Table QR)</DialogTitle>
          </DialogHeader>
          {selectedTableForQr && (() => {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const qrUrl = `${origin}/shop/${orgSlug || 'store'}?table=${selectedTableForQr.id}`;

            return (
              <div className="flex flex-col items-center py-3 space-y-4">
                <div className="text-center">
                  <h3 className="text-3xl font-black text-emerald-400 tracking-tight">{selectedTableForQr.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1">ລູກຄ້າສາມາດສະແກນ QR ເພື່ອເບິ່ງເມນູ ແລະ ສັ່ງອາຫານໄດ້ເອງ</p>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-zinc-800 flex items-center justify-center">
                  <QRCodeSVG 
                    id="table-qr-svg"
                    value={qrUrl}
                    size={210}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                {/* Visible URL Input with 1-click select & copy */}
                <div className="w-full space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-zinc-400 block">ລິ້ງສັ່ງອາຫານປະຈຳໂຕະ (Table Order Link):</label>
                  <div className="flex items-center gap-1.5">
                    <Input 
                      readOnly
                      value={qrUrl}
                      onClick={(e) => {
                        e.currentTarget.select();
                        handleCopyTableUrl(qrUrl);
                      }}
                      className="bg-zinc-950 border-zinc-800 text-xs font-mono text-zinc-300 h-10 rounded-xl cursor-pointer"
                    />
                    <Button
                      type="button"
                      onClick={() => handleCopyTableUrl(qrUrl)}
                      className={`h-10 px-3.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
                        copiedTableLink
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                          : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                      }`}
                    >
                      {copiedTableLink ? (
                        <>
                          <Check className="w-4 h-4 mr-1 text-white" />
                          <span>ຄັດລອກແລ້ວ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          <span>ຄັດລອກ</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Action Buttons: Main Copy, Open in New Tab, Print */}
                <div className="w-full grid grid-cols-3 gap-2 pt-1">
                  <Button 
                    type="button"
                    onClick={() => handleCopyTableUrl(qrUrl)}
                    className={`h-11 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md ${
                      copiedTableLink
                        ? "bg-emerald-600 text-white"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                    }`}
                  >
                    {copiedTableLink ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>ຄັດລອກແລ້ວ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>ຄັດລອກລິ້ງ</span>
                      </>
                    )}
                  </Button>

                  <Button 
                    type="button"
                    onClick={() => window.open(qrUrl, "_blank")}
                    variant="outline"
                    className="h-11 rounded-xl text-xs font-bold border-zinc-700 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    <span>ເປີດລິ້ງ</span>
                  </Button>

                  <Button 
                    type="button"
                    onClick={handlePrintTableQr}
                    variant="outline"
                    className="h-11 rounded-xl text-xs font-bold border-zinc-700 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-purple-400" />
                    <span>ພິມ QR</span>
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── CHECKOUT / PAYMENT DIALOG ── */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">ຊຳລະເງິນສຳເລັດແລ້ວ</h3>
                <p className="text-zinc-400 text-xs">ໂຕ໊ະຖືກປ່ຽນເປັນສະຖານະ ວ່າງ (AVAILABLE) ແລ້ວ</p>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">
                  ເຊັກບິນ ແລະ ຮັບເງິນ - {selectedTableForCheckout?.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-5 py-2">
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">ຍອດລວມທັງໝົດ (Total)</span>
                    <span className="text-2xl font-black text-emerald-400">
                      ₭{(selectedTableForCheckout?.orders?.[0]?.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">ວິທີຊຳລະເງິນ (Payment Method)</Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setPaymentMethod("CASH")}
                      className={`h-auto py-3 border-zinc-800 flex-col gap-1.5 ${
                        paymentMethod === "CASH" 
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                          : "bg-zinc-900 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Banknote className="w-5 h-5" />
                      <span className="text-xs font-bold">ເງິນສົດ (Cash)</span>
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setPaymentMethod("PROMPTPAY")}
                      className={`h-auto py-3 border-zinc-800 flex-col gap-1.5 ${
                        paymentMethod === "PROMPTPAY" 
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                          : "bg-zinc-900 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <ScanLine className="w-5 h-5" />
                      <span className="text-xs font-bold">ສະແກນຈ່າຍ / ໂອນ</span>
                    </Button>
                  </div>
                </div>

                {paymentMethod === "CASH" && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">ຮັບເງິນມາ (Cash Received)</Label>
                      <Input 
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-white text-lg h-12"
                        placeholder="0"
                        autoFocus
                      />
                    </div>
                    {Number(cashReceived) > 0 && (
                      <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <span className="text-zinc-400 font-medium text-xs">ເງິນທອນ (Change):</span>
                        <span className={`text-lg font-black ${(Number(cashReceived) - (selectedTableForCheckout?.orders?.[0]?.totalAmount || 0)) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ₭{(Number(cashReceived) - (selectedTableForCheckout?.orders?.[0]?.totalAmount || 0)).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === "PROMPTPAY" && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="bg-white p-4 rounded-xl flex items-center justify-center">
                      <QRCodeSVG 
                        value={paymentQrCode || promptPayId || "0000000000"}
                        size={180}
                        level="H"
                      />
                    </div>
                    <div className="text-center text-xs text-zinc-400 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                      <p>ບັນຊີຮັບເງິນ: {paymentAccountInfo || "ຍັງບໍ່ໄດ້ຕັ້ງຄ່າບັນຊີ"}</p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handlePayBill} 
                  disabled={isProcessingPayment || (paymentMethod === "CASH" && Number(cashReceived) > 0 && (Number(cashReceived) - (selectedTableForCheckout?.orders?.[0]?.totalAmount || 0)) < 0)}
                  className="w-full h-12 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                >
                  {isProcessingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />}
                  ຢືນຢັນການຊຳລະເງິນ (Confirm Payment)
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
