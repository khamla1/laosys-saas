"use client";

import { askConfirm } from "@/components/ConfirmModal";
import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Image as ImageIcon,
  Trash2,
  Edit,
  XCircle,
  Loader2,
  UploadCloud,
  Calendar,
  User,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Wrench,
  ShoppingBag,
  Building
} from "lucide-react";
import { toast } from "sonner";

export default function GalleryPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("EQUIPMENT");
  const [description, setDescription] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/dashboard/gallery");
      if (res.ok) {
        const data = await res.json();
        setMedia(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("ບໍ່ສາມາດໂຫຼດຮູບພາບ ແລະ ສື່ອຸປະກອນໄດ້");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.url) {
          setImageUrl(json.url);
          if (!title) {
            setTitle(file.name.replace(/\.[^/.]+$/, ""));
          }
          toast.success("ອັບໂຫຼດຮູບພາບສຳເລັດ");
        }
      } else {
        toast.error("ອັບໂຫຼດຮູບພາບບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດ");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      return toast.error("ກະລຸນາປ້ອນຫົວຂໍ້ ແລະ ອັບໂຫຼດຮູບພາບ");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          imageUrl: imageUrl.trim(),
          description: `[${category}] ${description.trim()}`.trim(),
          addedBy: addedBy.trim() || "Admin",
        }),
      });

      if (res.ok) {
        toast.success("ບັນທຶກຮູບພາບເຂົ້າຄັງສື່ສຳເລັດ");
        setShowAddModal(false);
        resetForm();
        fetchMedia();
      } else {
        toast.error("ບັນທຶກຮູບພາບບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await askConfirm("ທ່ານຕ້ອງການລຶບຮູບພາບນີ້ອອກຈາກຄັງສື່ແທ້ບໍ່?", {
      title: "ຢືນຢັນການລຶບຮູບພາບ",
      confirmText: "ລຶບຮູບພາບ",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/dashboard/gallery/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບຮູບພາບສຳເລັດແລ້ວ");
        setSelectedImage(null);
        fetchMedia();
      } else {
        toast.error("ລຶບຮູບພາບບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    }
  };

  const handleCopyLink = (url: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast.success("ສຳເນົາລິ້ງຮູບພາບແລ້ວ (Link copied to clipboard)");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetForm = () => {
    setTitle("");
    setImageUrl("");
    setDescription("");
    setCategory("EQUIPMENT");
    setAddedBy("");
  };

  const filteredMedia = media.filter((m) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q)) ||
      (m.addedBy && m.addedBy.toLowerCase().includes(q));

    if (categoryFilter === "ALL") return matchSearch;
    const desc = m.description || "";
    if (categoryFilter === "EQUIPMENT") return matchSearch && desc.includes("[EQUIPMENT]");
    if (categoryFilter === "PRODUCT") return matchSearch && desc.includes("[PRODUCT]");
    if (categoryFilter === "REPAIR") return matchSearch && desc.includes("[REPAIR]");
    if (categoryFilter === "FACILITY") return matchSearch && desc.includes("[FACILITY]");

    return matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-600 to-purple-700 shadow-lg shadow-fuchsia-500/20 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ຮູບພາບ / ສື່ອຸປະກອນ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30">
                Media Gallery
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ຄັງເກັບຮູບພາບສິນຄ້າ, ອຸປະກອນກິລາ, ງານສ້ອມແປງ, ສະຖານທີ່ ແລະ ນຳລິ້ງໄປໃຊ້ໃນລະບົບ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-fuchsia-500/20 flex items-center gap-2"
        >
          <UploadCloud className="w-4 h-4" />
          <span>ອັບໂຫຼດຮູບໃໝ່</span>
        </button>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຮູບພາບທັງໝົດ</p>
          <h3 className="text-2xl font-black text-white mt-2">{media.length} ໄຟລ໌</h3>
          <p className="text-xs text-zinc-500 mt-2">ໃນຄັງສື່ອຸປະກອນ</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ອຸປະກອນ & ເຄື່ອງມື</p>
          <h3 className="text-2xl font-black text-fuchsia-400 mt-2">
            {media.filter((m) => (m.description || "").includes("[EQUIPMENT]")).length} ຮູບ
          </h3>
          <p className="text-xs text-fuchsia-400/80 mt-2">ຮູບເຄື່ອງມື & ອຸປະກອນ</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ສິນຄ້າ & ໂປຣໂມຊັ່ນ</p>
          <h3 className="text-2xl font-black text-blue-400 mt-2">
            {media.filter((m) => (m.description || "").includes("[PRODUCT]")).length} ຮູບ
          </h3>
          <p className="text-xs text-blue-400/80 mt-2">ສຳລັບຂາຍໜ້າຮ້ານ</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຜົນງານສ້ອມແປງ</p>
          <h3 className="text-2xl font-black text-amber-400 mt-2">
            {media.filter((m) => (m.description || "").includes("[REPAIR]")).length} ຮູບ
          </h3>
          <p className="text-xs text-amber-400/80 mt-2">ຫຼັກຖານການສ້ອມແປງ</p>
        </div>
      </div>

      {/* ── Toolbar & Category Tabs ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ຮູບພາບ, ລາຍລະອຽດ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-fuchsia-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "ທັງໝົດ", val: "ALL" },
            { label: "ອຸປະກອນ & ເຄື່ອງມື", val: "EQUIPMENT" },
            { label: "ສິນຄ້າ & ໂປຣໂມຊັ່ນ", val: "PRODUCT" },
            { label: "ຜົນງານສ້ອມແປງ", val: "REPAIR" },
            { label: "ສະຖານທີ່ & ສາຂາ", val: "FACILITY" },
          ].map((cat) => (
            <button
              key={cat.val}
              onClick={() => setCategoryFilter(cat.val)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === cat.val
                  ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Media Masonry Grid ── */}
      {isLoading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-fuchsia-500 mb-2" />
          <p className="text-zinc-400 text-sm">ກຳລັງໂຫຼດຄັງຮູບພາບ...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="p-16 text-center flex flex-col items-center border border-zinc-800 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-3">
            <ImageIcon className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-300 font-bold text-base">ບໍ່ພົບຮູບພາບໃນຄັງສື່</p>
          <p className="text-zinc-500 text-xs mt-1">ກົດປຸ່ມ "ອັບໂຫຼດຮູບໃໝ່" ເພື່ອເລີ່ມຕົ້ນເພີ່ມຮູບພາບ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-lg cursor-pointer hover:border-fuchsia-500/50 transition-all duration-300"
            >
              <div className="relative w-full h-48 bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/600x400/18181b/a1a1aa?text=Image+Not+Found";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Quick Copy Link Button on hover */}
                <button
                  onClick={(e) => handleCopyLink(item.imageUrl, item.id, e)}
                  className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-fuchsia-600 text-white rounded-xl text-xs backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
                  title="ສຳເນົາລິ້ງຮູບພາບ"
                >
                  {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-4">
                <h3 className="text-white font-bold text-sm truncate group-hover:text-fuchsia-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-zinc-400 text-xs mt-1 truncate">
                  {item.description ? item.description.replace(/\[.*?\]\s*/g, "") : "ບໍ່ມີຄຳອະທິບາຍ"}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="text-zinc-400">{item.addedBy || "Admin"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lightbox Preview Modal ── */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Preview */}
            <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[300px]">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/600x400/18181b/a1a1aa?text=Image+Not+Found";
                }}
              />
            </div>

            {/* Image Metadata & Actions */}
            <div className="w-full md:w-80 bg-zinc-900 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800">
              <div>
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-white">{selectedImage.title}</h2>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1 mb-4">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(selectedImage.createdAt).toLocaleString()}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block mb-1 font-semibold">ລາຍລະອຽດ:</span>
                    <p className="text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800 leading-relaxed">
                      {selectedImage.description || "ບໍ່ມີລາຍລະອຽດ"}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-1 font-semibold">ຜູ້ບັນທຶກ:</span>
                    <span className="text-zinc-200">{selectedImage.addedBy || "Admin"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-1 font-semibold">ລິ້ງ URL ຂອງຮູບ:</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={selectedImage.imageUrl}
                        className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-400 font-mono truncate"
                      />
                      <button
                        onClick={() => handleCopyLink(selectedImage.imageUrl, selectedImage.id)}
                        className="px-2.5 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg text-xs font-semibold shrink-0"
                      >
                        {copiedId === selectedImage.id ? "ສຳເນົາແລ້ວ" : "ສຳເນົາ"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 mt-6">
                <button
                  onClick={() => handleDelete(selectedImage.id)}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ລຶບຮູບພາບນີ້</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Upload Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-fuchsia-500" />
                <span>ອັບໂຫຼດຮູບພາບໃໝ່</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ຍົກເລີກ
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* File Upload Box */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ເລືອກໄຟລ໌ຮູບພາບຈາກອຸປະກອນ *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-700 hover:border-fuchsia-500 rounded-2xl p-6 text-center cursor-pointer bg-zinc-950/60 hover:bg-zinc-950 transition-all flex flex-col items-center justify-center"
                >
                  {isUploading ? (
                    <div className="py-4">
                      <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400">ກຳລັງອັບໂຫຼດໄຟລ໌...</p>
                    </div>
                  ) : imageUrl ? (
                    <div className="space-y-2">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-32 h-24 object-cover rounded-xl mx-auto border border-zinc-700"
                      />
                      <p className="text-xs text-emerald-400 font-semibold">ອັບໂຫຼດຮູບພາບຮຽບຮ້ອຍແລ້ວ</p>
                      <p className="text-[11px] text-zinc-500">ກົດເພື່ອປ່ຽນຮູບພາບອື່ນ</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-zinc-500 mb-2" />
                      <p className="text-sm font-semibold text-zinc-200">ກົດເພື່ອເລືອກຮູບພາບ</p>
                      <p className="text-xs text-zinc-500 mt-1">ຮອງຮັບໄຟລ໌ JPG, PNG, WebP (ສູງສຸດ 100MB)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Alternatively paste URL */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  ຫຼື ປ້ອນລິ້ງ URL ຮູບພາບໂດຍກົງ
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... ຫຼື /uploads/..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ຫົວຂໍ້ຮູບພາບ *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="ເຊັ່ນ: ໄມ້ຕີດອກປີກໄກ່ Astrox 99, ໃບສ້ອມແປງ..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">ໝວດໝູ່ສື່</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-fuchsia-500"
                  >
                    <option value="EQUIPMENT">ອຸປະກອນ & ເຄື່ອງມື</option>
                    <option value="PRODUCT">ສິນຄ້າ & ໂປຣໂມຊັ່ນ</option>
                    <option value="REPAIR">ຜົນງານ & ສ້ອມແປງ</option>
                    <option value="FACILITY">ສະຖານທີ່ & ສາຂາ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">ຜູ້ບັນທຶກ</label>
                  <input
                    type="text"
                    value={addedBy}
                    onChange={(e) => setAddedBy(e.target.value)}
                    placeholder="ຊື່ພະນັກງານ"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ລາຍລະອຽດເພີ່ມເຕີມ
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ຄຳອະທິບາຍກ່ຽວກັບຮູບພາບ ຫຼື ອຸປະກອນ..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-fuchsia-500 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !imageUrl}
                  className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>ບັນທຶກຮູບພາບ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
