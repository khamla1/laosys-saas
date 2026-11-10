"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Loader2, Globe, Image as ImageIcon, LayoutTemplate,
  UploadCloud, Save, Check, X, Video, Image as ImageIcon2,
  Copy, QrCode, Search, Tag, Sparkles,
  Link2, ShoppingBag, ShoppingCart, ShieldCheck, Star, Flame, Phone, Truck, Eye, Lock, ExternalLink, LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function stripEmojis(text: string = "") {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function optimizeImageForBanner(file: File): Promise<{ blob: Blob; type: string; wasCompressed: boolean }> {
  // Only compress static raster images (JPG, PNG, WebP) over 350KB
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size <= 350 * 1024) {
    return { blob: file, type: file.type, wasCompressed: false };
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ blob: file, type: file.type, wasCompressed: false });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (webpBlob) => {
            if (webpBlob && webpBlob.size < file.size * 0.92) {
              resolve({ blob: webpBlob, type: "image/webp", wasCompressed: true });
            } else {
              resolve({ blob: file, type: file.type, wasCompressed: false });
            }
          },
          "image/webp",
          0.86
        );
      } catch {
        resolve({ blob: file, type: file.type, wasCompressed: false });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ blob: file, type: file.type, wasCompressed: false });
    };

    img.src = objectUrl;
  });
}

type Banner = {
  url: string;
  type: "image" | "video";
};

type UploadProgressState = {
  active: boolean;
  fileName: string;
  mediaType: "image" | "video";
  originalSize: number;
  uploadSize: number;
  loadedBytes: number;
  percent: number;
  speedBps: number;
  etaSeconds: number | null;
  stage: "optimizing" | "uploading" | "saving" | "completed" | "error";
  wasCompressed: boolean;
  errorMessage?: string;
};

export default function StorefrontSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [uploadState, setUploadState] = useState<UploadProgressState | null>(null);

  // Store Organization Info
  const [slug, setSlug] = useState("my-shop");
  const [name, setName] = useState("ຊື່ຮ້ານຄ້າຂອງທ່ານ (Store Name)");

  // E-Commerce Storefront Content Info
  const [announcementText, setAnnouncementText] = useState(
    "ຈັດສົ່ງດ່ວນທົ່ວປະເທດລາວ (Anousith / HAL) • ຮັບປະກັນສິນຄ້າຄຸນນະພາບແທ້ 100% • ໃຊ້ຄູປອງສ່ວນຫຼຸດໄດ້ທີ່ໜ້າຊຳລະເງິນ"
  );
  const [heroBadge, setHeroBadge] = useState("OFFICIAL ONLINE STORE");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [contactPhone, setContactPhone] = useState("020 5555 8888");

  // SEO & Meta Info
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  // Sample products from store for live preview
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);

  const [config, setConfig] = useState<{
    theme: string;
    bannerUrl: string;
    customDomain: string;
    metadata: {
      banners?: Banner[];
      ecommerce?: {
        announcementText?: string;
        heroBadge?: string;
        heroTitle?: string;
        heroSubtitle?: string;
        contactPhone?: string;
      };
      seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string;
      };
    };
  }>({
    theme: "light",
    bannerUrl: "",
    customDomain: "",
    metadata: { banners: [], ecommerce: {}, seo: {} },
  });

  const [originUrl, setOriginUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
    fetchStorefrontConfig();
  }, []);

  const fetchStorefrontConfig = async () => {
    try {
      const [res, prodRes] = await Promise.all([
        fetch("/api/storefront"),
        fetch("/api/products?page=1&limit=4")
      ]);

      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        setPreviewProducts(Array.isArray(prodJson) ? prodJson.slice(0, 4) : (prodJson.data || []).slice(0, 4));
      }

      if (res.ok) {
        const data = await res.json();
        if (data) {
          let banners: Banner[] = [];
          if (data.metadata?.banners && Array.isArray(data.metadata.banners)) {
            banners = data.metadata.banners;
          } else if (data.bannerUrl) {
            banners = [{ url: data.bannerUrl, type: "image" }];
          }

          const seoData = data.metadata?.seo || {};
          const ecomData = data.metadata?.ecommerce || {};

          setConfig({
            theme: data.theme || "light",
            bannerUrl: data.bannerUrl || "",
            customDomain: data.customDomain || "",
            metadata: {
              ...data.metadata,
              banners,
              ecommerce: ecomData,
              seo: seoData,
            },
          });

          if (data.organization?.slug) {
            setSlug(data.organization.slug);
          }
          if (data.organization?.name) {
            setName(data.organization.name);
          }

          setAnnouncementText(
            stripEmojis(
              ecomData.announcementText ||
                "ຈັດສົ່ງດ່ວນທົ່ວປະເທດລາວ (Anousith / HAL) • ຮັບປະກັນສິນຄ້າຄຸນນະພາບແທ້ 100% • ໃຊ້ຄູປອງສ່ວນຫຼຸດໄດ້ທີ່ໜ້າຊຳລະເງິນ"
            )
          );
          setHeroBadge(stripEmojis(ecomData.heroBadge || "OFFICIAL ONLINE STORE") || "OFFICIAL ONLINE STORE");
          setHeroTitle(stripEmojis(ecomData.heroTitle || data.organization?.name || ""));
          setHeroSubtitle(
            stripEmojis(
              ecomData.heroSubtitle ||
                seoData.metaDescription ||
                "ຄັດສັນສິນຄ້າຄຸນນະພາບພຣີມຽມ ພ້ອມບໍລິການຈັດສົ່ງດ່ວນທົ່ວປະເທດ ແລະ ຊຳລະເງິນອອນລາຍທີ່ປອດໄພ"
            )
          );
          setContactPhone(stripEmojis(ecomData.contactPhone || "020 5555 8888"));

          setSeoTitle(seoData.metaTitle || data.organization?.name || "");
          setSeoDescription(seoData.metaDescription || "ຈຳໜ່າຍສິນຄ້າຄຸນນະພາບ ພ້ອມບໍລິການຈັດສົ່ງທົ່ວປະເທດ");
          setSeoKeywords(seoData.metaKeywords || "ຮ້ານຄ້າອອນລາຍ, online shop, laosys");
        }
      }
    } catch (error) {
      console.error("Failed to fetch storefront config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const fullUrl = `${originUrl || "http://localhost:3000"}/shop/${slug || "my-shop"}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("ຄັດລອກລິງກ໌ຮ້ານຄ້າສຳເລັດແລ້ວ! (Copied to Clipboard)");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setUploadState(null);
    toast.info("ຍົກເລີກການອັບໂຫຼດແລ້ວ (Upload Cancelled)");
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error("ຂະໜາດໄຟລ໌ໃຫຍ່ເກີນໄປ (ສູງສຸດ 100MB)");
      return;
    }

    const mediaType: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
    const needsCompression =
      mediaType === "image" &&
      ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
      file.size > 350 * 1024;

    setUploadState({
      active: true,
      fileName: file.name,
      mediaType,
      originalSize: file.size,
      uploadSize: file.size,
      loadedBytes: 0,
      percent: needsCompression ? 5 : 1,
      speedBps: 0,
      etaSeconds: null,
      stage: needsCompression ? "optimizing" : "uploading",
      wasCompressed: false,
    });

    try {
      const { blob, type: finalMimeType, wasCompressed } = await optimizeImageForBanner(file);
      const totalSize = blob.size;

      setUploadState((prev) =>
        prev
          ? {
              ...prev,
              uploadSize: totalSize,
              wasCompressed,
              percent: wasCompressed ? 12 : 2,
              stage: "uploading",
            }
          : null
      );

      const startTime = performance.now();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.open("POST", "/api/upload", true);
        xhr.setRequestHeader("x-upload-mode", "raw");
        xhr.setRequestHeader("x-file-type", finalMimeType);
        xhr.setRequestHeader("x-file-size", String(totalSize));
        xhr.setRequestHeader("Content-Type", finalMimeType);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const elapsedSec = Math.max((performance.now() - startTime) / 1000, 0.1);
            const speedBps = event.loaded / elapsedSec;
            const remainingBytes = Math.max(event.total - event.loaded, 0);
            const etaSeconds = speedBps > 0 ? Math.ceil(remainingBytes / speedBps) : null;
            const rawPercent = Math.round((event.loaded / event.total) * 100);
            const clampedPercent = Math.min(Math.max(rawPercent, 1), 99);

            setUploadState((prev) =>
              prev
                ? {
                    ...prev,
                    loadedBytes: event.loaded,
                    uploadSize: event.total,
                    percent: clampedPercent,
                    speedBps,
                    etaSeconds,
                    stage: clampedPercent >= 99 ? "saving" : "uploading",
                  }
                : null
            );
          }
        };

        xhr.onload = () => {
          xhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText || "{}");
              if (data.url) {
                const newBanner: Banner = { url: data.url, type: mediaType };
                setConfig((prev) => ({
                  ...prev,
                  bannerUrl: prev.metadata.banners?.length === 0 ? data.url : prev.bannerUrl,
                  metadata: {
                    ...prev.metadata,
                    banners: [...(prev.metadata.banners || []), newBanner],
                  },
                }));

                setUploadState((prev) =>
                  prev
                    ? {
                        ...prev,
                        loadedBytes: totalSize,
                        percent: 100,
                        etaSeconds: 0,
                        stage: "completed",
                      }
                    : null
                );

                toast.success("ອັບໂຫຼດໄຟລ໌ Banner ສຳເລັດ 100%!");
                setTimeout(() => {
                  setUploadState(null);
                }, 900);
                resolve();
              } else {
                reject(new Error(data.error || "ການອັບໂຫຼດລົ້ມເຫຼວ"));
              }
            } catch {
              reject(new Error("ເກີດຂໍ້ຜິດພາດໃນການອ່ານຜົນລັບ"));
            }
          } else {
            let errMsg = "ການອັບໂຫຼດລົ້ມເຫຼວ";
            try {
              const errJson = JSON.parse(xhr.responseText || "{}");
              if (errJson.error) errMsg = errJson.error;
            } catch {}
            reject(new Error(errMsg));
          }
        };

        xhr.onerror = () => {
          xhrRef.current = null;
          reject(new Error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ເຄືອຂ່າຍ"));
        };

        xhr.onabort = () => {
          xhrRef.current = null;
          resolve();
        };

        xhr.send(blob);
      });
    } catch (err: any) {
      const msg = err?.message || "ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດ";
      setUploadState((prev) =>
        prev
          ? {
              ...prev,
              stage: "error",
              errorMessage: msg,
            }
          : null
      );
      toast.error(msg);
    }
  };

  const removeBanner = (index: number) => {
    setConfig((prev) => {
      const newBanners = [...(prev.metadata.banners || [])];
      newBanners.splice(index, 1);
      return {
        ...prev,
        bannerUrl: newBanners.length > 0 ? newBanners[0].url : "",
        metadata: {
          ...prev.metadata,
          banners: newBanners,
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...config,
        name: name.trim(),
        slug: slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "-"),
        metadata: {
          ...config.metadata,
          ecommerce: {
            announcementText: stripEmojis(announcementText),
            heroBadge: stripEmojis(heroBadge),
            heroTitle: stripEmojis(heroTitle || name.trim()),
            heroSubtitle: stripEmojis(heroSubtitle),
            contactPhone: stripEmojis(contactPhone),
          },
          seo: {
            metaTitle: seoTitle,
            metaDescription: seoDescription,
            metaKeywords: seoKeywords,
          },
        },
      };

      const res = await fetch("/api/storefront", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        if (updated.organization?.slug) setSlug(updated.organization.slug);
        if (updated.organization?.name) setName(updated.organization.name);
        toast.success("ບັນທຶກການຕັ້ງຄ່າໜ້າເວັບ E-Commerce & SEO ສຳເລັດແລ້ວ!");
      } else {
        const data = await res.json();
        toast.error(data.error || "ການບັນທຶກລົ້ມເຫຼວ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  const banners = config.metadata.banners || [];
  const fullShopUrl = `${originUrl || "http://localhost:3000"}/shop/${slug || "my-shop"}`;
  const isDarkPreview = ["dark", "nature", "ocean", "luxury", "sunset", "colorful", "cyberpunk", "forest", "royal", "vintage"].includes(config.theme);

  const sampleCards =
    previewProducts.length > 0
      ? previewProducts
      : [
          {
            id: "1",
            name: "ກະເປົ໋າຜ້າລົດໂລກຮ້ອນ Eco-Friendly Tote",
            price: 55000,
            category: "Fashion",
            img: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80",
          },
          {
            id: "2",
            name: "ແກ້ວເກັບຄວາມເຢັນ Stanley Quencher 30oz",
            price: 420000,
            category: "Lifestyle",
            img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80",
          },
          {
            id: "3",
            name: "ທຽນຫອມອໂຣມາ ອໍແກນິກ (Organic Candle)",
            price: 120000,
            category: "Home",
            img: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80",
          },
          {
            id: "4",
            name: "ຊຸດຂອງຂວັນພຣີມຽມ ກາເຟ & ຊາລາວ",
            price: 350000,
            category: "Coffee & Tea",
            img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80",
          },
        ];

  return (
    <div className="relative pb-24 sm:pb-28 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* SECTION 1: TOP E-COMMERCE STOREFRONT HEADER & ACTIONS */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-zinc-900 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-5">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] sm:text-xs font-extrabold">
              <Sparkles size={13} className="stroke-[1.75] shrink-0" />
              <span className="truncate">E-Commerce Storefront Builder & Live Preview</span>
            </div>
            <h1 className="text-lg sm:text-3xl font-black text-white tracking-tight">
              ຕັ້ງຄ່າໜ້າຮ້ານອອນລາຍ (E-Commerce Storefront)
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              ອອກແບບໜ້າເວັບ E-Commerce ຂອງທ່ານແບບຄົບວົງຈອນ ພ້ອມແຖບໂປຣໂມຊັ່ນ, ປ້າຍ Hero Banner, ໝວດໝູ່ສິນຄ້າ, ກະຕ່າສັ່ງຊື້ ແລະ SEO
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
            <Button
              type="button"
              onClick={handleCopyLink}
              className={`h-9 sm:h-12 px-3 sm:px-5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg ${
                copied
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 stroke-[1.75]" />
                  <span>ຄັດລອກແລ້ວ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 stroke-[1.75]" />
                  <span>ຄັດລອກລິງກ໌ຮ້ານ</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQrModal(true)}
              className="h-9 sm:h-12 px-3 sm:px-4 rounded-xl border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-bold text-xs sm:text-sm sm:order-3"
            >
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 stroke-[1.75]" />
              <span>QR ຮ້ານ</span>
            </Button>

            <Link href={`/shop/${slug}`} target="_blank" className="col-span-2 sm:col-span-1 sm:order-2">
              <Button
                type="button"
                className="w-full h-9 sm:h-12 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25"
              >
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 stroke-[1.75]" />
                <span>ເປີດເບິ່ງເວັບໜ້າຮ້ານຈິງ (Open E-Commerce)</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* URL Bar */}
        <div className="mt-3 sm:mt-5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-950/90 border border-zinc-800 flex items-center justify-between gap-2 sm:gap-3 overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <Link2 size={16} className="text-emerald-400 shrink-0 stroke-[1.75]" />
            <span className="font-mono text-xs sm:text-base text-zinc-200 truncate">
              {fullShopUrl}
            </span>
          </div>
          <Link
            href={`/shop/${slug}`}
            target="_blank"
            className="shrink-0 text-[11px] sm:text-xs text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5 stroke-[1.75]" /> ເບິ່ງໜ້າເວັບຈິງ
          </Link>
        </div>
      </div>

      {/* SECTION 2: LIVE INTERACTIVE E-COMMERCE WEBSITE PREVIEW */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              ຕົວຢ່າງໜ້າເວັບ E-Commerce ຂອງທ່ານແບບສົດໆ (Live Storefront Preview)
            </h2>
          </div>
          <span className="text-xs text-zinc-400">
            ໂທນສີປັດຈຸບັນ: <strong className="text-emerald-400 uppercase">{config.theme}</strong>
          </span>
        </div>

        {/* Browser Frame Mockup */}
        <div className={`rounded-2xl overflow-hidden border border-zinc-700/80 shadow-2xl ${isDarkPreview ? "bg-zinc-950 text-white" : "bg-slate-50 text-slate-900"}`}>
          {/* Browser Top Chrome */}
          <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex-1 max-w-md bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1 text-[11px] font-mono text-zinc-400 truncate flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400 stroke-[1.75] shrink-0" />
              <span className="truncate">{fullShopUrl}</span>
            </div>
            <Link
              href={`/shop/${slug}`}
              target="_blank"
              className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>ເປີດເຕັມຈໍ</span>
              <ExternalLink className="w-3 h-3 stroke-[1.75]" />
            </Link>
          </div>

          {/* 1. Preview Announcement Bar */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white text-[11px] py-1.5 px-4 flex items-center justify-between">
            <span className="font-semibold truncate flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 stroke-[1.75] shrink-0" />
              <span className="truncate">{stripEmojis(announcementText)}</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 font-mono shrink-0 ml-2">
              <Phone className="w-3 h-3 stroke-[1.75]" /> {stripEmojis(contactPhone)}
            </span>
          </div>

          {/* 2. Preview E-Commerce Navbar */}
          <div className={`px-3 sm:px-5 py-2.5 sm:py-3.5 border-b flex items-center justify-between gap-2 sm:gap-4 ${isDarkPreview ? "bg-zinc-900/90 border-white/10" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-xs sm:text-sm shrink-0">
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.75]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-base truncate">{name}</span>
                  <span className="hidden xs:inline-flex text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 items-center gap-1 shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5 stroke-[1.75]" /> Official Mall
                  </span>
                </div>
              </div>
            </div>

            <div className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs w-64 ${isDarkPreview ? "bg-zinc-950 border-white/10 text-zinc-400" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
              <Search className="w-3.5 h-3.5 stroke-[1.75]" />
              <span className="truncate">ຄົ້ນຫາສິນຄ້າໃນຮ້ານ...</span>
            </div>

            <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow shrink-0">
              <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[1.75]" />
              <span>ກະຕ່າ (4)</span>
            </div>
          </div>

          {/* 3. Preview Hero Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white p-4 sm:p-8">
            {banners.length > 0 && (
              <div className="absolute inset-0 z-0">
                {banners[0].type === "video" ? (
                  <video
                    src={banners[0].url}
                    className="w-full h-full object-cover opacity-55"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={banners[0].url}
                    alt="Hero Banner Preview"
                    className="w-full h-full object-cover opacity-55"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
              </div>
            )}
            <div className="max-w-xl space-y-2 sm:space-y-2.5 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold">
                <ShieldCheck className="w-3 h-3 stroke-[1.75]" />
                <span>{stripEmojis(heroBadge)}</span>
              </span>
              <h3 className="text-base sm:text-3xl font-black tracking-tight">
                {stripEmojis(heroTitle || name)}
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-300 line-clamp-2">
                {stripEmojis(heroSubtitle)}
              </p>
              <div className="pt-1 flex flex-wrap gap-1.5 sm:gap-2">
                <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[11px] sm:text-xs inline-flex items-center gap-1">
                  <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[1.75]" />
                  <span>ຊ້ອບສິນຄ້າທັງໝົດ</span>
                </span>
                <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 text-white font-bold text-[11px] sm:text-xs border border-white/15 inline-flex items-center gap-1">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 stroke-[1.75]" />
                  <span>ສິນຄ້າຂາຍດີ</span>
                </span>
              </div>
            </div>
          </div>

          {/* 4. Preview Product Cards Grid */}
          <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 sm:gap-1.5 overflow-x-auto custom-scrollbar">
                <span className="px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] sm:text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
                  <LayoutGrid className="w-3 h-3 stroke-[1.75]" /> ສິນຄ້າທັງໝົດ
                </span>
                <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border inline-flex items-center gap-1 shrink-0 ${isDarkPreview ? "bg-zinc-900 border-white/10 text-zinc-300" : "bg-white border-slate-200 text-slate-600"}`}>
                  <Flame className="w-3 h-3 text-amber-500 stroke-[1.75]" /> ຂາຍດີ
                </span>
                <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border inline-flex items-center gap-1 shrink-0 ${isDarkPreview ? "bg-zinc-900 border-white/10 text-zinc-300" : "bg-white border-slate-200 text-slate-600"}`}>
                  <Sparkles className="w-3 h-3 text-emerald-500 stroke-[1.75]" /> ມາໃໝ່
                </span>
              </div>
              <span className="hidden sm:inline text-[11px] opacity-60 shrink-0">ຈັດລຽງ: ມາໃໝ່ລ່າສຸດ</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
              {sampleCards.map((item: any, idx: number) => {
                const rawImg = item.img || item.images?.[0];
                const fallback = [
                  "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80",
                  "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80",
                  "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80",
                  "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80",
                ][idx % 4];
                return (
                  <div
                    key={item.id || idx}
                    className={`rounded-xl sm:rounded-2xl overflow-hidden border flex flex-col ${
                      isDarkPreview ? "bg-zinc-900 border-white/10" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="relative aspect-[4/3] sm:aspect-square bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <img
                        src={rawImg || fallback}
                        alt={item.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = fallback;
                        }}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-zinc-950/85 text-amber-400 border border-amber-400/40 font-extrabold text-[8px] sm:text-[9px] flex items-center gap-0.5 sm:gap-1">
                        <Flame className="w-2.5 h-2.5 text-amber-400 stroke-[1.75]" /> ຂາຍດີ
                      </span>
                    </div>
                    <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between gap-1.5 sm:gap-2">
                      <div>
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] mb-0.5 sm:mb-1">
                          <span className="text-amber-500 font-bold flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 stroke-[1.75]" /> 4.9
                          </span>
                          <span className="text-emerald-500 font-bold">ພ້ອມສົ່ງ</span>
                        </div>
                        <p className="font-bold text-[11px] sm:text-xs line-clamp-1 sm:line-clamp-2">{item.name}</p>
                      </div>
                      <div className="pt-1 sm:pt-1.5 border-t border-slate-500/10 flex items-center justify-between">
                        <span className="font-black text-[11px] sm:text-sm text-emerald-500">
                          ₭{Number(item.price).toLocaleString()}
                        </span>
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-emerald-500 text-white text-[9px] sm:text-[10px] font-bold">
                          ຊື້ເລີຍ
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: STORE NAME, URL SLUG & E-COMMERCE HERO / PROMO CUSTOMIZATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left 6 cols: Store Name, Slug & Contact */}
        <div className="lg:col-span-6 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="bg-blue-500/20 p-2.5 rounded-2xl shrink-0">
              <Tag className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                ຂໍ້ມູນຮ້ານຄ້າ & ລິງກ໌ URL (Store Identity)
              </h2>
              <p className="text-xs text-zinc-400">ຊື່ຮ້ານ, URL Slug ແລະ ເບີໂທຕິດຕໍ່ບົນໜ້າເວັບ E-Commerce</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-zinc-300">ຊື່ຮ້ານຄ້າຂອງທ່ານ (Store Name)</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!heroTitle || heroTitle === name) setHeroTitle(e.target.value);
                  if (!seoTitle || seoTitle === name) setSeoTitle(e.target.value);
                }}
                className="h-11 bg-zinc-950/70 border-zinc-800 text-white rounded-xl font-bold mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-300">ທີ່ຢູ່ລິງກ໌ URL (Store Slug)</Label>
              <div className="relative flex items-center mt-1">
                <span className="absolute left-3.5 text-zinc-500 text-xs font-mono select-none">/shop/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"))}
                  className="h-11 bg-zinc-950/70 border-zinc-800 text-blue-400 rounded-xl font-mono pl-14 font-bold"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-300">ເບີໂທຕິດຕໍ່ / WhatsApp ໜ້າຮ້ານ</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="020 xxxx xxxx"
                className="h-11 bg-zinc-950/70 border-zinc-800 text-white rounded-xl mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-300">ໂດເມນສ່ວນຕົວ (Custom Domain - ຖ້າມີ)</Label>
              <Input
                placeholder="e.g. www.mystore.com"
                value={config.customDomain}
                onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                className="h-11 bg-zinc-950/70 border-zinc-800 text-white rounded-xl mt-1"
              />
            </div>
          </div>
        </div>

        {/* Right 6 cols: E-Commerce Hero & Promo Bar Settings */}
        <div className="lg:col-span-6 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="bg-emerald-500/20 p-2.5 rounded-2xl shrink-0">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                ປັບແຕ່ງໜ້າເວັບ E-Commerce (Hero & Promo Bar)
              </h2>
              <p className="text-xs text-zinc-400">ກຳນົດຂໍ້ຄວາມໂປຣໂມຊັ່ນດ້ານເທິງ ແລະ ຂໍ້ຄວາມຕ້ອນຮັບໜ້າເວັບ</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-zinc-300">ຂໍ້ຄວາມແຖບໂປຣໂມຊັ່ນດ້ານເທິງ (Top Announcement Bar)</Label>
              <Input
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="h-11 bg-zinc-950/70 border-zinc-800 text-white rounded-xl text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-zinc-300">ປ້າຍກຳກັບ Hero Badge</Label>
                <Input
                  value={heroBadge}
                  onChange={(e) => setHeroBadge(e.target.value)}
                  className="h-11 bg-zinc-950/70 border-zinc-800 text-emerald-400 font-bold rounded-xl text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-zinc-300">ຫົວຂໍ້ຫຼັກໜ້າຮ້ານ (Hero Headline)</Label>
                <Input
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder={name}
                  className="h-11 bg-zinc-950/70 border-zinc-800 text-white font-bold rounded-xl text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-300">ຄຳອະທິບາຍໜ້າຮ້ານ (Hero Subtitle)</Label>
              <textarea
                rows={3}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full bg-zinc-950/70 border border-zinc-800 text-white rounded-xl text-xs p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: BANNERS & THEME SELECTION */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
        {/* Banner Upload Section */}
        <div className="p-4 sm:p-8 border-b border-white/5">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-purple-500/20 p-2.5 rounded-xl shrink-0">
              <ImageIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                ຮູບປົກໂປຣໂມຊັ່ນ & ວິດີໂອໜ້າຮ້ານ (Hero Banner Carousel)
              </h2>
              <p className="text-xs text-zinc-400">
                ອັບໂຫຼດຮູບ ຫຼື ວິດີໂອແນວນອນເພື່ອສະແດງເປັນສະໄລດ໌ໂຊວ໌ບົນໜ້າເວັບ E-Commerce (ຖ້າບໍ່ອັບໂຫຼດ ລະບົບຈະໃຊ້ Hero Showcase ອັດຕະໂນມັດ)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {banners.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((banner, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-2xl overflow-hidden border border-zinc-700/50 bg-black/20 aspect-[21/9]"
                  >
                    {banner.type === "video" ? (
                      <video src={banner.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <img src={banner.url} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-white flex items-center gap-1">
                      {banner.type === "video" ? <Video className="w-3 h-3" /> : <ImageIcon2 className="w-3 h-3" />}
                      {idx + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBanner(idx)}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-zinc-700/50 bg-zinc-950/50 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group py-8">
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleBannerUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center text-zinc-500">
                <UploadCloud className="w-8 h-8 mb-2 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                <p className="text-sm font-medium group-hover:text-zinc-300 transition-colors">
                  ຄລິກ ຫຼື ລາກໄຟລ໌ມາວາງບ່ອນນີ້ເພື່ອເພີ່ມຮູບ/ວິດີໂອ Banner
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="p-4 sm:p-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <div className="bg-blue-500/20 p-2.5 rounded-xl shrink-0">
              <LayoutTemplate className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ໂທນສີຂອງເວັບ E-Commerce (Storefront Theme)</h2>
              <p className="text-xs text-zinc-400">ເລືອກໂທນສີທີ່ເໝາະກັບແບຣນຮ້ານຄ້າຂອງທ່ານ (ເບິ່ງຜົນລັບໃນກອບຕົວຢ່າງດ້ານເທິງໄດ້ທັນທີ)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {[
              { id: "light", label: "ສະຫວ່າງ (Clean Light)", preview: "bg-slate-100 border-slate-300" },
              { id: "dark", label: "ມືດ (Modern Dark)", preview: "bg-zinc-950 border-zinc-800" },
              { id: "colorful", label: "ສີສັນ (Vibrant)", preview: "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" },
              { id: "nature", label: "ທຳມະຊາດ (Emerald)", preview: "bg-gradient-to-br from-stone-900 to-emerald-950" },
              { id: "ocean", label: "ທະເລ (Ocean Blue)", preview: "bg-gradient-to-br from-slate-900 to-cyan-950" },
              { id: "luxury", label: "ຫຼູຫຼາ (Gold Luxury)", preview: "bg-zinc-950 border-amber-500/40" },
              { id: "sunset", label: "ຕາເວັນຕົກ (Sunset)", preview: "bg-gradient-to-br from-rose-900 to-orange-950" },
              { id: "pastel", label: "ພາສເທວ (Soft Pastel)", preview: "bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200" },
              { id: "cyberpunk", label: "ໄຊເບີພັນ (Cyberpunk)", preview: "bg-zinc-950 border-fuchsia-500" },
              { id: "minimal", label: "ມິນິມອລ (Minimal White)", preview: "bg-white border-zinc-200" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setConfig({ ...config, theme: t.id })}
                className={`cursor-pointer rounded-xl sm:rounded-2xl border-2 transition-all p-1.5 sm:p-2 text-left ${
                  config.theme === t.id
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
                }`}
              >
                <div className={`h-11 sm:h-16 rounded-lg sm:rounded-xl mb-1.5 sm:mb-2 border ${t.preview}`} />
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] sm:text-xs font-bold text-zinc-200 truncate">{t.label}</span>
                  {config.theme === t.id && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 5: SEO & GOOGLE SEARCH PREVIEW */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="bg-emerald-500/20 p-2.5 rounded-2xl shrink-0">
            <Search className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              ການຕັ້ງຄ່າ SEO & Google Search Snippet
            </h2>
            <p className="text-xs text-zinc-400">ກຳນົດຫົວຂໍ້ ແລະ ຄຳອະທິບາຍຮ້ານເມື່ອລູກຄ້າຄົ້ນຫາໃນ Google</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div>
              <Label className="text-xs font-semibold text-zinc-300">ຫົວຂໍ້ບົນ Google Search (SEO Meta Title)</Label>
              <Input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="h-11 bg-zinc-950/70 border-zinc-800 text-white rounded-xl text-sm font-bold mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-300 flex justify-between">
                <span>ຄຳອະທິບາຍຮ້ານ (SEO Meta Description)</span>
                <span className="text-zinc-500">{seoDescription.length}/160</span>
              </Label>
              <textarea
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full bg-zinc-950/70 border border-zinc-800 text-white rounded-xl text-sm p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-zinc-300">ຄຳຄົ້ນຫາ (Keywords)</Label>
              <Input
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                className="h-11 bg-zinc-950/70 border-zinc-800 text-white rounded-xl text-sm mt-1"
              />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2.5">
            <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-400" />
              ຕົວຢ່າງບົນ Google Search (Live SERP Preview)
            </Label>
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-xl space-y-2">
              <div className="text-xs text-zinc-400 font-mono truncate">
                {originUrl || "https://laosys.site"} › shop › <span className="text-zinc-200">{slug}</span>
              </div>
              <h3 className="text-base font-medium text-blue-400 hover:underline leading-snug">
                {seoTitle || name}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                {seoDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY SAVE BAR */}
      <div className="fixed bottom-2.5 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-lg md:w-auto md:min-w-[460px]">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)] p-2 sm:p-4 flex items-center justify-between gap-3 sm:gap-4">
          <span className="hidden sm:inline-block text-xs sm:text-sm text-zinc-300 font-bold ml-2">
            ບັນທຶກການອອກແບບໜ້າເວັບ E-Commerce
          </span>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-lg sm:rounded-xl px-4 sm:px-8 font-black shadow-lg shadow-emerald-500/25 transition-all h-9 sm:h-12 text-xs sm:text-sm active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 animate-spin" />
                ກຳລັງບັນທຶກ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                ບັນທຶກທຸກການປ່ຽນແປງ (Save All)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* QR CODE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">QR Code ໜ້າເວັບ E-Commerce ຂອງທ່ານ</h3>
            <p className="text-xs text-zinc-400">
              ລູກຄ້າສາມາດໃຊ້ກ້ອງມືຖືສະແກນເພື່ອເຂົ້າຊື້ສິນຄ້າໃນຮ້ານຂອງທ່ານໄດ້ທັນທີ
            </p>
            <div className="bg-white p-6 rounded-2xl inline-block mx-auto shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  fullShopUrl
                )}`}
                alt="Store QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <div className="pt-2">
              <Button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold"
              >
                ປິດໜ້າຕ່າງ (Close)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD PROGRESS POPUP MODAL */}
      {uploadState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.85)] space-y-5 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                    uploadState.stage === "completed"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : uploadState.stage === "error"
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                      : "bg-purple-500/20 border-purple-500/30 text-purple-400"
                  }`}
                >
                  {uploadState.stage === "completed" ? (
                    <Check className="w-6 h-6 stroke-[2]" />
                  ) : uploadState.stage === "error" ? (
                    <X className="w-6 h-6 stroke-[2]" />
                  ) : (
                    <UploadCloud className="w-6 h-6 stroke-[1.75] animate-bounce" />
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    {uploadState.stage === "optimizing"
                      ? "ກຳລັງບີບອັດໄຟລ໌ໃຫ້ໂຫຼດໄວຂຶ້ນ..."
                      : uploadState.stage === "uploading"
                      ? "ກຳລັງອັບໂຫຼດໄຟລ໌ Banner..."
                      : uploadState.stage === "saving"
                      ? "ກຳລັງບັນທຶກໄຟລ໌ລົງເຊີບເວີ..."
                      : uploadState.stage === "completed"
                      ? "ອັບໂຫຼດສຳເລັດແລ້ວ!"
                      : "ການອັບໂຫຼດລົ້ມເຫຼວ"}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {uploadState.stage === "optimizing"
                      ? "ລະບົບກຳລັງປັບຂະໜາດຮູບພາບເພື່ອໃຫ້ອັບໂຫຼດໄວຂຶ້ນ"
                      : uploadState.stage === "uploading"
                      ? "ກະລຸນາລໍຖ້າຈົນກວ່າຈະຄົບ 100%"
                      : uploadState.stage === "saving"
                      ? "ໃກ້ສຳເລັດແລ້ວ ກຳລັງຈັດເກັບໄຟລ໌..."
                      : uploadState.stage === "completed"
                      ? "ເພີ່ມເຂົ້າໃນ Hero Banner ໜ້າຮ້ານຮຽບຮ້ອຍແລ້ວ"
                      : uploadState.errorMessage || "ກະລຸນາລອງໃໝ່ອີກຄັ້ງ"}
                  </p>
                </div>
              </div>

              {/* Big % Readout */}
              <div className="text-right shrink-0">
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    uploadState.stage === "error" ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {uploadState.percent}%
                </span>
              </div>
            </div>

            {/* File Info Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 shrink-0">
                  {uploadState.mediaType === "video" ? (
                    <Video className="w-4 h-4 text-purple-400 stroke-[1.75]" />
                  ) : (
                    <ImageIcon2 className="w-4 h-4 text-emerald-400 stroke-[1.75]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-200 truncate">{uploadState.fileName}</p>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {formatBytes(uploadState.loadedBytes)} / {formatBytes(uploadState.uploadSize)}
                    {uploadState.wasCompressed && (
                      <span className="ml-1.5 text-emerald-400 font-sans font-semibold">
                        (ບີບອັດຈາກ {formatBytes(uploadState.originalSize)})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {uploadState.stage === "uploading" && uploadState.speedBps > 0 && (
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-400 font-mono block">
                    {formatBytes(uploadState.speedBps)}/s
                  </span>
                  {uploadState.etaSeconds !== null && uploadState.etaSeconds > 0 && (
                    <span className="text-[10px] text-zinc-400 block">
                      ອີກ ~{uploadState.etaSeconds} ວິນາທີ
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    uploadState.stage === "error"
                      ? "bg-rose-500"
                      : "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                  }`}
                  style={{ width: `${Math.min(Math.max(uploadState.percent, 2), 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium px-0.5">
                <span>
                  {uploadState.stage === "optimizing"
                    ? "ຂັ້ນຕອນທີ 1/2: ບີບອັດໄຟລ໌ຄວາມໄວສູງ"
                    : uploadState.stage === "completed"
                    ? "ສຳເລັດຄົບຖ້ວນ 100%"
                    : "ຂັ້ນຕອນການສົ່ງຂໍ້ມູນຂຶ້ນເຊີບເວີ"}
                </span>
                <span className="font-mono text-zinc-300 font-bold">{uploadState.percent}% / 100%</span>
              </div>
            </div>

            {/* Action Button (Cancel or Close) */}
            <div className="pt-1">
              {uploadState.stage === "error" || uploadState.stage === "completed" ? (
                <Button
                  type="button"
                  onClick={() => setUploadState(null)}
                  className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-xs"
                >
                  ປິດໜ້າຕ່າງ (Close)
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleCancelUpload}
                  variant="outline"
                  className="w-full h-10 bg-zinc-950/80 hover:bg-rose-500/15 border-zinc-800 hover:border-rose-500/40 text-zinc-300 hover:text-rose-300 rounded-xl font-bold text-xs"
                >
                  <X className="w-3.5 h-3.5 mr-1.5 stroke-[1.75]" />
                  ຍົກເລີກການອັບໂຫຼດ (Cancel Upload)
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

