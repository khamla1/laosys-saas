"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  CameraOff,
  Scan,
  X,
  FlipHorizontal,
  Zap,
  ZapOff,
  Loader2,
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Keyboard,
  Upload,
  ShieldAlert,
  ExternalLink,
  ImageIcon
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { toast } from "sonner";

interface RentalCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export function RentalCameraScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: RentalCameraScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [manualInput, setManualInput] = useState("");
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const readerElementId = "rental-bill-camera-scanner-viewport";
  const hasScannedRef = useRef(false);

  // Initialize and stop scanner based on modal state & active tab
  useEffect(() => {
    if (!isOpen) {
      cleanupScanner();
      hasScannedRef.current = false;
      return;
    }

    if (activeTab === "camera") {
      hasScannedRef.current = false;
      initAndStartCamera();
    } else {
      cleanupScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [isOpen, activeTab]);

  const cleanupScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        // Silently catch teardown errors
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
        setIsStarting(false);
        setTorchOn(false);
        setTorchAvailable(false);
      }
    }
  };

  const initAndStartCamera = async (targetCameraId?: string) => {
    setIsStarting(true);
    setCameraError(null);
    hasScannedRef.current = false;

    // 1. Verify Secure Context (Browser security mandate for navigator.mediaDevices)
    const isSecure =
      typeof window !== "undefined" &&
      (window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    if (!isSecure) {
      setCameraError("SECURE_CONTEXT_REQUIRED");
      setIsStarting(false);
      return;
    }

    // Small delay to ensure the modal DOM node is mounted
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      // 2. Discover available camera devices
      let selectedConfig: any = { facingMode: "environment" };
      let detectedDevices: Array<{ id: string; label: string }> = [];

      try {
        detectedDevices = await Html5Qrcode.getCameras();
        if (detectedDevices && detectedDevices.length > 0) {
          setCameras(detectedDevices);
          let sel = targetCameraId;
          if (!sel) {
            const backCamera = detectedDevices.find((d) => {
              const l = d.label.toLowerCase();
              return l.includes("back") || l.includes("rear") || l.includes("environment");
            });
            sel = backCamera ? backCamera.id : detectedDevices[0].id;
          }
          setCurrentCameraId(sel);
          selectedConfig = sel;
        }
      } catch (detectErr) {
        // In case getCameras() throws prior to user permission prompt, fall back to constraint
        console.warn("getCameras() fallback to facingMode:", detectErr);
        selectedConfig = { facingMode: "environment" };
      }

      // Clean up previous instance if any
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch {
          // ignore
        }
      }

      const scanner = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
        ],
        verbose: false,
      });

      scannerRef.current = scanner;

      const config = {
        fps: 12,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
      };

      const handleSuccess = (decodedText: string) => {
        if (hasScannedRef.current) return;
        hasScannedRef.current = true;

        if (typeof window !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch {
            // ignore
          }
        }

        toast.success(`ສະແກນພົບລະຫັດ: ${decodedText}`);

        cleanupScanner().then(() => {
          onClose();
          onScanSuccess(decodedText);
        });
      };

      try {
        await scanner.start(selectedConfig, config, handleSuccess, () => {});
      } catch (firstStartErr: any) {
        console.warn("Primary camera start failed, attempting user camera fallback:", firstStartErr);
        // Fallback to front camera or default user camera
        await scanner.start({ facingMode: "user" }, config, handleSuccess, () => {});
      }

      setIsScanning(true);
      setIsStarting(false);

      // Check if torch/flash is supported
      try {
        const capabilities = scanner.getRunningTrackCameraCapabilities();
        if (capabilities && (capabilities as any).torchFeature?.isSupported?.()) {
          setTorchAvailable(true);
        }
      } catch {
        setTorchAvailable(false);
      }
    } catch (err: any) {
      console.error("Camera scanner error:", err);
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes("secure context") ||
        errMsg.includes("isSecureContext") ||
        errMsg.includes("getUserMedia")
      ) {
        setCameraError("SECURE_CONTEXT_REQUIRED");
      } else if (
        errMsg.includes("NotAllowedError") ||
        errMsg.includes("Permission") ||
        errMsg.includes("permission")
      ) {
        setCameraError("PERMISSION_DENIED");
      } else if (
        errMsg.includes("NotFoundError") ||
        errMsg.includes("DevicesNotFoundError")
      ) {
        setCameraError("NO_CAMERA_FOUND");
      } else {
        setCameraError(errMsg);
      }
      setIsStarting(false);
      setIsScanning(false);
    }
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current) return;
    const currentIdx = cameras.findIndex((c) => c.id === currentCameraId);
    const nextIdx = (currentIdx + 1) % cameras.length;
    const nextCam = cameras[nextIdx];

    await cleanupScanner();
    await initAndStartCamera(nextCam.id);
  };

  const handleToggleTorch = async () => {
    if (!scannerRef.current || !torchAvailable) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setTorchOn(nextState);
    } catch (e) {
      toast.error("ບໍ່ສາມາດເປີດໄຟແຟລດໄດ້ໃນກ້ອງນີ້ (Torch toggle failed)");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = manualInput.trim();
    if (!val) return;
    cleanupScanner();
    onClose();
    onScanSuccess(val);
  };

  const handleImageFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsStarting(true);
    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;
      }

      const decodedText = await scanner.scanFile(file, true);
      if (decodedText) {
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch {
            // ignore
          }
        }
        toast.success(`ສະແກນພົບລະຫັດ: ${decodedText}`);
        await cleanupScanner();
        onClose();
        onScanSuccess(decodedText);
      }
    } catch (err: any) {
      console.error("Scan file error:", err);
      toast.error("ບໍ່ພົບ QR Code ຫຼື Barcode ໃນຮູບພາບທີ່ເລືອກ (No barcode detected in image)");
    } finally {
      setIsStarting(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSwitchToHttps = () => {
    if (typeof window !== "undefined") {
      const targetUrl = `https://laosys.site${window.location.pathname}${window.location.search}`;
      window.location.href = targetUrl;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>ສະແກນບິນເຊົ່າອຸປະກອນ</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Live Scanner
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                ກວດສອບ ແລະ ຮັບຄືນອຸປະກອນຜ່ານ QR Code ຫຼື Barcode
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              cleanupScanner();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
            title="ປິດໜ້າຕ່າງ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-4 pb-2 bg-zinc-950/40 border-b border-zinc-800/80 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "camera"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>ເປີດກ້ອງສະແກນ (Camera)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "manual"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>ພິມ / ເຄື່ອງຍິງບາໂຄດ (Manual / Gun)</span>
          </button>
        </div>

        {/* Hidden File Input for Image Scanning Fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageFileScan}
          className="hidden"
        />

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {activeTab === "camera" ? (
            <div className="space-y-3">
              {/* Camera Viewport Container */}
              <div className="relative w-full aspect-square max-h-[320px] bg-black rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-inner flex items-center justify-center">
                {/* HTML5 QR Code Mount Node */}
                <div
                  id={readerElementId}
                  className="w-full h-full"
                  style={{ width: "100%", height: "100%" }}
                />

                {/* Loading State Overlay */}
                {isStarting && (
                  <div className="absolute inset-0 bg-zinc-950/90 z-20 flex flex-col items-center justify-center gap-2 text-center p-4">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-xs font-semibold text-zinc-200">ກຳລັງເປີດກ້ອງຖ່າຍຮູບ...</p>
                    <p className="text-[11px] text-zinc-400">ກະລຸນາອະນຸຍາດສິດການໃຊ້ກ້ອງຖ່າຍຮູບຫາກມີຂໍ້ຄວາມເຕືອນ</p>
                  </div>
                )}

                {/* Error State Overlay */}
                {cameraError && (
                  <div className="absolute inset-0 bg-zinc-950/95 z-30 flex flex-col items-center justify-center gap-3 text-center p-5 overflow-y-auto">
                    {cameraError === "SECURE_CONTEXT_REQUIRED" ? (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-amber-300">
                            ກ້ອງຖ່າຍຮູບຕ້ອງໃຊ້ງານຜ່ານລະບົບ HTTPS (Secure Context)
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                            Browser (Chrome, Safari, Edge) ບໍ່ອະນຸຍາດໃຫ້ເປີດກ້ອງເທິງ HTTP ທຳມະດາ ຫຼື IP Address. ກະລຸນາເຂົ້າໃຊ້ຜ່ານໂດເມນ HTTPS ຂອງລະບົບ:
                          </p>
                        </div>
                        <div className="w-full space-y-2 mt-1">
                          <button
                            type="button"
                            onClick={handleSwitchToHttps}
                            className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>ປ່ຽນໄປໃຊ້ https://laosys.site (HTTPS)</span>
                          </button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>ຖ່າຍຮູບ / ອັບໂຫຼດຮູບ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab("manual")}
                              className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold"
                            >
                              ປ່ຽນໄປພິມລະຫັດ
                            </button>
                          </div>
                        </div>
                      </>
                    ) : cameraError === "PERMISSION_DENIED" ? (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                          <CameraOff className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-rose-300">
                            ກະລຸນາອະນຸຍາດສິດການໃຊ້ກ້ອງຖ່າຍຮູບ (Permission Denied)
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                            ກົດທີ່ໄອຄອນລັອກ ຫຼື ໄອຄອນກ້ອງຂ້າງ URL ໃນ Browser ແລ້ວເລືອກ &quot;ອະນຸຍາດກ້ອງຖ່າຍຮູບ (Allow Camera)&quot;
                          </p>
                        </div>
                        <div className="flex gap-2 mt-2 w-full">
                          <button
                            type="button"
                            onClick={() => initAndStartCamera(currentCameraId || undefined)}
                            className="flex-1 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> ລອງໃໝ່
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" /> ຖ່າຍ / ເລືອກຮູບ
                          </button>
                        </div>
                      </>
                    ) : cameraError === "NO_CAMERA_FOUND" ? (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                          <CameraOff className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-amber-300">ບໍ່ພົບອຸປະກອນກ້ອງຖ່າຍຮູບ (No Camera Found)</p>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            ອຸປະກອນຂອງທ່ານອາດບໍ່ມີກ້ອງ ຫຼື ຖືກປິດໄວ້. ທ່ານສາມາດອັບໂຫຼດຮູບ ຫຼື ພິມລະຫັດບິນແທນໄດ້
                          </p>
                        </div>
                        <div className="flex gap-2 mt-2 w-full">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" /> ເລືອກຮູບພາບ
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("manual")}
                            className="flex-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                          >
                            ປ່ຽນໄປພິມລະຫັດ
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-rose-300">ບໍ່ສາມາດເປີດກ້ອງຖ່າຍຮູບໄດ້</p>
                          <p className="text-[11px] text-zinc-400 mt-1 font-mono break-all">{cameraError}</p>
                        </div>
                        <div className="flex gap-2 mt-2 w-full">
                          <button
                            type="button"
                            onClick={() => initAndStartCamera(currentCameraId || undefined)}
                            className="flex-1 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> ລອງໃໝ່
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" /> ເລືອກຮູບພາບ
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Active Scanning Overlay (Reticle and Laser Line) */}
                {isScanning && !cameraError && (
                  <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                    {/* Darkened Border Mask */}
                    <div className="relative w-56 h-56 rounded-2xl border-2 border-indigo-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                      {/* Corner Target Markers */}
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                      {/* Animated Laser Scan Line */}
                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                {/* Floating Controls (Switch Camera / Torch) */}
                {isScanning && (
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                    {torchAvailable && (
                      <button
                        type="button"
                        onClick={handleToggleTorch}
                        className={`p-2.5 rounded-xl backdrop-blur-md border text-xs font-bold transition-all shadow-lg ${
                          torchOn
                            ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-amber-500/30"
                            : "bg-black/60 text-white border-white/20 hover:bg-black/80"
                        }`}
                        title={torchOn ? "ປິດໄຟແຟລດ" : "ເປີດໄຟແຟລດ"}
                      >
                        {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                      </button>
                    )}
                    {cameras.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 text-xs font-bold transition-all shadow-lg"
                        title="ສະຫຼັບກ້ອງໜ້າ / ຫຼັງ"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Status and Action Buttons */}
              <div className="space-y-2">
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>ສ່ອງກ້ອງໃສ່ QR Code ຫຼື Barcode ຢູ່ເທິງໃບບິນ</span>
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {cameras.length > 1 ? `${cameras.length} ກ້ອງ` : "ພ້ອມໃຊ້ງານ"}
                  </span>
                </div>

                {/* Upload Image Alternative Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ຫຼື ຖ່າຍຮູບ / ອັບໂຫຼດຮູບພາບໃບບິນ (Upload or Snap Photo)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Manual / USB Laser Scanner Tab */
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 block">
                  ລະຫັດບາໂຄດ ຫຼື ລະຫັດບິນ (#RNT-XXXXXX)
                </label>
                <div className="relative">
                  <Barcode className="w-5 h-5 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="ຍິງເຄື່ອງສະແກນ ຫຼື ພິມລະຫັດບິນ..."
                    className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  ຮອງຮັບເຄື່ອງຍິງບາໂຄດ Barcode Scanner (1D/2D), ການພິມລະຫັດບິນ #RNT-XXXXXX, ເລກບັດປະຈຳຕົວ ຫຼື ເບີໂທລະສັບລູກຄ້າ.
                </p>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-1">
                <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ຂະບວນການອັດຕະໂນມັດເມື່ອສະແກນ:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1 text-zinc-400">
                  <li>ຫາກຢູ່ໃນກຳນົດ: ເປີດໜ້າຕ່າງຮັບຄືນອຸປະກອນ ແລະ ສະສາງເງິນມັດຈຳທັນທີ</li>
                  <li>ຫາກກາຍກຳນົດ: ແຈ້ງເຕືອນເວລາທີ່ກາຍ ແລະ ເປີດໜ້າຄິດໄລ່ຄ່າປັບໃໝ</li>
                  <li>ຫາກສົ່ງຄືນແລ້ວ: ສະແດງປະຫວັດການສົ່ງຄືນ ແລະ ພິມໃບບິນຍ້ອນຫຼັງໄດ້</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    cleanupScanner();
                    onClose();
                  }}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Search className="w-4 h-4" />
                  <span>ກວດສອບ & ດຳເນີນການ</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Global CSS tweaks for html5-qrcode video viewport */}
        <style dangerouslySetInnerHTML={{ __html: `
          #${readerElementId} video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            border-radius: 0.875rem !important;
          }
          #${readerElementId} {
            border: none !important;
          }
          #${readerElementId}__scan_region {
            min-height: 100% !important;
          }
        `}} />
      </div>
    </div>
  );
}
