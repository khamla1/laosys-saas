"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart, Plus, Minus, X, CheckCircle2, ChevronRight, ShoppingBag,
  MapPin, Phone, User, Truck, Store as StoreIcon, Ticket, Sparkles,
  Loader2, Search, Star, Heart, ShieldCheck, Clock, CreditCard,
  Eye, Flame, PackageCheck, ArrowUpDown, LayoutGrid, Award, ArrowRight,
  Navigation, Tag, QrCode, Upload, Copy, Check, MessageCircle, PackageSearch,
  Printer, Share2, Gift, Zap, ThumbsUp, Receipt, Building2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import BannerCarousel from "@/components/BannerCarousel";
import { normalizeLaoPhone } from "@/lib/laoPhone";

function stripEmojis(text: string = "") {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const LAOS_PROVINCES = [
  "ນະຄອນຫຼວງວຽງຈັນ (Vientiane Capital)",
  "ຫຼວງພະບາງ (Luang Prabang)",
  "ຈຳປາສັກ (Champasak)",
  "ສະຫວັນນະເຂດ (Savannakhet)",
  "ຄຳມ່ວນ (Khammouane)",
  "ວຽງຈັນ (Vientiane Province)",
  "ອຸດົມໄຊ (Oudomxay)",
  "ບໍ່ແກ້ວ (Bokeo)",
  "ຫຼວງນ້ຳທາ (Luang Namtha)",
  "ຜົ້ງສາລີ (Phongsaly)",
  "ຫົວພັນ (Houaphanh)",
  "ຊຽງຂວາງ (Xieng Khouang)",
  "ໄຊຍະບູລີ (Xayabury)",
  "ໄຊສົມບູນ (Xaysomboun)",
  "ບໍລິຄຳໄຊ (Bolikhamsai)",
  "ສາລະວັນ (Salavan)",
  "ເຊກອງ (Sekong)",
  "ອັດຕະປື (Attapeu)"
];

const LAOS_LOGISTICS_CARRIERS = [
  { id: "ANOUSITH", name: "ອານຸສິດ Express", sub: "ຈັດສົ່ງດ່ວນທົ່ວປະເທດ (1-2 ວັນ)", badge: "ຍອດນິຍົມ" },
  { id: "HAL", name: "ຮຸ່ງອາລຸນ (HAL Logistics)", sub: "ສາຂາຄອບຄຸມທຸກແຂວງທົ່ວລາວ", badge: "ແນະນຳ" },
  { id: "MIXAY", name: "ມີໄຊ Express (Mixay)", sub: "ຂົນສົ່ງໄວ ປອດໄພ ກວດສອບໄດ້", badge: "" },
  { id: "MESSENGER", name: "ແມັສເຊັນເຈີ (ວຽງຈັນ)", sub: "ສົ່ງດ່ວນເຖິງໜ້າບ້ານພາຍໃນ 2 ຊມ.", badge: "ດ່ວນພິເສດ" },
  { id: "PICKUP", name: "ມາຮັບເອງທີ່ໜ້າຮ້ານ", sub: "ບໍ່ມີຄ່າຈັດສົ່ງ ຮັບສິນຄ້າໄດ້ທັນທີ", badge: "ຟຣີ" },
];

const CUSTOMER_REVIEWS = [
  {
    name: "ທ. ສົມພone ພົມມະວົງ",
    location: "ນະຄອນຫຼວງວຽງຈັນ",
    rating: 5,
    comment: "ສິນຄ້າຄຸນນະພາບດີຫຼາຍ ຕົງປົກ 100% ແພັກເຄື່ອງມາຢ່າງດີ ຈັດສົ່ງຜ່ານອານຸສິດໄວສຸດໆ ແນະນຳຮ້ານນີ້ເລີຍ!",
    date: "2 ມື້ກ່ອນ",
    verified: true,
  },
  {
    name: "ນ. ມະນີຈັນ วงศ์สวัสดิ์",
    location: "ຫຼວງພະບາງ",
    rating: 5,
    comment: "ຊຳລະເງິນຜ່ານ QR ສະດວກຫຼາຍ ແອັດມິນຕອບໄວ ບໍລິການປະທັບໃຈ ອຸດໜູນອີກແນ່ນອນເຈົ້າ.",
    date: "4 ມື້ກ່ອນ",
    verified: true,
  },
  {
    name: "ທ. ທະນູສິນ ໄຊຍະจักร",
    location: "ປາກເຊ, ຈຳປາສັກ",
    rating: 5,
    comment: "ລາຄາຄຸ້ມຄ່າ ໃຊ້ຄູປອງສ່ວນຫຼຸດໜ້າຮ້ານໄດ້ຈິງ ສົ່ງລົງປາກເຊພຽງ 2 ມື້ກໍໄດ້ຮັບເຄື່ອງແລ້ວ.",
    date: "ອາທິດກ່ອນ",
    verified: true,
  },
];

const RECENT_BUYERS_FEED = [
  { buyer: "ລູກຄ້າຈາກ ນະຄອນຫຼວງວຽງຈັນ", time: "2 ນາທີກ່ອນ" },
  { buyer: "ລູກຄ້າຈາກ ຫຼວງພະບາງ", time: "5 ນາທີກ່ອນ" },
  { buyer: "ລູກຄ້າຈາກ ສະຫວັນນະເຂດ", time: "9 ນາທີກ່ອນ" },
  { buyer: "ລູກຄ້າຈາກ ປາກເຊ, ຈຳປາສັກ", time: "14 ນາທີກ່ອນ" },
];

const FALLBACK_PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80",
];

function getProductFallbackImage(name: string = "", idx: number = 0) {
  const lower = name.toLowerCase();
  if (lower.includes("tote") || lower.includes("bag") || lower.includes("ກະເປົ໋າ")) {
    return "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80";
  }
  if (lower.includes("coffee") || lower.includes("tea") || lower.includes("ກາເຟ") || lower.includes("ຊາ")) {
    return "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80";
  }
  if (lower.includes("candle") || lower.includes("ທຽນ")) {
    return "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80";
  }
  if (lower.includes("stanley") || lower.includes("cup") || lower.includes("ແກ້ວ")) {
    return "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80";
  }
  return FALLBACK_PRODUCT_IMAGES[idx % FALLBACK_PRODUCT_IMAGES.length];
}

const FREE_SHIPPING_THRESHOLD = 200000;

export default function ShopClient({
  store,
  products,
  coupons = [],
  theme,
  tableId,
}: {
  store: any;
  products: any[];
  coupons?: any[];
  theme: string;
  tableId?: string;
}) {
  const catalogRef = useRef<HTMLDivElement>(null);
  const flashSaleRef = useRef<HTMLDivElement>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Filter, Search, Sort & Wishlist State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "PRICE_ASC" | "PRICE_DESC" | "NAME_ASC">("NEWEST");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Customer, Logistics & Payment State
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    village: "",
    district: "",
    province: "ນະຄອນຫຼວງວຽງຈັນ (Vientiane Capital)",
    shippingCarrier: "ANOUSITH",
    shippingMethod: "EXPRESS",
    paymentMethod: "QR_TRANSFER" as "QR_TRANSFER" | "CASH_ON_DELIVERY",
    note: "",
    address: "",
  });

  // Payment Slip Upload State
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string>("");
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Coupon State & Storefront Customer Account (1-Person-1-Coupon DB Synced)
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; id?: string } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [claimedCodes, setClaimedCodes] = useState<string[]>([]);
  const [usedCodes, setUsedCodes] = useState<string[]>([]);

  // Storefront Customer Member Login State (Per-Store Isolated)
  const [customerAccount, setCustomerAccount] = useState<any | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [loginPhoneInput, setLoginPhoneInput] = useState("");
  const [loginNameInput, setLoginNameInput] = useState("");
  const [isLoggingInCustomer, setIsLoggingInCustomer] = useState(false);
  const [pendingCouponToClaim, setPendingCouponToClaim] = useState<string | null>(null);

  const displayCoupons = useMemo(() => {
    if (Array.isArray(coupons) && coupons.length > 0) return coupons;
    return [
      {
        id: "default-welcome10",
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: 10,
        minOrderVal: 50000,
      },
      {
        id: "default-vip50k",
        code: "VIP50K",
        type: "FIXED",
        value: 50000,
        minOrderVal: 300000,
      },
    ];
  }, [coupons]);

  const parsedLoginPhone = useMemo(() => normalizeLaoPhone(loginPhoneInput), [loginPhoneInput]);
  const parsedCheckoutPhone = useMemo(() => normalizeLaoPhone(customerInfo.phone), [customerInfo.phone]);

  // Restore logged-in storefront customer on mount & sync with server DB
  useEffect(() => {
    const storageKey = `laosys_shop_member_${store.slug}`;
    const savedPhone = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (!savedPhone) return;

    fetch(`/api/shop/${store.slug}/customer?phone=${encodeURIComponent(savedPhone)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.customer) {
          setCustomerAccount(data.customer);
          setClaimedCodes(Array.isArray(data.customer.claimedCoupons) ? data.customer.claimedCoupons : []);
          setUsedCodes(Array.isArray(data.customer.usedCoupons) ? data.customer.usedCoupons : []);
          setCustomerInfo((prev) => ({
            ...prev,
            name: prev.name || data.customer.name || "",
            phone: data.customer.displayPhone || data.customer.phone || prev.phone,
          }));
        }
      })
      .catch(() => {});
  }, [store.slug]);

  // Order Receipt & Tracking State
  const [orderComplete, setOrderComplete] = useState(false);
  const [lastOrderReceipt, setLastOrderReceipt] = useState<any | null>(null);
  const [receiptPrintFormat, setReceiptPrintFormat] = useState<"a4" | "slip">("a4");
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackQuery, setTrackQuery] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState<any[]>([]);
  const [trackSearched, setTrackSearched] = useState(false);

  // Enhanced Product Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [modalVariant, setModalVariant] = useState<any | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [modalImageIdx, setModalImageIdx] = useState<number>(0);

  // Flash Sale Countdown & Live Purchase Social Proof State
  const [countdown, setCountdown] = useState({ hours: 3, mins: 42, secs: 18 });
  const [liveToastIdx, setLiveToastIdx] = useState(0);
  const [showLiveToast, setShowLiveToast] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        let { hours, mins, secs } = prev;
        if (secs > 0) {
          secs -= 1;
        } else {
          secs = 59;
          if (mins > 0) {
            mins -= 1;
          } else {
            mins = 59;
            hours = hours > 0 ? hours - 1 : 3;
          }
        }
        return { hours, mins, secs };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const cycle = setInterval(() => {
      setLiveToastIdx((prev) => (prev + 1) % RECENT_BUYERS_FEED.length);
    }, 9000);
    return () => clearInterval(cycle);
  }, [products.length]);

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setModalVariant(product?.variants?.[0] || null);
    setModalQty(1);
    setModalImageIdx(0);
  };

  // Theme styling helpers
  const isDarkBase = ["dark", "nature", "ocean", "luxury", "sunset", "colorful", "cyberpunk", "forest", "royal", "vintage"].includes(theme);

  const pageBg =
    theme === "dark" ? "bg-zinc-950 text-white" :
    theme === "colorful" ? "bg-gradient-to-br from-indigo-950 via-purple-950 to-zinc-950 text-white" :
    theme === "nature" ? "bg-gradient-to-br from-stone-950 via-emerald-950 to-stone-950 text-emerald-50" :
    theme === "ocean" ? "bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950 text-cyan-50" :
    theme === "luxury" ? "bg-zinc-950 text-amber-50" :
    theme === "sunset" ? "bg-gradient-to-br from-rose-950 via-orange-950 to-zinc-950 text-orange-50" :
    theme === "pastel" ? "bg-gradient-to-br from-pink-50/70 via-purple-50/60 to-blue-50/70 text-zinc-900" :
    theme === "cyberpunk" ? "bg-zinc-950 text-fuchsia-100" :
    theme === "coffee" ? "bg-stone-100 text-stone-900" :
    theme === "forest" ? "bg-emerald-950 text-emerald-50" :
    theme === "royal" ? "bg-indigo-950 text-amber-50" :
    theme === "vintage" ? "bg-stone-950 text-amber-50" :
    theme === "minimal" ? "bg-white text-zinc-900" :
    "bg-slate-50 text-slate-900";

  const headerBg = isDarkBase
    ? "bg-zinc-950/90 border-white/10 text-white"
    : "bg-white/95 border-slate-200/80 text-slate-900 shadow-sm";

  const cardBg = isDarkBase
    ? "bg-zinc-900/85 border border-white/10 hover:border-emerald-500/50 text-white shadow-xl shadow-black/20"
    : "bg-white border border-slate-200/80 hover:border-emerald-500/60 text-slate-900 shadow-md shadow-slate-200/50";

  const textColor = isDarkBase ? "text-white" : "text-slate-900";
  const subtextColor = isDarkBase ? "text-zinc-400" : "text-slate-500";

  // Extract E-Commerce customization metadata
  const ecomConfig = store.ecommerce || {};
  const announcementText = stripEmojis(
    ecomConfig.announcementText ||
      "ຈັດສົ່ງດ່ວນທົ່ວປະເທດລາວ (Anousith / HAL) • ຮັບປະກັນສິນຄ້າຄຸນນະພາບແທ້ 100% • ໃຊ້ຄູປອງສ່ວນຫຼຸດໄດ້ທີ່ໜ້າຊຳລະເງິນ"
  );
  const heroBadge = stripEmojis(ecomConfig.heroBadge || "OFFICIAL ONLINE STORE") || "OFFICIAL ONLINE STORE";
  const heroTitle = stripEmojis(ecomConfig.heroTitle || store.name || "Super Store Online");
  const heroSubtitle = stripEmojis(
    ecomConfig.heroSubtitle ||
      store.seo?.metaDescription ||
      `ຍິນດີຕ້ອນຮັບສູ່ຮ້ານ ${store.name} — ຄັດສັນສິນຄ້າຄຸນນະພາບພຣີມຽມ ພ້ອມບໍລິການຈັດສົ່ງດ່ວນທົ່ວປະເທດ ແລະ ຊຳລະເງິນອອນລາຍທີ່ປອດໄພ`
  );
  const contactPhone = stripEmojis(ecomConfig.contactPhone || store.phone || "020 5555 8888");
  const bankAccountName = ecomConfig.bankAccountName || store.name || "LAOSYS OFFICIAL STORE";
  const bankAccountNumber = ecomConfig.bankAccountNumber || "160-12-00-01234567-001";
  const bankName = ecomConfig.bankName || "ທະນາຄານການຄ້າຕ່າງປະເທດລາວ (BCEL One)";

  const banners = store.banners || [];

  // Extract unique product categories
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = (p.category || "ສິນຄ້າທົ່ວໄປ").trim();
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [products]);

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory === "WISHLIST") {
      list = list.filter((p) => wishlist.includes(p.id));
    } else if (selectedCategory === "BESTSELLER") {
      list = list.slice(0, Math.max(4, Math.ceil(list.length * 0.6)));
    } else if (selectedCategory !== "ALL") {
      list = list.filter((p) => (p.category || "ສິນຄ້າທົ່ວໄປ").trim() === selectedCategory);
    }

    if (sortBy === "PRICE_ASC") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "PRICE_DESC") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "NAME_ASC") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return list;
  }, [products, searchQuery, selectedCategory, sortBy, wishlist]);

  const toggleWishlist = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const getProductImage = (product: any, idx: number = 0) => {
    const rawImg = product?.images?.[0];
    if (!rawImg || brokenImages[product.id]) {
      return getProductFallbackImage(product?.name, idx);
    }
    return rawImg;
  };

  const addToCart = (
    product: any,
    variant: any = null,
    openCartImmediately = false,
    qtyToAdd = 1
  ) => {
    const existingIndex = cart.findIndex(
      (item) =>
        item.productId === product.id &&
        (variant ? item.variantId === variant.id : !item.variantId)
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += qtyToAdd;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          variantId: variant ? variant.id : null,
          name: product.name,
          variantName: variant ? variant.name : null,
          price: variant && variant.price !== null ? variant.price : product.price,
          quantity: qtyToAdd,
          image: getProductImage(product, 0),
        },
      ]);
    }
    if (openCartImmediately) {
      setCartOpen(true);
    } else {
      toast.success(`ເພີ່ມ "${product.name}" (x${qtyToAdd}) ລົງກະຕ່າແລ້ວ`);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const removeItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const finalNetAmount = Math.max(0, totalAmount - (appliedCoupon?.discountAmount || 0));
  const freeShippingProgress = Math.min(100, Math.round((totalAmount / FREE_SHIPPING_THRESHOLD) * 100));
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - totalAmount);

  const handleCustomerLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = normalizeLaoPhone(loginPhoneInput);
    if (!parsed.isValid) {
      toast.error(parsed.error || "ກະລຸນາປ້ອນເບີໂທລະສັບລາວໃຫ້ຖືກຕ້ອງ");
      return;
    }

    setIsLoggingInCustomer(true);
    try {
      const res = await fetch(`/api/shop/${store.slug}/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          phone: parsed.normalized,
          name: loginNameInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.customer) {
        toast.error(data.error || "ບໍ່ສາມາດເຂົ້າສູ່ລະບົບໄດ້");
        return;
      }

      const cust = data.customer;
      setCustomerAccount(cust);
      setClaimedCodes(Array.isArray(cust.claimedCoupons) ? cust.claimedCoupons : []);
      setUsedCodes(Array.isArray(cust.usedCoupons) ? cust.usedCoupons : []);
      setCustomerInfo((prev) => ({
        ...prev,
        name: cust.name && !cust.name.startsWith("ລູກຄ້າ ") ? cust.name : prev.name || cust.name,
        phone: cust.displayPhone || cust.phone,
      }));
      if (typeof window !== "undefined") {
        localStorage.setItem(`laosys_shop_member_${store.slug}`, cust.phone);
      }
      toast.success(`ຍິນດີຕ້ອນຮັບ ${cust.displayPhone}! ເຂົ້າສູ່ລະບົບສະມາຊິກຮ້ານ ${store.name} ສຳເລັດ`);

      if (pendingCouponToClaim) {
        const codeToClaim = pendingCouponToClaim;
        setPendingCouponToClaim(null);
        setLoginModalOpen(false);
        await executeClaimVoucherWithPhone(cust.phone, codeToClaim);
      } else {
        setLoginModalOpen(false);
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ລະບົບ");
    } finally {
      setIsLoggingInCustomer(false);
    }
  };

  const handleCustomerLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`laosys_shop_member_${store.slug}`);
    }
    setCustomerAccount(null);
    setClaimedCodes([]);
    setUsedCodes([]);
    setAppliedCoupon(null);
    setLoginPhoneInput("");
    setLoginNameInput("");
    setLoginModalOpen(false);
    toast.success("ອອກຈາກລະບົບສະມາຊິກແລ້ວ");
  };

  const executeClaimVoucherWithPhone = async (phone: string, code: string) => {
    const cleanCode = code.trim().toUpperCase();
    try {
      const res = await fetch(`/api/shop/${store.slug}/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim_coupon",
          phone,
          couponCode: cleanCode,
        }),
      });
      const data = await res.json();
      if (data.customer) {
        setCustomerAccount(data.customer);
        setClaimedCodes(Array.isArray(data.customer.claimedCoupons) ? data.customer.claimedCoupons : []);
        setUsedCodes(Array.isArray(data.customer.usedCoupons) ? data.customer.usedCoupons : []);
      }

      if (res.ok && data.success) {
        setCouponCode(cleanCode);
        navigator.clipboard?.writeText(cleanCode).catch(() => {});
        toast.success(data.message || `ເກັບຄູປອງ "${cleanCode}" ສຳເລັດ! (1 ຄົນ / 1 ສິດ)`);
      } else {
        if (data.alreadyClaimed) {
          setCouponCode(cleanCode);
          toast.info(data.error || `ທ່ານເກັບຄູປອງ ${cleanCode} ໄວ້ແລ້ວ ສາມາດກົດໃຊ້ໃນກະຕ່າໄດ້ເລີຍ!`);
        } else {
          toast.error(data.error || "ບໍ່ສາມາດເກັບຄູປອງນີ້ໄດ້");
        }
      }
    } catch {
      toast.error("ບໍ່ສາມາດເຊື່ອມຕໍ່ລະບົບເກັບຄູປອງໄດ້");
    }
  };

  const handleClaimVoucher = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!customerAccount?.phone) {
      setPendingCouponToClaim(cleanCode);
      setLoginModalOpen(true);
      toast.info("ກະລຸນາປ້ອນເບີໂທລະສັບ ເພື່ອຮັບສິດເກັບຄູປອງ (ຈຳກັດ 1 ເບີ / 1 ຄັ້ງ)");
      return;
    }
    await executeClaimVoucherWithPhone(customerAccount.phone, cleanCode);
  };

  const handleValidateCoupon = async (overrideCode?: string) => {
    const targetCode = (overrideCode ?? couponCode).trim().toUpperCase();
    if (!targetCode) return;

    const activePhone = customerAccount?.phone || customerInfo.phone;
    const parsedPhone = normalizeLaoPhone(activePhone);
    if (!parsedPhone.isValid) {
      setPendingCouponToClaim(targetCode);
      setLoginModalOpen(true);
      toast.error("ກະລຸນາປ້ອນເບີໂທລະສັບກ່ອນໃຊ້ຄູປອງສ່ວນຫຼຸດ (ຈຳກັດ 1 ເບີ / 1 ຄັ້ງ)");
      return;
    }

    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch(`/api/shop/${store.slug}/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: targetCode,
          totalAmount,
          customerPhone: parsedPhone.normalized,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedCoupon(data.coupon);
        setCouponCode("");
        toast.success(`ໃຊ້ຄູປອງສ່ວນຫຼຸດ -₭${data.coupon.discountAmount.toLocaleString()} ສຳເລັດ!`);
      } else {
        if (data.requireLogin) {
          setPendingCouponToClaim(targetCode);
          setLoginModalOpen(true);
        }
        setCouponError(data.error || "ລະຫັດຄູປອງບໍ່ຖືກຕ້ອງ");
        toast.error(data.error || "ລະຫັດຄູປອງບໍ່ຖືກຕ້ອງ");
      }
    } catch {
      setCouponError("ບໍ່ສາມາດກວດສອບຄູປອງໄດ້");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleUploadSlip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSlip(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storeSlug", organization.slug || "");
      formData.append("customerPhone", customerPhone || memberSession?.phone || "");
      formData.append("customerName", customerName || memberSession?.name || "");
      formData.append("category", "payment-slips");
      const res = await fetch("/api/public-upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setPaymentSlipUrl(data.url);
        toast.success("ອັບໂຫຼດຮູບສະລິບໂອນເງິນສຳເລັດແລ້ວ!");
      } else {
        toast.error(data.error || "ອັບໂຫຼດຮູບສະລິບບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການອັບໂຫຼດຮູບສະລິບ");
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const handleTrackOrders = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? trackQuery).trim();
    if (!q || q.length < 3) {
      toast.error("ກະລຸນາປ້ອນເບີໂທ ຫຼື ລະຫັດບິນຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ");
      return;
    }
    setIsTracking(true);
    setTrackSearched(true);
    try {
      const res = await fetch(`/api/shop/${store.slug}/track?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok && data.orders) {
        setTrackedOrders(data.orders);
      } else {
        setTrackedOrders([]);
        toast.error(data.error || "ບໍ່ພົບຂໍ້ມູນຄຳສັ່ງຊື້");
      }
    } catch {
      toast.error("ບໍ່ສາມາດກວດສອບສະຖານະຄຳສັ່ງຊື້ໄດ້");
    } finally {
      setIsTracking(false);
    }
  };

  const openTrackingModal = () => {
    setTrackOpen(true);
    const targetPhone =
      customerAccount?.phone ||
      (typeof window !== "undefined"
        ? localStorage.getItem(`laosys_shop_member_${store.slug}`)
        : null);

    if (targetPhone) {
      setTrackQuery(targetPhone);
      handleTrackOrders(targetPhone);
    } else {
      try {
        const savedRecent =
          typeof window !== "undefined"
            ? localStorage.getItem(`laosys_recent_order_${store.slug}`)
            : null;
        if (savedRecent) {
          const parsed = JSON.parse(savedRecent);
          if (parsed?.shortId) {
            setTrackQuery(parsed.shortId);
            handleTrackOrders(parsed.shortId);
          } else if (parsed?.phone) {
            setTrackQuery(parsed.phone);
            handleTrackOrders(parsed.phone);
          }
        }
      } catch {}
    }
  };

  const handleCheckout = async () => {
    if (!customerInfo.name || (!tableId && !customerInfo.phone)) {
      toast.error(
        tableId
          ? "ກະລຸນາປ້ອນຊື່ຜູ້ສັ່ງ"
          : "ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທຕິດຕໍ່ໃຫ້ຄົບຖ້ວນ"
      );
      return;
    }

    if (
      !tableId &&
      customerInfo.shippingCarrier !== "PICKUP" &&
      (!customerInfo.village || !customerInfo.district)
    ) {
      toast.error("ກະລຸນາປ້ອນບ້ານ ແລະ ເມືອງສຳລັບຈັດສົ່ງໃຫ້ຄົບຖ້ວນ");
      return;
    }

    const fullAddressString = tableId
      ? customerInfo.address
      : customerInfo.shippingCarrier === "PICKUP"
      ? "ມາຮັບສິນຄ້າເອງທີ່ໜ້າຮ້ານ (Store Pickup)"
      : [
          customerInfo.village ? `ບ້ານ ${customerInfo.village}` : null,
          customerInfo.district ? `ເມືອງ ${customerInfo.district}` : null,
          customerInfo.province ? `ແຂວງ ${customerInfo.province}` : null,
          customerInfo.address ? `(ສາຂາ/ລາຍລະອຽດ: ${customerInfo.address})` : null,
        ]
          .filter(Boolean)
          .join(", ");

    setIsCheckingOut(true);
    try {
      const res = await fetch(`/api/shop/${store.slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone || undefined,
          customerAddress: fullAddressString || undefined,
          shippingCarrier: customerInfo.shippingCarrier || "ANOUSITH",
          shippingMethod: customerInfo.shippingCarrier === "PICKUP" ? "PICKUP" : customerInfo.shippingMethod || "EXPRESS",
          paymentMethod: customerInfo.paymentMethod,
          paymentSlipUrl: paymentSlipUrl || undefined,
          note: customerInfo.note || undefined,
          couponCode: appliedCoupon?.code || undefined,
          couponId: appliedCoupon?.id || undefined,
          discountAmount: appliedCoupon?.discountAmount || 0,
          tableId: tableId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setLastOrderReceipt(
          data.receipt || {
            id: data.orderId,
            shortId: (data.orderId || "000000").slice(-6).toUpperCase(),
            storeName: store.name,
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            customerAddress: fullAddressString,
            paymentMethod: customerInfo.paymentMethod,
            paymentSlipUrl: paymentSlipUrl || null,
            shippingCarrier: customerInfo.shippingCarrier,
            subtotalAmount: totalAmount,
            discountAmount: appliedCoupon?.discountAmount || 0,
            couponCode: appliedCoupon?.code || null,
            totalAmount: finalNetAmount,
            createdAt: new Date().toISOString(),
            items: cart,
          }
        );
        if (data.customer) {
          setCustomerAccount(data.customer);
          setClaimedCodes(Array.isArray(data.customer.claimedCoupons) ? data.customer.claimedCoupons : []);
          setUsedCodes(Array.isArray(data.customer.usedCoupons) ? data.customer.usedCoupons : []);
          if (typeof window !== "undefined") {
            localStorage.setItem(`laosys_shop_member_${store.slug}`, data.customer.phone);
          }
        }
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              `laosys_recent_order_${store.slug}`,
              JSON.stringify({
                id: data.orderId,
                shortId: (data.orderId || "000000").slice(-6).toUpperCase(),
                phone: customerInfo.phone,
                name: customerInfo.name,
                total: finalNetAmount,
                date: new Date().toISOString(),
              })
            );
          } catch {}
        }
        setCart([]);
        setAppliedCoupon(null);
        setPaymentSlipUrl("");
        setCartOpen(false);
        setOrderComplete(true);
        toast.success("ສັ່ງຊື້ສິນຄ້າສຳເລັດແລ້ວ!");
      } else {
        toast.error(data.error || "ສັ່ງຊື້ບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການສັ່ງຊື້");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const featuredProduct = products[0] || null;
  const flashSaleProducts = useMemo(() => products.slice(0, 4), [products]);
  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return products
      .filter((p) => p.id !== selectedProduct.id)
      .sort((a, b) => (a.category === selectedProduct.category ? -1 : 1))
      .slice(0, 3);
  }, [products, selectedProduct]);

  const cleanWhatsAppNumber = useMemo(() => {
    const digits = contactPhone.replace(/[^0-9]/g, "");
    if (digits.startsWith("856")) return digits;
    if (digits.startsWith("020")) return `856${digits.slice(1)}`;
    if (digits.startsWith("20")) return `856${digits}`;
    return `8562055558888`;
  }, [contactPhone]);

  // ============================================================================
  // DIGITAL ORDER RECEIPT VIEW (AFTER CHECKOUT - PROFESSIONAL PRINTABLE INVOICE/SLIP)
  // ============================================================================
  if (orderComplete && lastOrderReceipt) {
    const whatsappConfirmText = encodeURIComponent(
      `ສະບາຍດີຮ້ານ ${store.name}!
ຂ້ອຍຫາກໍສັ່ງຊື້ສິນຄ້າອອນລາຍ:
• ລະຫັດບິນ: #${lastOrderReceipt.shortId}
• ຊື່ລູກຄ້າ: ${lastOrderReceipt.customerName}
• ເບີໂທ: ${lastOrderReceipt.customerPhone || "-"}
• ຍອດຊຳລະສຸດທິ: ₭${Number(lastOrderReceipt.totalAmount || 0).toLocaleString()}
• ການຊຳລະ: ${lastOrderReceipt.paymentMethod === "QR_TRANSFER" ? "ໂອນຜ່ານ QR ທະນາຄານ" : "ເກັບເງິນປາຍທາງ (COD)"}`
    );

    const formattedOrderDate = new Date(lastOrderReceipt.createdAt || Date.now()).toLocaleDateString("lo-LA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className={`min-h-screen ${pageBg} py-8 px-4 flex flex-col items-center justify-start`}>
        {/* ── Strict Print Styles (Hides all UI, displays ONLY the pure white invoice document) ── */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                html, body {
                  background: #ffffff !important;
                  color: #000000 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body * {
                  visibility: hidden !important;
                }
                #printable-receipt-doc, #printable-receipt-doc * {
                  visibility: visible !important;
                }
                #printable-receipt-doc {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 auto !important;
                  padding: 10mm !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                .no-print {
                  display: none !important;
                  visibility: hidden !important;
                }
                @page {
                  size: ${receiptPrintFormat === "slip" ? "80mm auto" : "A4 portrait"};
                  margin: ${receiptPrintFormat === "slip" ? "0" : "10mm"};
                }
              }
            `,
          }}
        />

        {/* ── On-Screen Control Bar (Hidden when printing) ── */}
        <div className="no-print w-full max-w-4xl mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-zinc-900/90 border border-white/10 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>ສັ່ງຊື້ສິນຄ້າສຳເລັດແລ້ວ!</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                    #{lastOrderReceipt.shortId}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  ໃບບິນຢືນຢັນຄຳສັ່ງຊື້ອອນລາຍ (ເລືອກຮູບແບບໃບບິນ ແລະ ກົດພິມ/ບັນທຶກ PDF)
                </p>
              </div>
            </div>

            {/* Receipt Format Switcher (A4 vs Slip 80mm) */}
            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setReceiptPrintFormat("a4")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  receiptPrintFormat === "a4"
                    ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ໃບໃຫຍ່ A4 (Invoice)
              </button>
              <button
                type="button"
                onClick={() => setReceiptPrintFormat("slip")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  receiptPrintFormat === "slip"
                    ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ບິນນ້ອຍ 80mm (POS Slip)
              </button>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <Button
              type="button"
              onClick={() => window.print()}
              className="h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>ພິມໃບບິນ (Print / Save PDF)</span>
            </Button>

            <a
              href={`https://wa.me/${cleanWhatsAppNumber}?text=${whatsappConfirmText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>ສົ່ງບິນເຂົ້າ WhatsApp</span>
            </a>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const code = lastOrderReceipt.shortId;
                setOrderComplete(false);
                setTrackQuery(code);
                setTrackOpen(true);
                handleTrackOrders(code);
              }}
              className="h-12 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <PackageSearch className="w-4 h-4 text-emerald-500" />
              <span>ຕິດຕາມພັດສະດຸ</span>
            </Button>

            <Button
              type="button"
              onClick={() => setOrderComplete(false)}
              className="h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold"
            >
              ກັບໄປເລືອກຊື້ສິນຄ້າຕໍ່
            </Button>
          </div>
        </div>

        {/* ── ACTUAL PRINTABLE DOCUMENT (White Paper Invoice) ── */}
        <div
          id="printable-receipt-doc"
          className={`bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-300 font-sans mx-auto transition-all ${
            receiptPrintFormat === "slip"
              ? "w-full max-w-[80mm] p-4 text-xs font-mono"
              : "w-full max-w-4xl p-8 sm:p-12 text-sm"
          }`}
        >
          {receiptPrintFormat === "a4" ? (
            /* ======================================================== */
            /* A4 FORMAL TAX INVOICE & ORDER RECEIPT                    */
            /* ======================================================== */
            <div className="space-y-6">
              {/* Header: Store Info + Document Title */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-800 pb-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-sm">
                      S
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {store.name}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    ຮ້ານຄ້າອອນລາຍຢ່າງເປັນທາງການ • ຈັດສົ່ງດ່ວນທົ່ວປະເທດລາວ
                  </p>
                  <p className="text-xs text-slate-600">
                    <strong>ໂທ / WhatsApp:</strong> {contactPhone}
                  </p>
                  {store.address && (
                    <p className="text-xs text-slate-600">
                      <strong>ທີ່ຢູ່ຮ້ານ:</strong> {store.address}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="inline-block px-3 py-1 rounded bg-slate-900 text-white text-xs font-black uppercase tracking-wider mb-1">
                    ໃບບິນຮັບເງິນ / ໃບສົ່ງສິນຄ້າ
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    OFFICIAL ORDER RECEIPT
                  </p>
                  <p className="text-base font-black font-mono text-emerald-700">
                    ເລກທີບິນ: #{lastOrderReceipt.shortId}
                  </p>
                  <p className="text-xs text-slate-600">
                    <strong>ວັນທີ:</strong> {formattedOrderDate}
                  </p>
                  <p className="text-xs text-slate-600">
                    <strong>ສະຖານະ:</strong> <span className="font-bold text-emerald-700">ຢືນຢັນຄຳສັ່ງຊື້ສຳເລັດ</span>
                  </p>
                </div>
              </div>

              {/* Customer & Shipping Details Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/80 space-y-1.5 text-xs">
                  <p className="font-black text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                    ຂໍ້ມູນລູກຄ້າ (Bill To):
                  </p>
                  <p><span className="text-slate-500">ຊື່ລູກຄ້າ:</span> <strong className="text-slate-900 text-sm">{lastOrderReceipt.customerName}</strong></p>
                  <p><span className="text-slate-500">ເບີໂທຕິດຕໍ່:</span> <strong className="font-mono">{lastOrderReceipt.customerPhone || "-"}</strong></p>
                  <p><span className="text-slate-500">ວິທີຊຳລະເງິນ:</span> <strong className="text-emerald-800">{lastOrderReceipt.paymentMethod === "QR_TRANSFER" ? "ໂອນຜ່ານ QR ທະນາຄານ (BCEL One)" : "ເກັບເງິນປາຍທາງ (COD)"}</strong></p>
                </div>

                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/80 space-y-1.5 text-xs">
                  <p className="font-black text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1">
                    ຂໍ້ມູນການຈັດສົ່ງ (Ship To):
                  </p>
                  <p><span className="text-slate-500">ບໍລິສັດຂົນສົ່ງ:</span> <strong className="text-slate-900">{lastOrderReceipt.shippingCarrier || "ANOUSITH"}</strong></p>
                  <p><span className="text-slate-500">ຮູບແບບ:</span> <strong>{lastOrderReceipt.shippingMethod || "EXPRESS"}</strong></p>
                  <p><span className="text-slate-500">ທີ່ຢູ່ຈັດສົ່ງ:</span> <strong className="text-slate-900">{lastOrderReceipt.customerAddress || "ມາຮັບສິນຄ້າເອງທີ່ໜ້າຮ້ານ"}</strong></p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 font-black">
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-12">ລ/ດ</th>
                      <th className="py-2.5 px-4 text-left border-r border-slate-300">ລາຍການສິນຄ້າ (Item Description)</th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-300 w-20">ຈຳນວນ</th>
                      <th className="py-2.5 px-4 text-right border-r border-slate-300 w-32">ລາຄາ/ໜ່ວຍ</th>
                      <th className="py-2.5 px-4 text-right w-36">ລວມເງິນ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(lastOrderReceipt.items || []).map((it: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 border-r border-slate-200 font-semibold text-slate-900">
                          <div>{it.name}</div>
                          {it.variantName && (
                            <span className="text-[11px] text-slate-500 font-normal">
                              ຕົວເລືອກ: {it.variantName}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 font-bold">
                          {it.quantity}
                        </td>
                        <td className="py-2.5 px-4 text-right border-r border-slate-200 font-mono">
                          ₭{Number(it.price).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-black font-mono">
                          ₭{(Number(it.price) * it.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals Breakdown */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
                <div className="space-y-2 text-xs text-slate-600 max-w-sm">
                  <p className="font-bold text-slate-900">ໝາຍເຫດ & ເງື່ອນໄຂ:</p>
                  <p>• ກະລຸນາກວດສອບສິນຄ້າທັນທີທີ່ໄດ້ຮັບຈາກພະນັກງານຂົນສົ່ງ.</p>
                  <p>• ສິນຄ້າຮັບປະກັນຄຸນນະພາບແທ້ 100% ຕາມນະໂຍບາຍຂອງຮ້ານ {store.name}.</p>
                  <p>• ສາມາດນຳເລກບິນ <strong>#{lastOrderReceipt.shortId}</strong> ໄປກວດສອບສະຖານະພັດສະດຸໄດ້ຕະຫຼອດ 24 ຊມ.</p>
                </div>

                <div className="w-full sm:w-80 space-y-2 text-xs border border-slate-300 rounded-xl p-4 bg-slate-50">
                  <div className="flex justify-between text-slate-700">
                    <span>ຍອດລວມສິນຄ້າ (Subtotal):</span>
                    <span className="font-mono font-bold">₭{Number(lastOrderReceipt.subtotalAmount || lastOrderReceipt.totalAmount).toLocaleString()}</span>
                  </div>
                  {lastOrderReceipt.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>ສ່ວນຫຼຸດ ({lastOrderReceipt.couponCode || "ຄູປອງ"}):</span>
                      <span className="font-mono">-₭{Number(lastOrderReceipt.discountAmount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700">
                    <span>ຄ່າຈັດສົ່ງ ({lastOrderReceipt.shippingCarrier}):</span>
                    <span className="font-bold text-emerald-700">ສົ່ງຟຣີ</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t-2 border-slate-800 text-sm font-black text-slate-950">
                    <span>ຍອດຊຳລະສຸດທິ:</span>
                    <span className="text-xl font-black font-mono text-emerald-800">
                      ₭{Number(lastOrderReceipt.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures & Verification QR */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-300 text-xs items-end">
                <div className="flex flex-col items-center">
                  <QRCodeSVG
                    value={`LAOSYS_ORDER|${lastOrderReceipt.id}|${lastOrderReceipt.shortId}|${lastOrderReceipt.totalAmount}`}
                    size={80}
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-1">VERIFY #{lastOrderReceipt.shortId}</span>
                </div>

                <div className="text-center space-y-8">
                  <p className="text-slate-500">ລາຍເຊັນຜູ້ຮັບສິນຄ້າ (Customer):</p>
                  <div className="border-b border-slate-400 w-36 mx-auto"></div>
                  <p className="text-[11px] text-slate-600">ວັນທີ: ___/___/2026</p>
                </div>

                <div className="text-center space-y-8">
                  <p className="text-slate-500">ຜູ້ຈັດການ / ພະນັກງານ (Authorized):</p>
                  <div className="border-b border-slate-400 w-36 mx-auto"></div>
                  <p className="text-[11px] text-slate-600">ຮ້ານ {store.name}</p>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* 80mm THERMAL POS RECEIPT SLIP                            */
            /* ======================================================== */
            <div className="space-y-3 text-center">
              <div className="border-b border-dashed border-slate-400 pb-2">
                <h2 className="font-black text-sm uppercase tracking-wide">{store.name}</h2>
                <p className="text-[10px] text-slate-600">ໃບບິນຮັບເງິນ / ໃບສົ່ງສິນຄ້າ (RECEIPT)</p>
                <p className="text-[10px] text-slate-600 font-mono">ບິນເລກທີ: #{lastOrderReceipt.shortId}</p>
                <p className="text-[9px] text-slate-500">{formattedOrderDate}</p>
              </div>

              <div className="text-left space-y-1 py-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">ລູກຄ້າ:</span>
                  <span className="font-bold">{lastOrderReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ເບີໂທ:</span>
                  <span className="font-mono">{lastOrderReceipt.customerPhone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ຂົນສົ່ງ:</span>
                  <span>{lastOrderReceipt.shippingCarrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ຊຳລະ:</span>
                  <span className="font-bold">{lastOrderReceipt.paymentMethod === "QR_TRANSFER" ? "QR ທະນາຄານ" : "COD ປາຍທາງ"}</span>
                </div>
                {lastOrderReceipt.customerAddress && (
                  <p className="text-[10px] text-slate-600 pt-1 border-t border-dotted">
                    <strong>ທີ່ຢູ່:</strong> {lastOrderReceipt.customerAddress}
                  </p>
                )}
              </div>

              <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1.5 text-left text-[11px]">
                {(lastOrderReceipt.items || []).map((it: any, i: number) => (
                  <div key={i} className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold line-clamp-1">{it.name}</p>
                      {it.variantName && <p className="text-[9px] text-slate-500">{it.variantName}</p>}
                      <p className="text-[9px] text-slate-500 font-mono">
                        {it.quantity} x ₭{Number(it.price).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-black font-mono shrink-0">
                      ₭{(Number(it.price) * it.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-left text-[11px] pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">ຍອດລວມ:</span>
                  <span className="font-mono font-bold">₭{Number(lastOrderReceipt.subtotalAmount || lastOrderReceipt.totalAmount).toLocaleString()}</span>
                </div>
                {lastOrderReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>ສ່ວນຫຼຸດ:</span>
                    <span className="font-mono">-₭{Number(lastOrderReceipt.discountAmount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-400">
                  <span>ຍອດສຸດທິ:</span>
                  <span className="font-mono text-base text-black">
                    ₭{Number(lastOrderReceipt.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-3 flex flex-col items-center gap-1">
                <QRCodeSVG
                  value={`LAOSYS_ORDER|${lastOrderReceipt.id}|${lastOrderReceipt.shortId}|${lastOrderReceipt.totalAmount}`}
                  size={65}
                />
                <p className="text-[10px] text-slate-600 font-bold mt-1">ຂອບໃຈທີ່ອຸດໜູນຮ້ານ {store.name}</p>
                <p className="text-[8px] text-slate-500">Powered by LAOSYS</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${pageBg} transition-colors duration-300`}>
      {/* 1. TOP E-COMMERCE ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white text-xs py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
          <div className="font-semibold tracking-wide flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
            {announcementText.split("•").map((part, idx) => {
              const IconComp = idx === 0 ? Truck : idx === 1 ? ShieldCheck : Ticket;
              return (
                <span key={idx} className="inline-flex items-center gap-1.5">
                  <IconComp className="w-3.5 h-3.5 shrink-0 text-emerald-100 stroke-[1.75]" />
                  <span>{part.trim()}</span>
                </span>
              );
            })}
          </div>
          <div className="hidden md:flex items-center gap-4 text-[11px] font-medium text-emerald-50 shrink-0">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 stroke-[1.75]" /> ໂທ/WhatsApp: {contactPhone}
            </span>
            <span className="opacity-40">|</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 stroke-[1.75]" />
              ເປີດຮັບອໍເດີອອນລາຍ 24 ຊມ.
            </span>
          </div>
        </div>
      </div>

      {/* 2. STICKY E-COMMERCE NAVBAR */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${headerBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
          {/* Brand Logo & Store Name */}
          <div
            onClick={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <StoreIcon className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-xl tracking-tight">
                  {store.name}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 stroke-[1.75]" /> Official Mall
                </span>
              </div>
              <p className={`text-[11px] ${subtextColor} hidden sm:block`}>
                ຮ້ານຄ້າອອນລາຍຢ່າງເປັນທາງການ • ຈັດສົ່ງທົ່ວປະເທດ
              </p>
            </div>
          </div>

          {/* Center Search Bar */}
          <div className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <Search className={`w-4 h-4 stroke-[1.75] absolute left-4 top-1/2 -translate-y-1/2 ${subtextColor}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`ຄົ້ນຫາສິນຄ້າໃນຮ້ານ ${store.name}...`}
                className={`w-full h-11 pl-11 pr-10 rounded-full text-sm border outline-none transition-all ${
                  isDarkBase
                    ? "bg-zinc-900/90 border-white/15 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                    : "bg-slate-100/90 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="w-4 h-4 stroke-[1.75]" />
                </button>
              )}
            </div>
          </div>

          {/* Right Actions: Member Login, Track Order, Wishlist & Shopping Cart */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Vouchers Center Button */}
            <button
              type="button"
              onClick={() => setVoucherModalOpen(true)}
              className={`h-11 px-3.5 rounded-full border flex items-center gap-1.5 text-xs font-bold transition-all ${
                isDarkBase
                  ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400"
                  : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700"
              }`}
              title="ສູນລວມຄູປອງສ່ວນຫຼຸດ (Vouchers)"
            >
              <Ticket className="w-4 h-4 text-emerald-500 stroke-[2]" />
              <span className="hidden sm:inline">ຄູປອງ ({displayCoupons.length})</span>
            </button>

            {/* Member Phone Login / Profile Button */}
            <button
              type="button"
              onClick={() => {
                if (customerAccount?.phone) {
                  setLoginPhoneInput(customerAccount.displayPhone || customerAccount.phone);
                  setLoginNameInput(customerAccount.name || "");
                }
                setLoginModalOpen(true);
              }}
              className={`h-11 px-3.5 rounded-full border flex items-center gap-1.5 text-xs font-bold transition-all ${
                customerAccount
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25"
                  : isDarkBase
                  ? "bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25 text-amber-300"
                  : "bg-amber-50 border-amber-300 hover:bg-amber-100 text-amber-800"
              }`}
              title="ເຂົ້າສູ່ລະບົບສະມາຊິກດ້ວຍເບີໂທລະສັບ (Member Login)"
            >
              <User className="w-4 h-4 stroke-[2]" />
              {customerAccount ? (
                <span className="flex items-center gap-1.5">
                  <span className="hidden sm:inline font-mono">{customerAccount.displayPhone}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                    {customerAccount.tier || "MEMBER"}
                  </span>
                </span>
              ) : (
                <span>ເຂົ້າສູ່ລະບົບ (ເບີໂທ)</span>
              )}
            </button>

            {/* Track Order Button */}
            <button
              type="button"
              onClick={openTrackingModal}
              className={`h-11 px-3.5 rounded-full border flex items-center gap-1.5 text-xs font-bold transition-all ${
                isDarkBase
                  ? "bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200"
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200/70 text-slate-700"
              }`}
              title="ກວດສອບສະຖານະພັດສະດຸ (Track Order)"
            >
              <PackageSearch className="w-4 h-4 text-emerald-500 stroke-[1.75]" />
              <span className="hidden lg:inline">ຕິດຕາມພັດສະດຸ</span>
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(selectedCategory === "WISHLIST" ? "ALL" : "WISHLIST");
                catalogRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`relative h-11 px-3.5 rounded-full border flex items-center gap-1.5 text-xs font-bold transition-all ${
                selectedCategory === "WISHLIST"
                  ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/25"
                  : isDarkBase
                  ? "bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200"
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200/70 text-slate-700"
              }`}
              title="ລາຍການສິນຄ້າທີ່ມັກ (Wishlist)"
            >
              <Heart className={`w-4 h-4 stroke-[1.75] ${wishlist.length > 0 && selectedCategory !== "WISHLIST" ? "text-rose-500" : ""}`} />
              <span className="hidden sm:inline">ທີ່ມັກ</span>
              {wishlist.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full px-4 sm:px-5 h-11 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] font-bold text-xs sm:text-sm gap-2"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
              <span>ກະຕ່າສິນຄ້າ</span>
              {totalAmount > 0 && (
                <span className="hidden sm:inline font-extrabold bg-black/20 px-2.5 py-0.5 rounded-full text-xs">
                  ₭{totalAmount.toLocaleString()}
                </span>
              )}
              {totalItems > 0 && (
                <span className="-top-1.5 -right-1.5 absolute bg-rose-500 text-white text-[11px] font-black rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className={`w-4 h-4 stroke-[1.75] absolute left-3.5 top-1/2 -translate-y-1/2 ${subtextColor}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`ຄົ້ນຫາສິນຄ້າໃນຮ້ານ ${store.name}...`}
              className={`w-full h-10 pl-10 pr-8 rounded-full text-xs border outline-none ${
                isDarkBase
                  ? "bg-zinc-900 border-white/15 text-white"
                  : "bg-slate-100 border-slate-200 text-slate-900"
              }`}
            />
          </div>
        </div>
      </header>

      {/* 3. E-COMMERCE HERO SECTION */}
      {banners.length > 0 ? (
        <section className="relative w-full h-[320px] sm:h-[420px] overflow-hidden">
          <BannerCarousel banners={banners} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent z-10 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-xl space-y-4 text-white">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg">
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[1.75]" />
                  <span>{heroBadge}</span>
                </span>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight drop-shadow-xl">
                  {heroTitle}
                </h1>
                <p className="text-sm sm:text-base text-zinc-200 line-clamp-2 drop-shadow">
                  {heroSubtitle}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => catalogRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm shadow-xl transition-all flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 stroke-[1.75]" />
                    <span>ຊ້ອບສິນຄ້າເລີຍ (Shop Now)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => flashSaleRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="px-5 py-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/20 font-bold text-sm transition-all flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>ໂປຣໂມຊັນ Flash Sale</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden border-b border-emerald-500/10 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 stroke-[1.75]" />
                  <span>{heroBadge}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
                  {heroTitle}
                </h1>

                <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  {heroSubtitle}
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => catalogRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <LayoutGrid className="w-4 h-4 stroke-[1.75]" />
                    <span>ເລືອກຊື້ສິນຄ້າທັງໝົດ ({products.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("BESTSELLER");
                      catalogRef.current?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold text-sm transition-all flex items-center gap-2"
                  >
                    <Flame className="w-4 h-4 text-amber-400 stroke-[1.75]" />
                    <span>ສິນຄ້າຂາຍດີ (Bestsellers)</span>
                  </button>
                </div>

                {/* Store Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 max-w-lg mx-auto lg:mx-0">
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400">{products.length}+</div>
                    <div className="text-[11px] text-zinc-400">ລາຍການສິນຄ້າພ້ອມສົ່ງ</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-amber-400 flex items-center justify-center lg:justify-start gap-1">
                      <span>4.9</span>
                      <Star className="w-4 h-4 text-amber-400 stroke-[1.75]" />
                    </div>
                    <div className="text-[11px] text-zinc-400">ຄະແນນຄວາມພຶງພໍໃຈ</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-cyan-400">100%</div>
                    <div className="text-[11px] text-zinc-400">ຮັບປະກັນຄຸນນະພາບແທ້</div>
                  </div>
                </div>
              </div>

              {featuredProduct && (
                <div className="lg:col-span-5">
                  <div
                    onClick={() => openProductModal(featuredProduct)}
                    className="cursor-pointer group relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-5 shadow-2xl hover:border-emerald-400/50 transition-all"
                  >
                    <div className="absolute top-7 left-7 z-20 px-3 py-1 rounded-full bg-zinc-950/85 backdrop-blur-md text-amber-400 border border-amber-400/40 font-extrabold text-xs shadow-lg flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400 stroke-[1.75]" />
                      <span>ສິນຄ້າແນະນຳ (Featured)</span>
                    </div>
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-black/20 mb-4">
                      <img
                        src={getProductImage(featuredProduct, 0)}
                        alt={featuredProduct.name}
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [featuredProduct.id]: true }))
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
                          {featuredProduct.category || "ສິນຄ້າຍອດນິຍົມ"}
                        </p>
                        <h3 className="text-lg font-extrabold text-white truncate">
                          {featuredProduct.name}
                        </h3>
                        <p className="text-2xl font-black text-emerald-400 mt-0.5">
                          ₭{featuredProduct.price.toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(featuredProduct, null, true);
                        }}
                        className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 shadow-lg transition-all flex items-center gap-1.5"
                      >
                        <span>ຊື້ເລີຍ</span>
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}



      {/* 5. FLASH SALE SECTION */}
      <section ref={flashSaleRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full space-y-6">
        {/* Flash Sale Countdown Strip */}
        {flashSaleProducts.length >= 2 && (
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-emerald-500/10 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
                  <Zap className="w-4 h-4 fill-current" />
                  <span>FLASH SALE ລາຄາພິເສດ</span>
                </div>
                <span className={`text-xs font-bold ${subtextColor} hidden sm:inline`}>
                  ຮີບຊື້ກ່ອນໝົດເວລາໂປຣໂມຊັນ!
                </span>
              </div>

              {/* Live Countdown Timer */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${subtextColor}`}>ໝົດເວລາໃນ:</span>
                <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-amber-400 border border-amber-500/30">
                    {String(countdown.hours).padStart(2, "0")}
                  </span>
                  <span className="text-amber-500 font-bold">:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-amber-400 border border-amber-500/30">
                    {String(countdown.mins).padStart(2, "0")}
                  </span>
                  <span className="text-amber-500 font-bold">:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-rose-400 border border-rose-500/30">
                    {String(countdown.secs).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {flashSaleProducts.map((fp, idx) => {
                const soldPercent = 72 + ((idx * 7) % 22);
                const originalPrice = Math.round(fp.price * 1.2);
                return (
                  <div
                    key={fp.id}
                    onClick={() => openProductModal(fp)}
                    className={`cursor-pointer group rounded-2xl p-3 border transition-all hover:-translate-y-1 ${
                      isDarkBase ? "bg-zinc-900/90 border-white/10 hover:border-amber-500/50" : "bg-white border-slate-200 hover:border-amber-500"
                    }`}
                  >
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2.5 bg-black/20">
                      <img
                        src={getProductImage(fp, idx)}
                        alt={fp.name}
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [fp.id]: true }))
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] shadow">
                        -20%
                      </span>
                    </div>
                    <h4 className={`font-bold text-xs sm:text-sm truncate ${textColor}`}>{fp.name}</h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm sm:text-base font-black text-amber-500">
                        ₭{fp.price.toLocaleString()}
                      </span>
                      <span className={`text-[10px] line-through ${subtextColor}`}>
                        ₭{originalPrice.toLocaleString()}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-2 w-full bg-rose-500/15 h-3.5 rounded-full overflow-hidden relative">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full"
                        style={{ width: `${soldPercent}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-white drop-shadow">
                        ຂາຍແລ້ວ {soldPercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 6. MAIN E-COMMERCE CATALOG SECTION */}
      <main ref={catalogRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-6">
        {/* Category Pills & Sort Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-500/15">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedCategory === "ALL"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                  : isDarkBase
                  ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-white/10"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>ສິນຄ້າທັງໝົດ ({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory("BESTSELLER")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedCategory === "BESTSELLER"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25"
                  : isDarkBase
                  ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-white/10"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Flame className={`w-3.5 h-3.5 stroke-[1.75] ${selectedCategory === "BESTSELLER" ? "text-slate-950" : "text-amber-500"}`} />
              <span>ຂາຍດີ / ແນະນຳ</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === cat.name
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                    : isDarkBase
                    ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-white/10"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Tag className="w-3 h-3 stroke-[1.75] opacity-70" />
                <span>{cat.name} ({cat.count})</span>
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
            <span className={`text-xs font-medium ${subtextColor}`}>
              ສະແດງ <strong className={textColor}>{filteredProducts.length}</strong> ລາຍການ
            </span>

            <div className="flex items-center gap-2">
              <ArrowUpDown className={`w-3.5 h-3.5 stroke-[1.75] ${subtextColor}`} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`h-9 px-3 rounded-xl text-xs font-bold border outline-none ${
                  isDarkBase
                    ? "bg-zinc-900 border-white/10 text-white"
                    : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                <option value="NEWEST">ຈັດລຽງ: ສິນຄ້າມາໃໝ່ລ່າສຸດ</option>
                <option value="PRICE_ASC">ລາຄາ: ຕ່ຳ ໄປ ສູງ</option>
                <option value="PRICE_DESC">ລາຄາ: ສູງ ໄປ ຕ່ຳ</option>
                <option value="NAME_ASC">ຊື່ສິນຄ້າ: A - Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* E-COMMERCE PRODUCT GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product, idx) => {
            const isWished = wishlist.includes(product.id);
            const inStock = product.stock === undefined || product.stock > 0;
            const imgUrl = getProductImage(product, idx);

            return (
              <div
                key={product.id}
                onClick={() => openProductModal(product)}
                className={`group ${cardBg} rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col cursor-pointer relative`}
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-zinc-800">
                  <img
                    src={imgUrl}
                    alt={product.name}
                    onError={() =>
                      setBrokenImages((prev) => ({ ...prev, [product.id]: true }))
                    }
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Top-left Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    {idx < 2 && (
                      <span className="px-2.5 py-1 rounded-full bg-zinc-950/85 backdrop-blur-md text-amber-400 border border-amber-400/40 font-extrabold text-[10px] uppercase tracking-wide shadow-md flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400 stroke-[1.75]" /> ຂາຍດີ
                      </span>
                    )}
                    {product.category && (
                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-semibold text-[10px]">
                        {product.category}
                      </span>
                    )}
                  </div>

                  {/* Top-right Wishlist Heart */}
                  <button
                    type="button"
                    onClick={(e) => toggleWishlist(product.id, e)}
                    className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 ${
                      isWished
                        ? "bg-rose-500 text-white"
                        : "bg-white/90 hover:bg-white text-slate-700"
                    }`}
                    title="ເພີ່ມໃນລາຍການທີ່ມັກ"
                  >
                    <Heart className="w-4 h-4 stroke-[1.75]" />
                  </button>

                  {/* Hover Quick View Bar */}
                  <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 hidden sm:flex justify-center">
                    <span className="px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <Eye className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75]" /> ເບິ່ງລາຍລະອຽດສິນຄ້າ
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3.5 sm:p-5 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-[1.75]" />
                        <span>4.9</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inStock
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-rose-500/10 text-rose-500"
                        }`}
                      >
                        {inStock ? "ພ້ອມສົ່ງ" : "ໝົດຊົ່ວຄາວ"}
                      </span>
                    </div>

                    <h3 className={`font-extrabold text-sm sm:text-base line-clamp-2 ${textColor} group-hover:text-emerald-500 transition-colors leading-snug`}>
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className={`text-xs line-clamp-1 mt-1 ${subtextColor}`}>
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="pt-2 border-t border-slate-500/10 space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className={`text-[10px] block ${subtextColor}`}>ລາຄາພິເສດ</span>
                        <span className="text-base sm:text-xl font-black text-emerald-500 tracking-tight">
                          ₭{product.price.toLocaleString()}
                        </span>
                      </div>
                      <span className={`text-[10px] line-through ${subtextColor}`}>
                        ₭{Math.round(product.price * 1.15).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        className={`h-9 rounded-xl text-xs font-bold border ${
                          isDarkBase
                            ? "bg-white/5 hover:bg-white/10 border-white/15 text-white"
                            : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const firstVar = product.variants?.[0] || null;
                          addToCart(product, firstVar, false);
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> ໃສ່ກະຕ່າ
                      </Button>

                      <Button
                        type="button"
                        className="h-9 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md shadow-emerald-500/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          const firstVar = product.variants?.[0] || null;
                          addToCart(product, firstVar, true);
                        }}
                      >
                        ຊື້ເລີຍ
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className={`col-span-full py-20 text-center rounded-3xl border border-dashed ${isDarkBase ? "border-white/10 bg-white/5" : "border-slate-300 bg-white"}`}>
              <ShoppingBag className="w-14 h-14 mx-auto mb-3 opacity-30" />
              <h3 className={`text-lg font-bold ${textColor} mb-1`}>ບໍ່ພົບສິນຄ້າທີ່ຄົ້ນຫາ</h3>
              <p className={`text-xs ${subtextColor} mb-4`}>ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເລືອກໝວດໝູ່ສິນຄ້າທັງໝົດ</p>
              <Button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("ALL");
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 text-xs font-bold"
              >
                ສະແດງສິນຄ້າທັງໝົດ
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* 7. VERIFIED CUSTOMER REVIEWS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className={`rounded-3xl border p-6 sm:p-8 ${isDarkBase ? "bg-zinc-900/60 border-white/10" : "bg-white border-slate-200/80 shadow-sm"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-500 mb-1">
                <ThumbsUp className="w-3.5 h-3.5" /> ຣີວິວຈາກລູກຄ້າຕົວຈິງ (Verified Buyers)
              </span>
              <h3 className={`text-xl sm:text-2xl font-black ${textColor}`}>
                ຄວາມປະທັບໃຈຈາກລູກຄ້າທີ່ສັ່ງຊື້ກັບ {store.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/25">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-black text-sm text-amber-500">4.9 / 5.0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CUSTOMER_REVIEWS.map((rev, i) => (
              <div
                key={i}
                className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                  isDarkBase ? "bg-zinc-950/60 border-white/10" : "bg-slate-50 border-slate-200/70"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(rev.rating)].map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className={`text-[11px] ${subtextColor}`}>{rev.date}</span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed ${textColor}`}>"{rev.comment}"</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-500/10">
                  <div>
                    <p className="text-xs font-extrabold">{rev.name}</p>
                    <p className={`text-[10px] ${subtextColor}`}>{rev.location}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" /> ຊື້ແລ້ວ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FLOATING MOBILE CART BAR */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 sm:hidden">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-2xl flex items-center justify-between font-extrabold text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white text-emerald-600 text-xs font-black flex items-center justify-center">
                {totalItems}
              </span>
              <span>ເບິ່ງກະຕ່າ & ຊຳລະເງິນ</span>
            </div>
            <span className="flex items-center gap-1">
              <span>₭{totalAmount.toLocaleString()}</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </span>
          </button>
        </div>
      )}

      {/* 9. FLOATING WHATSAPP DIRECT CHAT WIDGET (BOTTOM RIGHT) */}
      <a
        href={`https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(`ສະບາຍດີຮ້ານ ${store.name}, ຂ້ອຍສົນໃຈສອບຖາມສິນຄ້າໃນໜ້າເວັບໄຊ`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 sm:bottom-6 right-5 z-40 group flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-full p-3.5 sm:px-5 sm:py-3 shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105"
        title="ແຊັດສອບຖາມຜ່ານ WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-white/20 stroke-[2]" />
        <span className="hidden sm:inline font-extrabold text-xs">ແຊັດຖາມຮ້ານ (WhatsApp)</span>
      </a>

      {/* 10. LIVE PURCHASE SOCIAL PROOF TOAST (BOTTOM LEFT) */}
      {showLiveToast && products.length > 0 && (
        <div
          onClick={() => openProductModal(products[liveToastIdx % products.length])}
          className={`fixed bottom-6 left-5 z-30 hidden lg:flex items-center gap-3 p-3 pr-9 rounded-2xl border shadow-2xl cursor-pointer transition-all hover:scale-[1.02] max-w-xs ${
            isDarkBase ? "bg-zinc-900/95 border-white/15 text-white" : "bg-white/95 border-slate-200 text-slate-900"
          }`}
        >
          <img
            src={getProductImage(products[liveToastIdx % products.length], liveToastIdx)}
            alt="Product"
            className="w-12 h-12 rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-emerald-500 truncate">
              {RECENT_BUYERS_FEED[liveToastIdx % RECENT_BUYERS_FEED.length].buyer}
            </p>
            <p className="text-xs font-extrabold truncate">
              ຫາກໍສັ່ງຊື້ {products[liveToastIdx % products.length]?.name}
            </p>
            <p className={`text-[10px] ${subtextColor}`}>
              {RECENT_BUYERS_FEED[liveToastIdx % RECENT_BUYERS_FEED.length].time} • ຢືນຢັນແລ້ວ
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowLiveToast(false);
            }}
            className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 10A. COMPACT VOUCHER BANNER (BOTTOM / BELOW PRODUCTS) */}
      {displayCoupons.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
          <div
            onClick={() => setVoucherModalOpen(true)}
            className={`cursor-pointer rounded-2xl border p-3.5 sm:px-6 flex items-center justify-between gap-3 transition-all hover:scale-[1.01] hover:border-emerald-500/60 shadow-lg ${
              isDarkBase
                ? "bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900/90 border-emerald-500/30"
                : "bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 border-emerald-200"
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                <Ticket className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-black text-sm sm:text-base ${textColor}`}>
                    ສູນລວມຄູປອງສ່ວນຫຼຸດ (Store Vouchers)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
                    {displayCoupons.length} ຄູປອງ
                  </span>
                </div>
                <p className={`text-xs truncate ${subtextColor}`}>
                  {customerAccount
                    ? `ລັອກອິນເບີ: ${customerAccount.displayPhone} • ຄລິກເພື່ອເປີດເບິ່ງ ແລະ ເກັບຄູປອງທັງໝົດ`
                    : "ຄລິກເພື່ອເຂົ້າສູ່ລະບົບດ້ວຍເບີໂທ & ເກັບຄູປອງສ່ວນຫຼຸດ (1 ເບີ / 1 ສິດ)"}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 flex items-center gap-1.5 shadow-md transition-all"
            >
              <span>ກົດຮັບຄູປອງ</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        </section>
      )}

            {/* 10B. VALUE PROPOSITION BAR / TRUST BADGES (BOTTOM / ABOVE FOOTER) */}
      <section className={`border-y mt-12 ${isDarkBase ? "border-white/5 bg-zinc-950/80" : "border-slate-200 bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Truck,
                title: "ຈັດສົ່ງດ່ວນທົ່ວປະເທດ",
                desc: "ອານຸສິດ / ຮຸ່ງອາລຸນ / ມີໄຊ",
                color: "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20",
              },
              {
                icon: ShieldCheck,
                title: "ຮັບປະກັນສິນຄ້າແທ້ 100%",
                desc: "ກວດສອບຄຸນນະພາບກ່ອນສົ່ງທຸກຊິ້ນ",
                color: "text-blue-500 bg-blue-500/10 border border-blue-500/20",
              },
              {
                icon: QrCode,
                title: "ຊຳລະຜ່ານ QR & COD",
                desc: "ຮອງຮັບ BCEL One / ເກັບປາຍທາງ",
                color: "text-purple-500 bg-purple-500/10 border border-purple-500/20",
              },
              {
                icon: Clock,
                title: "ບໍລິການລູກຄ້າທຸກວັນ",
                desc: `ຕິດຕໍ່ສອບຖາມ ${contactPhone}`,
                color: "text-amber-500 bg-amber-500/10 border border-amber-500/20",
              },
            ].map((prop) => (
              <div key={`bottom-${prop.title}`} className="flex items-center gap-3.5 p-3 rounded-2xl transition-all hover:bg-white/5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${prop.color}`}>
                  <prop.icon className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <h4 className={`text-xs sm:text-sm font-black truncate ${textColor}`}>{prop.title}</h4>
                  <p className={`text-[11px] truncate ${subtextColor}`}>{prop.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. COMPLETE E-COMMERCE FOOTER */}
      <footer className={`border-t mt-8 ${isDarkBase ? "bg-zinc-950 border-white/10 text-zinc-400" : "bg-slate-900 border-slate-800 text-slate-300"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black">
                  <StoreIcon className="w-5 h-5 stroke-[1.75]" />
                </div>
                <span className="text-xl font-black text-white">{store.name}</span>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                {heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-emerald-400 font-bold inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[1.75]" /> ຮ້ານຄ້າຢືນຢັນຕົວຕົນ (Verified Store)
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-cyan-400 font-bold inline-flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 stroke-[1.75]" /> ຈັດສົ່ງທົ່ວປະເທດລາວ
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">ບໍລິການຈັດສົ່ງ & ຊຳລະເງິນ</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75] shrink-0" />
                  <span>Anousith Express / HAL / Mixay</span>
                </li>
                <li className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75] shrink-0" />
                  <span>ບໍລິການສົ່ງດ່ວນພາຍໃນຕົວເມືອງ</span>
                </li>
                <li className="flex items-center gap-2">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75] shrink-0" />
                  <span>ຊຳລະຜ່ານ BCEL One QR / ໂອນທະນາຄານ</span>
                </li>
                <li className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75] shrink-0" />
                  <span>ຮອງຮັບການເກັບເງິນປາຍທາງ (COD)</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">ຕິດຕໍ່ຮ້ານຄ້າ</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75]" />
                  <span>ໂທ / WhatsApp: {contactPhone}</span>
                </li>
                {store.address && (
                  <li className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75]" />
                    <span>{store.address}</span>
                  </li>
                )}
                <li className="text-emerald-400 font-semibold pt-1 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 stroke-[1.75]" />
                  <span>ເປີດຮັບອໍເດີອອນລາຍທຸກວັນ 24 ຊົ່ວໂມງ</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
            <p>Powered by LAOSYS E-Commerce Storefront</p>
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* DIALOG 1: SHOPPING CART & COMPLETE CHECKOUT MODAL                     */}
      {/* ===================================================================== */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className={`w-[96vw] max-w-[96vw] sm:max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl ${isDarkBase ? "bg-zinc-950 border-white/10" : "bg-white"} ${textColor} shadow-2xl p-4 sm:p-8 border`}>
          <DialogHeader className="mb-4 border-b border-slate-500/15 pb-4">
            <DialogTitle className={`${textColor} flex items-center justify-between text-xl sm:text-2xl font-extrabold tracking-tight`}>
              <span className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-emerald-500 stroke-[1.75]" />
                ກະຕ່າສິນຄ້າ & ຊຳລະເງິນ (Shopping Cart & Checkout)
              </span>
              <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                {totalItems} ລາຍການ
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* FREE SHIPPING PROGRESS BAR */}
          {cart.length > 0 && (
            <div className={`mb-6 p-3.5 rounded-2xl border ${isDarkBase ? "bg-emerald-950/30 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"}`}>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <Truck className="w-4 h-4 stroke-[2]" />
                  {amountNeededForFreeShipping === 0 ? (
                    <span>ຍິນດີດ້ວຍ! ອໍເດີຂອງທ່ານໄດ້ຮັບສິດຈັດສົ່ງຟຣີທົ່ວປະເທດ!</span>
                  ) : (
                    <span>
                      ຊື້ເພີ່ມອີກພຽງ <strong>₭{amountNeededForFreeShipping.toLocaleString()}</strong> ເພື່ອຮັບສິດຈັດສົ່ງຟຣີ!
                    </span>
                  )}
                </span>
                <span className="text-emerald-500 font-mono">{freeShippingProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-emerald-500/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-10 h-10 text-emerald-500 stroke-[1.75]" />
                </div>
                <p className={`text-lg font-bold ${textColor}`}>ກະຕ່າສິນຄ້າຫວ່າງເປົ່າ (Empty Cart)</p>
                <p className={`text-sm ${subtextColor} mt-1 mb-6`}>ເລືອກສິນຄ້າທີ່ທ່ານຕ້ອງການໃສ່ກະຕ່າເລີຍ!</p>
                <Button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 font-bold"
                >
                  ກັບໄປເລືອກຊື້ສິນຄ້າ
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: Customer, Logistics & Payment Method */}
                <div className={`lg:col-span-7 space-y-6 p-5 sm:p-6 rounded-3xl border ${isDarkBase ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                  {/* 1. Customer Info */}
                  <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2 border-b pb-3 border-slate-500/15">
                    <User className="w-5 h-5 text-emerald-500 stroke-[1.75]" />
                    1. ຂໍ້ມູນຜູ້ສັ່ງຊື້ (Customer Information)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block opacity-80">ຊື່ ແລະ ນາມສະກຸນ *</Label>
                      <Input
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        className="h-11 rounded-xl"
                        placeholder="ປ້ອນຊື່ ແລະ ນາມສະກຸນ"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block opacity-80">
                        ເບີໂທຕິດຕໍ່ (WhatsApp) *
                      </Label>
                      <Input
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        className="h-11 rounded-xl font-mono"
                        placeholder="ເຊັ່ນ: 020 5555 8888"
                      />
                      {customerInfo.phone.trim().length > 0 && (
                        <p className={`text-[11px] mt-1 font-bold ${parsedCheckoutPhone.isValid ? "text-emerald-500" : "text-amber-500"}`}>
                          {parsedCheckoutPhone.isValid
                            ? `ລະບົບປັບເປັນ: ${parsedCheckoutPhone.formatted} (${parsedCheckoutPhone.carrierHint})`
                            : parsedCheckoutPhone.error}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 2. Laos Logistics & Shipping Address */}
                  {!tableId && (
                    <>
                      <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2 border-b pb-3 border-slate-500/15 pt-2">
                        <Truck className="w-5 h-5 text-emerald-500 stroke-[1.75]" />
                        2. ເລືອກບໍລິສັດຂົນສົ່ງ & ທີ່ຢູ່ຈັດສົ່ງ
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {LAOS_LOGISTICS_CARRIERS.map((carrier) => {
                          const selected = customerInfo.shippingCarrier === carrier.id;
                          return (
                            <button
                              key={carrier.id}
                              type="button"
                              onClick={() =>
                                setCustomerInfo({
                                  ...customerInfo,
                                  shippingCarrier: carrier.id,
                                  shippingMethod: carrier.id === "PICKUP" ? "PICKUP" : carrier.id === "MESSENGER" ? "MESSENGER" : "EXPRESS",
                                })
                              }
                              className={`p-3 rounded-2xl border text-left transition-all flex items-start justify-between gap-2 ${
                                selected
                                  ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                                  : "border-slate-500/20 hover:border-emerald-500/40"
                              }`}
                            >
                              <div>
                                <p className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${selected ? "text-emerald-500" : "opacity-30"}`} />
                                  <span>{carrier.name}</span>
                                </p>
                                <p className="text-[11px] opacity-70 mt-0.5 pl-5">{carrier.sub}</p>
                              </div>
                              {carrier.badge && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold text-[10px] shrink-0">
                                  {carrier.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {customerInfo.shippingCarrier !== "PICKUP" && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div>
                              <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block opacity-80">ບ້ານ (Village) *</Label>
                              <Input
                                value={customerInfo.village}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, village: e.target.value })}
                                className="h-11 rounded-xl"
                                placeholder="ເຊັ່ນ: ໂພນສີນວນ"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block opacity-80">ເມືອງ (District) *</Label>
                              <Input
                                value={customerInfo.district}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, district: e.target.value })}
                                className="h-11 rounded-xl"
                                placeholder="ເຊັ່ນ: ສີສັດຕະນາກ"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block opacity-80">ແຂວງ (Province) *</Label>
                              <select
                                value={customerInfo.province}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, province: e.target.value })}
                                className={`w-full h-11 rounded-xl px-3 border text-xs font-semibold ${isDarkBase ? "bg-zinc-900 border-white/10 text-white" : "bg-white border-slate-300 text-slate-900"}`}
                              >
                                {LAOS_PROVINCES.map((prov) => (
                                  <option key={prov} value={prov}>{prov}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block opacity-80">ສາຂາຂົນສົ່ງປາຍທາງ / ຈຸດສັງເກດ (Branch or Landmark)</Label>
                            <Input
                              value={customerInfo.address}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                              className="h-11 rounded-xl"
                              placeholder="ເຊັ່ນ: ຝາກສາຂາ ອານຸສິດ ດົງໂດກ, ຫຼື ຮ່ອມ 3..."
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* 3. Payment Method & QR Slip Upload */}
                  <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2 border-b pb-3 border-slate-500/15 pt-2">
                    <CreditCard className="w-5 h-5 text-emerald-500 stroke-[1.75]" />
                    3. ເລືອກຊ່ອງທາງຊຳລະເງິນ (Payment Method)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: "QR_TRANSFER" })}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        customerInfo.paymentMethod === "QR_TRANSFER"
                          ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                          : "border-slate-500/20 hover:border-emerald-500/40"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-xs sm:text-sm">ໂອນຜ່ານ QR ທະນາຄານ</p>
                        <p className="text-[11px] opacity-70">BCEL One / LDB / JDB / LAO QR</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: "CASH_ON_DELIVERY" })}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        customerInfo.paymentMethod === "CASH_ON_DELIVERY"
                          ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                          : "border-slate-500/20 hover:border-emerald-500/40"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-xs sm:text-sm">ເກັບເງິນປາຍທາງ (COD)</p>
                        <p className="text-[11px] opacity-70">ຊຳລະເງິນສົດຕອນຮັບສິນຄ້າ</p>
                      </div>
                    </button>
                  </div>

                  {/* QR Code Card & Slip Upload Box */}
                  {customerInfo.paymentMethod === "QR_TRANSFER" && (
                    <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${isDarkBase ? "bg-zinc-900 border-emerald-500/30" : "bg-white border-emerald-200"}`}>
                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md shrink-0">
                          <QRCodeSVG
                            value={`LAOSYS_PAY|${store.slug}|${bankAccountNumber}|${finalNetAmount}`}
                            size={132}
                            level="M"
                          />
                        </div>
                        <div className="space-y-2 text-center sm:text-left flex-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-[10px] font-extrabold uppercase">
                            <Building2 className="w-3 h-3" /> {bankName}
                          </span>
                          <p className="text-xs opacity-75">ຊື່ບັນຊີ: <strong className={textColor}>{bankAccountName}</strong></p>
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <span className="font-mono font-black text-sm sm:text-base text-emerald-500">{bankAccountNumber}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(bankAccountNumber);
                                setCopiedAccount(true);
                                toast.success("ກ໊ອບປີ້ເລກບັນຊີແລ້ວ!");
                                setTimeout(() => setCopiedAccount(false), 2000);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 text-xs font-bold flex items-center gap-1"
                            >
                              {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedAccount ? "ກ໊ອບປີ້ແລ້ວ" : "Copy"}</span>
                            </button>
                          </div>
                          <p className="text-xs font-bold">
                            ຍອດໂອນສຸດທິ: <strong className="text-emerald-500 text-base">₭{finalNetAmount.toLocaleString()}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Slip Upload Input */}
                      <div className="pt-3 border-t border-slate-500/15">
                        <Label className="text-xs font-bold mb-2 block">
                          ແນບຮູບໃບບິນ / ສະລິບໂອນເງິນ BCEL One (ເພື່ອຢືນຢັນອໍເດີໄວຂຶ້ນ)
                        </Label>
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/30 font-extrabold text-xs transition-all">
                            {isUploadingSlip ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            <span>{paymentSlipUrl ? "ປ່ຽນຮູບສະລິບໂອນເງິນ" : "ອັບໂຫຼດຮູບສະລິບໂອນເງິນ"}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleUploadSlip}
                              className="hidden"
                            />
                          </label>
                          {paymentSlipUrl && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500">
                              <CheckCircle2 className="w-4 h-4" /> ແນບສະລິບສຳເລັດແລ້ວ
                            </span>
                          )}
                        </div>
                        {paymentSlipUrl && (
                          <div className="mt-3 relative w-28 h-36 rounded-xl overflow-hidden border border-emerald-500/40">
                            <img src={paymentSlipUrl} alt="Payment Slip" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setPaymentSlipUrl("")}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block opacity-80">ໝາຍເຫດເພີ່ມເຕີມ (Additional Note)</Label>
                    <Input
                      value={customerInfo.note}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, note: e.target.value })}
                      className="h-11 rounded-xl"
                      placeholder="ເຊັ່ນ: ໂທຫາກ່ອນສົ່ງ..."
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Order Summary & Coupon Discount */}
                <div className="lg:col-span-5 space-y-6">
                  <div className={`p-5 rounded-3xl border ${isDarkBase ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"} space-y-4`}>
                    <h3 className="text-lg font-extrabold flex items-center justify-between border-b pb-3 border-slate-500/15">
                      <span>ສະຫຼຸບລາຍການສິນຄ້າ ({totalItems})</span>
                      <span className="text-emerald-500">₭{totalAmount.toLocaleString()}</span>
                    </h3>

                    <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                      {cart.map((item, idx) => (
                        <div key={idx} className={`relative flex gap-3 p-3 rounded-2xl border ${isDarkBase ? "bg-black/20 border-white/10" : "bg-white border-slate-200"}`}>
                          <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-slate-100">
                            <img
                              src={item.image || getProductFallbackImage(item.name, idx)}
                              alt={item.name}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = getProductFallbackImage(item.name, idx);
                              }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="pr-6">
                              <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                              {item.variantName && <p className="text-[11px] opacity-70">{item.variantName}</p>}
                              <div className="text-emerald-500 font-extrabold text-xs mt-0.5">₭{item.price.toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                              <button onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 rounded-full bg-slate-500/15 flex items-center justify-center">
                                <Minus className="w-3 h-3 stroke-[1.75]" />
                              </button>
                              <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 rounded-full bg-slate-500/15 flex items-center justify-center">
                                <Plus className="w-3 h-3 stroke-[1.75]" />
                              </button>
                            </div>
                          </div>
                          <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-rose-400 hover:text-rose-500 p-1">
                            <X className="w-4 h-4 stroke-[1.75]" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* COUPON DISCOUNT BOX */}
                    <div className="pt-3 border-t border-slate-500/15">
                      <Label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-500">
                        <Ticket className="w-4 h-4 stroke-[1.75]" />
                        ຄູປອງສ່ວນຫຼຸດ (Coupon Code)
                      </Label>
                      {!appliedCoupon ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              placeholder="ໃສ່ລະຫັດຄູປອງ"
                              className="h-10 rounded-xl uppercase font-mono font-bold text-xs"
                            />
                            <Button
                              type="button"
                              onClick={() => handleValidateCoupon()}
                              disabled={validatingCoupon || !couponCode.trim()}
                              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                            >
                              {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "ໃຊ້ຄູປອງ"}
                            </Button>
                          </div>
                          {displayCoupons.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {displayCoupons.slice(0, 3).map((cp: any) => {
                                const codeUpper = String(cp.code).toUpperCase();
                                const alreadyUsed = usedCodes.includes(codeUpper);
                                return (
                                  <button
                                    key={cp.id || cp.code}
                                    type="button"
                                    disabled={alreadyUsed}
                                    onClick={() => {
                                      setCouponCode(codeUpper);
                                      handleValidateCoupon(codeUpper);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold border ${
                                      alreadyUsed
                                        ? "bg-zinc-800 text-zinc-500 border-zinc-700 line-through cursor-not-allowed"
                                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                                    }`}
                                  >
                                    {alreadyUsed ? `${codeUpper} (ໃຊ້ແລ້ວ)` : `+ ໃຊ້ໂຄ້ດ ${codeUpper}`}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-emerald-500 stroke-[1.75]" />
                            <div>
                              <p className="text-xs font-bold text-emerald-500 font-mono">{appliedCoupon.code}</p>
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-300">ສ່ວນຫຼຸດ -₭{appliedCoupon.discountAmount.toLocaleString()}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAppliedCoupon(null)}
                            className="text-xs text-rose-500 font-bold px-2 py-1 rounded hover:bg-rose-500/10 flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5 stroke-[1.75]" /> ຍົກເລີກ
                          </button>
                        </div>
                      )}
                      {couponError && <p className="text-xs text-rose-500 mt-1.5 font-medium">{couponError}</p>}
                    </div>

                    {/* SUMMARY TOTAL BREAKDOWN */}
                    <div className="pt-3 border-t border-slate-500/15 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="opacity-70">ຍອດລວມສິນຄ້າ (Subtotal)</span>
                        <span className="font-bold">₭{totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="opacity-70">ຄ່າຈັດສົ່ງ ({customerInfo.shippingCarrier})</span>
                        <span className="font-bold text-emerald-500">
                          {amountNeededForFreeShipping === 0 || customerInfo.shippingCarrier === "PICKUP"
                            ? "ສົ່ງຟຣີ (Free)"
                            : "ຈ່າຍຕາມຈິງປາຍທາງ"}
                        </span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-emerald-500 font-bold">
                          <span>ສ່ວນຫຼຸດຄູປອງ ({appliedCoupon.code})</span>
                          <span>-₭{appliedCoupon.discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-500/15 text-lg">
                        <span className="font-extrabold">ຍອດຊຳລະສຸດທິ (Net Total)</span>
                        <span className="text-2xl font-black text-emerald-500">
                          ₭{finalNetAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-13 py-3.5 rounded-2xl text-base font-extrabold shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.01] border-0 mt-2"
                      onClick={handleCheckout}
                      disabled={
                        isCheckingOut ||
                        !customerInfo.name ||
                        (!tableId && !customerInfo.phone) ||
                        (!tableId && customerInfo.shippingCarrier !== "PICKUP" && (!customerInfo.village || !customerInfo.district))
                      }
                    >
                      {isCheckingOut ? "ກຳລັງສັ່ງຊື້..." : (
                        <span className="flex items-center justify-center gap-2">
                          <ShoppingCart className="w-5 h-5 stroke-[1.75]" />
                          <span>ຢືນຢັນການສັ່ງຊື້ (Confirm Order)</span>
                          <ChevronRight className="w-5 h-5 stroke-[1.75]" />
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* DIALOG 2: ENHANCED PRODUCT DETAIL MODAL (VARIANTS, QTY, RELATED)      */}
      {/* ===================================================================== */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className={`w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl p-0 rounded-3xl ${isDarkBase ? "bg-zinc-900 text-white" : "bg-white text-slate-900"}`}>
          {selectedProduct && (
            <div className="flex flex-col">
              {/* Product Main Image */}
              <div className="relative w-full aspect-[16/10] bg-slate-100 dark:bg-zinc-800">
                <img
                  src={selectedProduct.images?.[modalImageIdx] || getProductImage(selectedProduct, 0)}
                  alt={selectedProduct.name}
                  onError={() =>
                    setBrokenImages((prev) => ({ ...prev, [selectedProduct.id]: true }))
                  }
                  className="w-full h-full object-cover"
                />
                {selectedProduct.category && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold">
                    {selectedProduct.category}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    toast.success("ກ໊ອບປີ້ລິ້ງສິນຄ້າແລ້ວ!");
                  }}
                  className="absolute top-4 right-14 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/85 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" /> ແຊຣ໌
                </button>
              </div>

              {/* Multi-angle Image Thumbnails if available */}
              {Array.isArray(selectedProduct.images) && selectedProduct.images.length > 1 && (
                <div className="flex items-center gap-2 px-6 pt-3 overflow-x-auto">
                  {selectedProduct.images.map((img: string, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setModalImageIdx(i)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 ${
                        modalImageIdx === i ? "border-emerald-500" : "border-transparent opacity-60"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="p-6 sm:p-7 space-y-5">
                <DialogHeader>
                  <DialogTitle className={`text-2xl font-extrabold tracking-tight ${textColor}`}>
                    {selectedProduct.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-black text-emerald-500">
                      ₭{((modalVariant?.price ?? selectedProduct.price) || 0).toLocaleString()}
                    </p>
                    <p className={`text-xs line-through ${subtextColor}`}>
                      ລາຄາປົກກະຕິ ₭{Math.round(((modalVariant?.price ?? selectedProduct.price) || 0) * 1.15).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 stroke-[1.75]" />
                    <span>
                      {selectedProduct.stock !== undefined
                        ? `ມີສິນຄ້າພ້ອມສົ່ງ (${selectedProduct.stock} ຊິ້ນ)`
                        : "ມີສິນຄ້າພ້ອມສົ່ງ"}
                    </span>
                  </span>
                </div>

                {selectedProduct.description && (
                  <p className={`text-sm leading-relaxed ${subtextColor}`}>
                    {selectedProduct.description}
                  </p>
                )}

                {/* Variant Selector Pills */}
                {Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-500/15">
                    <Label className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                      ເລືອກຕົວເລືອກສິນຄ້າ (Select Option / Variant):
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.variants.map((v: any) => {
                        const active = modalVariant?.id === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setModalVariant(v)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                              active
                                ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                                : "border-slate-500/25 hover:border-emerald-500/40"
                            }`}
                          >
                            {v.name} {v.price !== null ? `(₭${Number(v.price).toLocaleString()})` : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-500/15">
                  <span className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                    ຈຳນວນທີ່ຕ້ອງການສັ່ງຊື້ (Quantity):
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-xl border border-slate-500/25 flex items-center justify-center hover:border-emerald-500"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-black text-base w-8 text-center">{modalQty}</span>
                    <button
                      type="button"
                      onClick={() => setModalQty((q) => q + 1)}
                      className="w-9 h-9 rounded-xl border border-slate-500/25 flex items-center justify-center hover:border-emerald-500"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart & Buy Now Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-500/15">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5"
                    onClick={() => {
                      addToCart(selectedProduct, modalVariant, false, modalQty);
                      setSelectedProduct(null);
                    }}
                  >
                    <Plus className="w-4 h-4 stroke-[1.75]" />
                    <span>ເພີ່ມລົງກະຕ່າ (x{modalQty})</span>
                  </Button>
                  <Button
                    type="button"
                    className="h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm border-0 shadow-lg flex items-center justify-center gap-1.5"
                    onClick={() => {
                      const prod = selectedProduct;
                      const vr = modalVariant;
                      const q = modalQty;
                      setSelectedProduct(null);
                      addToCart(prod, vr, true, q);
                    }}
                  >
                    <span>ຊື້ເລີຍ (₭{(((modalVariant?.price ?? selectedProduct.price) || 0) * modalQty).toLocaleString()})</span>
                    <ArrowRight className="w-4 h-4 stroke-[2]" />
                  </Button>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                  <div className="pt-4 border-t border-slate-500/15 space-y-3">
                    <p className="text-xs font-extrabold uppercase tracking-wider opacity-75">
                      ສິນຄ້າໃກ້ຄຽງທີ່ແນະນຳ (Related Products)
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {relatedProducts.map((rp, i) => (
                        <div
                          key={rp.id}
                          onClick={() => openProductModal(rp)}
                          className={`cursor-pointer p-2 rounded-xl border transition-all hover:border-emerald-500 ${
                            isDarkBase ? "bg-zinc-950/60 border-white/10" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <img
                            src={getProductImage(rp, i)}
                            alt={rp.name}
                            className="w-full aspect-square rounded-lg object-cover mb-1.5"
                          />
                          <p className="text-[11px] font-bold truncate">{rp.name}</p>
                          <p className="text-xs font-black text-emerald-500">₭{rp.price.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* DIALOG 3: REAL-TIME ORDER TRACKING MODAL (ກວດສອບສະຖານະພັດສະດຸ)          */}
      {/* ===================================================================== */}
      <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
        <DialogContent className={`w-[95vw] sm:max-w-xl max-h-[88vh] overflow-y-auto rounded-3xl border p-5 sm:p-7 ${isDarkBase ? "bg-zinc-950 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-xl font-black">
              <PackageSearch className="w-6 h-6 text-emerald-500" />
              <span>ກວດສອບສະຖານະຄຳສັ່ງຊື້ & ພັດສະດຸ (Track Order)</span>
            </DialogTitle>
          </DialogHeader>

          <p className={`text-xs ${subtextColor}`}>
            ປ້ອນ <strong>ເບີໂທລະສັບ (020 xxxx xxxx)</strong> ຫຼື <strong>ລະຫັດໃບບິນ</strong> ຂອງທ່ານເພື່ອກວດເບິ່ງສະຖານະການຈັດສົ່ງແບບ Real-time
          </p>

          {/* Logged in member quick search badge */}
          {customerAccount && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400">
              <div className="flex items-center gap-2 truncate">
                <User className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="truncate">
                  ລັອກອິນດ້ວຍເບີ: <strong>{customerAccount.displayPhone}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTrackQuery(customerAccount.phone);
                  handleTrackOrders(customerAccount.phone);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] shrink-0 transition-all flex items-center gap-1 shadow"
              >
                <span>ຄົ້ນຫາອໍເດີຂ້ອຍ</span>
                <Search className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Input
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrackOrders()}
              placeholder="ປ້ອນເບີໂທ ຫຼື ລະຫັດບິນ ເຊັ່ນ: 020..."
              className="h-11 rounded-xl text-sm"
            />
            <Button
              type="button"
              onClick={() => handleTrackOrders()}
              disabled={isTracking}
              className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shrink-0"
            >
              {isTracking ? <Loader2 className="w-4 h-4 animate-spin" /> : "ຄົ້ນຫາອໍເດີ"}
            </Button>
          </div>

          {/* Smart Warning when typing 10 digits starting with 020 */}
          {trackQuery.replace(/\D/g, "").startsWith("020") && trackQuery.replace(/\D/g, "").length === 10 && (
            <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-bold">ຂໍ້ສັງເກດ: ເບີ 020 ປົກກະຕິມີ 11 ຕົວເລກ (ຕອນນີ້ພິມໄດ້ 10 ຕົວ, ອາດພິມຕົກ 1 ຕົວ)</p>
                <p className="opacity-80 text-[10px] mt-0.5">ລະບົບໄດ້ໃຊ້ການຄົ້ນຫາແບບອັດສະລິຍະ (Fuzzy Matching) ເພື່ອຊອກຫາອໍເດີທີ່ໃກ້ຄຽງທີ່ສຸດໃຫ້ທ່ານອັດຕະໂນມັດ.</p>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-3">
            {trackSearched && trackedOrders.length === 0 && !isTracking && (
              <div className="text-center py-10 rounded-2xl border border-dashed border-slate-500/25">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-bold">ບໍ່ພົບຂໍ້ມູນຄຳສັ່ງຊື້</p>
                <p className={`text-xs ${subtextColor} mt-0.5`}>ກະລຸນາກວດສອບເບີໂທ ຫຼື ລະຫັດບິນຂອງທ່ານອີກຄັ້ງ</p>
              </div>
            )}

            {trackedOrders.map((ord) => {
              const stepIdx =
                ord.status === "COMPLETED" || ord.status === "PAID"
                  ? 3
                  : ord.status === "READY"
                  ? 2
                  : ord.status === "PREPARING"
                  ? 1
                  : 0;
              const steps = [
                "ຮັບອໍເດີແລ້ວ",
                "ກຳລັງແພັກສິນຄ້າ",
                "ສົ່ງຂົນສົ່ງແລ້ວ",
                "ສຳເລັດ",
              ];

              return (
                <div
                  key={ord.id}
                  className={`p-4 rounded-2xl border space-y-3.5 ${
                    isDarkBase ? "bg-zinc-900 border-white/10" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-500/15 pb-2.5">
                    <div>
                      <span className="font-mono font-black text-emerald-500 text-sm">#{ord.shortId}</span>
                      <span className={`text-[11px] ${subtextColor} ml-2`}>
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-extrabold text-xs">
                      ₭{Number(ord.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* 4-Step Visual Progress Bar */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {steps.map((st, idx) => {
                      const active = idx <= stepIdx;
                      return (
                        <div key={st} className="text-center space-y-1">
                          <div
                            className={`h-2 rounded-full ${
                              active ? "bg-emerald-500" : "bg-slate-500/20"
                            }`}
                          />
                          <p className={`text-[10px] font-bold ${active ? "text-emerald-500" : subtextColor}`}>
                            {st}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-xs space-y-1 pt-1">
                    <p><span className={subtextColor}>ລູກຄ້າ:</span> <strong>{ord.customerName}</strong> ({ord.customerPhone})</p>
                    {ord.customerAddress && (
                      <p><span className={subtextColor}>ທີ່ຢູ່ຈັດສົ່ງ:</span> {ord.customerAddress}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* DIALOG 4: CUSTOMER PHONE LOGIN & MEMBER PROFILE MODAL                 */}
      {/* ===================================================================== */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className={`w-[95vw] sm:max-w-md rounded-3xl border p-6 ${isDarkBase ? "bg-zinc-950 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-xl font-black">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span>{customerAccount ? "ບັນຊີສະມາຊິກຂອງທ່ານ" : "ເຂົ້າສູ່ລະບົບດ້ວຍເບີໂທລະສັບ"}</span>
                <p className={`text-xs font-normal ${subtextColor}`}>
                  ຮ້ານ {store.name} (ຂໍ້ມູນສະມາຊິກແຍກສະເພາະຮ້ານນີ້ເທົ່ານັ້ນ)
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {customerAccount ? (
            <div className="space-y-4 pt-2">
              <div className={`p-4 rounded-2xl border space-y-2 ${isDarkBase ? "bg-zinc-900 border-emerald-500/30" : "bg-emerald-50/70 border-emerald-200"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold opacity-75">ເບີໂທສະມາຊິກມາດຕະຖານ:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                    ລະດັບ {customerAccount.tier || "BRONZE"}
                  </span>
                </div>
                <p className="font-mono font-black text-xl text-emerald-500">
                  {customerAccount.displayPhone || customerAccount.phone}
                </p>
                <p className="text-xs font-semibold">
                  ຊື່ລູກຄ້າ: <strong>{customerAccount.name}</strong>
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-500/15 text-xs">
                  <div>
                    <span className={subtextColor}>ອໍເດີສະສົມ:</span>{" "}
                    <strong>{customerAccount.orderCount || 0} ຄັ້ງ</strong>
                  </div>
                  <div>
                    <span className={subtextColor}>ຄະແນນສະສົມ:</span>{" "}
                    <strong className="text-amber-500">{customerAccount.points || 0} ແຕ້ມ</strong>
                  </div>
                </div>
              </div>

              {/* Claimed & Used Coupons Summary */}
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                  ຄູປອງຂອງທ່ານໃນຮ້ານນີ້ (ຈຳກັດ 1 ເບີ / 1 ສິດ):
                </p>
                {claimedCodes.length === 0 ? (
                  <p className={`text-xs ${subtextColor}`}>ຍັງບໍ່ທັນໄດ້ເກັບຄູປອງ</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {claimedCodes.map((code) => {
                      const isUsed = usedCodes.includes(code);
                      return (
                        <span
                          key={code}
                          className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border flex items-center gap-1.5 ${
                            isUsed
                              ? "bg-zinc-800 text-zinc-400 border-zinc-700 line-through"
                              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>{code}</span>
                          <span className="text-[10px]">
                            {isUsed ? "(ໃຊ້ສິດແລ້ວ)" : "(ພ້ອມໃຊ້)"}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCustomerLogout}
                  className="flex-1 h-11 rounded-xl text-xs font-bold text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                >
                  ອອກຈາກລະບົບ / ປ່ຽນເບີ
                </Button>
                <Button
                  type="button"
                  onClick={() => setLoginModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold"
                >
                  ເລືອກຊື້ສິນຄ້າຕໍ່
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomerLogin} className="space-y-4 pt-1">
              {pendingCouponToClaim && (
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2">
                  <Ticket className="w-4 h-4 shrink-0" />
                  <span>
                    ປ້ອນເບີໂທເພື່ອຮັບຄູປອງ <strong>{pendingCouponToClaim}</strong> (ຈຳກັດ 1 ເບີໂທ / 1 ສິດ)
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-extrabold">
                  ເບີໂທລະສັບຂອງທ່ານ *
                </Label>
                <Input
                  value={loginPhoneInput}
                  onChange={(e) => setLoginPhoneInput(e.target.value)}
                  placeholder="ເຊັ່ນ: 020 5555 8888"
                  className="h-12 rounded-xl font-mono text-base font-bold"
                  autoFocus
                />
                {loginPhoneInput.trim().length > 0 && (
                  <p className={`text-xs font-bold ${parsedLoginPhone.isValid ? "text-emerald-500" : "text-rose-400"}`}>
                    {parsedLoginPhone.isValid
                      ? `${parsedLoginPhone.formatted} (${parsedLoginPhone.carrierHint})`
                      : parsedLoginPhone.error}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold opacity-80">
                  ຊື່ຫຼິ້ນ ຫຼື ຊື່ຜູ້ຮັບສິນຄ້າ (ບໍ່ບັງຄັບ)
                </Label>
                <Input
                  value={loginNameInput}
                  onChange={(e) => setLoginNameInput(e.target.value)}
                  placeholder="ເຊັ່ນ: ທ. ສົມຊາຍ / ນ. ມະນີ"
                  className="h-11 rounded-xl text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoggingInCustomer || !parsedLoginPhone.isValid}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/20"
              >
                {isLoggingInCustomer ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : pendingCouponToClaim ? (
                  `ຢືນຢັນເບີໂທ & ຮັບຄູປອງ ${pendingCouponToClaim}`
                ) : (
                  "ເຂົ້າສູ່ລະບົບດ້ວຍເບີໂທລະສັບ"
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* DIALOG 5: VOUCHER CENTER POPUP MODAL (ສູນລວມຄູປອງສ່ວນຫຼຸດ)             */}
      {/* ===================================================================== */}
      <Dialog open={voucherModalOpen} onOpenChange={setVoucherModalOpen}>
        <DialogContent className={`w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border p-5 sm:p-7 ${isDarkBase ? "bg-zinc-950 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
          <DialogHeader className="border-b border-slate-500/15 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl font-black">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <Ticket className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <span>ສູນລວມຄູປອງສ່ວນຫຼຸດ (Store Vouchers)</span>
                <p className={`text-xs font-normal ${subtextColor}`}>
                  ຮ້ານ {store.name} • ຈຳກັດ 1 ເບີໂທລະສັບ / 1 ສິດ
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Member Phone Status Bar */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-slate-500/15 text-xs">
            {customerAccount ? (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>ລັອກອິນໃນນາມເບີ: <strong className="font-mono text-emerald-400">{customerAccount.displayPhone}</strong></span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className={subtextColor}>ຍັງບໍ່ທັນໄດ້ລັອກອິນ (ກົດເກັບຄູປອງເພື່ອປ້ອນເບີໂທ)</span>
                <button
                  type="button"
                  onClick={() => {
                    setVoucherModalOpen(false);
                    setLoginModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 font-bold text-xs"
                >
                  ໃສ່ເບີໂທ
                </button>
              </div>
            )}
          </div>

          {/* Grid of coupons inside modal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {displayCoupons.map((cp: any) => {
              const codeUpper = String(cp.code).toUpperCase();
              const isUsed = usedCodes.includes(codeUpper);
              const isClaimed = claimedCodes.includes(codeUpper) || appliedCoupon?.code === codeUpper;
              const discountLabel =
                cp.type === "PERCENTAGE"
                  ? `ຫຼຸດ ${cp.value}%`
                  : `ຫຼຸດ ₭${Number(cp.value).toLocaleString()}`;
              return (
                <div
                  key={cp.id || cp.code}
                  className={`relative overflow-hidden rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                    isUsed
                      ? "opacity-60 bg-zinc-900/40 border-zinc-700"
                      : isDarkBase
                      ? "bg-zinc-900/90 border-emerald-500/30 hover:border-emerald-400"
                      : "bg-emerald-50/60 border-emerald-200 hover:border-emerald-400"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-emerald-500">{discountLabel}</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                        {codeUpper}
                      </span>
                    </div>
                    <p className={`text-xs ${subtextColor}`}>
                      {cp.minOrderVal > 0
                        ? `ເມື່ອຊື້ຄົບຂັ້ນຕ່ຳ ₭${Number(cp.minOrderVal).toLocaleString()}`
                        : "ໃຊ້ໄດ້ກັບທຸກລາຍການ (ບໍ່ມີຂັ້ນຕ່ຳ)"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isUsed}
                    onClick={() => handleClaimVoucher(codeUpper)}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                      isUsed
                        ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                        : isClaimed
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md"
                    }`}
                  >
                    {isUsed
                      ? "ໃຊ້ສິດແລ້ວ (1/1)"
                      : isClaimed
                      ? "ເກັບແລ້ວ (ກົດໃຊ້ໃນກະຕ່າ)"
                      : "ເກັບຄູປອງສ່ວນຫຼຸດ"}
                  </button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
