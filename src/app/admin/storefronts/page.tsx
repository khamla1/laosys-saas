"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutTemplate,
  Globe,
  Image as ImageIcon,
  Store,
  Search,
  ExternalLink,
  Edit,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  Palette,
} from "lucide-react";
import { toast } from "sonner";

interface StorefrontItem {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  logo: string | null;
  storefront?: {
    id: string;
    theme: string;
    bannerUrl: string | null;
    primaryColor: string | null;
    customDomain: string | null;
  };
}

export default function StorefrontsAdminPage() {
  const [stores, setStores] = useState<StorefrontItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Edit Modal
  const [editingStore, setEditingStore] = useState<StorefrontItem | null>(null);
  const [theme, setTheme] = useState("MODERN");
  const [bannerUrl, setBannerUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [customDomain, setCustomDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/admin/storefronts");
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໜ້າຮ້ານໄດ້");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/storefronts/${editingStore.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          bannerUrl,
          primaryColor,
          customDomain,
        }),
      });

      if (res.ok) {
        toast.success(`ອັບເດດໜ້າຮ້ານອອນລາຍຂອງ "${editingStore.name}" ສຳເລັດແລ້ວ!`);
        setEditingStore(null);
        fetchStores();
      } else {
        toast.error("ບັນທຶກບໍ່ສຳເລັດ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (store: StorefrontItem) => {
    setEditingStore(store);
    setTheme(store.storefront?.theme || "MODERN");
    setBannerUrl(store.storefront?.bannerUrl || "");
    setPrimaryColor(store.storefront?.primaryColor || "#3b82f6");
    setCustomDomain(store.storefront?.customDomain || "");
  };

  const filteredStores = stores.filter((s) => {
    return (
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      (s.storefront?.customDomain &&
        s.storefront.customDomain.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <LayoutTemplate className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ຈັດການໜ້າຮ້ານອອນລາຍ (Online Storefronts)
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Storefront Manager
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ປັບແຕ່ງທີມໜ້າຮ້ານ, ປ້າຍແບນເນີ, ສີແບຣນ ແລະ ໂດເມນສ່ວນຕົວ (Custom Domain) ຂອງແຕ່ລະຮ້ານ
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ໜ້າຮ້ານທັງໝົດ (Storefronts)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-2">
                {stores.length} <span className="text-sm font-normal text-zinc-500">ຮ້ານ</span>
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Store className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ໜ້າຮ້ານຄ້າອອນລາຍທີ່ພ້ອມຂາຍສິນຄ້າ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ໂດເມນສ່ວນຕົວ (Custom Domains)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-purple-400 mt-2">
                {stores.filter((s) => s.storefront?.customDomain).length}{" "}
                <span className="text-sm font-normal text-zinc-500">ໂດເມນ</span>
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Globe className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ຮ້ານທີ່ເຊື່ອມຕໍ່ຊື່ເວັບໄຊທ໌ສ່ວນຕົວ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-pink-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ທີມທີ່ນິຍົມ (Popular Theme)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-pink-400 mt-2">MODERN</h3>
            </div>
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ຮູບແບບໜ້າຮ້ານທີ່ຖືກໃຊ້ງານຫຼາຍທີ່ສຸດ</p>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 items-center justify-between">
        <div className="relative w-full sm:w-72 md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ຮ້ານ, Slug, ຫຼື ໂດເມນ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Storefronts Grid ── */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
          <p className="text-zinc-500 text-sm">ກຳລັງໂຫຼດຂໍ້ມູນໜ້າຮ້ານ...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="p-8 sm:p-12 md:p-20 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
          <div className="w-20 h-20 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
            <LayoutTemplate className="w-10 h-10 text-zinc-600" />
          </div>
          <p className="text-zinc-300 text-lg font-semibold">ບໍ່ພົບຂໍ້ມູນໜ້າຮ້ານ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredStores.map((store) => {
            const st = store.storefront;
            return (
              <div
                key={store.id}
                className="bg-zinc-900/90 border border-zinc-800/80 hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      THEME: {st?.theme || "MODERN"}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      {store.businessType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-pink-500/20 border border-zinc-800 flex items-center justify-center font-black text-lg text-white shrink-0">
                      {store.name ? store.name[0]?.toUpperCase() : "S"}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight group-hover:text-indigo-400 transition-colors">
                        {store.name}
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono">
                        {st?.customDomain ? st.customDomain : `${store.slug}.saas.la`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3.5 my-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-indigo-400" /> ໂດເມນ:
                      </span>
                      <span className="text-white font-mono">
                        {st?.customDomain || "ຍັງບໍ່ໄດ້ຕັ້ງ"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-purple-400" /> ສີຫຼັກແບຣນ:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block border border-white/20"
                          style={{ backgroundColor: st?.primaryColor || "#3b82f6" }}
                        />
                        <span className="text-zinc-300 font-mono">
                          {st?.primaryColor || "#3b82f6"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                  <a
                    href={`/shop/${store.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> ເປີດເບິ່ງໜ້າຮ້ານ
                  </a>

                  <button
                    onClick={() => openEdit(store)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" /> ປັບແຕ່ງ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit Storefront Modal ── */}
      {editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ປັບແຕ່ງໜ້າຮ້ານ: {editingStore.name}
              </h2>
              <button
                onClick={() => setEditingStore(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ທີມໜ້າຮ້ານ (Storefront Theme)
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="MODERN">MODERN (ສະໄໝໃໝ່)</option>
                  <option value="MINIMAL">MINIMAL (ຮຽບງ່າຍ)</option>
                  <option value="SPORT">SPORT (ສະປອດ / ກິລາ)</option>
                  <option value="LUXURY">LUXURY (ພຣີມຽມ / ຫຼູຫຼາ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ໂດເມນສ່ວນຕົວ (Custom Domain)
                </label>
                <input
                  type="text"
                  placeholder="ເຊັ່ນ: shop.laosports.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ສີຫຼັກແບຣນ (Primary Color HEX)
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  URL ຮູບແບນເນີ (Banner Image)
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/banner.jpg"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  ບັນທຶກການປ່ຽນແປງ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
