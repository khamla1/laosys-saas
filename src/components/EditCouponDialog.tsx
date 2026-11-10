"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Search,
  Ticket,
  Sparkles,
  X,
  ShoppingBag,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";

export function EditCouponDialog({
  coupon,
  products = [],
  onCouponUpdated,
}: {
  coupon: any;
  products: any[];
  onCouponUpdated: () => void;
}) {
  const [code, setCode] = useState(coupon.code || "");
  const [type, setType] = useState(coupon.type || "PERCENTAGE");
  const [value, setValue] = useState(coupon.value !== undefined ? coupon.value.toString() : "");
  const [minOrderVal, setMinOrderVal] = useState(
    coupon.minOrderVal !== undefined && coupon.minOrderVal !== null ? coupon.minOrderVal.toString() : ""
  );
  const [maxDiscount, setMaxDiscount] = useState(
    coupon.maxDiscount !== undefined && coupon.maxDiscount !== null ? coupon.maxDiscount.toString() : ""
  );
  const [maxUsage, setMaxUsage] = useState(
    coupon.maxUsage !== undefined && coupon.maxUsage !== null ? coupon.maxUsage.toString() : ""
  );
  const [expiresAt, setExpiresAt] = useState(
    coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : ""
  );
  const [isActive, setIsActive] = useState(Boolean(coupon.isActive));

  // Product Targeting State
  const initialSelected = Array.isArray(coupon.applicableProductIds) ? coupon.applicableProductIds : [];
  const [selectedProducts, setSelectedProducts] = useState<string[]>(initialSelected);
  const [applyToAllProducts, setApplyToAllProducts] = useState<boolean>(initialSelected.length === 0);
  const [searchProduct, setSearchProduct] = useState("");

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    onCouponUpdated();
  };

  const handleSelectAllFiltered = (filteredList: any[]) => {
    const ids = filteredList.map((p) => p.id);
    setSelectedProducts((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearSelected = () => {
    setSelectedProducts([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!code.trim()) {
      setFormError("ກະລຸນາປ້ອນລະຫັດຄູປອງ");
      return;
    }
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      setFormError("ກະລຸນາປ້ອນມູນຄ່າສ່ວນຫຼຸດທີ່ຖືກຕ້ອງ");
      return;
    }
    if (!applyToAllProducts && selectedProducts.length === 0) {
      setFormError("ກະລຸນາເລືອກຢ່າງໜ້ອຍ 1 ສິນຄ້າ ຫຼື ເລືອກ 'ທຸກສິນຄ້າໃນຮ້ານ'");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          value: Number(value),
          minOrderVal: minOrderVal ? Number(minOrderVal) : 0,
          maxDiscount: maxDiscount ? Number(maxDiscount) : null,
          maxUsage: maxUsage ? Number(maxUsage) : null,
          expiresAt: expiresAt || null,
          isActive,
          applicableProductIds: applyToAllProducts ? [] : selectedProducts,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onCouponUpdated();
      } else {
        setFormError(data.error || "ບໍ່ສາມາດອັບເດດຄູປອງໄດ້");
      }
    } catch {
      setFormError("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = (products || []).filter((p) =>
    String(p?.name || "")
      .toLowerCase()
      .includes(String(searchProduct || "").toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl lg:max-w-5xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  ແກ້ໄຂຄູປອງສ່ວນຫຼຸດ (Edit Promo Code)
                </h2>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {coupon.code}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                ອັບເດດມູນຄ່າສ່ວນຫຼຸດ, ເງື່ອນໄຂການໃຊ້ງານ ແລະ ເລືອກສິນຄ້າທີ່ຮອງຮັບ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
            title="ປິດ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body with Wide 2-Column Grid */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Column: Coupon Information & Conditions */}
            <div className="space-y-4 bg-zinc-950/60 p-4 sm:p-5 rounded-2xl border border-zinc-800/80">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>ຂໍ້ມູນລະຫັດ & ເງື່ອນໄຂສ່ວນຫຼຸດ</span>
                </h4>
                <span className="text-[11px] text-zinc-400 font-mono">
                  ID: {coupon.id ? String(coupon.id).slice(-6) : "-"}
                </span>
              </div>

              {/* Promo Code Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  ລະຫັດຄູປອງ (Promo Code) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ຕົວຢ່າງ: WELCOME10, VIP20"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 font-mono uppercase tracking-wider font-bold"
                />
              </div>

              {/* Type & Discount Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    ຮູບແບບສ່ວນຫຼຸດ
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="PERCENTAGE">ເປີເຊັນ (% OFF)</option>
                    <option value="FIXED">ຈຳນວນເງິນ (₭)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    ມູນຄ່າສ່ວນຫຼຸດ <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={type === "PERCENTAGE" ? "10" : "50000"}
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-emerald-400 font-bold focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    ຍອດຊື້ຂັ້ນຕ່ຳ (₭)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderVal}
                    onChange={(e) => setMinOrderVal(e.target.value)}
                    placeholder="0 = ບໍ່ຈຳກັດ"
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    ຫຼຸດສູງສຸດ (₭)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={type !== "PERCENTAGE"}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder={type === "PERCENTAGE" ? "ຫວ່າງ = ບໍ່ຈຳກັດ" : "ສະເພາະເປີເຊັນ"}
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-mono disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Total Usage Limit & Expiration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    ຈຳນວນຄັ້ງທີ່ໃຊ້ໄດ້
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(e.target.value)}
                    placeholder="ຫວ່າງ = ບໍ່ຈຳກັດ"
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    ວັນໝົດອາຍຸ
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Status Switcher */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ສະຖານະຄູປອງ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      isActive
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ເປີດໃຊ້ງານ (Active)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActive(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      !isActive
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>ປິດໃຊ້ງານ (Inactive)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Applicable Products Selector */}
            <div className="space-y-3 bg-zinc-950/60 p-4 sm:p-5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60 mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                    <span>ຂອບເຂດສິນຄ້າທີ່ຮອງຮັບສ່ວນຫຼຸດ</span>
                  </h4>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    ({products.length} ສິນຄ້າໃນຮ້ານ)
                  </span>
                </div>

                {/* Scope Radio / Buttons */}
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setApplyToAllProducts(true);
                      setSelectedProducts([]);
                    }}
                    className={`p-3 rounded-2xl text-xs font-semibold border transition-all text-left ${
                      applyToAllProducts
                        ? "bg-blue-600/20 border-blue-500 text-blue-200 shadow-lg shadow-blue-500/10"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850"
                    }`}
                  >
                    <p className="font-bold text-sm">ທຸກສິນຄ້າໃນຮ້ານ</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Store-wide (ໃຊ້ໄດ້ກັບທຸກເມນູ)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApplyToAllProducts(false)}
                    className={`p-3 rounded-2xl text-xs font-semibold border transition-all text-left ${
                      !applyToAllProducts
                        ? "bg-blue-600/20 border-blue-500 text-blue-200 shadow-lg shadow-blue-500/10"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850"
                    }`}
                  >
                    <p className="font-bold text-sm">ເລືອກສະເພາະບາງສິນຄ້າ</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {selectedProducts.length} ລາຍການທີ່ເລືອກ
                    </p>
                  </button>
                </div>

                {/* Product search & list (Visible if NOT applyToAllProducts) */}
                {!applyToAllProducts && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="ຄົ້ນຫາຊື່ສິນຄ້າ ຫຼື ລະຫັດ..."
                          value={searchProduct}
                          onChange={(e) => setSearchProduct(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      {filteredProducts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectAllFiltered(filteredProducts)}
                          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium shrink-0 transition-colors"
                        >
                          ເລືອກທັງໝົດ ({filteredProducts.length})
                        </button>
                      )}
                      {selectedProducts.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearSelected}
                          className="px-3 py-2 bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 rounded-xl text-xs font-medium shrink-0 transition-colors"
                        >
                          ລ້າງອອກ
                        </button>
                      )}
                    </div>

                    <div className="max-h-[300px] sm:max-h-[340px] overflow-y-auto custom-scrollbar space-y-1.5 bg-zinc-900/90 p-2.5 rounded-2xl border border-zinc-800">
                      {products.length === 0 ? (
                        <p className="text-zinc-500 text-xs p-4 text-center">ຍັງບໍ່ມີສິນຄ້າໃນລະບົບ</p>
                      ) : filteredProducts.length === 0 ? (
                        <p className="text-zinc-500 text-xs p-4 text-center">ບໍ່ພົບສິນຄ້າທີ່ກົງກັບຄຳຄົ້ນຫາ</p>
                      ) : (
                        filteredProducts.map((p) => {
                          const isChecked = selectedProducts.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-center justify-between gap-3 p-2.5 rounded-xl cursor-pointer text-xs border transition-colors ${
                                isChecked
                                  ? "bg-blue-500/15 border-blue-500/40 text-blue-100"
                                  : "bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/60"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  className="accent-blue-500 w-4 h-4 rounded cursor-pointer shrink-0"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProducts((prev) => [...prev, p.id]);
                                    } else {
                                      setSelectedProducts((prev) => prev.filter((id) => id !== p.id));
                                    }
                                  }}
                                />
                                <span className="truncate select-none font-medium text-xs">
                                  {p.name}
                                </span>
                              </div>
                              {p.price !== undefined && (
                                <span className="text-xs font-mono text-emerald-400 font-bold shrink-0">
                                  ₭{Number(p.price).toLocaleString()}
                                </span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Footer */}
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between mt-3">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  <span>ເງື່ອນໄຂການນຳໃຊ້:</span>
                </span>
                <span className="font-bold text-blue-400">
                  {applyToAllProducts
                    ? "ໃຊ້ໄດ້ກັບທຸກສິນຄ້າໃນຮ້ານ (Store-wide)"
                    : `ໃຊ້ໄດ້ສະເພາະ ${selectedProducts.length} ສິນຄ້າທີ່ເລືອກ`}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs sm:text-sm font-semibold transition-colors"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={handleSubmit as any}
            disabled={submitting}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {submitting ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກການແກ້ໄຂ"}
          </button>
        </div>
      </div>
    </div>
  );
}
