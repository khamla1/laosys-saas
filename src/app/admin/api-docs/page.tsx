"use client";

import {
  useState,
  useEffect } from "react";
import { askConfirm } from "@/components/ConfirmModal";
import { toast } from "sonner";
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  Play,
  Bell,
  ShoppingCart,
  Package,
  BarChart3,
  ShieldCheck,
  Smartphone,
  Terminal,
  ExternalLink,
  ChevronRight,
  Info,
  Search,
  Code2,
  Globe,
  Eye,
  EyeOff,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Zap,
  Receipt,
  LayoutGrid
} from "lucide-react";

interface ApiDefinition {
  id: string;
  category: "auth" | "notifications" | "orders" | "summary" | "products";
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  title: string;
  titleLao: string;
  description: string;
  descriptionLao: string;
  headers: Array<{ name: string; value: string; required: boolean; desc: string }>;
  queryParams?: Array<{ name: string; type: string; required: boolean; default?: string; desc: string }>;
  pathParams?: Array<{ name: string; type: string; required: boolean; desc: string }>;
  bodySchema?: Record<string, any>;
  sampleResponse: Record<string, any>;
  defaultTestParams?: {
    queryParams?: Record<string, string>;
    pathParams?: Record<string, string>;
    body?: string;
  };
}

const API_CATALOG: ApiDefinition[] = [
  // ─── 1. AUTH & CONNECT ───
  {
    id: "mobile-connect",
    category: "auth",
    method: "GET",
    path: "/api/v1/mobile/connect",
    title: "Verify Connection & Store Profile",
    titleLao: "ກວດສອບການເຊື່ອມຕໍ່ & ຂໍ້ມູນຮ້ານຄ້າ (Handshake)",
    description: "Ping the server to verify API key validity, retrieve store identity, currency settings, and active modules.",
    descriptionLao: "ໃຊ້ສຳລັບໃຫ້ Mobile App ຍິງທົດສອບວ່າ Key ຖືກຕ້ອງຫຼືບໍ່ ພ້ອມດຶງຂໍ້ມູນຊື່ຮ້ານ, ເບີໂທ, ທີ່ຢູ່, ແລະ ຄ່າເງິນ",
    headers: [
      { name: "X-API-Key", value: "sk_live_...", required: true, desc: "Store API Key" },
      { name: "Accept", value: "application/json", required: false, desc: "JSON content type" },
    ],
    sampleResponse: {
      success: true,
      message: "Connected successfully to Store API",
      authMethod: "API_KEY",
      serverTime: "2026-11-03T17:00:00.000Z",
      apiVersion: "v1.0",
      store: {
        id: "6724...",
        name: "ຮ້ານອາຫານ ແລະ ເຄື່ອງດື່ມ ຄຳຫຼ້າ",
        slug: "khamla-shop",
        logo: "https://...",
        businessType: "RESTAURANT",
        phone: "020 5555 1234",
        currency: { primary: "LAK", rateTHB: 650, rateUSD: 22000 },
        enabledModules: ["POS", "ORDERS", "INVENTORY"],
      },
    },
  },

  // ─── 2. SUMMARY & KPI ───
  {
    id: "mobile-summary",
    category: "summary",
    method: "GET",
    path: "/api/v1/mobile/summary",
    title: "Real-time Dashboard Summary & Alerts",
    titleLao: "ສະຫຼຸບຍອດຂາຍ & ສະຖານະແຈ້ງເຕືອນ Real-time (KPI Summary)",
    description: "Get real-time snapshot of today's sales, pending orders count, unread notification count, low-stock count, and latest order timestamp.",
    descriptionLao: "ຈຸດສຳຄັນສຳລັບໜ້າ Home ຂອງ Mobile App: ດຶງຍອດຂາຍມື້ນີ້, ຈຳນວນອໍເດີທີ່ລໍຖ້າກວດສອບ, ແລະ ເວລາອໍເດີລ່າສຸດ ເພື່ອກວດຈັບອໍເດີໃໝ່ໄດ້ທັນທີ",
    headers: [
      { name: "X-API-Key", value: "sk_live_...", required: true, desc: "Store API Key" },
    ],
    sampleResponse: {
      success: true,
      store: { id: "6724...", name: "ຮ້ານ ຄຳຫຼ້າ" },
      serverTime: "2026-11-03T17:05:00.000Z",
      kpis: {
        todaySales: 1850000,
        todayOrdersCount: 14,
        pendingOrdersCount: 3,
        processingOrdersCount: 2,
        unreadNotificationsCount: 5,
        lowStockCount: 4,
      },
      latestSync: {
        latestOrderTimestamp: "2026-11-03T17:02:15.000Z",
        latestOrderId: "67248f...",
        latestOrderNumber: "#ORD-8F9B2C",
        latestNotificationTimestamp: "2026-11-03T17:02:16.000Z",
        latestNotificationTitle: "ອໍເດີໃໝ່ #ORD-8F9B2C",
      },
    },
  },

  // ─── 3. NOTIFICATIONS ───
  {
    id: "mobile-notifications-list",
    category: "notifications",
    method: "GET",
    path: "/api/v1/mobile/notifications",
    title: "Fetch Notifications & Alerts",
    titleLao: "ດຶງລາຍການແຈ້ງເຕືອນ & ສຽງເຕືອນ (Notifications)",
    description: "List notifications with unread badge count, filter by unread only, and poll notifications created after a timestamp.",
    descriptionLao: "ດຶງແຈ້ງເຕືອນທັງໝົດ ຫຼື ເອົາສະເພາະອັນທີ່ຍັງບໍ່ທັນອ່ານ ຮອງຮັບ polling ດ້ວຍ parameter `since` ສຳລັບດັງສຽງເຕືອນໃນມືຖື",
    headers: [
      { name: "X-API-Key", value: "sk_live_...", required: true, desc: "Store API Key" },
    ],
    queryParams: [
      { name: "unreadOnly", type: "boolean", required: false, default: "false", desc: "Filter to only unread notifications ('true' or 'false')" },
      { name: "since", type: "string (ISO)", required: false, desc: "Only return notifications created after this date (e.g. 2026-11-03T16:00:00Z)" },
      { name: "limit", type: "number", required: false, default: "30", desc: "Max items to retrieve (1-100)" },
    ],
    sampleResponse: {
      success: true,
      unreadCount: 4,
      count: 2,
      pollTimestamp: "2026-11-03T17:10:00.000Z",
      notifications: [
        {
          id: "672491a...",
          title: "ອໍເດີໃໝ່ #ORD-8F9B2C",
          message: "ມີລູກຄ້າສັ່ງຊື້ສິນຄ້າ 3 ລາຍການ ຍອດລວມ 245,000 LAK",
          type: "NEW_ORDER",
          isRead: false,
          link: "/dashboard/orders?id=67248f...",
          createdAt: "2026-11-03T17:02:16.000Z",
        },
        {
          id: "672490b...",
          title: "ສິນຄ້າໃກ້ໝົດສະຕັອກ",
          message: "ສິນຄ້າ 'ກາເຟອາຣາບິກ້າ 500g' ເຫຼືອພຽງ 2 ຖົງ",
          type: "LOW_STOCK",
          isRead: false,
          link: "/dashboard/inventory",
          createdAt: "2026-11-03T16:45:00.000Z",
        },
      ],
    },
    defaultTestParams: {
      queryParams: { unreadOnly: "false", limit: "10" },
    },
  },
  {
    id: "mobile-notifications-read",
    category: "notifications",
    method: "POST",
    path: "/api/v1/mobile/notifications/read",
    title: "Mark Notifications as Read",
    titleLao: "ໝາຍວ່າອ່ານແລ້ວ (Mark as Read)",
    description: "Mark a specific notification as read by ID, or mark all unread notifications as read at once.",
    descriptionLao: "ອັບເດດສະຖານະການອ່ານແຈ້ງເຕືອນ ເພື່ອລົດຕົວເລກ Badge ແຈ້ງເຕືອນໃນແອັບ",
    headers: [
      { name: "X-API-Key", value: "sk_live_...", required: true, desc: "Store API Key" },
      { name: "Content-Type", value: "application/json", required: true, desc: "JSON Body" },
    ],
    bodySchema: {
      notificationId: "string (optional - ID of specific notification)",
      all: "boolean (optional - true to mark all as read)",
    },
    sampleResponse: {
      success: true,
      message: "Notification marked as read",
      notificationId: "672491a...",
      updatedCount: 1,
    },
    defaultTestParams: {
      body: JSON.stringify({ all: true }, null, 2),
    },
  },

  // ─── 4. ORDERS ───
  {
    id: "mobile-orders-list",
    category: "orders",
    method: "GET",
    path: "/api/v1/mobile/orders",
    title: "List Orders & Real-time Polling",
    titleLao: "ດຶງລາຍການອໍເດີ & Polling ອໍເດີໃໝ່ (Orders List)",
    description: "List store orders with filters by status, search by customer/phone, pagination, and incremental polling with `since`.",
    descriptionLao: "ດຶງລາຍການອໍເດີທັງໝົດ ພ້ອມສະຫຼຸບສິນຄ້າ ແລະ ລູກຄ້າ ສາມາດໃຊ້ polling ທຸກໆ 5-10 ວິນາທີ ດ້ວຍ `since` ເພື່ອເບິ່ງອໍເດີທີ່ເຂົ້າມາໃໝ່",
    headers: [
      { name: "X-API-Key", value: "sk_live_...", required: true, desc: "Store API Key" },
    ],
    queryParams: [
      { name: "status", type: "string", required: false, default: "ALL", desc: "Filter by status: ALL, PENDING, PAID, PROCESSING, SHIPPED, COMPLETED, CANCELLED" },
      { name: "since", type: "string (ISO)", required: false, desc: "Incremental polling: return orders created after this timestamp" },
      { name: "search", type: "string", required: false, desc: "Search customer name, phone number, or order ID" },
      { name: "page", type: "number", required: false, default: "1", desc: "Page number" },
      { name: "limit", type: "number", required: false, default: "20", desc: "Page size (1-100)" },
    ],
    sampleResponse: {
      success: true,
      pagination: { page: 1, limit: 20, total: 35, totalPages: 2 },
      pollTimestamp: "2026-11-03T17:15:00.000Z",
      orders: [
        {
          id: "67248f...",
          orderNumber: "#ORD-8F9B2C",
          status: "PENDING",
          totalAmount: 245000,
          currency: "LAK",
          customer: {
            name: "ສົມສັກ ໄຊຍະວົງ",
            phone: "020 9999 8888",
            email: "somsak@example.com",
            address: "ບ້ານ ໂພນສະອາດ, ເມືອງ ໄຊເສດຖາ",
            note: "ຂໍນ້ຳກ້ອນແຍກຕ່າງຫາກ",
          },
          payment: {
            method: "BCEL_ONE",
            slipUrl: "https://.../slip.jpg",
            discountAmount: 15000,
            couponCode: "WELCOME15",
          },
          table: "ໂຕະ VIP 2",
          itemsCount: 3,
          itemsPreview: "ກາເຟເຢັນ x2, ຊາຂຽວມັດຊະ x1",
          createdAt: "2026-11-03T17:02:15.000Z",
          updatedAt: "2026-11-03T17:02:15.000Z",
        },
      ],
    },
    defaultTestParams: {
      queryParams: { status: "ALL", limit: "5" },
    },
  },
  {
    id: "mobile-order-detail",
    category: "orders",
    method: "GET",
    path: "/api/v1/mobile/orders/:id",
    title: "Get Full Order Details",
    titleLao: "ເບິ່ງລາຍລະອຽດອໍເດີຄົບຖ້ວນ (Order Detail)",
    description: "Inspect complete breakdown of an order: all items, product images, quantities, modifiers, customer delivery address, table, and payment slip.",
    descriptionLao: "ເບິ່ງລາຍລະອຽດທຸກຢ່າງຂອງອໍເດີ: ສິນຄ້າແຕ່ລະຢ່າງ, ຮູບພາບ, ລາຄາ, ສ່ວນຫຼຸດ, ຫຼັກຖານການໂອນເງິນ (Slip), ແລະ ໂຕະທີ່ນັ່ງ",
    headers: [
      { name: "X-API-Key", value: "sk_live_...", required: true, desc: "Store API Key" },
    ],
    pathParams: [
      { name: "id", type: "string", required: true, desc: "Order ID (MongoDB ObjectId, e.g. 67248f...)" },
    ],
    sampleResponse: {
      success: true,
      order: {
        id: "67248f...",
        orderNumber: "#ORD-8F9B2C",
        status: "PENDING",
        totalAmount: 245000,
        currency: "LAK",
        customer: {
          name: "ສົມສັກ ໄຊຍະວົງ",
          phone: "020 9999 8888",
          email: "somsak@example.com",
          address: "ບ້ານ ໂພນສະອາດ, ເມືອງ ໄຊເສດຖາ",
          note: "ຂໍນ້ຳກ້ອນແຍກຕ່າງຫາກ",
        },
        payment: {
          method: "BCEL_ONE",
          slipUrl: "https://.../slip.jpg",
          couponCode: "WELCOME15",
          discountAmount: 15000,
        },
        table: { id: "tab123", name: "ໂຕະ VIP 2", zone: "Indoor AC" },
        itemsCount: 3,
        items: [
          {
            id: "item1",
            productId: "prod101",
            productName: "ກາເຟອາເມຣິກາໂນ່ເຢັນ",
            productImage: "https://.../coffee.jpg",
            categoryName: "ເຄື່ອງດື່ມ",
            barcode: "885012345678",
            quantity: 2,
            price: 35000,
            subtotal: 70000,
            status: "PENDING",
            modifiers: { sweetness: "50%", size: "L" },
          },
        ],
        createdAt: "2026-11-03T17:02:15.000Z",
        updatedAt: "2026-11-03T17:02:15.000Z",
      },
    },
    defaultTestParams: {
      pathParams: { id: "YOUR_ORDER_ID" },
    },
  },
  {
    id: "mobile-order-update",
    category: "orders",
    method: "PATCH",
    path: "/api/v1/mobile/orders/:id",
    title: "Update Order Status",
    titleLao: "ອັບເດດສະຖານະອໍເດີ (Update Status)",
    description: "Accept, prepare, complete, or cancel an order directly from the mobile app. Automatically records audit log trail.",
    descriptionLao: "ກົດຮັບອໍເດີ, ສັ່ງເຮັດຄົວ (PROCESSING), ສຳເລັດອໍເດີ (COMPLETED), ຫຼື ຍົກເລີກ (CANCELLED) ພ້ອມບັນທຶກປະຫວັດການແກ້ໄຂອັດຕະໂນມັດ",
    headers: [
      { name: "X-API-Key", value: "sk_live_...", required: true, desc: "Store API Key" },
      { name: "Content-Type", value: "application/json", required: true, desc: "JSON Body" },
    ],
    pathParams: [
      { name: "id", type: "string", required: true, desc: "Order ID (MongoDB ObjectId)" },
    ],
    bodySchema: {
      status: "string (required: PENDING | PAID | PROCESSING | SHIPPED | COMPLETED | CANCELLED)",
      note: "string (optional - reason or staff note)",
    },
    sampleResponse: {
      success: true,
      message: "Order #ORD-8F9B2C status updated to PROCESSING",
      order: {
        id: "67248f...",
        orderNumber: "#ORD-8F9B2C",
        oldStatus: "PENDING",
        newStatus: "PROCESSING",
        updatedAt: "2026-11-03T17:20:00.000Z",
      },
    },
    defaultTestParams: {
      pathParams: { id: "YOUR_ORDER_ID" },
      body: JSON.stringify({ status: "PROCESSING", note: "Staff accepted via Mobile App" }, null, 2),
    },
  },

  // ─── 5. PRODUCTS & INVENTORY ───
  {
    id: "mobile-products-list",
    category: "products",
    method: "GET",
    path: "/api/v1/mobile/products",
    title: "Products & Stock Inspection",
    titleLao: "ກວດສອບສິນຄ້າ & ສະຕັອກ (Products & Stock)",
    description: "Browse products, check remaining quantities, detect low-stock items, scan barcodes, and view selling prices.",
    descriptionLao: "ໃຊ້ສຳລັບເບິ່ງຈຳນວນສະຕັອກຄົງເຫຼືອ, ກວດສອບສິນຄ້າໃກ້ໝົດ, ແລະ ສະແກນບາໂຄດສິນຄ້າຜ່ານມືຖື",
    headers: [
      { name: "X-API-Key", value: "sk_live_...", required: true, desc: "Store API Key" },
    ],
    queryParams: [
      { name: "search", type: "string", required: false, desc: "Search by product name, barcode, or description" },
      { name: "lowStockOnly", type: "boolean", required: false, default: "false", desc: "Filter to only products with stock <= 5" },
      { name: "categoryId", type: "string", required: false, desc: "Filter by category ID" },
      { name: "limit", type: "number", required: false, default: "30", desc: "Max items (1-100)" },
    ],
    sampleResponse: {
      success: true,
      pagination: { page: 1, limit: 30, total: 120, totalPages: 4 },
      products: [
        {
          id: "672401...",
          name: "ກາເຟອາຣາບິກ້າ 500g",
          price: 95000,
          costPrice: 65000,
          stock: 3,
          barcode: "8859123456789",
          category: "ເມັດກາເຟ",
          image: "https://.../bean.jpg",
          isLowStock: true,
          isOutOfStock: false,
          updatedAt: "2026-11-03T16:00:00.000Z",
        },
      ],
    },
    defaultTestParams: {
      queryParams: { lowStockOnly: "true", limit: "5" },
    },
  },
];

export default function ApiDocsHubPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [storeName, setStoreName] = useState<string>("");
  const [loadingKey, setLoadingKey] = useState<boolean>(true);
  const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [regenerating, setRegenerating] = useState<boolean>(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedApiId, setExpandedApiId] = useState<string | null>("mobile-orders-list");

  // Code snippets tab
  const [selectedSnippetLang, setSelectedSnippetLang] = useState<"flutter" | "react-native" | "curl" | "fetch">("flutter");

  // Try it out simulator state
  const [testInputs, setTestInputs] = useState<Record<string, { queryParams: Record<string, string>; pathParams: Record<string, string>; body: string }>>({});
  const [testResults, setTestResults] = useState<Record<string, { loading: boolean; status?: number; timeMs?: number; data?: any; error?: string }>>({});

  // Base URL
  const [originUrl, setOriginUrl] = useState<string>("http://26.86.176.51:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    setLoadingKey(true);
    try {
      const res = await fetch("/api/v1/mobile/keys");
      const data = await res.json();
      if (data.success && data.apiKey) {
        setApiKey(data.apiKey);
        setStoreName(data.storeName || "Store");
      }
    } catch (e) {
      console.error("Failed to load API key", e);
    } finally {
      setLoadingKey(false);
    }
  };

  const handleRegenerateKey = async () => {
    const confirmed = await askConfirm({
      title: "ຢືນຢັນການສ້າງ API Key ໃໝ່",
      message: "ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການສ້າງ API Key ໃໝ່?",
      subMessage: "ຫາກສ້າງໃໝ່ ແອັບມືຖືທີ່ໃຊ້ Key ເກົ່າຈະບໍ່ສາມາດເຊື່ອມຕໍ່ໄດ້ຈົນກວ່າຈະປ່ຽນ Key ໃໝ່.",
      variant: "warning",
      confirmText: "ຢືນຢັນສ້າງ Key ໃໝ່",
      cancelText: "ຍົກເລີກ",
    });
    if (!confirmed) {
      return;
    }
    setRegenerating(true);
    try {
      const res = await fetch("/api/v1/mobile/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate" }),
      });
      const data = await res.json();
      if (data.success && data.apiKey) {
        setApiKey(data.apiKey);
        toast.success("ສ້າງ API Key ໃໝ່ສຳເລັດແລ້ວ!");
      }
    } catch (e) {
      toast.error("ບໍ່ສາມາດສ້າງ Key ໃໝ່ໄດ້");
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text: string, isKey = false) => {
    navigator.clipboard.writeText(text);
    if (isKey) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  // Filter APIs
  const filteredApis = API_CATALOG.filter((api) => {
    const matchesCategory = selectedCategory === "all" || api.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      api.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.titleLao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.descriptionLao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.method.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Simulator helper
  const getTestInput = (api: ApiDefinition) => {
    if (!testInputs[api.id]) {
      return {
        queryParams: api.defaultTestParams?.queryParams || {},
        pathParams: api.defaultTestParams?.pathParams || {},
        body: api.defaultTestParams?.body || (api.bodySchema ? JSON.stringify(api.bodySchema, null, 2) : ""),
      };
    }
    return testInputs[api.id];
  };

  const updateTestInput = (apiId: string, type: "queryParams" | "pathParams" | "body", keyOrVal: string, value?: string) => {
    setTestInputs((prev) => {
      const current = prev[apiId] || { queryParams: {}, pathParams: {}, body: "" };
      if (type === "body") {
        return { ...prev, [apiId]: { ...current, body: keyOrVal } };
      } else {
        return {
          ...prev,
          [apiId]: {
            ...current,
            [type]: { ...current[type], [keyOrVal]: value || "" },
          },
        };
      }
    });
  };

  const executeLiveTest = async (api: ApiDefinition) => {
    const input = getTestInput(api);
    let resolvedPath = api.path;

    // Replace path params
    if (api.pathParams) {
      api.pathParams.forEach((param) => {
        const val = input.pathParams[param.name] || param.name;
        resolvedPath = resolvedPath.replace(`:${param.name}`, encodeURIComponent(val));
      });
    }

    // Build query params
    const queryParts: string[] = [];
    if (api.queryParams) {
      Object.entries(input.queryParams).forEach(([k, v]) => {
        if (v !== undefined && v !== "") {
          queryParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
        }
      });
    }

    const fullUrl = `${resolvedPath}${queryParts.length > 0 ? "?" + queryParts.join("&") : ""}`;

    setTestResults((prev) => ({
      ...prev,
      [api.id]: { loading: true },
    }));

    const startTime = performance.now();
    try {
      const headers: Record<string, string> = {
        "X-API-Key": apiKey || "test_key",
      };
      if (api.method !== "GET") {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(fullUrl, {
        method: api.method,
        headers,
        body: api.method !== "GET" && input.body ? input.body : undefined,
      });

      const endTime = performance.now();
      const timeMs = Math.round(endTime - startTime);
      const data = await res.json().catch(() => ({ raw: "Non-JSON response" }));

      setTestResults((prev) => ({
        ...prev,
        [api.id]: {
          loading: false,
          status: res.status,
          timeMs,
          data,
        },
      }));
    } catch (err: any) {
      const endTime = performance.now();
      setTestResults((prev) => ({
        ...prev,
        [api.id]: {
          loading: false,
          status: 0,
          timeMs: Math.round(endTime - startTime),
          error: err.message || "Network Error",
        },
      }));
    }
  };

  // Generate Code Snippet
  const generateSnippet = (api: ApiDefinition, lang: "flutter" | "react-native" | "curl" | "fetch") => {
    const effectiveKey = apiKey || "YOUR_API_KEY";
    const samplePath = api.path.replace(":id", "67248f1234567890abcdef");
    const fullUrl = `${originUrl}${samplePath}`;

    if (lang === "flutter") {
      if (api.method === "GET") {
        return `// Flutter (Dart) - ${api.title}
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> fetch${api.id.replace(/-/g, "_")}() async {
  final url = Uri.parse('$originUrl${samplePath}');
  final response = await http.get(
    url,
    headers: {
      'X-API-Key': '${effectiveKey}',
      'Accept': 'application/json',
    },
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    print('Response: $data');
  } else {
    print('Failed with status: \${response.statusCode}');
  }
}`;
      } else {
        return `// Flutter (Dart) - ${api.title}
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> send${api.id.replace(/-/g, "_")}() async {
  final url = Uri.parse('$originUrl${samplePath}');
  final response = await http.${api.method.toLowerCase()}(
    url,
    headers: {
      'X-API-Key': '${effectiveKey}',
      'Content-Type': 'application/json',
    },
    body: jsonEncode(${api.defaultTestParams?.body || JSON.stringify(api.bodySchema || {}, null, 2)}),
  );

  final result = jsonDecode(response.body);
  print('Result: $result');
}`;
      }
    }

    if (lang === "react-native") {
      return `// React Native / Axios / Fetch - ${api.title}
const sendRequest = async () => {
  try {
    const response = await fetch('${fullUrl}', {
      method: '${api.method}',
      headers: {
        'X-API-Key': '${effectiveKey}',
        'Content-Type': 'application/json',
      },
      ${api.method !== "GET" ? `body: JSON.stringify(${api.defaultTestParams?.body || "{}"}),` : ""}
    });

    const data = await response.json();
    console.log('Success:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};`;
    }

    if (lang === "curl") {
      if (api.method === "GET") {
        return `curl -X GET "${fullUrl}" \\
  -H "X-API-Key: ${effectiveKey}" \\
  -H "Accept: application/json"`;
      } else {
        return `curl -X ${api.method} "${fullUrl}" \\
  -H "X-API-Key: ${effectiveKey}" \\
  -H "Content-Type: application/json" \\
  -d '${api.defaultTestParams?.body ? api.defaultTestParams.body.replace(/\n\s*/g, " ") : "{}"}'`;
      }
    }

    // fetch (JS)
    return `const res = await fetch('${fullUrl}', {
  method: '${api.method}',
  headers: {
    'X-API-Key': '${effectiveKey}',
    'Content-Type': 'application/json',
  },
  ${api.method !== "GET" ? `body: JSON.stringify(${api.defaultTestParams?.body || "{}"}),` : ""}
});
const data = await res.json();
console.log(data);`;
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-sky-500/15 text-sky-400 border-sky-500/30";
      case "POST":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "PATCH":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "DELETE":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-zinc-700 text-zinc-300 border-zinc-600";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 space-y-8 font-sans">
      {/* ── Top Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-blue-950/40 border border-zinc-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25">
                <Smartphone size={24} />
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                REST API v1 • Mobile Integration Hub
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              ສູນລວມ API ສຳລັບແອັບມືຖື & ລະບົບພາຍນອກ
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-3xl leading-relaxed">
              ເອກະສານ API ຄົບຊຸດພ້ອມລະບົບ Key ສຳລັບເຊື່ອມຕໍ່ກັບ Mobile App (Flutter, React Native, iOS, Android) ເພື່ອຮັບການແຈ້ງເຕືອນ, ຕິດຕາມອໍເດີ, ກວດສອບສະຕັອກສິນຄ້າ ແລະ ດຶງສະຫຼຸບຍອດຂາຍແບບ Real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700/60 text-xs text-zinc-300 flex items-center gap-2">
              <Globe size={14} className="text-emerald-400" />
              <span>Base URL:</span>
              <code className="text-emerald-400 font-mono font-medium">{originUrl}</code>
            </div>
          </div>
        </div>
      </div>

      {/* ── API Key & Credentials Card ── */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <Key size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-base">Store API Key & Authentication</h2>
              <p className="text-xs text-zinc-400">
                ໃຊ້ Key ນີ້ສົ່ງໄປໃນ Header <code className="text-blue-400 font-mono">X-API-Key</code> ຫຼື <code className="text-blue-400 font-mono">Authorization: Bearer &lt;KEY&gt;</code> ຂອງທຸກໆ Request ຈາກແອັບ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerateKey}
              disabled={regenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={regenerating ? "animate-spin" : ""} />
              <span>{regenerating ? "ກຳລັງສ້າງ..." : "ສ້າງ Key ໃໝ່ (Rotate)"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* Key Viewer */}
          <div className="lg:col-span-2 space-y-2">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <span>Active Secret Key:</span>
              {storeName && <span className="text-zinc-500 font-normal">({storeName})</span>}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={isKeyVisible ? "text" : "password"}
                  readOnly
                  value={loadingKey ? "Loading API key..." : apiKey || "No API Key Generated"}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono text-amber-300 focus:outline-none focus:border-blue-500 select-all"
                />
                <button
                  type="button"
                  onClick={() => setIsKeyVisible(!isKeyVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                  title={isKeyVisible ? "Hide key" : "Show key"}
                >
                  {isKeyVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                onClick={() => copyToClipboard(apiKey, true)}
                disabled={!apiKey}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shrink-0 shadow-lg shadow-blue-600/20"
              >
                {copiedKey ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedKey ? "Copied!" : "Copy Key"}</span>
              </button>
            </div>
          </div>

          {/* Quick Header instructions */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3 text-xs space-y-1.5 font-mono text-zinc-300">
            <div className="text-[11px] font-sans font-medium text-zinc-500 uppercase tracking-wider mb-1">
              Required Headers:
            </div>
            <div className="text-emerald-400">X-API-Key: {isKeyVisible && apiKey ? apiKey : "sk_live_••••••••••••"}</div>
            <div className="text-zinc-400">Content-Type: application/json</div>
            <div className="text-zinc-400">Accept: application/json</div>
          </div>
        </div>
      </div>

      {/* ── Architecture & Mobile Polling Flow Guide ── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950/20 via-zinc-900/60 to-purple-950/20 border border-blue-900/30 p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
          <Zap size={16} />
          <span>ຄຳແນະນຳການອອກແບບແອັບມືຖືສຳລັບແຈ້ງເຕືອນອໍເດີ (Mobile Real-time Flow)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-zinc-300">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-1">
            <div className="text-blue-400 font-semibold flex items-center gap-1">
              <span>1. ເຊື່ອມຕໍ່ (Pair App)</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              ຍິງ <code className="text-sky-300">GET /connect</code> ເພື່ອກວດສອບ Key ແລະ ດຶງຊື່ຮ້ານຄ້າ, ໂລໂກ້ ແລະ ຄ່າເງິນ.
            </p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-1">
            <div className="text-emerald-400 font-semibold flex items-center gap-1">
              <span>2. ກວດຈັບອໍເດີໃໝ່ (Polling)</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              ໃຫ້ແອັບ Loop ທຸກໆ 5-10 ວິ ຍິງ <code className="text-emerald-300">GET /summary</code> ຫາກ <code className="text-zinc-300">latestOrderTimestamp</code> ປ່ຽນແປງ ໃຫ້ດັງສຽງເຕືອນທັນທີ.
            </p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-1">
            <div className="text-amber-400 font-semibold flex items-center gap-1">
              <span>3. ດຶງອໍເດີໃໝ່ (Fetch Orders)</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              ຍິງ <code className="text-amber-300">GET /orders?since=...</code> ເພື່ອເອົາສະເພາະອໍເດີທີ່ເພີ່ມຂຶ້ນມາໃໝ່ ປະຢັດເນັດ ແລະ ໄວທີ່ສຸດ.
            </p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-1">
            <div className="text-purple-400 font-semibold flex items-center gap-1">
              <span>4. ກົດຮັບ & ຈັດການ (Action)</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              ກົດເບິ່ງລາຍລະອຽດດ້ວຍ <code className="text-purple-300">GET /orders/:id</code> ແລະ ກົດຮັບອໍເດີດ້ວຍ <code className="text-purple-300">PATCH /orders/:id</code>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Category Filter Tabs & Search ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Categories (Lucide Dark Theme Tabs) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-xs shadow-inner">
          {[
            { id: "all", label: "ທັງໝົດ (All)", icon: LayoutGrid, count: API_CATALOG.length },
            { id: "orders", label: "ອໍເດີ & ລາຍລະອຽດ", icon: Receipt, count: API_CATALOG.filter((a) => a.category === "orders").length },
            { id: "notifications", label: "ແຈ້ງເຕືອນ (Alerts)", icon: Bell, count: API_CATALOG.filter((a) => a.category === "notifications").length },
            { id: "summary", label: "ສະຫຼຸບ KPI", icon: BarChart3, count: API_CATALOG.filter((a) => a.category === "summary").length },
            { id: "products", label: "ສິນຄ້າ & ສະຕັອກ", icon: Package, count: API_CATALOG.filter((a) => a.category === "products").length },
            { id: "auth", label: "ເຊື່ອມຕໍ່ (Auth)", icon: Key, count: API_CATALOG.filter((a) => a.category === "auth").length },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 font-semibold"
                    : "bg-zinc-950/60 text-zinc-400 border-zinc-800/80 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <Icon size={15} strokeWidth={2} className={`shrink-0 ${isSelected ? "text-white" : "text-zinc-400"}`} />
                <span>{cat.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາ API, URL, Method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* ── API Endpoints List ── */}
      <div className="space-y-4">
        {filteredApis.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
            <Info size={32} className="mx-auto text-zinc-600 mb-2" />
            <p className="text-zinc-400 text-sm">ບໍ່ພົບ API ທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ</p>
          </div>
        ) : (
          filteredApis.map((api) => {
            const isExpanded = expandedApiId === api.id;
            const input = getTestInput(api);
            const testResult = testResults[api.id];

            return (
              <div
                key={api.id}
                className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 overflow-hidden shadow-lg hover:border-zinc-700/80 transition-colors"
              >
                {/* Endpoint Header Bar */}
                <div
                  onClick={() => setExpandedApiId(isExpanded ? null : api.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 cursor-pointer gap-3 hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${getMethodBadgeClass(api.method)}`}>
                      {api.method}
                    </span>
                    <span className="font-mono text-sm md:text-base font-semibold text-zinc-100 break-all">
                      {api.path}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-medium text-zinc-200">{api.titleLao}</div>
                      <div className="text-[11px] text-zinc-500">{api.title}</div>
                    </div>
                    <ChevronRight
                      size={18}
                      className={`text-zinc-500 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-90 text-blue-400" : ""}`}
                    />
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-4 md:p-6 border-t border-zinc-800/80 bg-zinc-950/40 space-y-6">
                    {/* Description */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-xs space-y-1">
                      <div className="text-zinc-200 font-medium">{api.descriptionLao}</div>
                      <div className="text-zinc-400">{api.description}</div>
                    </div>

                    {/* Parameters Tables */}
                    <div className="space-y-4">
                      {/* Headers */}
                      {api.headers && api.headers.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                            Request Headers
                          </h4>
                          <div className="overflow-x-auto rounded-xl border border-zinc-800">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                                <tr>
                                  <th className="p-2.5 font-medium">Header Name</th>
                                  <th className="p-2.5 font-medium">Value / Example</th>
                                  <th className="p-2.5 font-medium">Required</th>
                                  <th className="p-2.5 font-medium">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                                {api.headers.map((h) => (
                                  <tr key={h.name} className="hover:bg-zinc-900/40">
                                    <td className="p-2.5 text-blue-400">{h.name}</td>
                                    <td className="p-2.5 text-amber-300">{h.value}</td>
                                    <td className="p-2.5 font-sans">
                                      {h.required ? (
                                        <span className="text-rose-400 font-semibold">Yes</span>
                                      ) : (
                                        <span className="text-zinc-500">Optional</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 font-sans text-zinc-400">{h.desc}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Path Params */}
                      {api.pathParams && api.pathParams.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                            Path Parameters (URL)
                          </h4>
                          <div className="overflow-x-auto rounded-xl border border-zinc-800">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                                <tr>
                                  <th className="p-2.5 font-medium">Parameter</th>
                                  <th className="p-2.5 font-medium">Type</th>
                                  <th className="p-2.5 font-medium">Required</th>
                                  <th className="p-2.5 font-medium">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                                {api.pathParams.map((p) => (
                                  <tr key={p.name} className="hover:bg-zinc-900/40">
                                    <td className="p-2.5 text-purple-400">:{p.name}</td>
                                    <td className="p-2.5 text-zinc-400">{p.type}</td>
                                    <td className="p-2.5 font-sans text-rose-400 font-semibold">Yes</td>
                                    <td className="p-2.5 font-sans text-zinc-300">{p.desc}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Query Params */}
                      {api.queryParams && api.queryParams.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                            Query Parameters (?key=value)
                          </h4>
                          <div className="overflow-x-auto rounded-xl border border-zinc-800">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                                <tr>
                                  <th className="p-2.5 font-medium">Param Name</th>
                                  <th className="p-2.5 font-medium">Type</th>
                                  <th className="p-2.5 font-medium">Default</th>
                                  <th className="p-2.5 font-medium">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                                {api.queryParams.map((q) => (
                                  <tr key={q.name} className="hover:bg-zinc-900/40">
                                    <td className="p-2.5 text-emerald-400">{q.name}</td>
                                    <td className="p-2.5 text-zinc-400">{q.type}</td>
                                    <td className="p-2.5 text-zinc-500">{q.default || "-"}</td>
                                    <td className="p-2.5 font-sans text-zinc-300">{q.desc}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Request Body */}
                      {api.bodySchema && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                            Request Body (JSON)
                          </h4>
                          <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 overflow-x-auto">
                            {JSON.stringify(api.bodySchema, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Interactive "Try It Out" Simulator & Response Sample */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                      {/* Live API Tester */}
                      <div className="rounded-xl border border-blue-900/40 bg-zinc-900/70 p-4 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                            <Play size={14} />
                            <span>ທົດລອງຍິງ API (Live Interactive Tester)</span>
                          </div>
                          <button
                            onClick={() => executeLiveTest(api)}
                            disabled={testResult?.loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
                          >
                            <Send size={12} className={testResult?.loading ? "animate-spin" : ""} />
                            <span>{testResult?.loading ? "ກຳລັງສົ່ງ..." : "ສົ່ງຄຳຂໍ (Execute)"}</span>
                          </button>
                        </div>

                        {/* Input controls */}
                        <div className="space-y-3 text-xs">
                          {/* Path inputs */}
                          {api.pathParams &&
                            api.pathParams.map((p) => (
                              <div key={p.name} className="space-y-1">
                                <label className="text-zinc-400 font-mono text-[11px]">
                                  Path Param: :{p.name}
                                </label>
                                <input
                                  type="text"
                                  placeholder={p.name}
                                  value={input.pathParams[p.name] || ""}
                                  onChange={(e) =>
                                    updateTestInput(api.id, "pathParams", p.name, e.target.value)
                                  }
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            ))}

                          {/* Query inputs */}
                          {api.queryParams &&
                            api.queryParams.map((q) => (
                              <div key={q.name} className="space-y-1">
                                <label className="text-zinc-400 font-mono text-[11px]">
                                  Query Param: ?{q.name}
                                </label>
                                <input
                                  type="text"
                                  placeholder={q.default || q.name}
                                  value={input.queryParams[q.name] ?? q.default ?? ""}
                                  onChange={(e) =>
                                    updateTestInput(api.id, "queryParams", q.name, e.target.value)
                                  }
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            ))}

                          {/* Body input */}
                          {api.method !== "GET" && (
                            <div className="space-y-1">
                              <label className="text-zinc-400 font-mono text-[11px]">JSON Body:</label>
                              <textarea
                                rows={4}
                                value={input.body}
                                onChange={(e) => updateTestInput(api.id, "body", e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          )}
                        </div>

                        {/* Result Output */}
                        {testResult && (
                          <div className="space-y-2 pt-2 border-t border-zinc-800">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-zinc-300">Live Result:</span>
                              <div className="flex items-center gap-2">
                                {testResult.status !== undefined && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      testResult.status >= 200 && testResult.status < 300
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    }`}
                                  >
                                    {testResult.status} OK
                                  </span>
                                )}
                                {testResult.timeMs !== undefined && (
                                  <span className="text-[10px] text-zinc-500 font-mono">
                                    {testResult.timeMs}ms
                                  </span>
                                )}
                              </div>
                            </div>
                            <pre className="max-h-56 overflow-auto p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                              {testResult.error
                                ? JSON.stringify({ error: testResult.error }, null, 2)
                                : JSON.stringify(testResult.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Sample JSON Response */}
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 size={14} />
                            <span>ຕົວຢ່າງ Response (Sample JSON)</span>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(JSON.stringify(api.sampleResponse, null, 2))
                            }
                            className="p-1 hover:text-white text-zinc-500 transition-colors"
                            title="Copy sample JSON"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                        <pre className="max-h-80 overflow-auto p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[11px] font-mono text-emerald-300/90 leading-relaxed">
                          {JSON.stringify(api.sampleResponse, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Multi-Language Code Snippets */}
                    <div className="space-y-3 pt-3 border-t border-zinc-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                          <Code2 size={15} className="text-purple-400" />
                          <span>Code Example ສຳລັບແອັບມືຖື</span>
                        </div>

                        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-[11px]">
                          {(["flutter", "react-native", "curl", "fetch"] as const).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setSelectedSnippetLang(lang)}
                              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                                selectedSnippetLang === lang
                                  ? "bg-purple-600 text-white shadow-sm"
                                  : "text-zinc-400 hover:text-white"
                              }`}
                            >
                              {lang === "flutter"
                                ? "Flutter (Dart)"
                                : lang === "react-native"
                                ? "React Native"
                                : lang === "curl"
                                ? "cURL"
                                : "Fetch (JS)"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                          {generateSnippet(api, selectedSnippetLang)}
                        </pre>
                        <button
                          onClick={() =>
                            copyToClipboard(generateSnippet(api, selectedSnippetLang))
                          }
                          className="absolute right-3 top-3 p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                          title="Copy snippet"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
