"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { askConfirm } from "@/components/ConfirmModal";
import {
  ChefHat,
  Plus,
  Search,
  Trash2,
  Edit2,
  Printer,
  Package,
  Percent,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  X,
  Save,
  RefreshCw,
  FileText,
  Layers,
  Scale,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  Loader2,
  Receipt,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";

interface Ingredient {
  id: string;
  name: string;
  sku?: string | null;
  unit: string;
  costPerUnit: number;
  stock?: number;
  minStock?: number;
  _count?: {
    recipeItems: number;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  images?: string[];
}

interface RecipeItem {
  id: string;
  productId: string;
  ingredientId: string;
  quantity: number;
  ingredient: Ingredient;
  product?: Product;
}

export default function RecipeCostingPage() {
  const [activeTab, setActiveTab] = useState<"ingredients" | "recipes" | "analytics">("recipes");

  // Data State
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allRecipeItems, setAllRecipeItems] = useState<RecipeItem[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Active Selected Product for Recipes
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);

  // Search & Filter States
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [analyticsFilter, setAnalyticsFilter] = useState<"ALL" | "HIGH_MARGIN" | "MODERATE" | "HIGH_COST">("ALL");

  // Add Ingredient Form
  const [ingName, setIngName] = useState("");
  const [ingSku, setIngSku] = useState("");
  const [ingUnit, setIngUnit] = useState("g");
  const [ingCost, setIngCost] = useState("");
  const [ingStock, setIngStock] = useState("");
  const [ingMinStock, setIngMinStock] = useState("");
  const [isSubmittingIng, setIsSubmittingIng] = useState(false);
  const [isSeedingPresets, setIsSeedingPresets] = useState(false);

  // Edit Ingredient Modal
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [editIngName, setEditIngName] = useState("");
  const [editIngSku, setEditIngSku] = useState("");
  const [editIngUnit, setEditIngUnit] = useState("g");
  const [editIngCost, setEditIngCost] = useState("");
  const [editIngStock, setEditIngStock] = useState("");
  const [editIngMinStock, setEditIngMinStock] = useState("");
  const [isUpdatingIng, setIsUpdatingIng] = useState(false);

  // Add Recipe Item Form
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [recipeQuantity, setRecipeQuantity] = useState("");
  const [isSubmittingRecipe, setIsSubmittingRecipe] = useState(false);

  // Edit Recipe Item Quantity Modal
  const [editingRecipeItem, setEditingRecipeItem] = useState<RecipeItem | null>(null);
  const [editItemQty, setEditItemQty] = useState("");
  const [isUpdatingRecipeItem, setIsUpdatingRecipeItem] = useState(false);

  // Dual-Format Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printFormat, setPrintFormat] = useState<"80MM" | "A4">("80MM");

  // Load Initial Data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoadingInitial(true);
    try {
      await Promise.all([fetchIngredients(), fetchProducts(), fetchAllRecipes()]);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const res = await fetch("/api/dashboard/ingredients");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setIngredients(data);
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດຂໍ້ມູນວັດຖຸດິບໄດ້");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setProducts(data);
        if (!selectedProductId && data.length > 0) {
          setSelectedProductId(data[0].id);
        }
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດລາຍການເມນູໄດ້");
    }
  };

  const fetchAllRecipes = async () => {
    try {
      const res = await fetch("/api/dashboard/recipes");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAllRecipeItems(data);
      }
    } catch (err) {
      console.error("Failed to load all recipes", err);
    }
  };

  // When Selected Product Changes, Fetch Its Recipe
  useEffect(() => {
    if (selectedProductId) {
      fetchRecipe(selectedProductId);
    } else {
      setRecipeItems([]);
    }
  }, [selectedProductId]);

  const fetchRecipe = async (productId: string) => {
    setIsLoadingRecipe(true);
    try {
      const res = await fetch(`/api/dashboard/recipes?productId=${productId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setRecipeItems(data);
      }
    } catch (err) {
      toast.error("ບໍ່ສາມາດໂຫຼດສູດອາຫານໄດ້");
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  // 1-Click Seed Presets
  const handleSeedPresets = async () => {
    setIsSeedingPresets(true);
    try {
      const res = await fetch("/api/dashboard/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEED_PRESETS" })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`ເພີ່ມວັດຖຸດິບຍອດນິຍົມສຳເລັດ +${data.count} ລາຍການ`);
        fetchIngredients();
      } else {
        toast.error(data.error || "ເກີດຂໍ້ຜິດພາດໃນການສ້າງຊຸດວັດຖຸດິບ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsSeedingPresets(false);
    }
  };

  // Create Ingredient
  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName.trim() || !ingCost) {
      return toast.error("ກະລຸນາປ້ອນຊື່ວັດຖຸດິບ ແລະ ຕົ້ນທຶນຕໍ່ໜ່ວຍ");
    }

    setIsSubmittingIng(true);
    try {
      const res = await fetch("/api/dashboard/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ingName.trim(),
          sku: ingSku.trim() || undefined,
          unit: ingUnit,
          costPerUnit: parseFloat(ingCost),
          stock: ingStock ? parseFloat(ingStock) : 0,
          minStock: ingMinStock ? parseFloat(ingMinStock) : 0
        })
      });
      if (res.ok) {
        toast.success("ເພີ່ມວັດຖຸດິບໃໝ່ສຳເລັດແລ້ວ");
        setIngName("");
        setIngSku("");
        setIngCost("");
        setIngStock("");
        setIngMinStock("");
        fetchIngredients();
      } else {
        const err = await res.json();
        toast.error(err.error || "ບໍ່ສາມາດເພີ່ມວັດຖຸດິບໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການສ້າງວັດຖຸດິບ");
    } finally {
      setIsSubmittingIng(false);
    }
  };

  // Open Edit Ingredient Modal
  const openEditIngredient = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setEditIngName(ing.name);
    setEditIngSku(ing.sku || "");
    setEditIngUnit(ing.unit);
    setEditIngCost(ing.costPerUnit.toString());
    setEditIngStock(ing.stock !== undefined ? ing.stock.toString() : "0");
    setEditIngMinStock(ing.minStock !== undefined ? ing.minStock.toString() : "0");
  };

  // Update Ingredient
  const handleUpdateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngredient) return;
    if (!editIngName.trim() || !editIngCost) {
      return toast.error("ກະລຸນາປ້ອນຊື່ ແລະ ຕົ້ນທຶນ");
    }

    setIsUpdatingIng(true);
    try {
      const res = await fetch(`/api/dashboard/ingredients/${editingIngredient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editIngName.trim(),
          sku: editIngSku.trim() || undefined,
          unit: editIngUnit,
          costPerUnit: parseFloat(editIngCost),
          stock: editIngStock ? parseFloat(editIngStock) : 0,
          minStock: editIngMinStock ? parseFloat(editIngMinStock) : 0
        })
      });
      if (res.ok) {
        toast.success("ອັບເດດຂໍ້ມູນວັດຖຸດິບສຳເລັດແລ້ວ");
        setEditingIngredient(null);
        fetchIngredients();
        if (selectedProductId) fetchRecipe(selectedProductId);
        fetchAllRecipes();
      } else {
        toast.error("ບໍ່ສາມາດອັບເດດວັດຖຸດິບໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setIsUpdatingIng(false);
    }
  };

  // Delete Ingredient
  const handleDeleteIngredient = async (id: string, name: string) => {
    const ok = await askConfirm(
      `ທ່ານຕ້ອງການລຶບວັດຖຸດິບ "${name}" ແທ້ບໍ່?`,
      {
        title: "ຢືນຢັນການລຶບວັດຖຸດິບ (Delete Ingredient)",
        variant: "danger",
        confirmText: "ລຶບວັດຖຸດິບ",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/dashboard/ingredients/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບວັດຖຸດິບສຳເລັດແລ້ວ");
        fetchIngredients();
        if (selectedProductId) fetchRecipe(selectedProductId);
        fetchAllRecipes();
      } else {
        toast.error("ບໍ່ສາມາດລຶບວັດຖຸດິບໄດ້ ເນື່ອງຈາກອາດມີການຜູກໃນສູດອາຫານແລ້ວ");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  // Add Item to Recipe
  const handleAddRecipeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedIngredientId || !recipeQuantity) {
      return toast.error("ກະລຸນາເລືອກວັດຖຸດິບ ແລະ ລະບຸປະລິມານທີ່ໃຊ້");
    }

    setIsSubmittingRecipe(true);
    try {
      const res = await fetch("/api/dashboard/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          ingredientId: selectedIngredientId,
          quantity: parseFloat(recipeQuantity)
        })
      });
      if (res.ok) {
        toast.success("ເພີ່ມສ່ວນປະສົມລົງໃນສູດສຳເລັດ");
        setRecipeQuantity("");
        setSelectedIngredientId("");
        fetchRecipe(selectedProductId);
        fetchAllRecipes();
      } else {
        toast.error("ບໍ່ສາມາດເພີ່ມສ່ວນປະສົມໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setIsSubmittingRecipe(false);
    }
  };

  // Update Recipe Item Quantity
  const handleUpdateRecipeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipeItem || !editItemQty) return;

    setIsUpdatingRecipeItem(true);
    try {
      const res = await fetch(`/api/dashboard/recipes/${editingRecipeItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: parseFloat(editItemQty)
        })
      });
      if (res.ok) {
        toast.success("ອັບເດດປະລິມານສ່ວນປະສົມສຳເລັດ");
        setEditingRecipeItem(null);
        if (selectedProductId) fetchRecipe(selectedProductId);
        fetchAllRecipes();
      } else {
        toast.error("ບໍ່ສາມາດອັບເດດໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setIsUpdatingRecipeItem(false);
    }
  };

  // Delete Recipe Item
  const handleDeleteRecipeItem = async (id: string, ingredientName: string) => {
    const ok = await askConfirm(
      `ທ່ານຕ້ອງການລຶບສ່ວນປະສົມ "${ingredientName}" ອອກຈາກສູດນີ້ແທ້ບໍ່?`,
      {
        title: "ຢືນຢັນການລຶບສ່ວນປະສົມ",
        variant: "warning",
        confirmText: "ລຶບອອກ",
        cancelText: "ຍົກເລີກ"
      }
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/dashboard/recipes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ລຶບສ່ວນປະສົມອອກຈາກສູດສຳເລັດ");
        if (selectedProductId) fetchRecipe(selectedProductId);
        fetchAllRecipes();
      } else {
        toast.error("ບໍ່ສາມາດລຶບໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດ");
    }
  };

  // Calculations for Selected Product
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const selectedRecipeTotalCost = useMemo(() => {
    return recipeItems.reduce((total, item) => {
      return total + (item.quantity * (item.ingredient?.costPerUnit || 0));
    }, 0);
  }, [recipeItems]);

  const selectedSellingPrice = selectedProduct?.price || 0;
  const selectedGrossProfit = Math.max(0, selectedSellingPrice - selectedRecipeTotalCost);
  const selectedCostPercent = selectedSellingPrice > 0 ? (selectedRecipeTotalCost / selectedSellingPrice) * 100 : 0;
  const selectedMarginPercent = selectedSellingPrice > 0 ? (selectedGrossProfit / selectedSellingPrice) * 100 : 0;
  // Suggested price based on target 30% food cost
  const suggestedPriceAt30 = selectedRecipeTotalCost > 0 ? Math.ceil((selectedRecipeTotalCost / 0.3) / 1000) * 1000 : 0;

  // Selected Ingredient for quick helper preview
  const currentSelectedIng = useMemo(() => {
    return ingredients.find(i => i.id === selectedIngredientId) || null;
  }, [ingredients, selectedIngredientId]);

  // Global KPI Calculations
  const productsWithRecipesMap = useMemo(() => {
    const map = new Map<string, { totalCost: number; itemsCount: number }>();
    allRecipeItems.forEach(item => {
      const existing = map.get(item.productId) || { totalCost: 0, itemsCount: 0 };
      existing.totalCost += item.quantity * (item.ingredient?.costPerUnit || 0);
      existing.itemsCount += 1;
      map.set(item.productId, existing);
    });
    return map;
  }, [allRecipeItems]);

  const productsWithRecipesCount = productsWithRecipesMap.size;

  const { avgFoodCost, avgMarginPercent } = useMemo(() => {
    if (productsWithRecipesCount === 0) {
      return { avgFoodCost: 0, avgMarginPercent: 0 };
    }
    let sumCost = 0;
    let sumMarginPct = 0;
    let count = 0;

    products.forEach(p => {
      const rec = productsWithRecipesMap.get(p.id);
      if (rec && rec.itemsCount > 0) {
        sumCost += rec.totalCost;
        if (p.price > 0) {
          const margin = ((p.price - rec.totalCost) / p.price) * 100;
          sumMarginPct += margin;
        }
        count++;
      }
    });

    return {
      avgFoodCost: count > 0 ? sumCost / count : 0,
      avgMarginPercent: count > 0 ? sumMarginPct / count : 0
    };
  }, [products, productsWithRecipesMap, productsWithRecipesCount]);

  // Filtered Ingredients
  const filteredIngredients = useMemo(() => {
    if (!ingredientSearch.trim()) return ingredients;
    const q = ingredientSearch.toLowerCase();
    return ingredients.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.sku && i.sku.toLowerCase().includes(q))
    );
  }, [ingredients, ingredientSearch]);

  // Filtered Products for Recipe Sidebar
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  // Analytics Table Rows
  const analyticsRows = useMemo(() => {
    return products.map(p => {
      const rec = productsWithRecipesMap.get(p.id);
      const cost = rec ? rec.totalCost : 0;
      const profit = Math.max(0, p.price - cost);
      const costPct = p.price > 0 && cost > 0 ? (cost / p.price) * 100 : 0;
      const marginPct = p.price > 0 && cost > 0 ? (profit / p.price) * 100 : 0;
      const hasRecipe = !!(rec && rec.itemsCount > 0);
      const suggested = cost > 0 ? Math.ceil((cost / 0.3) / 1000) * 1000 : 0;

      let statusTier: "HIGH_MARGIN" | "MODERATE" | "HIGH_COST" = "HIGH_MARGIN";
      if (costPct > 45) {
        statusTier = "HIGH_COST";
      } else if (costPct > 32) {
        statusTier = "MODERATE";
      }

      return {
        product: p,
        hasRecipe,
        itemsCount: rec ? rec.itemsCount : 0,
        cost,
        profit,
        costPct,
        marginPct,
        suggested,
        statusTier
      };
    }).filter(row => {
      if (analyticsFilter === "ALL") return true;
      if (!row.hasRecipe) return false;
      return row.statusTier === analyticsFilter;
    });
  }, [products, productsWithRecipesMap, analyticsFilter]);

  // Helper for Product Image with fallback
  const getProductImage = (p: Product | null) => {
    if (p?.images && p.images.length > 0 && p.images[0]) {
      return p.images[0];
    }
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-950/70 p-6 rounded-3xl border border-zinc-800/80 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/10 border border-indigo-500/30 flex items-center justify-center shadow-inner shrink-0">
            <ChefHat className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ຄັງວັດຖຸດິບ & ສູດອາຫານ (Recipe Costing)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                BOM & Food Cost
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              ຄຳນວນຕົ້ນທຶນອາຫານຕໍ່ຈານ (Food Cost), ກຳໄລເບື້ອງຕົ້ນ (Gross Margin), ແລະ ພິມໃບສູດຄົວ 80mm / A4
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            type="button"
            onClick={handleSeedPresets}
            disabled={isSeedingPresets}
            className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 text-indigo-200 border border-indigo-500/30 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSeedingPresets ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400" />
            )}
            <span>+ ໃສ່ວັດຖຸດິບຍອດນິຍົມ 1-Click</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>ພິມບິນສູດຄົວ / ໃບຕົ້ນທຶນ</span>
          </button>

          <Link
            href="/dashboard/restaurant/cashier"
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Receipt className="w-4 h-4" />
            <span>ແຄຊເຊຍ</span>
          </Link>
        </div>
      </div>

      {/* TOP KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ວັດຖຸດິບທັງໝົດ</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{ingredients.length}</span>
            <span className="text-xs text-zinc-500 font-medium">ລາຍການ</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">ພ້ອມໃຊ້ງານໃນຄັງສູດອາຫານ</p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ເມນູທີ່ຜູກສູດແລ້ວ</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{productsWithRecipesCount}</span>
            <span className="text-xs text-zinc-500 font-medium">/ {products.length} ເມນູ</span>
          </div>
          <p className="text-[11px] text-purple-400 mt-1 font-medium">
            {products.length > 0
              ? `${Math.round((productsWithRecipesCount / products.length) * 100)}% ຂອງສິນຄ້າທັງໝົດ`
              : "0%"}
          </p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ຕົ້ນທຶນສະເລ່ຍ (Avg Cost)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs text-rose-400 font-bold">₭</span>
            <span className="text-2xl font-black text-white">{Math.round(avgFoodCost).toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">ຕົ້ນທຶນວັດຖຸດິບສະເລ່ຍຕໍ່ຈານ</p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">ອັດຕາກຳໄລສະເລ່ຍ</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              {avgMarginPercent > 0 ? `${avgMarginPercent.toFixed(1)}%` : "0%"}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
              {avgMarginPercent >= 65 ? "ກຳໄລດີຫຼາຍ" : avgMarginPercent >= 50 ? "ປານກາງ" : "ຄວນປັບປຸງ"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Gross Margin ສະເລ່ຍທຸກເມນູ</p>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800/80 w-fit backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab("recipes")}
          className={`px-5 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "recipes"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>1. ຜູກສູດອາຫານ & ຄິດໄລ່ຕົ້ນທຶນ (BOM)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ingredients")}
          className={`px-5 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "ingredients"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>2. ຈັດການວັດຖຸດິບ (Ingredients)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`px-5 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "analytics"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>3. ຕາຕະລາງວິເຄາະຕົ້ນທຶນທຸກເມນູ (Master Sheet)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RECIPES & BOM COSTING */}
      {/* ========================================================================= */}
      {activeTab === "recipes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR: MENU PRODUCT SELECTOR */}
          <div className="lg:col-span-4 bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 shadow-xl flex flex-col h-[750px] backdrop-blur-xl">
            <div className="pb-3 border-b border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                  <span>ເລືອກເມນູ/ສິນຄ້າ</span>
                </span>
                <span className="text-xs text-zinc-400 font-bold">{filteredProducts.length} ລາຍການ</span>
              </div>

              {/* Product Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="ຄົ້ນຫາຊື່ເມນູ ຫຼື ໝວດໝູ່..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto pt-3 space-y-2 pr-1 custom-scrollbar">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">ບໍ່ພົບເມນູທີ່ຄົ້ນຫາ</div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  const rec = productsWithRecipesMap.get(p.id);
                  const hasRecipe = rec && rec.itemsCount > 0;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProductId(p.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                        isSelected
                          ? "bg-gradient-to-r from-indigo-900/40 to-purple-900/30 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30"
                          : "bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-800/40 hover:border-zinc-700"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 shadow-sm">
                        <img
                          src={getProductImage(p)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`font-bold text-sm truncate ${isSelected ? "text-white" : "text-zinc-200"}`}>
                          {p.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold text-emerald-400">
                            ₭{p.price.toLocaleString()}
                          </span>
                          {p.category && (
                            <span className="text-[10px] text-zinc-500 truncate bg-zinc-800/80 px-1.5 py-0.5 rounded">
                              {p.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {hasRecipe ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            {rec.itemsCount} ສ່ວນປະສົມ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 text-[10px] font-bold">
                            ຍັງບໍ່ມີສູດ
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT WORKSPACE: SELECTED PRODUCT RECIPE & COST CALCULATOR */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedProduct ? (
              <div className="bg-zinc-950/70 border border-dashed border-zinc-800 rounded-3xl p-12 text-center text-zinc-500 flex flex-col items-center justify-center">
                <ChefHat className="w-12 h-12 mb-3 text-zinc-700" />
                <p className="font-bold text-zinc-400">ກະລຸນາເລືອກເມນູດ້ານຊ້າຍມືເພື່ອກຳນົດສູດອາຫານ</p>
                <p className="text-xs text-zinc-600 mt-1">ທ່ານສາມາດຜູກວັດຖຸດິບ, ຄຳນວນຕົ້ນທຶນຕໍ່ຈານ ແລະ ອັດຕາກຳໄລໄດ້ທັນທີ</p>
              </div>
            ) : (
              <>
                {/* HERO PRODUCT HEADER CARD */}
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-700/80 shrink-0 shadow-lg">
                        <img
                          src={getProductImage(selectedProduct)}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl sm:text-2xl font-black text-white">{selectedProduct.name}</h2>
                          {selectedProduct.category && (
                            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-bold border border-zinc-700">
                              {selectedProduct.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                          ລາຄາຂາຍໜ້າຮ້ານ:{" "}
                          <span className="text-emerald-400 font-extrabold text-sm">
                            ₭{selectedSellingPrice.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setPrintFormat("80MM");
                          setIsPrintModalOpen(true);
                        }}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-4 h-4 text-zinc-400" />
                        <span>ພິມບິນສູດ 80mm</span>
                      </button>
                    </div>
                  </div>

                  {/* FINANCIAL METRICS BREAKDOWN */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
                    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3.5">
                      <span className="text-[11px] font-bold text-zinc-400">ຕົ້ນທຶນວັດຖຸດິບ (Food Cost)</span>
                      <div className="mt-1 text-lg font-black text-rose-400">
                        ₭{selectedRecipeTotalCost.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">ຕໍ່ 1 ເສີບ / ຈານ</div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3.5">
                      <span className="text-[11px] font-bold text-zinc-400">ກຳໄລເບື້ອງຕົ້ນ (Gross Margin)</span>
                      <div className="mt-1 text-lg font-black text-emerald-400">
                        ₭{selectedGrossProfit.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">ລາຄາຂາຍ - ຕົ້ນທຶນ</div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3.5">
                      <span className="text-[11px] font-bold text-zinc-400">ອັດຕາຕົ້ນທຶນ (Cost %)</span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className={`text-lg font-black ${
                          selectedCostPercent > 45 ? "text-rose-400" : selectedCostPercent > 32 ? "text-amber-400" : "text-emerald-400"
                        }`}>
                          {selectedCostPercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            selectedCostPercent > 45 ? "bg-rose-500" : selectedCostPercent > 32 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, selectedCostPercent)}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3.5">
                      <span className="text-[11px] font-bold text-zinc-400">ລາຄາຂາຍແນະນຳ (Target 30%)</span>
                      <div className="mt-1 text-lg font-black text-indigo-400">
                        ₭{suggestedPriceAt30.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">ຕາມຫຼັກ Food Cost 30%</div>
                    </div>
                  </div>
                </div>

                {/* ADD INGREDIENT TO RECIPE FORM */}
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
                  <h3 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>ເພີ່ມສ່ວນປະສົມລົງໃນສູດນີ້ (Add Ingredient to Recipe)</span>
                  </h3>

                  <form onSubmit={handleAddRecipeItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5">ເລືອກວັດຖຸດິບ *</label>
                      <select
                        value={selectedIngredientId}
                        onChange={(e) => setSelectedIngredientId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- ເລືອກວັດຖຸດິບຈາກຄັງ --</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} (₭{ing.costPerUnit.toLocaleString()} / {ing.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                        ປະລິມານທີ່ໃຊ້ {currentSelectedIng ? `(${currentSelectedIng.unit})` : ""} *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.001"
                          value={recipeQuantity}
                          onChange={(e) => setRecipeQuantity(e.target.value)}
                          placeholder="ຈຳນວນ..."
                          className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <div className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs rounded-xl flex items-center justify-center shrink-0 min-w-[50px]">
                          {currentSelectedIng?.unit || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <button
                        type="submit"
                        disabled={isSubmittingRecipe}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isSubmittingRecipe ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span>ເພີ່ມລົງໃນສູດ</span>
                      </button>
                    </div>
                  </form>

                  {/* Quick Preview calculation */}
                  {currentSelectedIng && recipeQuantity && parseFloat(recipeQuantity) > 0 && (
                    <div className="mt-3 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/60 text-xs text-zinc-400 flex items-center justify-between">
                      <span>
                        ຕົ້ນທຶນສ່ວນປະສົມນີ້:{" "}
                        <strong className="text-white">
                          {recipeQuantity} {currentSelectedIng.unit} x ₭{currentSelectedIng.costPerUnit.toLocaleString()}
                        </strong>
                      </span>
                      <span className="text-emerald-400 font-bold">
                        = ₭{(parseFloat(recipeQuantity) * currentSelectedIng.costPerUnit).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* RECIPE ITEMS TABLE */}
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
                  <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/30">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-extrabold text-white">
                        ສ່ວນປະສົມທັງໝົດໃນສູດ ({recipeItems.length} ລາຍການ)
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-400">
                      ຕົ້ນທຶນລວມ: <strong className="text-rose-400">₭{selectedRecipeTotalCost.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-300">
                      <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase">
                        <tr>
                          <th className="px-5 py-3">ຊື່ສ່ວນປະສົມ (Ingredient)</th>
                          <th className="px-5 py-3">ຕົ້ນທຶນຕໍ່ໜ່ວຍ</th>
                          <th className="px-5 py-3">ປະລິມານທີ່ໃຊ້</th>
                          <th className="px-5 py-3 text-right">ຕົ້ນທຶນລວມ (₭)</th>
                          <th className="px-5 py-3 text-right">ສັດສ່ວນ (%)</th>
                          <th className="px-5 py-3 text-center">ຈັດການ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {isLoadingRecipe ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                            </td>
                          </tr>
                        ) : recipeItems.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-zinc-500">
                              ຍັງບໍ່ໄດ້ກຳນົດສ່ວນປະສົມໃນສູດນີ້. ກະລຸນາເລືອກວັດຖຸດິບດ້ານເທິງເພື່ອເພີ່ມລົງໃນສູດ.
                            </td>
                          </tr>
                        ) : (
                          recipeItems.map((item) => {
                            const subtotal = item.quantity * (item.ingredient?.costPerUnit || 0);
                            const percentOfCost = selectedRecipeTotalCost > 0 ? (subtotal / selectedRecipeTotalCost) * 100 : 0;

                            return (
                              <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                                <td className="px-5 py-3 font-bold text-white">
                                  {item.ingredient?.name || "N/A"}
                                </td>
                                <td className="px-5 py-3 text-zinc-400">
                                  ₭{item.ingredient?.costPerUnit.toLocaleString()} / {item.ingredient?.unit}
                                </td>
                                <td className="px-5 py-3 font-semibold text-zinc-200">
                                  {item.quantity} {item.ingredient?.unit}
                                </td>
                                <td className="px-5 py-3 text-right font-extrabold text-rose-400">
                                  ₭{subtotal.toLocaleString()}
                                </td>
                                <td className="px-5 py-3 text-right font-semibold text-zinc-400">
                                  {percentOfCost.toFixed(1)}%
                                </td>
                                <td className="px-5 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingRecipeItem(item);
                                        setEditItemQty(item.quantity.toString());
                                      }}
                                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                                      title="ແກ້ໄຂປະລິມານ"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRecipeItem(item.id, item.ingredient?.name || "")}
                                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                                      title="ລຶບອອກ"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INGREDIENTS INVENTORY MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "ingredients" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: ADD NEW INGREDIENT FORM */}
          <div className="lg:col-span-4 bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>ເພີ່ມວັດຖຸດິບໃໝ່ (New Ingredient)</span>
            </h2>

            <form onSubmit={handleCreateIngredient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">ຊື່ວັດຖຸດິບ (Ingredient Name) *</label>
                <input
                  type="text"
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  placeholder="ເຊັ່ນ: ເມັດກາເຟອາຣາບິກ້າ, ນົມສົດ, ຊີ້ນໝູ..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">ລະຫັດ SKU (ຖ້າມີ)</label>
                  <input
                    type="text"
                    value={ingSku}
                    onChange={(e) => setIngSku(e.target.value)}
                    placeholder="ING-001"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">ຫົວໜ່ວຍ (Unit) *</label>
                  <select
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="g">ກຣາມ (g)</option>
                    <option value="kg">ກິໂລກຣາມ (kg)</option>
                    <option value="ml">ມິນລີລິດ (ml)</option>
                    <option value="L">ລິດ (L)</option>
                    <option value="piece">ອັນ / ໜ່ວຍ (Piece)</option>
                    <option value="can">ກະປ໋ອງ (Can)</option>
                    <option value="box">ກ່ອງ (Box)</option>
                    <option value="tsp">ບ່ວງກາເຟ (tsp)</option>
                    <option value="tbsp">ບ່ວງແກງ (tbsp)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">ຕົ້ນທຶນຕໍ່ 1 ຫົວໜ່ວຍ (Cost / Unit ₭) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ingCost}
                  onChange={(e) => setIngCost(e.target.value)}
                  placeholder="ເຊັ່ນ: 250 (ກີບ/ກຣາມ)"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">ສະຕັອກປັດຈຸບັນ</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ingStock}
                    onChange={(e) => setIngStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">ສະຕັອກຂັ້ນຕ່ຳເຕືອນ</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ingMinStock}
                    onChange={(e) => setIngMinStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingIng}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingIng ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>ບັນທຶກວັດຖຸດິບໃໝ່</span>
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: INGREDIENTS LIST TABLE */}
          <div className="lg:col-span-8 bg-zinc-950/70 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
            <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/30">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-extrabold text-white">
                  ລາຍການວັດຖຸດິບທັງໝົດ ({filteredIngredients.length})
                </h3>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  placeholder="ຄົ້ນຫາວັດຖຸດິບ..."
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase">
                  <tr>
                    <th className="px-5 py-3">ຊື່ວັດຖຸດິບ / SKU</th>
                    <th className="px-5 py-3">ຕົ້ນທຶນຕໍ່ໜ່ວຍ</th>
                    <th className="px-5 py-3">ສະຕັອກ / ຂັ້ນຕ່ຳ</th>
                    <th className="px-5 py-3 text-center">ໃຊ້ໃນສູດ</th>
                    <th className="px-5 py-3 text-center">ຈັດການ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500">
                        ບໍ່ພົບລາຍການວັດຖຸດິບ. ທ່ານສາມາດກົດປຸ່ມ "+ ໃສ່ວັດຖຸດິບຍອດນິຍົມ 1-Click" ດ້ານເທິງເພື່ອເລີ່ມຕົ້ນໄດ້ທັນທີ.
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ing) => {
                      const isLowStock =
                        ing.minStock && ing.minStock > 0 && (ing.stock || 0) <= ing.minStock;

                      return (
                        <tr key={ing.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="px-5 py-3 font-bold text-white">
                            <div>{ing.name}</div>
                            {ing.sku && <div className="text-[10px] text-zinc-500 font-mono">{ing.sku}</div>}
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-emerald-400 font-bold">₭{ing.costPerUnit.toLocaleString()}</span>
                            <span className="text-zinc-500 ml-1">/ {ing.unit}</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-zinc-200">
                                {(ing.stock || 0).toLocaleString()} {ing.unit}
                              </span>
                              {isLowStock && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                                  ໃກ້ໝົດ
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              ຂັ້ນຕ່ຳ: {(ing.minStock || 0).toLocaleString()} {ing.unit}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-bold">
                              {ing._count?.recipeItems || 0} ສູດ
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditIngredient(ing)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                                title="ແກ້ໄຂ"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                                title="ລຶບ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MASTER COSTING & MARGIN ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === "analytics" && (
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl">
          <div className="p-6 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/30">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-400" />
                <span>ຕາຕະລາງວິເຄາະຕົ້ນທຶນ ແລະ ອັດຕາກຳໄລລວມ (Master Recipe Costing Sheet)</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                ສະຫຼຸບຕົ້ນທຶນອາຫານ, ກຳໄລເບື້ອງຕົ້ນ, ແລະ ປະເມີນສະຖານະກຳໄລທຸກເມນູ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrintFormat("A4");
                  setIsPrintModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700 transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>ພິມລາຍງານ A4</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-900/20 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400 font-bold mr-2">ກັ່ນຕອງຕາມກຳໄລ:</span>
            <button
              type="button"
              onClick={() => setAnalyticsFilter("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                analyticsFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              ທັງໝົດ ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsFilter("HIGH_MARGIN")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                analyticsFilter === "HIGH_MARGIN"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              ກຳໄລດີເລີດ (Cost &lt; 32%)
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsFilter("MODERATE")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                analyticsFilter === "MODERATE"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              ປານກາງ (Cost 32% - 45%)
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsFilter("HIGH_COST")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                analyticsFilter === "HIGH_COST"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              ຕົ້ນທຶນສູງ (Cost &gt; 45%)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase">
                <tr>
                  <th className="px-6 py-4">ເມນູ / ສິນຄ້າ</th>
                  <th className="px-6 py-4">ລາຄາຂາຍ (Price)</th>
                  <th className="px-6 py-4">ຕົ້ນທຶນວັດຖຸດິບ (Cost)</th>
                  <th className="px-6 py-4">ກຳໄລ (Gross Profit)</th>
                  <th className="px-6 py-4">Food Cost %</th>
                  <th className="px-6 py-4">Margin %</th>
                  <th className="px-6 py-4">ລາຄາແນະນຳ (30%)</th>
                  <th className="px-6 py-4 text-center">ຈັດການ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {analyticsRows.map((row) => (
                  <tr key={row.product.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                          <img
                            src={getProductImage(row.product)}
                            alt={row.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{row.product.name}</p>
                          <span className="text-[10px] text-zinc-500">
                            {row.hasRecipe ? `${row.itemsCount} ສ່ວນປະສົມ` : "ຍັງບໍ່ໄດ້ຜູກສູດ"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      ₭{row.product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-400">
                      {row.hasRecipe ? `₭${row.cost.toLocaleString()}` : "-"}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {row.hasRecipe ? `₭${row.profit.toLocaleString()}` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {row.hasRecipe ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          row.costPct > 45
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : row.costPct > 32
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}>
                          {row.costPct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-200">
                      {row.hasRecipe ? `${row.marginPct.toFixed(1)}%` : "-"}
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-400">
                      {row.hasRecipe && row.suggested > 0 ? `₭${row.suggested.toLocaleString()}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductId(row.product.id);
                          setActiveTab("recipes");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-indigo-600 text-zinc-300 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-1 mx-auto"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>ແກ້ໄຂສູດ</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT INGREDIENT MODAL */}
      {/* ========================================================================= */}
      {editingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              type="button"
              onClick={() => setEditingIngredient(null)}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-indigo-400" />
              <span>ແກ້ໄຂຂໍ້ມູນວັດຖຸດິບ</span>
            </h3>

            <form onSubmit={handleUpdateIngredient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">ຊື່ວັດຖຸດິບ *</label>
                <input
                  type="text"
                  value={editIngName}
                  onChange={(e) => setEditIngName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">SKU</label>
                  <input
                    type="text"
                    value={editIngSku}
                    onChange={(e) => setEditIngSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">ຫົວໜ່ວຍ</label>
                  <select
                    value={editIngUnit}
                    onChange={(e) => setEditIngUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="g">ກຣາມ (g)</option>
                    <option value="kg">ກິໂລກຣາມ (kg)</option>
                    <option value="ml">ມິນລີລິດ (ml)</option>
                    <option value="L">ລິດ (L)</option>
                    <option value="piece">ອັນ / ໜ່ວຍ (Piece)</option>
                    <option value="can">ກະປ໋ອງ (Can)</option>
                    <option value="box">ກ່ອງ (Box)</option>
                    <option value="tsp">ບ່ວງກາເຟ (tsp)</option>
                    <option value="tbsp">ບ່ວງແກງ (tbsp)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">ຕົ້ນທຶນຕໍ່ໜ່ວຍ (₭) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editIngCost}
                  onChange={(e) => setEditIngCost(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">ສະຕັອກປັດຈຸບັນ</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editIngStock}
                    onChange={(e) => setEditIngStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">ສະຕັອກຂັ້ນຕ່ຳເຕືອນ</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editIngMinStock}
                    onChange={(e) => setEditIngMinStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingIngredient(null)}
                  className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingIng}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdatingIng ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>ບັນທຶກການແກ້ໄຂ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT RECIPE ITEM QUANTITY MODAL */}
      {/* ========================================================================= */}
      {editingRecipeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <button
              type="button"
              onClick={() => setEditingRecipeItem(null)}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-white mb-2 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-indigo-400" />
              <span>ປັບປ່ຽນປະລິມານສ່ວນປະສົມ</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">{editingRecipeItem.ingredient?.name}</p>

            <form onSubmit={handleUpdateRecipeItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                  ປະລິມານທີ່ໃຊ້ ({editingRecipeItem.ingredient?.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={editItemQty}
                  onChange={(e) => setEditItemQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecipeItem(null)}
                  className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingRecipeItem}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                >
                  {isUpdatingRecipeItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>ອັບເດດ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DUAL-FORMAT PRINT SLIP MODAL */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 pr-10">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-black text-white">ພິມບິນສູດຄົວ & ໃບວິເຄາະຕົ້ນທຶນ</h3>
              </div>

              {/* Format Switcher */}
              <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPrintFormat("80MM")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    printFormat === "80MM"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  ບິນນ້ອຍ 80mm
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat("A4")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    printFormat === "A4"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  ບິນໃຫຍ່ A4
                </button>
              </div>
            </div>

            {/* PRINT PREVIEW BODY */}
            <div className="py-6 flex justify-center">
              {printFormat === "80MM" ? (
                /* 80MM Thermal Slip Preview */
                <div
                  id="print-recipe-slip-80mm"
                  className="w-[300px] bg-white text-zinc-900 p-4 rounded-xl shadow-2xl font-mono text-xs border border-zinc-300"
                >
                  <div className="text-center pb-3 border-b border-dashed border-zinc-400">
                    <p className="font-extrabold text-sm uppercase">KITCHEN RECIPE CARD</p>
                    <p className="text-[11px] text-zinc-600">ໃບກຳກັບສູດອາຫານໃນຄົວ</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{new Date().toLocaleString("lo-LA")}</p>
                  </div>

                  {selectedProduct ? (
                    <>
                      <div className="py-3 border-b border-dashed border-zinc-400">
                        <p className="text-sm font-black">{selectedProduct.name}</p>
                        <div className="flex justify-between text-[11px] text-zinc-600 mt-1">
                          <span>ລາຄາຂາຍ:</span>
                          <span className="font-bold">₭{selectedProduct.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-zinc-600">
                          <span>ຕົ້ນທຶນວັດຖຸດິບ:</span>
                          <span className="font-bold text-red-600">₭{selectedRecipeTotalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-zinc-600">
                          <span>Food Cost %:</span>
                          <span className="font-bold">{selectedCostPercent.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="py-3 border-b border-dashed border-zinc-400">
                        <p className="font-bold text-[11px] mb-2">ສ່ວນປະສົມຕໍ່ 1 ເສີບ:</p>
                        <div className="space-y-1.5">
                          {recipeItems.map((item, idx) => (
                            <div key={item.id || idx} className="flex justify-between text-[11px]">
                              <span>
                                {idx + 1}. {item.ingredient?.name}
                              </span>
                              <span className="font-bold">
                                {item.quantity} {item.ingredient?.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 text-center text-[10px] text-zinc-500">
                        <p>ມາດຕະຖານການປຸງລົດຊາດ & ຄຸມຕົ້ນທຶນ</p>
                        <p className="mt-1">*** ຫ້າມດັດແປງປະລິມານໂດຍບໍ່ໄດ້ຮັບອະນຸຍາດ ***</p>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-zinc-400 text-xs">
                      ກະລຸນາເລືອກເມນູກ່ອນພິມ
                    </div>
                  )}
                </div>
              ) : (
                /* A4 Master Costing Sheet Preview */
                <div
                  id="print-recipe-sheet-a4"
                  className="w-full max-w-xl bg-white text-zinc-900 p-6 rounded-xl shadow-2xl font-sans text-xs border border-zinc-300"
                >
                  <div className="border-b-2 border-zinc-900 pb-3 mb-4 flex justify-between items-end">
                    <div>
                      <h2 className="text-base font-black">MASTER RECIPE COSTING SHEET</h2>
                      <p className="text-xs text-zinc-600">ໃບວິເຄາະຕົ້ນທຶນ ແລະ ອັດຕາກຳໄລສູດອາຫານ</p>
                    </div>
                    <p className="text-[10px] text-zinc-500">{new Date().toLocaleDateString("lo-LA")}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-zinc-100 rounded-lg">
                    <div>
                      <span className="text-[10px] text-zinc-500">ເມນູທັງໝົດ:</span>
                      <p className="font-bold">{products.length} ລາຍການ</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">ຕົ້ນທຶນສະເລ່ຍ:</span>
                      <p className="font-bold">₭{Math.round(avgFoodCost).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500">Gross Margin ສະເລ່ຍ:</span>
                      <p className="font-bold text-emerald-700">{avgMarginPercent.toFixed(1)}%</p>
                    </div>
                  </div>

                  <table className="w-full text-left text-[11px] border-collapse mb-6">
                    <thead>
                      <tr className="border-b border-zinc-400 font-bold">
                        <th className="py-1.5">ເມນູ</th>
                        <th className="py-1.5 text-right">ລາຄາຂາຍ</th>
                        <th className="py-1.5 text-right">ຕົ້ນທຶນ</th>
                        <th className="py-1.5 text-right">ກຳໄລ</th>
                        <th className="py-1.5 text-right">Cost %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {analyticsRows.slice(0, 8).map((r) => (
                        <tr key={r.product.id}>
                          <td className="py-1.5 font-medium">{r.product.name}</td>
                          <td className="py-1.5 text-right">₭{r.product.price.toLocaleString()}</td>
                          <td className="py-1.5 text-right text-red-600">₭{r.cost.toLocaleString()}</td>
                          <td className="py-1.5 text-right text-emerald-600">₭{r.profit.toLocaleString()}</td>
                          <td className="py-1.5 text-right font-bold">{r.hasRecipe ? `${r.costPct.toFixed(1)}%` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-between pt-6 border-t border-zinc-300 text-[10px] text-zinc-600 text-center">
                    <div className="w-32 border-t border-zinc-400 pt-1">ຫົວໜ້າພໍ່ຄົວ (Chef)</div>
                    <div className="w-32 border-t border-zinc-400 pt-1">ຜູ້ຈັດການຮ້ານ (Manager)</div>
                    <div className="w-32 border-t border-zinc-400 pt-1">ເຈົ້າຂອງຮ້ານ (Owner)</div>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
              >
                ປິດ
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>ສັ່ງພິມອອກເຄື່ອງພິມ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
