"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Warehouse,
  Package,
  AlertTriangle,
  ArrowUpDown,
  Search,
  Plus,
  Trash2,
  DollarSign,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Sparkles,
  X,
  ExternalLink,
  LayoutGrid,
  List,
  Zap,
  Coffee,
  Utensils,
  CupSoda,
  Boxes,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  Camera,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  History,
  TrendingUp,
  MapPin,
  Truck,
  BarChart3,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  Edit,
  Tag,
  Scale
} from "lucide-react";
import { ActionModal, StatusPopup } from "@/components/ui/action-popup";
import { PaginationControls } from "@/components/PaginationControls";
import { CameraScannerModal } from "@/components/CameraScannerModal";
import { exportToExcel } from "@/lib/excel";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  category: string;
  inStock: number;
  minStock: number;
  costPrice: number;
  sellingPrice: number;
  unit: string;
  image?: string;
  images?: string[];
  description?: string;
  location?: string;
  supplier?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  user?: {
    name: string | null;
    email: string;
    role: string;
  };
}

function resolveFallbackImage(name?: string, category?: string): string {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (n.includes("ກາເຟ") || n.includes("coffee") || c.includes("ກາເຟ")) {
    return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80";
  }
  if (n.includes("ຊາ") || n.includes("tea") || n.includes("ມັດຈະ") || n.includes("matcha")) {
    return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80";
  }
  if (n.includes("ນົມ") || n.includes("milk")) {
    return "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80";
  }
  if (n.includes("ຊີ້ນ") || n.includes("ໝູ") || n.includes("ງົວ") || n.includes("meat") || n.includes("pork") || n.includes("beef")) {
    return "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&auto=format&fit=crop&q=80";
  }
  if (n.includes("ເຂົ້າ") || n.includes("ອາຫານ") || n.includes("food") || n.includes("rice") || c.includes("ອາຫານ")) {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80";
  }
  if (n.includes("ຈອກ") || n.includes("ອຸປະກອນ") || n.includes("cup") || c.includes("ອຸປະກອນ")) {
    return "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=400&auto=format&fit=crop&q=80";
  }
  if (n.includes("ເສື້ອ") || n.includes("shirt") || c.includes("ແຟຊັ່ນ")) {
    return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80";
  }
  if (n.includes("ກິລາ") || n.includes("sport") || c.includes("ກິລາ")) {
    return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&auto=format&fit=crop&q=80";
}

function formatDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "-";
  }
}

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: "INV-001",
    sku: "SKU-BEV-001",
    barcode: "885901234001",
    name: "ກາເຟອາຣາບິກ້າຄົ່ວເຂັ້ມ (500g)",
    category: "ວັດຖຸດິບ",
    inStock: 45,
    minStock: 10,
    costPrice: 120000,
    sellingPrice: 165000,
    unit: "ຖົງ",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&auto=format&fit=crop&q=80"
    ],
    description: "ເມັດກາເຟອາຣາບິກ້າແທ້ 100% ຈາກພູພຽງບໍລະເວນ ຄົ່ວລະດັບເຂັ້ມພິເສດ ເໝາະສຳລັບເມນູເອສເປຣສໂຊ ແລະ ລາເຕ້.",
    location: "Zone A-01 (ແຖວທີ 1)",
    supplier: "ບໍລິສັດ ກາເຟລາວ ພັດທະນາ ຈຳກັດ"
  },
  {
    id: "INV-002",
    sku: "SKU-BEV-002",
    barcode: "885901234002",
    name: "ນົມສົດພາດເຈີໄຣສ໌ (2L)",
    category: "ວັດຖຸດິບ",
    inStock: 8,
    minStock: 15,
    costPrice: 38000,
    sellingPrice: 50000,
    unit: "ແກັດ",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80"],
    description: "ນົມໂຄສົດແທ້ 100% ຜ່ານຂະບວນການພາດເຈີໄຣສ໌ ຄຸນນະພາບສູງ ຄວນເກັບຮັກສາໃນອຸນຫະພູມ 2-4°C.",
    location: "Zone C-Cold (ຕູ້ເຢັນໃຫຍ່)",
    supplier: "ຟາມໂຄນົມ ນ້ຳຊວງ"
  },
  {
    id: "INV-003",
    sku: "SKU-FOOD-011",
    barcode: "885901234003",
    name: "ຊີ້ນງົວອົດສະຕາລີ (1kg)",
    category: "ອາຫານ",
    inStock: 18,
    minStock: 10,
    costPrice: 240000,
    sellingPrice: 320000,
    unit: "ກິໂລ",
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&auto=format&fit=crop&q=80"],
    description: "ຊີ້ນງົວສັນນອກນຳເຂົ້າຈາກປະເທດອົດສະຕາລີ ຕັດແຕ່ງມາດຕະຖານ ສຳລັບສະເຕັກພຣີມຽມ.",
    location: "Zone C-Freezer (ຫ້ອງແຊ່ແຂງ)",
    supplier: "ບໍລິສັດ ນຳເຂົ້າອາຫານສາກົນ ຈຳກັດ"
  },
  {
    id: "INV-004",
    sku: "SKU-FOOD-012",
    barcode: "885901234004",
    name: "ຊີ້ນໝູສາມຊັ້ນ (1kg)",
    category: "ອາຫານ",
    inStock: 0,
    minStock: 5,
    costPrice: 85000,
    sellingPrice: 110000,
    unit: "ກິໂລ",
    image: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=400&auto=format&fit=crop&q=80"],
    description: "ຊີ້ນໝູສາມຊັ້ນສົດ ຄັດພິເສດ ຊັ້ນມັນພໍດີ ເໝາະສຳລັບເມນູປີ້ງ ແລະ ຕົ້ມ.",
    location: "Zone C-Freezer (ຫ້ອງແຊ່ແຂງ)",
    supplier: "ຕະຫຼາດສົດ ຫຼັກ 5"
  },
  {
    id: "INV-005",
    sku: "SKU-EQP-101",
    barcode: "885901234005",
    name: "ຈອກເຈ້ຍເຢັນ 16oz (100 ໃບ)",
    category: "ອຸປະກອນ",
    inStock: 120,
    minStock: 30,
    costPrice: 45000,
    sellingPrice: 65000,
    unit: "ແພັກ",
    image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=400&auto=format&fit=crop&q=80"],
    description: "ຈອກເຈ້ຍສອງຊັ້ນ ເຄືອບກັນຊຶມ Food Grade ສຳລັບໃສ່ເຄື່ອງດື່ມເຢັນ 16oz.",
    location: "Zone B-04 (ຊັ້ນວາງອຸປະກອນ)",
    supplier: "ໂຮງງານຜະລິດບັນຈຸພັນ ວຽງຈັນ"
  },
  {
    id: "INV-006",
    sku: "SKU-BEV-009",
    barcode: "885901234006",
    name: "ຊາຂຽວມັດຊະພຣີມຽມ (100g)",
    category: "ວັດຖຸດິບ",
    inStock: 6,
    minStock: 10,
    costPrice: 180000,
    sellingPrice: 250000,
    unit: "ກະປຸກ",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80"],
    description: "ຜົງຊາຂຽວມັດຊະແທ້ 100% ນຳເຂົ້າຈາກເມືອງອູຈິ ປະເທດຍີ່ປຸ່ນ ກິ່ນຫອມລະມຸນ ສີຂຽວທຳມະຊາດ.",
    location: "Zone A-02 (ຕູ້ແຫ້ງພິເສດ)",
    supplier: "ບໍລິສັດ ຊາ ແລະ ກາເຟ ອາຊີ ຈຳກັດ"
  }
];

const REASON_PRESETS = [
  { label: "ກວດນັບສິນຄ້າຕົວຈິງປະຈຳງວດ (Physical Count Audit)", value: "ກວດນັບຍອດສິນຄ້າຕົວຈິງປະຈຳງວດ (Physical Count Audit)" },
  { label: "ສິນຄ້າຊຳລຸດ / ແຕກຫັກ / ເສຍຫາຍ (Damaged)", value: "ສິນຄ້າຊຳລຸດ/ແຕກຫັກເສຍຫາຍໃນສາງ (Damaged/Broken)" },
  { label: "ສິນຄ້າໝົດອາຍຸ / ເສື່ອມສະພາບ (Expired)", value: "ສິນຄ້າໝົດອາຍຸ/ເສື່ອມຄຸນນະພາບ (Expired/Degraded)" },
  { label: "ຍອດຂາດເກີນຈາກການກວດສອບ (Discrepancy)", value: "ຍອດຂາດເກີນຈາກການກວດສອບພາຍໃນ (Stock Discrepancy)" },
  { label: "ປັບປຸງຍອດຍົກມາເລີ່ມຕົ້ນ (Initial Balance)", value: "ປັບປຸງຍອດຍົກມາເລີ່ມຕົ້ນລະບົບ (Initial Stock Balance Adjustment)" },
  { label: "ລູກຄ້າສົ່ງຄືນສິນຄ້າ (Customer Return)", value: "ລູກຄ້າສົ່ງສິນຄ້າຄືນສາງ (Customer Return Restock)" },
  { label: "ອື່ນໆ (ລະບຸເອງ)", value: "" }
];

export function InventoryDashboardClient() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<"TABLE" | "GRID">("TABLE");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState<"ALL" | "HEALTHY" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

  // Dynamic Categories extracted from loaded products
  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((i) => {
      if (i.category && i.category.trim()) {
        cats.add(i.category.trim());
      }
    });
    return ["ALL", ...Array.from(cats)];
  }, [items]);

  // Zoom Image State
  const [zoomedImage, setZoomedImage] = useState<{ url: string; name: string } | null>(null);

  // Product Inspection Modal State (View Product Details in Warehouse)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [productMovements, setProductMovements] = useState<StockMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Summary stats
  const [summaryStats, setSummaryStats] = useState<{
    totalSKUs: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  } | null>(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Add Item modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [newCategory, setNewCategory] = useState("ວັດຖຸດິບ");
  const [newStock, setNewStock] = useState<number>(20);
  const [newPrice, setNewPrice] = useState<number>(50000);
  const [newCostPrice, setNewCostPrice] = useState<number>(35000);
  const [newLocation, setNewLocation] = useState("Zone A-01");
  const [newSupplier, setNewSupplier] = useState("ຕົວແທນຈຳໜ່າຍຫຼັກ");
  const [newImageUrl, setNewImageUrl] = useState("");

  // Safe Adjust stock modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [itemToAdjust, setItemToAdjust] = useState<InventoryItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<"EXACT" | "DELTA">("EXACT");
  const [exactStockInput, setExactStockInput] = useState<number>(0);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [selectedReasonPreset, setSelectedReasonPreset] = useState<string>(REASON_PRESETS[0].value);
  const [safetyConfirmed, setSafetyConfirmed] = useState<boolean>(false);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);

  // Status popup
  const [statusPopup, setStatusPopup] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({
    open: false,
    title: "",
    message: "",
    type: "success"
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        search: searchQuery,
        category: categoryFilter,
        stats: "true"
      });
      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : json.data;
        if (json.stats) {
          setSummaryStats(json.stats);
        }
        if (Array.isArray(data) && (data.length > 0 || (json.stats && json.stats.totalSKUs > 0))) {
          const mapped: InventoryItem[] = data.map((p: any) => {
            let img = null;
            let allImages: string[] = [];
            if (Array.isArray(p.images) && p.images.length > 0) {
              allImages = p.images.filter(Boolean);
              img = allImages[0];
            } else if (typeof p.image === "string" && p.image) {
              img = p.image;
              allImages = [p.image];
            }

            const fallback = resolveFallbackImage(p.name, p.category);
            const finalImage = img || fallback;
            if (allImages.length === 0) {
              allImages = [finalImage];
            }

            const costPrice = Number((p.metadata as any)?.costPrice ?? (p.price ? Math.round(p.price * 0.7) : 0)) || 0;
            const sellingPrice = Number(p.price) || (costPrice > 0 ? Math.round(costPrice * 1.3) : 0);

            return {
              id: p.id,
              sku: (p.metadata as any)?.sku || `SKU-${p.id.slice(-6).toUpperCase()}`,
              barcode: (p.metadata as any)?.barcode || (p.metadata as any)?.sku || `885${p.id.slice(-9)}`,
              name: p.name,
              category: p.category || "ວັດຖຸດິບ",
              inStock: Number(p.stock ?? 0),
              minStock: Number(p.minStock ?? (p.metadata as any)?.minStock ?? 10),
              costPrice: costPrice,
              sellingPrice: sellingPrice,
              unit: (p.metadata as any)?.unit || "ລາຍການ",
              image: finalImage,
              images: allImages,
              description: p.description || "",
              location: (p.metadata as any)?.location || (p.metadata as any)?.zone || "Zone A-01",
              supplier: (p.metadata as any)?.supplier || (p.metadata as any)?.vendor || "ຕົວແທນຈຳໜ່າຍຫຼັກ",
              createdAt: p.createdAt,
              updatedAt: p.updatedAt
            };
          });
          setItems(mapped);
          setTotalItems(typeof json.total === "number" ? json.total : mapped.length);
        } else {
          setItems(INITIAL_INVENTORY);
          setTotalItems(INITIAL_INVENTORY.length);
        }
      } else {
        setItems(INITIAL_INVENTORY);
        setTotalItems(INITIAL_INVENTORY.length);
      }
    } catch (err) {
      console.error("Failed to fetch inventory products:", err);
      setItems(INITIAL_INVENTORY);
      setTotalItems(INITIAL_INVENTORY.length);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage, searchQuery, categoryFilter]);

  // Client side filtering for stock status
  const displayedItems = useMemo(() => {
    if (stockStatusFilter === "LOW_STOCK") {
      return items.filter((i) => i.inStock > 0 && i.inStock <= i.minStock);
    }
    if (stockStatusFilter === "OUT_OF_STOCK") {
      return items.filter((i) => i.inStock === 0);
    }
    if (stockStatusFilter === "HEALTHY") {
      return items.filter((i) => i.inStock > i.minStock);
    }
    return items;
  }, [items, stockStatusFilter]);

  const totalSKUs = summaryStats?.totalSKUs ?? items.length;
  const totalValue = summaryStats?.totalValue ?? items.reduce((acc, i) => acc + i.inStock * i.costPrice, 0);
  const totalRetailPotential = items.reduce((acc, i) => acc + i.inStock * i.sellingPrice, 0);
  const lowStockCount = summaryStats?.lowStockCount ?? items.filter((i) => i.inStock > 0 && i.inStock <= i.minStock).length;
  const outOfStockCount = summaryStats?.outOfStockCount ?? items.filter((i) => i.inStock === 0).length;
  const healthyCount = items.filter((i) => i.inStock > i.minStock).length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Copy text helper
  const handleCopy = (text: string, label: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`ຄັດລອກ ${label}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Inspect Product Details in Warehouse
  const handleOpenDetails = async (item: InventoryItem) => {
    setSelectedProduct(item);
    setActiveGalleryIndex(0);
    setDetailsModalOpen(true);
    setIsLoadingMovements(true);
    try {
      const res = await fetch(`/api/products/${item.id}/stock`);
      if (res.ok) {
        const data = await res.json();
        setProductMovements(Array.isArray(data) ? data : []);
      } else {
        setProductMovements([]);
      }
    } catch (err) {
      console.error("Error fetching stock movements:", err);
      setProductMovements([]);
    } finally {
      setIsLoadingMovements(false);
    }
  };

  // Open Safe Adjustment Modal
  const handleOpenAdjustModal = (item: InventoryItem) => {
    setItemToAdjust(item);
    setAdjustMode("EXACT");
    setExactStockInput(item.inStock);
    setAdjustDelta(0);
    setAdjustReason("");
    setSelectedReasonPreset(REASON_PRESETS[0].value);
    setSafetyConfirmed(false);
    setAdjustModalOpen(true);
  };

  // Compute Target Stock & Delta
  const targetStock = useMemo(() => {
    if (!itemToAdjust) return 0;
    if (adjustMode === "EXACT") {
      return Math.max(0, Number(exactStockInput) || 0);
    }
    return Math.max(0, itemToAdjust.inStock + (Number(adjustDelta) || 0));
  }, [itemToAdjust, adjustMode, exactStockInput, adjustDelta]);

  const effectiveDelta = useMemo(() => {
    if (!itemToAdjust) return 0;
    return targetStock - itemToAdjust.inStock;
  }, [itemToAdjust, targetStock]);

  const finalReason = useMemo(() => {
    const custom = adjustReason.trim();
    if (!selectedReasonPreset) return custom;
    if (!custom) return selectedReasonPreset;
    return `${selectedReasonPreset} - ${custom}`;
  }, [selectedReasonPreset, adjustReason]);

  const canSubmitAdjustment = useMemo(() => {
    return effectiveDelta !== 0 && finalReason.trim().length >= 3 && safetyConfirmed && !isAdjusting;
  }, [effectiveDelta, finalReason, safetyConfirmed, isAdjusting]);

  // Execute Safe Adjustment
  const handleConfirmAdjust = async () => {
    if (!itemToAdjust || !canSubmitAdjustment) return;

    setIsAdjusting(true);
    try {
      const res = await fetch(`/api/products/${itemToAdjust.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ADJUST",
          quantity: targetStock,
          reason: finalReason
        })
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemToAdjust.id ? { ...i, inStock: targetStock } : i
          )
        );

        if (selectedProduct && selectedProduct.id === itemToAdjust.id) {
          setSelectedProduct({ ...selectedProduct, inStock: targetStock });
        }

        setAdjustModalOpen(false);
        setStatusPopup({
          open: true,
          title: "ປັບປຸງສະຕັອກ ແລະ ບັນທຶກ Audit Log ສຳເລັດ!",
          message: `ອັບເດດຍອດສະຕັອກຂອງ "${itemToAdjust.name}" ເປັນ ${targetStock} ${itemToAdjust.unit} (ປ່ຽນແປງ: ${effectiveDelta > 0 ? `+${effectiveDelta}` : effectiveDelta}) ພ້ອມບັນທຶກລົງປະຫວັດ Audit Logs ຂອງລະບົບຮຽບຮ້ອຍແລ້ວ.`,
          type: "success"
        });
        fetchProducts();
      } else {
        const errText = await res.text();
        toast.error(`ບໍ່ສາມາດປັບສະຕັອກໄດ້: ${errText || "ເກີດຂໍ້ຜິດພາດ"}`);
      }
    } catch (e) {
      console.error("Adjustment error:", e);
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await fetch(`/api/products/${itemToDelete.id}`, {
        method: "DELETE"
      });
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      if (selectedProduct && selectedProduct.id === itemToDelete.id) {
        setDetailsModalOpen(false);
        setSelectedProduct(null);
      }
      setDeleteModalOpen(false);
      setStatusPopup({
        open: true,
        title: "ລົບສິນຄ້າສຳເລັດແລ້ວ!",
        message: `ລາຍການ "${itemToDelete.name}" ຖືກລົບອອກຈາກຄັງສິນຄ້າຮຽບຮ້ອຍແລ້ວ.`,
        type: "success"
      });
      fetchProducts();
    } catch (e) {
      console.error(e);
      setStatusPopup({
        open: true,
        title: "ເກີດຂໍ້ຜິດພາດ",
        message: "ບໍ່ສາມາດລົບສິນຄ້າໄດ້ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ.",
        type: "error"
      });
    } finally {
      setItemToDelete(null);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const generatedSku = newSku.trim() || `SKU-${Date.now().toString().slice(-6)}`;
    const finalBarcode = newBarcode.trim() || `885${Date.now().toString().slice(-9)}`;

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          price: Number(newPrice),
          stock: Number(newStock),
          category: newCategory,
          images: newImageUrl.trim() ? [newImageUrl.trim()] : [resolveFallbackImage(newName, newCategory)],
          metadata: {
            sku: generatedSku,
            barcode: finalBarcode,
            minStock: 10,
            unit: "ໜ່ວຍ",
            costPrice: Number(newCostPrice),
            location: newLocation,
            supplier: newSupplier
          }
        })
      });

      if (res.ok) {
        fetchProducts();
        setAddModalOpen(false);
        setNewName("");
        setNewSku("");
        setNewBarcode("");
        setNewImageUrl("");
        setStatusPopup({
          open: true,
          title: "ເພີ່ມສິນຄ້າເຂົ້າຄັງສຳເລັດແລ້ວ!",
          message: `ບັນທຶກ "${newName}" ເຂົ້າສູ່ລະບົບສາງຮຽບຮ້ອຍແລ້ວ.`,
          type: "success"
        });
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // Fallback local update
    const newItem: InventoryItem = {
      id: `INV-${Date.now()}`,
      sku: generatedSku,
      barcode: finalBarcode,
      name: newName.trim(),
      category: newCategory,
      inStock: Number(newStock),
      minStock: 10,
      costPrice: Number(newCostPrice),
      sellingPrice: Number(newPrice),
      unit: "ໜ່ວຍ",
      image: newImageUrl.trim() || resolveFallbackImage(newName, newCategory),
      images: [newImageUrl.trim() || resolveFallbackImage(newName, newCategory)],
      location: newLocation,
      supplier: newSupplier
    };

    setItems([newItem, ...items]);
    setAddModalOpen(false);
    setNewName("");
    setNewSku("");
    setNewBarcode("");
    setNewImageUrl("");
    setStatusPopup({
      open: true,
      title: "ເພີ່ມສິນຄ້າເຂົ້າຄັງສຳເລັດແລ້ວ!",
      message: `ບັນທຶກ "${newItem.name}" (${newItem.sku}) ເຂົ້າສູ່ລະບົບສາງຮຽບຮ້ອຍແລ້ວ.`,
      type: "success"
    });
  };

  // Export Inventory Excel Sheet
  const handleExportExcel = () => {
    try {
      const headers = [
        "ລະຫັດ SKU",
        "ບາໂຄ້ດ (Barcode)",
        "ຊື່ສິນຄ້າ (Product Name)",
        "ໝວດໝູ່ (Category)",
        "ຈຳນວນໃນສາງ (In Stock)",
        "ເກນຂັ້ນຕ່ຳ (Min Stock)",
        "ໜ່ວຍນັບ (Unit)",
        "ຕົ້ນທຶນ/ໜ່ວຍ ₭ (Cost)",
        "ລາຄາຂາຍ/ໜ່ວຍ ₭ (Sell)",
        "ກຳໄລ/ໜ່ວຍ ₭",
        "ອັດຕາກຳໄລ (%)",
        "ມູນຄ່າສາງລວມ ₭ (Valuation)",
        "ທີ່ຕັ້ງໃນສາງ (Location)",
        "ຜູ້ສະໜອງ (Supplier)",
        "ສະຖານະສະຕັອກ"
      ];

      const data = displayedItems.map((item) => {
        const profit = Math.max(0, item.sellingPrice - item.costPrice);
        const marginPct = item.sellingPrice > 0 ? ((profit / item.sellingPrice) * 100).toFixed(1) + "%" : "0%";
        const totalVal = item.inStock * item.costPrice;
        const status = item.inStock === 0 ? "ໝົດສາງ (Out of Stock)" : item.inStock <= item.minStock ? "ໃກ້ໝົດ (Low Stock)" : "ປົກກະຕິ (Healthy)";

        return [
          item.sku,
          item.barcode || "-",
          item.name,
          item.category,
          item.inStock,
          item.minStock,
          item.unit,
          item.costPrice,
          item.sellingPrice,
          profit,
          marginPct,
          totalVal,
          item.location || "Zone A-01",
          item.supplier || "ຕົວແທນຈຳໜ່າຍຫຼັກ",
          status
        ];
      });

      exportToExcel({
        filename: `Inventory_Stock_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: "Warehouse Stock",
        title: "ລາຍງານຄັງສິນຄ້າ & ຈັດການສະຕັອກ (Inventory Stock Report)",
        subtitle: `ວັນທີອອກລາຍງານ: ${new Date().toLocaleDateString("lo-LA")} | ລວມທັງໝົດ: ${displayedItems.length} ລາຍການ | ມູນຄ່າສາງລວມ: ₭${totalValue.toLocaleString()}`,
        headers,
        data
      });

      toast.success("ດາວໂຫຼດຟາຍ Excel ຄັງສິນຄ້າຮຽບຮ້ອຍແລ້ວ!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("ບໍ່ສາມາດດາວໂຫຼດ Excel ໄດ້");
    }
  };

  const getStockBadge = (item: InventoryItem) => {
    if (item.inStock === 0) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 w-fit shrink-0 whitespace-nowrap">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> ໝົດສາງ
        </span>
      );
    }
    if (item.inStock <= item.minStock) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 w-fit shrink-0 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> ໃກ້ໝົດ ({item.inStock}/{item.minStock})
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold w-fit shrink-0 whitespace-nowrap flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" /> ປົກກະຕິ ({item.inStock})
      </span>
    );
  };

  const getMovementBadge = (type: string, quantity: number) => {
    switch (type) {
      case "ADD":
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
            ຮັບເຂົ້າ (+{quantity})
          </span>
        );
      case "REMOVE":
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
            ເບີກອອກ ({quantity})
          </span>
        );
      case "ADJUST":
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold">
            ປັບຍອດ ({quantity > 0 ? `+${quantity}` : quantity})
          </span>
        );
      case "SALE":
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
            ຂາຍ POS ({quantity})
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px] font-medium">
            {type} ({quantity > 0 ? `+${quantity}` : quantity})
          </span>
        );
    }
  };

  return (
    <div suppressHydrationWarning className="w-full max-w-[1750px] mx-auto space-y-6 pb-16 px-2 sm:px-4 lg:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER BANNER - ENTERPRISE WAREHOUSE SUITE */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-950/90 via-zinc-900/95 to-slate-950/90 p-6 sm:p-8 rounded-3xl border border-blue-500/30 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-500/30 border border-blue-400/40">
                <Warehouse className="w-4 h-4 text-cyan-200" />
                <span>Enterprise Warehouse Management (WMS)</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>ລະບົບບັນທຶກ Audit Log ຖາວອນ</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                <span>ກວດສອບຂໍ້ມູນສິນຄ້າຄົບວົງຈອນ</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              ຄັງສິນຄ້າ & ຈັດການສະຕັອກ{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
                (Inventory & Warehouse Management)
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
              ສູນກວດກາສິນຄ້າໃນສາງລະດັບມືອາຊີບ • ກວດເບິ່ງຂໍ້ມູນສິນຄ້າລະອຽດ, ຮູບພາບ, ທີ່ຕັ້ງ, ຕົ້ນທຶນ, ລາຄາຂາຍ, ຈຸດສັ່ງຊື້ ແລະ ປັບປຸງສະຕັອກຢ່າງປອດໄພພ້ອມບັນທຶກປະຫວັດການແກ້ໄຂ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <Link
              href="/dashboard/products/create"
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-blue-600/30 border border-blue-400/40 transition-all flex items-center justify-center gap-2 active:scale-95 group"
            >
              <Plus className="w-4 h-4 text-cyan-200" />
              <span>ສ້າງສິນຄ້າໃໝ່ (Create Product)</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                title="ດາວໂຫຼດລາຍການຄັງສິນຄ້າເປັນໄຟລ໌ Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="py-2.5 px-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                title="ເພີ່ມລາຍການສິນຄ້າດ່ວນເຂົ້າຄັງ"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ ລາຍການດ່ວນ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TOP KPI STATS CARDS - INTERACTIVE WAREHOUSE METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total SKUs */}
        <Card
          onClick={() => setStockStatusFilter("ALL")}
          className={`cursor-pointer transition-all rounded-3xl backdrop-blur-xl shadow-lg border ${
            stockStatusFilter === "ALL"
              ? "bg-blue-500/20 border-blue-400 ring-2 ring-blue-500/30"
              : "bg-gradient-to-br from-blue-500/10 via-zinc-900/60 to-blue-900/10 border-blue-500/20 hover:border-blue-500/40"
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-blue-400 flex items-center justify-between">
              <span>ສິນຄ້າທັງໝົດ (TOTAL SKUS)</span>
              <Package className="w-4 h-4 text-blue-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white">{totalSKUs} ລາຍການ</div>
            <p className="text-[11px] text-zinc-400 mt-1">ຄລິກເພື່ອສະແດງທັງໝົດ</p>
          </CardContent>
        </Card>

        {/* Total Valuation */}
        <Card className="bg-gradient-to-br from-emerald-500/10 via-zinc-900/60 to-emerald-900/10 border-emerald-500/20 rounded-3xl backdrop-blur-xl shadow-lg col-span-2 sm:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-emerald-400 flex items-center justify-between">
              <span>ມູນຄ່າສາງລວມ (COST VALUE)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white truncate">
              ₭{totalValue.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 truncate">
              ມູນຄ່າຂາຍ: ₭{totalRetailPotential.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Healthy Stock */}
        <Card
          onClick={() => {
            setStockStatusFilter(stockStatusFilter === "HEALTHY" ? "ALL" : "HEALTHY");
          }}
          className={`cursor-pointer transition-all rounded-3xl backdrop-blur-xl shadow-lg border ${
            stockStatusFilter === "HEALTHY"
              ? "bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-500/30"
              : "bg-gradient-to-br from-cyan-500/10 via-zinc-900/60 to-cyan-900/10 border-cyan-500/20 hover:border-cyan-500/40"
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-cyan-400 flex items-center justify-between">
              <span>ສະຕັອກປົກກະຕິ (HEALTHY)</span>
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400">{healthyCount} ລາຍການ</div>
            <p className="text-[11px] text-zinc-400 mt-1">ສະຕັອກພຽງພໍ (ຄລິກກັ່ນຕອງ)</p>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card
          onClick={() => {
            setStockStatusFilter(stockStatusFilter === "LOW_STOCK" ? "ALL" : "LOW_STOCK");
          }}
          className={`cursor-pointer transition-all rounded-3xl backdrop-blur-xl shadow-lg border ${
            stockStatusFilter === "LOW_STOCK"
              ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-500/30"
              : "bg-gradient-to-br from-amber-500/10 via-zinc-900/60 to-amber-900/10 border-amber-500/20 hover:border-amber-500/40"
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-amber-400 flex items-center justify-between">
              <span>ສິນຄ້າໃກ້ໝົດ (LOW STOCK)</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">{lowStockCount} ລາຍການ</div>
            <p className="text-[11px] text-zinc-400 mt-1">ຕ່ຳກວ່າເກນຂັ້ນຕ່ຳ (ຄລິກກັ່ນຕອງ)</p>
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card
          onClick={() => {
            setStockStatusFilter(stockStatusFilter === "OUT_OF_STOCK" ? "ALL" : "OUT_OF_STOCK");
          }}
          className={`cursor-pointer transition-all rounded-3xl backdrop-blur-xl shadow-lg border ${
            stockStatusFilter === "OUT_OF_STOCK"
              ? "bg-rose-500/20 border-rose-400 ring-2 ring-rose-500/30"
              : "bg-gradient-to-br from-rose-500/10 via-zinc-900/60 to-rose-900/10 border-rose-500/20 hover:border-rose-500/40"
          }`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-rose-400 flex items-center justify-between">
              <span>ສິນຄ້າໝົດສາງ (OUT OF STOCK)</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-rose-400">{outOfStockCount} ລາຍການ</div>
            <p className="text-[11px] text-zinc-400 mt-1">ຕ້ອງການສັ່ງຊື້ດ່ວນ (ຄລິກກັ່ນຕອງ)</p>
          </CardContent>
        </Card>
      </div>

      {/* QUICK SHORTCUTS & WAREHOUSE TOOLS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Link
          href="/dashboard/inventory/barcode"
          className="p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-indigo-950/40 border border-zinc-800 hover:border-indigo-500/40 transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-extrabold text-white group-hover:text-indigo-300">
              ພິມບາໂຄ້ດ & ປ້າຍລາຄາ
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Barcode & Price Label</p>
          </div>
          <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 shrink-0" />
        </Link>

        <Link
          href="/dashboard/inventory/expiry"
          className="p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-amber-950/40 border border-zinc-800 hover:border-amber-500/40 transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-extrabold text-white group-hover:text-amber-300">
              ຕິດຕາມວັນໝົດອາຍຸ
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Expiry Date & Batch</p>
          </div>
          <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 shrink-0" />
        </Link>

        <Link
          href="/dashboard/inventory/serial"
          className="p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-cyan-950/40 border border-zinc-800 hover:border-cyan-500/40 transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-extrabold text-white group-hover:text-cyan-300">
              Serial / IMEI Tracking
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">ເລກເຄື່ອງລາຍຊິ້ນ</p>
          </div>
          <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 shrink-0" />
        </Link>

        <Link
          href="/dashboard/inventory/suppliers"
          className="p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-emerald-950/40 border border-zinc-800 hover:border-emerald-500/40 transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-extrabold text-white group-hover:text-emerald-300">
              ຜູ້ສະໜອງ (Suppliers)
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">ຄູ່ຄ້າ ແລະ ຕົວແທນ</p>
          </div>
          <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 shrink-0" />
        </Link>

        <Link
          href="/dashboard/audit-logs"
          className="p-3.5 rounded-2xl bg-zinc-900/70 hover:bg-blue-950/40 border border-zinc-800 hover:border-blue-500/40 transition-all flex items-center justify-between group col-span-2 lg:col-span-1"
        >
          <div>
            <p className="text-xs font-extrabold text-white group-hover:text-blue-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>ປະຫວັດ Audit Logs</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">ກວດສອບປະຫວັດການແກ້ໄຂ</p>
          </div>
          <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 shrink-0" />
        </Link>
      </div>

      {/* FILTER & MAIN DIRECTORY CARD */}
      <Card className="bg-zinc-950/70 border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
        <CardHeader className="p-5 sm:p-6 border-b border-zinc-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900/30">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-base sm:text-lg font-extrabold text-white">
                ລາຍການສິນຄ້າໃນສາງ (Warehouse Stock Directory)
              </CardTitle>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              ຄລິກທີ່ຊື່ສິນຄ້າ ຫຼື ປຸ່ມ "ຂໍ້ມູນ" ເພື່ອກວດສອບຂໍ້ມູນສິນຄ້າຄົບວົງຈອນ • ປັບປຸງສະຕັອກດ້ວຍລະບົບຄວາມປອດໄພ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input & Camera Scanner */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <Input
                  placeholder="ຄົ້ນຫາຊື່, SKU, ບາໂຄ້ດ..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 bg-zinc-900/80 border-zinc-700/60 text-white rounded-xl h-10 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="px-3 sm:px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20 active:scale-95 h-10"
                title="ເປີດກ້ອງສະແກນບາໂຄດສິນຄ້າໃນສາງ"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">ກ້ອງສະແກນ</span>
                <span className="sm:hidden">ສະແກນ</span>
              </button>
            </div>

            {/* Page Size / Show All Switcher */}
            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs shrink-0">
              <span className="text-zinc-500 text-[11px] px-1.5 font-medium hidden sm:inline">ສະແດງ:</span>
              {[10, 25, 50, 100, 500].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all shrink-0 ${
                    itemsPerPage === size
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title={size === 500 ? "ສະແດງສິນຄ້າທັງໝົດໃນໜ້າດຽວ (Show All)" : `ສະແດງ ${size} ລາຍການຕໍ່ໜ້າ`}
                >
                  {size === 500 ? "ທັງໝົດ (All)" : size}
                </button>
              ))}
            </div>

            {/* Category Filter Chips (Dynamic from all products) */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full sm:max-w-xs md:max-w-md lg:max-w-lg pb-1 scrollbar-thin">
              {dynamicCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                    categoryFilter === cat
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {cat === "ALL" ? "ທັງໝົດ" : cat}
                </button>
              ))}
            </div>

            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("TABLE")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "TABLE" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Table View (ມຸມມອງຕາຕະລາງ)"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "GRID" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Grid View (ມຸມມອງກາດພ້ອມຮູບໃຫຍ່)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Active Filter Notice */}
          {stockStatusFilter !== "ALL" && (
            <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 px-6 flex items-center justify-between text-xs text-amber-300">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>
                  ກຳລັງສະແດງສະເພາະ:{" "}
                  <strong>
                    {stockStatusFilter === "HEALTHY"
                      ? "ສິນຄ້າສະຕັອກປົກກະຕິ"
                      : stockStatusFilter === "LOW_STOCK"
                      ? "ສິນຄ້າໃກ້ໝົດ"
                      : "ສິນຄ້າໝົດສາງ"}
                  </strong>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setStockStatusFilter("ALL")}
                className="underline hover:text-white font-bold"
              >
                ລ້າງຕົວກັ່ນຕອງ (Show All)
              </button>
            </div>
          )}

          {/* VIEW 1: GRID VIEW (CARD VIEW WITH PRODUCT DETAILS & ACTIONS) */}
          {viewMode === "GRID" ? (
            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedItems.map((item) => {
                const profit = Math.max(0, item.sellingPrice - item.costPrice);
                const marginPct = item.sellingPrice > 0 ? Math.round((profit / item.sellingPrice) * 100) : 0;
                const stockHealthPct = Math.min(100, Math.round((item.inStock / Math.max(1, item.minStock * 2)) * 100));

                return (
                  <div
                    key={item.id}
                    className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 hover:bg-zinc-900 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    {/* Product Image Header with Status Pill */}
                    <div className="relative h-44 w-full bg-zinc-950 overflow-hidden">
                      <img
                        src={item.image || resolveFallbackImage(item.name, item.category)}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                        onClick={() => handleOpenDetails(item)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />

                      {/* SKU Pill */}
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold text-cyan-300 border border-white/10">
                        {item.sku}
                      </div>

                      {/* Stock Status Badge */}
                      <div className="absolute top-2.5 right-2.5">{getStockBadge(item)}</div>

                      {/* Category & Location Overlay */}
                      <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 text-zinc-300 text-[10px] font-medium border border-zinc-700/50">
                          {item.category}
                        </span>
                        {item.location && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 text-[10px] font-medium border border-blue-800/50 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-400" />
                            <span>{item.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4
                          onClick={() => handleOpenDetails(item)}
                          className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors cursor-pointer"
                          title="ຄລິກເພື່ອກວດສອບຂໍ້ມູນສິນຄ້າລະອຽດ"
                        >
                          {item.name}
                        </h4>
                      </div>

                      {/* Stock Level Progress Gauge */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400">ລະດັບສະຕັອກ:</span>
                          <span className="font-extrabold text-white">
                            {item.inStock} <span className="text-zinc-500 font-normal">/ ເກນ {item.minStock} {item.unit}</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              item.inStock === 0
                                ? "bg-rose-500 w-0"
                                : item.inStock <= item.minStock
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${item.inStock === 0 ? 0 : Math.max(5, stockHealthPct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Cost, Sell Price & Margin */}
                      <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>ຕົ້ນທຶນ/ໜ່ວຍ:</span>
                          <span className="font-mono text-zinc-200 font-bold">₭{item.costPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>ລາຄາຂາຍ:</span>
                          <span className="font-mono text-cyan-300 font-bold">
                            ₭{item.sellingPrice.toLocaleString()}{" "}
                            <span className="text-[10px] text-emerald-400 font-normal">(+{marginPct}%)</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-400 pt-1 border-t border-zinc-800/60">
                          <span>ມູນຄ່າສາງລວມ:</span>
                          <span className="font-mono text-emerald-400 font-bold">
                            ₭{(item.costPrice * item.inStock).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(item)}
                          className="col-span-2 py-2 px-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95"
                          title="ເບິ່ງຂໍ້ມູນສິນຄ້າລະອຽດ"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>ຂໍ້ມູນ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAdjustModal(item)}
                          className="col-span-2 py-2 px-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95"
                          title="ປັບປຸງສະຕັອກສິນຄ້າ"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>ປັບສະຕັອກ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(item)}
                          className="col-span-1 p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-all flex items-center justify-center active:scale-95"
                          title="ລົບສິນຄ້າ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {displayedItems.length === 0 && (
                <div className="col-span-full py-16 text-center text-zinc-500 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-zinc-700" />
                  <p className="text-sm font-bold text-zinc-400">ບໍ່ພົບຂໍ້ມູນສິນຄ້າໃນຄັງ</p>
                </div>
              )}
            </div>
          ) : (
            /* VIEW 2: HIGH-DENSITY ENTERPRISE TABLE VIEW */
            <>
              {/* Mobile View */}
              <div className="md:hidden divide-y divide-zinc-800/80">
                {displayedItems.map((item) => (
                  <div key={item.id} className="p-4 space-y-3 hover:bg-zinc-900/40 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Product Thumbnail with Click-to-details */}
                      <div
                        onClick={() => handleOpenDetails(item)}
                        className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 shadow-sm relative group cursor-pointer"
                      >
                        <img
                          src={item.image || resolveFallbackImage(item.name, item.category)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-mono text-xs font-bold text-blue-400">{item.sku}</span>
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-medium">
                            {item.category}
                          </span>
                          {item.location && (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-950 text-blue-300 text-[10px] font-medium">
                              {item.location}
                            </span>
                          )}
                        </div>
                        <h4
                          onClick={() => handleOpenDetails(item)}
                          className="font-bold text-white text-sm leading-snug break-words cursor-pointer hover:text-blue-400"
                        >
                          {item.name}
                        </h4>
                      </div>

                      <div className="shrink-0">{getStockBadge(item)}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">ສະຕັອກ</span>
                        <span className="text-white font-extrabold text-xs">
                          {item.inStock} {item.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">ຕົ້ນທຶນ</span>
                        <span className="text-zinc-200 font-mono font-bold text-xs">
                          ₭{item.costPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500 block text-[10px]">ມູນຄ່າລວມ</span>
                        <span className="text-emerald-400 font-mono font-bold text-xs">
                          ₭{(item.costPrice * item.inStock).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(item)}
                        className="flex-1 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>ເບິ່ງຂໍ້ມູນ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAdjustModal(item)}
                        className="flex-1 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>ປັບສະຕັອກ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(item)}
                        className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-zinc-800/80 hover:bg-transparent bg-zinc-900/50 text-xs">
                      <TableHead className="text-zinc-400 font-bold w-14 py-3">ຮູບ</TableHead>
                      <TableHead className="text-zinc-400 font-bold w-36">ລະຫັດ / ບາໂຄ້ດ</TableHead>
                      <TableHead className="text-zinc-400 font-bold min-w-[160px]">ລາຍການສິນຄ້າ</TableHead>
                      <TableHead className="text-zinc-400 font-bold w-32">ໝວດ & ທີ່ຕັ້ງ</TableHead>
                      <TableHead className="text-zinc-400 font-bold w-36">ລະດັບສະຕັອກ</TableHead>
                      <TableHead className="text-zinc-400 font-bold w-32">ຕົ້ນທຶນ vs ຂາຍ</TableHead>
                      <TableHead className="text-zinc-400 font-bold w-28">ມູນຄ່າສາງລວມ</TableHead>
                      <TableHead className="text-right text-zinc-400 font-bold w-44 sticky right-0 z-20 bg-zinc-950/95 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.6)]">
                        ຈັດການ (Action)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedItems.map((item) => {
                      const profit = Math.max(0, item.sellingPrice - item.costPrice);
                      const marginPct = item.sellingPrice > 0 ? Math.round((profit / item.sellingPrice) * 100) : 0;
                      const stockHealthPct = Math.min(100, Math.round((item.inStock / Math.max(1, item.minStock * 2)) * 100));

                      return (
                        <TableRow key={item.id} className="border-zinc-800/60 hover:bg-zinc-900/50 transition-colors group">
                          {/* Image Thumbnail */}
                          <TableCell className="py-2.5 px-3">
                            <div
                              onClick={() => handleOpenDetails(item)}
                              className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 shadow-sm relative group cursor-pointer hover:border-blue-500 transition-colors"
                              title="ຄລິກເພື່ອກວດສອບຂໍ້ມູນສິນຄ້າ"
                            >
                              <img
                                src={item.image || resolveFallbackImage(item.name, item.category)}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          </TableCell>

                          {/* SKU & Barcode */}
                          <TableCell className="py-2.5 px-3 font-mono text-xs">
                            <div className="flex items-center gap-1 font-bold text-blue-400">
                              <span>{item.sku}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.sku, "SKU")}
                                className="text-zinc-500 hover:text-white p-0.5 rounded"
                                title="ຄັດລອກ SKU"
                              >
                                {copiedField === "SKU" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            {item.barcode && (
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1">
                                <span>{item.barcode}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.barcode!, "Barcode")}
                                  className="text-zinc-600 hover:text-white p-0.5 rounded"
                                  title="ຄັດລອກ Barcode"
                                >
                                  {copiedField === "Barcode" ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                </button>
                              </div>
                            )}
                          </TableCell>

                          {/* Name & Unit */}
                          <TableCell className="py-2.5 px-3">
                            <div
                              onClick={() => handleOpenDetails(item)}
                              className="font-bold text-white text-sm hover:text-blue-400 cursor-pointer transition-colors line-clamp-1"
                              title="ຄລິກເພື່ອກວດສອບຂໍ້ມູນສິນຄ້າລະອຽດ"
                            >
                              {item.name}
                            </div>
                            <span className="text-[11px] text-zinc-500 font-medium">
                              ໜ່ວຍນັບ: {item.unit}
                            </span>
                          </TableCell>

                          {/* Category & Location */}
                          <TableCell className="py-2.5 px-3">
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 text-[11px] font-medium inline-block truncate max-w-[130px]">
                                {item.category}
                              </span>
                              {item.location && (
                                <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                                  <span className="truncate max-w-[110px]">{item.location}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Stock Level Gauge */}
                          <TableCell className="py-2.5 px-3 w-36">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                {getStockBadge(item)}
                                <span className="text-[10px] font-mono text-zinc-400">
                                  ຕ່ຳ {item.minStock}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    item.inStock === 0
                                      ? "bg-rose-500 w-0"
                                      : item.inStock <= item.minStock
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${item.inStock === 0 ? 0 : Math.max(5, stockHealthPct)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>

                          {/* Cost vs Selling Price */}
                          <TableCell className="py-2.5 px-3 text-xs">
                            <div className="font-mono text-zinc-300 text-[11px]">
                              ທຶນ: <span className="font-bold">₭{item.costPrice.toLocaleString()}</span>
                            </div>
                            <div className="font-mono text-cyan-300 text-[11px] mt-0.5">
                              ຂາຍ: ₭{item.sellingPrice.toLocaleString()}{" "}
                              <span className="text-emerald-400 text-[10px]">(+{marginPct}%)</span>
                            </div>
                          </TableCell>

                          {/* Total Valuation */}
                          <TableCell className="py-2.5 px-3 text-emerald-400 font-mono font-bold text-xs">
                            ₭{(item.costPrice * item.inStock).toLocaleString()}
                          </TableCell>

                          {/* Sticky Actions Column: NEVER Cut Off! */}
                          <TableCell className="text-right py-2.5 px-3 sticky right-0 z-10 bg-zinc-950/95 backdrop-blur-md shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.6)]">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenDetails(item)}
                                className="px-2.5 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-bold transition-all flex items-center gap-1 active:scale-95 shrink-0"
                                title="ເບິ່ງຂໍ້ມູນສິນຄ້າລະອຽດ"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                <span>ຂໍ້ມູນ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAdjustModal(item)}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 text-xs font-bold transition-all flex items-center gap-1 active:scale-95 shrink-0"
                                title="ປັບປຸງສະຕັອກສິນຄ້າ"
                              >
                                <Scale className="w-3.5 h-3.5" />
                                <span>ປັບສະຕັອກ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(item)}
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-all shrink-0"
                                title="ລົບສິນຄ້າ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {displayedItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-zinc-500">
                          ບໍ່ພົບຂໍ້ມູນສິນຄ້າໃນຄັງ
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* PAGINATION CONTROLS */}
          <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/40">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              pageSizeOptions={[10, 25, 50, 100, 500]}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: PRODUCT INSPECTION MODAL (FULL WAREHOUSE PRODUCT PROFILE)        */}
      {/* ========================================================================= */}
      {detailsModalOpen && selectedProduct && (
        <div
          onClick={() => setDetailsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-blue-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl my-auto space-y-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5 text-blue-400" />
                    <span>ຂໍ້ມູນສິນຄ້າໃນຄັງ (Product Profile)</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono font-bold">
                    {selectedProduct.sku}
                  </span>
                  {getStockBadge(selectedProduct)}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">{selectedProduct.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content Grid: Left Visuals & Specs, Right Financials & History */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (5 cols): Images & Warehouse Identity */}
              <div className="lg:col-span-5 space-y-4">
                {/* Image Gallery */}
                <div className="space-y-2">
                  <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 group shadow-lg">
                    <img
                      src={
                        (selectedProduct.images && selectedProduct.images[activeGalleryIndex]) ||
                        selectedProduct.image ||
                        resolveFallbackImage(selectedProduct.name, selectedProduct.category)
                      }
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setZoomedImage({
                          url:
                            (selectedProduct.images && selectedProduct.images[activeGalleryIndex]) ||
                            selectedProduct.image ||
                            resolveFallbackImage(selectedProduct.name, selectedProduct.category),
                          name: selectedProduct.name
                        })
                      }
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/90 transition-all border border-white/20"
                      title="ຂະຫຍາຍຮູບພາບ"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thumbnail Strip (if multiple) */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {selectedProduct.images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveGalleryIndex(idx)}
                          className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                            activeGalleryIndex === idx
                              ? "border-blue-500 scale-105 shadow-md shadow-blue-500/30"
                              : "border-zinc-800 hover:border-zinc-600 opacity-70"
                          }`}
                        >
                          <img src={imgUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Warehouse & Logistics Spec Box */}
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5 text-xs">
                  <h4 className="font-extrabold text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ຂໍ້ມູນການຈັດເກັບ & ໂລຈິສຕິກສ໌</span>
                  </h4>

                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-400">ລະຫັດ SKU:</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-blue-400">
                      <span>{selectedProduct.sku}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedProduct.sku, "SKU")}
                        className="text-zinc-500 hover:text-white p-0.5 rounded"
                      >
                        {copiedField === "SKU" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-400">ລະຫັດບາໂຄ້ດ (Barcode):</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-zinc-200">
                      <span>{selectedProduct.barcode || "-"}</span>
                      {selectedProduct.barcode && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedProduct.barcode!, "Barcode")}
                          className="text-zinc-500 hover:text-white p-0.5 rounded"
                        >
                          {copiedField === "Barcode" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-400">ທີ່ຕັ້ງໃນສາງ (Location):</span>
                    <span className="font-bold text-cyan-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{selectedProduct.location || "Zone A-01"}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-400">ຜູ້ສະໜອງ (Supplier):</span>
                    <span className="font-bold text-zinc-300 truncate max-w-[160px]">
                      {selectedProduct.supplier || "ຕົວແທນຈຳໜ່າຍຫຼັກ"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-400">ໜ່ວຍນັບມາດຕະຖານ:</span>
                    <span className="font-bold text-white">{selectedProduct.unit}</span>
                  </div>
                </div>

                {/* Description Box */}
                {selectedProduct.description && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 text-xs space-y-1">
                    <span className="text-zinc-400 font-bold block text-[11px]">ລາຍລະອຽດສິນຄ້າ:</span>
                    <p className="text-zinc-300 leading-relaxed">{selectedProduct.description}</p>
                  </div>
                )}
              </div>

              {/* Right Column (7 cols): Valuation, Financials & Stock Movements */}
              <div className="lg:col-span-7 space-y-5">
                {/* 4 Financial & Inventory Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Current Stock */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 text-xs block">ສະຕັອກຄົງເຫຼືອປັດຈຸບັນ</span>
                    <div className="text-2xl font-black text-white">
                      {selectedProduct.inStock}{" "}
                      <span className="text-xs text-zinc-400 font-normal">{selectedProduct.unit}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      ຈຸດສັ່ງຊື້ຂັ້ນຕ່ຳ: <strong className="text-zinc-300">{selectedProduct.minStock} {selectedProduct.unit}</strong>
                    </div>
                  </div>

                  {/* Pricing & Margin */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 text-xs block">ລາຄາຂາຍ / ກຳໄລ</span>
                    <div className="text-xl font-black text-cyan-300">
                      ₭{selectedProduct.sellingPrice.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-bold">
                      ກຳໄລ: ₭{Math.max(0, selectedProduct.sellingPrice - selectedProduct.costPrice).toLocaleString()}{" "}
                      ({selectedProduct.sellingPrice > 0 ? Math.round(((selectedProduct.sellingPrice - selectedProduct.costPrice) / selectedProduct.sellingPrice) * 100) : 0}%)
                    </div>
                  </div>

                  {/* Unit Cost */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 text-xs block">ຕົ້ນທຶນສະເລ່ຍ/ໜ່ວຍ</span>
                    <div className="text-xl font-black text-zinc-200">
                      ₭{selectedProduct.costPrice.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-zinc-500">ໃຊ້ຄິດໄລ່ມູນຄ່າສາງ</div>
                  </div>

                  {/* Total Valuation */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-zinc-900/80 border border-emerald-500/30 space-y-1">
                    <span className="text-emerald-400 text-xs block font-bold">ມູນຄ່າສາງລວມ (Valuation)</span>
                    <div className="text-xl font-black text-emerald-300">
                      ₭{(selectedProduct.inStock * selectedProduct.costPrice).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      ມູນຄ່າຂາຍ: ₭{(selectedProduct.inStock * selectedProduct.sellingPrice).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Stock Movements Audit History */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <History className="w-4 h-4 text-blue-400" />
                      <span>ປະຫວັດການເຄື່ອນໄຫວສະຕັອກ (Live Movements & Audit Trail)</span>
                    </h4>
                    <span className="text-[11px] text-zinc-400">
                      {productMovements.length} ລາຍການຫຼ້າສຸດ
                    </span>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                    {isLoadingMovements ? (
                      <div className="py-8 flex items-center justify-center gap-2 text-zinc-400 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span>ກຳລັງໂຫລດປະຫວັດການເຄື່ອນໄຫວ...</span>
                      </div>
                    ) : productMovements.length > 0 ? (
                      <div className="divide-y divide-zinc-800/60 text-xs">
                        {productMovements.map((m) => (
                          <div key={m.id} className="p-2.5 sm:p-3 hover:bg-zinc-900/50 transition-colors flex items-center justify-between gap-3">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {getMovementBadge(m.type, m.quantity)}
                                <span className="text-zinc-300 font-medium truncate max-w-[200px]">
                                  {m.reason || "ບໍ່ໄດ້ລະບຸເຫດຜົນ"}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                ດຳເນີນການໂດຍ: <strong className="text-zinc-400">{m.user?.name || m.user?.email || "ລະບົບ"}</strong>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono text-zinc-400 text-[11px] block">
                                {formatDateTime(m.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-zinc-500 space-y-1">
                        <History className="w-6 h-6 mx-auto text-zinc-700" />
                        <p className="text-xs">ຍັງບໍ່ມີປະຫວັດການເຄື່ອນໄຫວສະຕັອກເທື່ອ</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href={`/dashboard/products/${selectedProduct.id}`}
                  className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-zinc-700 w-full sm:w-auto"
                >
                  <Edit className="w-3.5 h-3.5 text-zinc-400" />
                  <span>ແກ້ໄຂສິນຄ້າເຕັມ (Edit Product)</span>
                </Link>
                <Link
                  href="/dashboard/audit-logs"
                  className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-zinc-800 w-full sm:w-auto"
                >
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  <span>ປະຫວັດ Audit Logs</span>
                </Link>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl font-bold text-xs text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all flex-1 sm:flex-initial"
                >
                  ປິດ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenAdjustModal(selectedProduct);
                  }}
                  className="py-2.5 px-5 rounded-xl font-black text-xs bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30 flex items-center justify-center gap-2 transition-all active:scale-95 flex-1 sm:flex-initial"
                >
                  <Scale className="w-4 h-4 text-cyan-200" />
                  <span>ປັບສະຕັອກສິນຄ້ານີ້ (Adjust Stock)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SAFE STOCK ADJUSTMENT MODAL WITH WAREHOUSE INTEGRITY SAFEGUARD     */}
      {/* ========================================================================= */}
      {adjustModalOpen && itemToAdjust && (
        <div
          onClick={() => setAdjustModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-blue-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl my-auto space-y-4 max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    ປັບປຸງສະຕັອກສິນຄ້າ (Safe Stock Adjustment)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    ລະບົບຄວບຄຸມສະຕັອກລະດັບອົງກອນ • ບັນທຶກປະຫວັດ Audit Trail ຖາວອນ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Mini Identity Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700 shrink-0">
                <img
                  src={itemToAdjust.image || resolveFallbackImage(itemToAdjust.name, itemToAdjust.category)}
                  alt={itemToAdjust.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-mono text-xs font-bold text-blue-400">{itemToAdjust.sku}</span>
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-medium">
                    {itemToAdjust.category}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm truncate">{itemToAdjust.name}</h4>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  ສະຕັອກປັດຈຸບັນ: <strong className="text-white">{itemToAdjust.inStock}</strong> {itemToAdjust.unit} • ຕົ້ນທຶນ: ₭{itemToAdjust.costPrice.toLocaleString()}
                </div>
              </div>
            </div>

            {/* WARNING 1: WAREHOUSE INTEGRITY WARNING */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-left">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>ຄຳເຕືອນຄວາມປອດໄພຂອງຄັງສິນຄ້າ (Inventory Safeguard)</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                ການປັບສະຕັອກດ້ວຍມືຄວນໃຊ້ສະເພາະກໍລະນີ <strong>ກວດນັບຍອດສິນຄ້າຕົວຈິງ</strong> ຫຼື <strong>ແກ້ໄຂຍອດຜິດດ່ຽງ</strong> ເທົ່ານັ້ນ.
              </p>
              <div className="text-[11px] text-zinc-400 space-y-1 bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/80">
                <div className="flex items-start gap-1.5 text-rose-300">
                  <span className="shrink-0">•</span>
                  <span><strong>ຫ້າມໃຊ້ແທນການຂາຍ:</strong> ຖ້າຂາຍສິນຄ້າອອກ ຕ້ອງໃຊ້ລະບົບ POS ເພື່ອໃຫ້ຍອດຂາຍ ແລະ ບັນຊີຖືກຕ້ອງ</span>
                </div>
                <div className="flex items-start gap-1.5 text-cyan-300">
                  <span className="shrink-0">•</span>
                  <span><strong>ຫ້າມໃຊ້ແທນການຮັບສິນຄ້າ:</strong> ຖ້າຮັບສິນຄ້າຈາກຜູ້ສະໜອງ ຄວນອອກໃບສັ່ງຊື້ (PO) ຫຼື ໃບຮັບສິນຄ້າ</span>
                </div>
              </div>
            </div>

            {/* WARNING 2: AUDIT LOG NOTICE */}
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-left flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-extrabold text-blue-300">
                  ບັນທຶກປະຫວັດການແກ້ໄຂ (Audit Log) ອັດຕະໂນມັດ
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  ທຸກການປັບປ່ຽນຈະຖືກບັນທຶກລົງ Audit Log ຖາວອນ ພ້ອມລະບຸ: ຊື່ຜູ້ດຳເນີນການ, ເວລາ, ຈຳນວນປ່ຽນແປງ (Delta), ແລະ ເຫດຜົນ. ຂໍ້ມູນນີ້ບໍ່ສາມາດລຶບໄດ້.
                </p>
              </div>
            </div>

            {/* MODE SWITCHER */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider block">
                ວິທີການປັບປຸງສະຕັອກ (Adjustment Mode)
              </label>
              <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAdjustMode("EXACT")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    adjustMode === "EXACT"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>ກວດນັບຍອດຕົວຈິງ (Physical Count)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode("DELTA")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    adjustMode === "DELTA"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>ປັບເພີ່ມ / ຫຼຸດ (+/- Delta)</span>
                </button>
              </div>
            </div>

            {/* INPUT SECTION BASED ON MODE */}
            {adjustMode === "EXACT" ? (
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-zinc-300 block">
                  ລະບຸຈຳນວນທີ່ນັບໄດ້ຕົວຈິງ (Counted Stock) *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExactStockInput(Math.max(0, exactStockInput - 1))}
                    className="h-11 w-11 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-lg border border-zinc-700 shrink-0"
                  >
                    -
                  </button>
                  <Input
                    type="number"
                    min={0}
                    value={exactStockInput}
                    onChange={(e) => setExactStockInput(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-zinc-900 border-zinc-700 text-white rounded-2xl h-11 text-center text-xl font-black"
                  />
                  <button
                    type="button"
                    onClick={() => setExactStockInput(exactStockInput + 1)}
                    className="h-11 w-11 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-lg border border-zinc-700 shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-zinc-300 block">
                  ປັບເພີ່ມ ຫຼື ຫຼຸດຈຳນວນ (+/- Adjust)
                </label>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustDelta(adjustDelta - 10)}
                    className="h-10 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs border border-zinc-700"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustDelta(adjustDelta - 1)}
                    className="h-10 w-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-base border border-zinc-700"
                  >
                    -
                  </button>
                  <div className="text-2xl font-black text-cyan-400 w-24 text-center font-mono">
                    {adjustDelta > 0 ? `+${adjustDelta}` : adjustDelta}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdjustDelta(adjustDelta + 1)}
                    className="h-10 w-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-base border border-zinc-700"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustDelta(adjustDelta + 10)}
                    className="h-10 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs border border-zinc-700"
                  >
                    +10
                  </button>
                </div>
              </div>
            )}

            {/* CALCULATION & VALUATION IMPACT PREVIEW */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-zinc-400">
                <span>ສະຕັອກກ່ອນປັບ:</span>
                <span className="font-bold text-white">{itemToAdjust.inStock} {itemToAdjust.unit}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>ສະຕັອກໃໝ່ຫຼັງປັບ:</span>
                <span className="font-extrabold text-cyan-300 text-sm">
                  {targetStock} {itemToAdjust.unit}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-zinc-800/80">
                <span>ຜົນຕ່າງ (Delta):</span>
                <span
                  className={`font-mono font-black text-sm ${
                    effectiveDelta > 0
                      ? "text-emerald-400"
                      : effectiveDelta < 0
                      ? "text-rose-400"
                      : "text-zinc-500"
                  }`}
                >
                  {effectiveDelta > 0 ? `+${effectiveDelta}` : effectiveDelta} {itemToAdjust.unit}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-zinc-400">
                <span>ມູນຄ່າສາງທີ່ປ່ຽນແປງ:</span>
                <span className="font-mono text-zinc-300 font-bold">
                  {effectiveDelta !== 0
                    ? `₭${(effectiveDelta * itemToAdjust.costPrice).toLocaleString()}`
                    : "0 ₭"}
                </span>
              </div>
            </div>

            {/* MANDATORY REASON SELECTION */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider block">
                ເຫດຜົນການປັບປຸງສະຕັອກ (Reason - ບັງຄັບລະບຸ) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {REASON_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedReasonPreset(preset.value)}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold text-left transition-all border ${
                      selectedReasonPreset === preset.value
                        ? "bg-blue-600/30 text-blue-300 border-blue-500 shadow-sm"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <Input
                placeholder="ລາຍລະອຽດເພີ່ມເຕີມເຊັ່ນ: ພົບເຫັນສິນຄ້າແຕກ 2 ກ່ອງ ໃນແຖວ A..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white rounded-xl h-10 text-xs px-3"
              />
            </div>

            {/* MANDATORY SAFETY CONFIRMATION CHECKBOX */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors text-left">
              <input
                type="checkbox"
                checked={safetyConfirmed}
                onChange={(e) => setSafetyConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-zinc-700 text-blue-600 focus:ring-blue-500 bg-zinc-950 shrink-0"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  ຢືນຢັນຄວາມຖືກຕ້ອງ ແລະ ຮັບຊາບການບັນທຶກ Audit Log *
                </span>
                <span className="text-[11px] text-zinc-400 block mt-0.5 leading-relaxed">
                  ຂ້ອຍໄດ້ກວດສອບຍອດສິນຄ້າຕົວຈິງໃນສາງແລ້ວ ແລະ ເຂົ້າໃຈວ່າການປັບປ່ຽນນີ້ຈະມີຜົນຕໍ່ມູນຄ່າສາງ ແລະ ຈະຖືກບັນທຶກລົງປະຫວັດ Audit Log ຂອງລະບົບທັນທີ.
                </span>
              </div>
            </label>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all active:scale-95"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                disabled={!canSubmitAdjustment}
                onClick={handleConfirmAdjust}
                className={`flex-2 py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  canSubmitAdjustment
                    ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/30 border border-blue-400/40 cursor-pointer"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed opacity-60"
                }`}
              >
                {isAdjusting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ກຳລັງບັນທຶກ ແລະ ບັນທຶກ Audit Log...</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4" />
                    <span>
                      {effectiveDelta === 0
                        ? "ຍອດສະຕັອກບໍ່ມີການປ່ຽນແປງ"
                        : !safetyConfirmed
                        ? "ກະລຸນາກົດຕິກຢືນຢັນຄວາມປອດໄພກ່ອນ"
                        : "ຢືນຢັນການປັບສະຕັອກ & ບັນທຶກ Audit Log"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LIGHTBOX IMAGE ZOOM MODAL                                        */}
      {/* ========================================================================= */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-4 text-center"
          >
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-black mb-3">
              <img src={zoomedImage.url} alt={zoomedImage.name} className="w-full h-full object-contain" />
            </div>
            <h3 className="font-bold text-white text-base">{zoomedImage.name}</h3>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION MODAL                                        */}
      {/* ========================================================================= */}
      <ActionModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="ຢືນຢັນການລົບສິນຄ້າ? (Confirm Delete)"
        description={
          itemToDelete
            ? `ທ່ານກຳລັງຈະລົບລາຍການ "${itemToDelete.name}" (${itemToDelete.sku}) ອອກຈາກຄັງສິນຄ້າ. ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້.`
            : ""
        }
        icon="delete"
        variant="danger"
        confirmText="ຢືນຢັນການລົບ (Delete Now)"
        cancelText="ຍົກເລີກ"
        onConfirm={confirmDelete}
      />

      {/* ========================================================================= */}
      {/* MODAL 5: QUICK ADD ITEM MODAL                                             */}
      {/* ========================================================================= */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-blue-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-500/25 border border-blue-400/40">
                  <Warehouse className="w-3.5 h-3.5 text-cyan-200" />
                  <span>ເພີ່ມສິນຄ້າເຂົ້າສາງດ່ວນ</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-zinc-300 block mb-1.5 uppercase tracking-wider">
                  ຊື່ສິນຄ້າ / ວັດຖຸດິບ (Product Name) *
                </label>
                <Input
                  required
                  placeholder="ຕົວຢ່າງ: ຊາໄທພຣີມຽມ (500g)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-700/80 text-white rounded-2xl h-12 text-sm px-4 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-zinc-300 block mb-2 uppercase tracking-wider">
                  ໝວດໝູ່ (Category)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "ວັດຖຸດິບ", icon: Coffee },
                    { label: "ອາຫານ", icon: Utensils },
                    { label: "ເຄື່ອງດື່ມ", icon: CupSoda },
                    { label: "ອຸປະກອນ", icon: Package }
                  ].map((cat) => {
                    const IconComponent = cat.icon;
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setNewCategory(cat.label)}
                        className={`h-11 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                          newCategory === cat.label
                            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-400 shadow-md shadow-blue-500/30"
                            : "bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider">
                      ລະຫັດສິນຄ້າ (SKU)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const prefix = (newCategory || "SKU").slice(0, 3).toUpperCase();
                        const num = Math.floor(1000 + Math.random() * 9000);
                        setNewSku(`${prefix}-${num}`);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold"
                    >
                      ສ້າງ SKU
                    </button>
                  </div>
                  <Input
                    placeholder="SKU-BEV-100"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="bg-zinc-900/90 border-zinc-700/80 text-white rounded-2xl h-11 font-mono text-sm px-4"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-zinc-300 block mb-1.5 uppercase tracking-wider">
                    ລະຫັດບາໂຄ້ດ (Barcode)
                  </label>
                  <Input
                    placeholder="885901234..."
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    className="bg-zinc-900/90 border-zinc-700/80 text-white rounded-2xl h-11 font-mono text-sm px-4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-zinc-300 block mb-1.5 uppercase tracking-wider">
                    ຈຳນວນສະຕັອກ
                  </label>
                  <Input
                    required
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="bg-zinc-900/90 border-zinc-700/80 text-white rounded-2xl h-11 text-center text-lg font-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-zinc-300 block mb-1.5 uppercase tracking-wider">
                    ຕົ້ນທຶນ/ໜ່ວຍ (Cost ₭)
                  </label>
                  <Input
                    required
                    type="number"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(Number(e.target.value))}
                    className="bg-zinc-900/90 border-zinc-700/80 text-white rounded-2xl h-11 text-sm font-black px-4"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-zinc-300 block mb-1.5 uppercase tracking-wider">
                    ລາຄາຂາຍ (Price ₭)
                  </label>
                  <Input
                    required
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="bg-zinc-900/90 border-zinc-700/80 text-white rounded-2xl h-11 text-sm font-black px-4"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-zinc-300 block mb-1.5 uppercase tracking-wider">
                  ຮູບພາບສິນຄ້າ (Image URL - ຖ້າມີ)
                </label>
                <Input
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-700/80 text-white rounded-2xl h-11 text-xs px-4"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-2xl font-bold text-sm text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:text-white transition-all active:scale-95"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3.5 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/30 border border-blue-400/40 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 text-cyan-200" />
                  <span>ບັນທຶກສິນຄ້າເຂົ້າສາງ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATUS POPUP                                                              */}
      {/* ========================================================================= */}
      <StatusPopup
        isOpen={statusPopup.open}
        onClose={() => setStatusPopup({ ...statusPopup, open: false })}
        title={statusPopup.title}
        message={statusPopup.message}
        type={statusPopup.type}
      />

      {/* Camera Barcode / QR Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(code) => {
          setSearchQuery(code);
          setCurrentPage(1);
          toast.success(`ຄົ້ນຫາສິນຄ້າ: ${code}`);
        }}
        title="ສະແກນບາໂຄດສິນຄ້າໃນສາງ (Scan Inventory Barcode)"
        subtitle="ສ່ອງກ້ອງໃສ່ບາໂຄດ ຫຼື SKU ເທິງສິນຄ້າເພື່ອຄົ້ນຫາທັນທີ"
        placeholder="ຍິງເຄື່ອງສະແກນ ຫຼື ພິມລະຫັດ SKU..."
      />
    </div>
  );
}
