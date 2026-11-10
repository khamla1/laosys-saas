"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Store,
  Utensils,
  ShoppingBag,
  Wrench,
  HeartPulse,
  CheckCircle,
  ArrowRight,
  X,
  Filter,
  Globe,
  Package,
  Sparkles,
  ExternalLink,
  ShoppingCart
} from "lucide-react";

export interface StoreItem {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  businessType?: string | null;
  createdAt: string | Date;
  storefront?: {
    theme?: string;
    bannerUrl?: string | null;
    metadata?: any;
  } | null;
  _count?: {
    products: number;
  };
}

interface StoresClientProps {
  initialStores: StoreItem[];
}

export default function StoresClient({ initialStores }: StoresClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Get business type display helper
  const getBusinessTypeInfo = (type?: string | null) => {
    switch (type) {
      case "RESTAURANT":
      case "F_AND_B":
        return {
          label: "ຮ້ານອາຫານ & ເຄື່ອງດື່ມ (Restaurant & F&B)",
          icon: <Utensils className="w-4 h-4 text-orange-400" />,
          badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          gradient: "from-orange-600/40 via-amber-600/30 to-zinc-900"
        };
      case "E_COMMERCE":
      case "RETAIL":
        return {
          label: "ຮ້ານຄ້າອອນລາຍ (E-Commerce & Retail)",
          icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
          badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          gradient: "from-emerald-600/40 via-teal-600/30 to-zinc-900"
        };
      case "SERVICE":
      case "REPAIR":
        return {
          label: "ບໍລິການ & ສ້ອມແປງ (Services)",
          icon: <Wrench className="w-4 h-4 text-blue-400" />,
          badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          gradient: "from-blue-600/40 via-indigo-600/30 to-zinc-900"
        };
      case "CLINIC":
      case "HEALTH":
        return {
          label: "ຄລີນິກ & ສຸຂະພາບ (Clinic & Health)",
          icon: <HeartPulse className="w-4 h-4 text-rose-400" />,
          badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          gradient: "from-rose-600/40 via-pink-600/30 to-zinc-900"
        };
      default:
        return {
          label: "ຮ້ານຄ້າທົ່ວໄປ (General Store)",
          icon: <Store className="w-4 h-4 text-cyan-400" />,
          badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
          gradient: "from-cyan-600/40 via-blue-600/30 to-zinc-900"
        };
    }
  };

  // Filtered stores based on search query & business type
  const filteredStores = useMemo(() => {
    return initialStores.filter((store) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (store.businessType &&
          store.businessType.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        selectedType === "ALL" || store.businessType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [initialStores, searchQuery, selectedType]);

  const categories = [
    { id: "ALL", label: "ທັງໝົດ (All Stores)", icon: Store, count: initialStores.length },
    { id: "RESTAURANT", label: "ຮ້ານອາຫານ (Restaurants)", icon: Utensils, count: initialStores.filter(s => s.businessType === "RESTAURANT").length },
    { id: "E_COMMERCE", label: "ຮ້ານຄ້າອອນລາຍ (E-Commerce)", icon: ShoppingBag, count: initialStores.filter(s => s.businessType === "E_COMMERCE").length },
    { id: "RETAIL", label: "ຮ້ານຄ້າທົ່ວໄປ (Retail)", icon: ShoppingCart, count: initialStores.filter(s => s.businessType === "RETAIL" || !s.businessType || s.businessType === "GENERIC").length },
    { id: "SERVICE", label: "ບໍລິການ (Services)", icon: Wrench, count: initialStores.filter(s => s.businessType === "SERVICE").length },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Banner Navigation */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src="/logo-v2.svg" 
              alt="LAOSYS Logo" 
              width={40} 
              height={40} 
              className="w-10 h-10 object-contain rounded-xl drop-shadow-[0_0_12px_rgba(0,242,254,0.35)] group-hover:scale-105 transition-all"
            />
            <div>
              <span className="font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
                LAOSYS
              </span>
              <span className="text-xs text-zinc-400 block -mt-1 font-medium">Store Directory</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="text-xs sm:text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
            >
              ← ກັບຄືນໜ້າຫຼັກ (Home)
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 bg-gradient-to-b from-zinc-900 via-zinc-900/50 to-zinc-950 border-b border-zinc-800/50">
        {/* Glow ambient background circles */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LAOSYS Official Merchant Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4">
            ຄົ້ນຫາຮ້ານຄ້າ &amp; ໜ້າຮ້ານອອນລາຍ
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 mt-2">
              (Explore LAOSYS Stores)
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            ສູນລວມຮ້ານອາຫານ, ຮ້ານຄ້າ ແລະ ເວັບໄຊທ໌ E-Commerce ທີ່ເປີດໃຫ້ບໍລິການເທິງລະບົບ LAOSYS
            ທ່ານສາມາດຄົ້ນຫາຊື່ຮ້ານ ແລະ ກົດເຂົ້າສູ່ໜ້າຮ້ານຄ້າ (Storefront) ເພື່ອສັ່ງຊື້ສິນຄ້າໄດ້ທັນທີ.
          </p>

          {/* Search Box */}
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ຄົ້ນຫາຊື່ຮ້ານ, ລິ້ງໜ້າຮ້ານ ຫຼື ປະເພດທຸລະກິດ... (Search store name or keyword)"
              className="w-full pl-12 pr-11 py-4 bg-zinc-900/90 border-2 border-zinc-700/80 focus:border-emerald-500 text-white rounded-2xl placeholder:text-zinc-500 text-sm sm:text-base shadow-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Filter Categories */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedType(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border flex items-center gap-1.5 ${
                  selectedType === cat.id
                    ? "bg-emerald-500 text-zinc-950 font-bold border-emerald-400 shadow-lg shadow-emerald-500/20"
                    : "bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {cat.icon && React.createElement(cat.icon, { className: "w-3.5 h-3.5 shrink-0" })}
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  selectedType === cat.id ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Results count header */}
        <div className="flex items-center justify-between mb-8 border-b border-zinc-800/60 pb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              ຮ້ານຄ້າທີ່ພົບ ({filteredStores.length} ຮ້ານ)
            </h2>
          </div>
          {searchQuery && (
            <div className="text-xs text-zinc-400">
              ຜົນການຄົ້ນຫາສຳລັບ &ldquo;<span className="text-emerald-400 font-medium">{searchQuery}</span>&rdquo;
            </div>
          )}
        </div>

        {filteredStores.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/80 max-w-lg mx-auto px-6">
            <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto mb-4 text-zinc-500">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              ບໍ່ພົບຮ້ານຄ້າທີ່ຄົ້ນຫາ (No Stores Found)
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເລືອກປະເພດຮ້ານຄ້າອື່ນ ເພື່ອເບິ່ງຮ້ານຄ້າທີ່ເປີດໃຫ້ບໍລິການເທິງລະບົບ
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedType("ALL");
              }}
              className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
            >
              ຣີເຊັດການຄົ້ນຫາ (Reset Filter)
            </button>
          </div>
        ) : (
          /* Store Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredStores.map((store) => {
              const typeInfo = getBusinessTypeInfo(store.businessType);
              const storeUrl = store.slug ? `/shop/${store.slug}` : `/stores/${store.id}`;

              // Get banner image if exists
              const bannerUrl =
                store.storefront?.bannerUrl ||
                (store.storefront?.metadata?.banners &&
                  Array.isArray(store.storefront.metadata.banners) &&
                  store.storefront.metadata.banners[0]?.url) ||
                null;

              return (
                <div
                  key={store.id}
                  className="group bg-zinc-900/80 rounded-3xl border border-zinc-800 hover:border-emerald-500/50 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col overflow-hidden relative"
                >
                  {/* Banner / Cover Header */}
                  <div className={`h-36 w-full relative overflow-hidden bg-gradient-to-br ${typeInfo.gradient}`}>
                    {bannerUrl ? (
                      <img
                        src={bannerUrl}
                        alt={store.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-30">
                        <Store className="w-16 h-16 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

                    {/* Business Type Badge */}
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 backdrop-blur-md bg-zinc-950/80 ${typeInfo.badgeClass}`}>
                      {typeInfo.icon}
                      <span>{typeInfo.label.split(" ")[0]}</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 pt-3 flex-1 flex flex-col justify-between -mt-10 relative z-10">
                    <div>
                      {/* Logo + Store Name */}
                      <div className="flex items-end gap-3 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-950 border-2 border-zinc-700 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
                          {store.logo ? (
                            <img
                              src={store.logo}
                              alt={store.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center font-extrabold text-2xl text-white">
                              {store.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-xl text-white truncate group-hover:text-emerald-400 transition-colors">
                              {store.name}
                            </h3>
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          </div>
                          <div className="flex items-center gap-1 text-xs text-zinc-400 truncate">
                            <Globe className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="truncate">laosys.site/shop/{store.slug || store.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Store Details & Stats */}
                      <div className="flex items-center gap-4 py-3 border-y border-zinc-800/80 text-xs text-zinc-400 mb-5">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-emerald-400" />
                          <span>
                            <strong className="text-zinc-200">
                              {store._count?.products || 0}
                            </strong>{" "}
                            ລາຍການສິນຄ້າ/ເມນູ
                          </span>
                        </div>
                        <div className="text-zinc-600">•</div>
                        <div>
                          <span>
                            ເປີດຮ້ານປີ{" "}
                            {new Date(store.createdAt).getFullYear() || 2026}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Link Button */}
                    <Link
                      href={storeUrl}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all"
                    >
                      <span>ເຂົ້າສູ່ໜ້າຮ້ານ (Visit Storefront)</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} LAOSYS — ລະບົບຈັດການຮ້ານຄ້າ POS ແລະ ເວັບໄຊທ໌ E-Commerce ຄົບວົງຈອນທີ່ດີທີ່ສຸດໃນລາວ</p>
        </div>
      </footer>
    </div>
  );
}
