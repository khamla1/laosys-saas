"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Save, BellRing, LayoutGrid, Store, Trash2, Calendar, AlertTriangle, MonitorSmartphone, CreditCard, CheckSquare, XCircle, Package } from "lucide-react";
import { BrandTelegram, BrandLine } from "@/components/icons/BrandIcons";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TelegramSettings {
  telegramChatId: string | null;
  telegramEnabled: boolean;
  lineNotifyToken?: string | null;
}

interface ModuleSettings {
  businessType: string;
  enabledModules: string[];
}

interface GeneralSettings {
  name: string;
  slug: string;
  subscriptionExpiresAt: string | null;
}

interface StorefrontSettings {
  theme: string;
  customDomain: string | null;
  bannerUrl: string | null;
}

interface PaymentSettings {
  promptPayId: string;
  paymentAccountInfo: string;
}

export default function StoreSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const storeId = resolvedParams.id;
  const router = useRouter();
  const { update } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingModules, setIsSavingModules] = useState(false);
  const [isSavingStorefront, setIsSavingStorefront] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({ telegramChatId: "", telegramEnabled: false, lineNotifyToken: "" });
  const [moduleSettings, setModuleSettings] = useState<ModuleSettings>({ businessType: "GENERIC", enabledModules: [] });
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({ name: "", slug: "", subscriptionExpiresAt: null });
  const [storefrontSettings, setStorefrontSettings] = useState<StorefrontSettings>({ theme: "light", customDomain: "", bannerUrl: "" });
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({ promptPayId: "", paymentAccountInfo: "" });

  const availableModules = [
    { id: "CORE", label: "ລະບົບຫຼັກ (Core)" },
    { id: "POS", label: "ລະບົບໜ້າຮ້ານ (POS)" },
    { id: "INVENTORY", label: "ລະບົບສາງສິນຄ້າ (Inventory)" },
    { id: "ECOMMERCE", label: "ລະບົບອີຄອມເມີຊ (E-commerce)" },
    { id: "RESTAURANT", label: "ລະບົບຮ້ານອາຫານ (Restaurant)" },
    { id: "BOOKING", label: "ລະບົບນັດໝາຍ (Booking)" },
    { id: "ACCOUNTING", label: "ລະບົບບັນຊີ (Accounting)" },
    { id: "RENTALS", label: "ລະບົບເຊົ່າອຸປະກອນ (Rentals)" },
    { id: "REPAIRS", label: "ສູນສ້ອມແປງ (Repairs)" },
    { id: "FITTING", label: "ບໍລິການຟິດຕິ້ງ (Fitting)" },
    { id: "CONSIGNMENT", label: "ສາງສິນຄ້າມືສອງ (Consignment)" },
    { id: "TEAM", label: "ຈັດການທີມ (Team/Club)" },
    { id: "COMMUNITY", label: "ຄອມມູນິຕີ້ (Community)" },
    { id: "TECH", label: "ອຸປະກອນອັດສະລິຍະ (Tech)" },
    { id: "AMBASSADORS", label: "ຕົວແທນຈຳໜ່າຍ (Ambassadors)" },
    { id: "COACHING", label: "ຫ້ອງຮຽນ/ໂຄດຊິ້ງ (Coaching)" },
    { id: "DATA_EDITOR", label: "ຈັດການຂໍ້ມູນ (Data Editor)" }
  ];
  
  const businessTypes = [
    { id: "GENERIC", label: "ທົ່ວໄປ (Generic)" },
    { id: "RESTAURANT", label: "ຮ້ານອາຫານ (Restaurant)" },
    { id: "RETAIL", label: "ຮ້ານຂາຍຍ່ອຍ (Retail)" },
    { id: "SERVICE", label: "ບໍລິການ (Service)" },
    { id: "COSMETICS", label: "ຮ້ານເຄື່ອງສຳອາງ (Cosmetics)" },
    { id: "ELECTRONICS", label: "ຮ້ານເຄື່ອງໃຊ້ໄຟຟ້າ (Electronics)" },
    { id: "FASHION", label: "ຮ້ານເສື້ອຜ້າ (Fashion)" },
    { id: "CLINIC", label: "ຄລີນິກ/ສະປາ (Clinic/Spa)" },
    { id: "SPORTS_CLUB", label: "ກິລາ/ຟິດເນດ (Sports Club)" }
  ];

  useEffect(() => {
    fetchSettings();
  }, [storeId]);

  const fetchSettings = async () => {
    try {
      // 1. Fetch General Info from new API
      const orgRes = await fetch(`/api/admin/stores/${storeId}`);
      if (!orgRes.ok) throw new Error("Failed to fetch store details");
      const orgData = await orgRes.json();
      
      setGeneralSettings({
        name: orgData.name,
        slug: orgData.slug,
        subscriptionExpiresAt: orgData.subscriptionExpiresAt ? new Date(orgData.subscriptionExpiresAt).toISOString().slice(0, 16) : null
      });

      setModuleSettings({
        businessType: orgData.businessType,
        enabledModules: orgData.enabledModules || [],
      });
      
      if (orgData.metadata?.payment) {
        setPaymentSettings({
          promptPayId: orgData.metadata.payment.promptPayId || "",
          paymentAccountInfo: orgData.metadata.payment.paymentAccountInfo || ""
        });
      }

      // 2. Fetch Telegram
      const telRes = await fetch(`/api/admin/stores/${storeId}/telegram`);
      if (telRes.ok) {
        const telData = await telRes.json();
        setTelegramSettings(telData.settings);
      }

      // 3. Fetch Storefront
      const storefRes = await fetch(`/api/admin/stores/${storeId}/storefront`);
      if (storefRes.ok) {
        const storefData = await storefRes.json();
        setStorefrontSettings({
          theme: storefData.theme || "light",
          customDomain: storefData.customDomain || "",
          bannerUrl: storefData.bannerUrl || ""
        });
      }
    } catch (error) {
      toast.error("Failed to load store settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setIsSavingGeneral(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: generalSettings.name,
          slug: generalSettings.slug,
          subscriptionExpiresAt: generalSettings.subscriptionExpiresAt ? new Date(generalSettings.subscriptionExpiresAt).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save general settings");
      }

      toast.success("General settings saved successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleSaveModules = async () => {
    setIsSavingModules(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleSettings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save modules");
      }

      toast.success("Module settings saved successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSavingModules(false);
    }
  };

  const handleSaveTelegram = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/telegram`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegramSettings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success("Telegram settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStorefront = async () => {
    setIsSavingStorefront(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/storefront`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storefrontSettings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save storefront settings");
      }

      toast.success("Storefront settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSavingStorefront(false);
    }
  };

  const handleSavePayment = async () => {
    setIsSavingPayment(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: { payment: paymentSettings }
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save payment settings");
      }

      toast.success("Payment settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleTestNotification = async () => {
    if (!telegramSettings.telegramChatId) {
      toast.error("Please assign a Chat ID and save first.");
      return;
    }
    setIsTesting(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/telegram/test`, { method: "POST" });
      if (!res.ok) throw new Error("Test failed");
      toast.success("Test notification sent! Check Telegram.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteStore = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete store");
      toast.success("Store deleted successfully");
      router.push("/admin/users");
    } catch (error: any) {
      toast.error(error.message);
      setIsDeleting(false);
    }
  };

  const handleManageStore = async () => {
    setIsSwitching(true);
    try {
      await update({ organizationId: storeId });
      toast.success(`Switched to managing store: ${generalSettings.name}`);
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Failed to switch store context");
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ຕັ້ງຄ່າຮ້ານ (Store Settings)</h1>
          <p className="text-zinc-400">ຈັດການການຕັ້ງຄ່າທັງໝົດຂອງຮ້ານຄ້ານີ້</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleManageStore}
            disabled={isSwitching}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)]"
          >
            {isSwitching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LayoutGrid className="w-4 h-4 mr-2" />}
            ເຂົ້າຈັດການຮ້ານນີ້ (Manage Store)
          </Button>
          <Link href="/admin/users">
            <Button variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
              ກັບຄືນໜ້າຫຼັກ (Back)
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. General Settings */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-xl text-zinc-100">ຂໍ້ມູນທົ່ວໄປ (General Settings)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-white mb-2 block">ຊື່ຮ້ານ (Store Name)</label>
              <Input 
                value={generalSettings.name}
                onChange={(e) => setGeneralSettings({ ...generalSettings, name: e.target.value })}
                className="bg-zinc-950 border-zinc-800 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-white mb-2 block">ໂດເມນ (Slug / URL)</label>
              <Input 
                value={generalSettings.slug}
                onChange={(e) => setGeneralSettings({ ...generalSettings, slug: e.target.value })}
                className="bg-zinc-950 border-zinc-800 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-2 block flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" /> ວັນໝົດອາຍຸ (Subscription Expiry)
            </label>
            <Input 
              type="datetime-local"
              value={generalSettings.subscriptionExpiresAt || ""}
              onChange={(e) => setGeneralSettings({ ...generalSettings, subscriptionExpiresAt: e.target.value })}
              className="bg-zinc-950 border-zinc-800 text-white w-full md:w-1/2"
            />
            <p className="text-xs text-zinc-500 mt-2">ປ່ອຍຫວ່າງໄວ້ຫາກຕ້ອງການໃຫ້ໃຊ້ໄດ້ຕະຫຼອດຊີວິດ (Lifetime)</p>
          </div>
          <Button 
            onClick={handleSaveGeneral} 
            disabled={isSavingGeneral}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSavingGeneral ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            ບັນທຶກຂໍ້ມູນທົ່ວໄປ (Save General)
          </Button>
        </CardContent>
      </Card>

      {/* 2. Modules Settings */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-xl text-zinc-100">ປະເພດທຸລະກິດ & ໂມດູນ (Business Type & Modules)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-white mb-2 block">ປະເພດທຸລະກິດ (Business Type)</label>
              <Select
                value={moduleSettings.businessType}
                onValueChange={(val) => setModuleSettings({ ...moduleSettings, businessType: val || "RETAIL" })}
              >
                <SelectTrigger className="w-full md:w-1/2 bg-zinc-950 border-zinc-800 text-white">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {businessTypes.map(type => (
                    <SelectItem key={type.id} value={type.id} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-sm font-bold text-white block">ເປີດໃຊ້ງານໂມດູນ (Enabled Modules)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModuleSettings({ ...moduleSettings, enabledModules: availableModules.map(m => m.id) })}
                    className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5" /> ເລືອກທັງໝົດ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuleSettings({ ...moduleSettings, enabledModules: ["CORE"] })}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> ຍົກເລີກທັງໝົດ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuleSettings({ ...moduleSettings, enabledModules: [] })}
                    className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-semibold transition-colors"
                    title="ລຶບຄ່າທີ່ຕັ້ງເອງອອກ ເພື່ອໃຫ້ໃຊ້ໂມດູນຕາມແພັກເກັດທີ່ຮ້ານນີ້ສະໝັກຢູ່"
                  >
                    <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> ຕັ້ງຕາມແພັກເກັດ</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {availableModules.map(mod => (
                  <label key={mod.id} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-purple-500 focus:ring-purple-500"
                      checked={moduleSettings.enabledModules.includes(mod.id)}
                      onChange={(e) => {
                        const newMods = e.target.checked 
                          ? [...moduleSettings.enabledModules, mod.id]
                          : moduleSettings.enabledModules.filter(m => m !== mod.id);
                        setModuleSettings({ ...moduleSettings, enabledModules: newMods });
                      }}
                    />
                    <span className="text-sm font-medium text-zinc-300">{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={handleSaveModules} 
              disabled={isSavingModules}
              className="bg-purple-600 hover:bg-purple-700 text-white mt-4"
            >
              {isSavingModules ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              ບັນທຶກໂມດູນ (Save Modules)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Telegram Settings */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-emerald-400" />
            <CardTitle className="text-xl text-zinc-100">ການແຈ້ງເຕືອນ (Notifications)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 p-4 rounded-xl border border-zinc-800 bg-zinc-950/50">
              <label className="text-sm font-bold text-white flex items-center gap-2"><BrandLine size={16} color="#06C755" /><span>LINE Notify Token</span></label>
              <input
                type="password"
                value={telegramSettings.lineNotifyToken || ""}
                onChange={(e) => setTelegramSettings({ ...telegramSettings, lineNotifyToken: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
              />
            </div>

            <div className="space-y-4 p-4 rounded-xl border border-zinc-800 bg-zinc-950/50">
              <label className="text-sm font-bold text-white flex items-center gap-2"><BrandTelegram size={16} color="#24A1DE" /><span>Telegram Chat ID</span></label>
              <input
                type="text"
                value={telegramSettings.telegramChatId || ""}
                onChange={(e) => setTelegramSettings({ ...telegramSettings, telegramChatId: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <div className="flex items-center gap-3 h-10">
                <input 
                  type="checkbox" 
                  checked={telegramSettings.telegramEnabled}
                  onChange={(e) => setTelegramSettings({ ...telegramSettings, telegramEnabled: e.target.checked })}
                />
                <span className="text-sm text-zinc-400">Enable Telegram</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSaveTelegram} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Notifications
            </Button>
            <Button onClick={handleTestNotification} disabled={isTesting} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700">
              Test Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Storefront Settings */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MonitorSmartphone className="w-5 h-5 text-orange-400" />
            <CardTitle className="text-xl text-zinc-100">ຕັ້ງຄ່າໜ້າຮ້ານອອນລາຍ (Storefront Settings)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-white mb-2 block">ຮູບແບບໜ້າຮ້ານ (Theme)</label>
              <Select
                value={storefrontSettings.theme}
                onValueChange={(val) => setStorefrontSettings({ ...storefrontSettings, theme: val || "light" })}
              >
                <SelectTrigger className="w-full md:w-1/2 bg-zinc-950 border-zinc-800 text-white">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="light" className="hover:bg-zinc-800">Light</SelectItem>
                  <SelectItem value="dark" className="hover:bg-zinc-800">Dark</SelectItem>
                  <SelectItem value="colorful" className="hover:bg-zinc-800">Colorful</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-bold text-white mb-2 block">ໂດເມນສ່ວນຕົວ (Custom Domain)</label>
              <Input 
                value={storefrontSettings.customDomain || ""}
                onChange={(e) => setStorefrontSettings({ ...storefrontSettings, customDomain: e.target.value })}
                placeholder="shop.yourbrand.com"
                className="bg-zinc-950 border-zinc-800 text-white w-full md:w-1/2"
              />
              <p className="text-xs text-zinc-500 mt-1">*ກະລຸນາຕັ້ງຄ່າ CNAME Record ຊີ້ມາທີ່ໂດເມນຫຼັກຂອງລະບົບ</p>
            </div>
            <div>
              <label className="text-sm font-bold text-white mb-2 block">ຮູບປົກໜ້າຮ້ານ (Banner URL)</label>
              <Input 
                value={storefrontSettings.bannerUrl || ""}
                onChange={(e) => setStorefrontSettings({ ...storefrontSettings, bannerUrl: e.target.value })}
                placeholder="https://..."
                className="bg-zinc-950 border-zinc-800 text-white w-full"
              />
            </div>
            <Button 
              onClick={handleSaveStorefront} 
              disabled={isSavingStorefront}
              className="bg-orange-600 hover:bg-orange-700 text-white mt-4"
            >
              {isSavingStorefront ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              ບັນທຶກໜ້າຮ້ານ (Save Storefront)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5. Payment Settings */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-xl text-zinc-100">ຂໍ້ມູນການຊຳລະເງິນ (Payment Settings)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-bold text-white mb-2 block">PromptPay ID / ເບີໂທ (ສະແກນຈ່າຍ)</label>
            <Input 
              value={paymentSettings.promptPayId}
              onChange={(e) => setPaymentSettings({ ...paymentSettings, promptPayId: e.target.value })}
              placeholder="020XXXXXXXX"
              className="bg-zinc-950 border-zinc-800 text-white w-full md:w-1/2"
            />
            <p className="text-xs text-zinc-500 mt-1">ລະບົບຈະສ້າງ QR Code ອັດຕະໂນມັດສຳລັບຮັບເງິນ</p>
          </div>
          <div>
            <label className="text-sm font-bold text-white mb-2 block">ລາຍລະອຽດບັນຊີທະນາຄານ (Account Info)</label>
            <textarea 
              value={paymentSettings.paymentAccountInfo}
              onChange={(e) => setPaymentSettings({ ...paymentSettings, paymentAccountInfo: e.target.value })}
              placeholder="ທະນາຄານ BCEL&#10;ຊື່ບັນຊີ: ບໍລິສັດ ABC&#10;ເລກບັນຊີ: 0101100012345678"
              className="bg-zinc-950 border-zinc-800 text-white w-full min-h-[100px] p-3 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button 
            onClick={handleSavePayment} 
            disabled={isSavingPayment}
            className="bg-blue-600 hover:bg-blue-700 text-white mt-2"
          >
            {isSavingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            ບັນທຶກຊ່ອງທາງຊຳລະ (Save Payment)
          </Button>
        </CardContent>
      </Card>

      {/* 6. Danger Zone */}
      <Card className="bg-zinc-950 border-red-900/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <CardTitle className="text-xl text-red-500">ອັນຕະລາຍ (Danger Zone)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-red-900/30 bg-red-500/5">
            <div>
              <h3 className="text-white font-bold">ລຶບຮ້ານຄ້າຖາວອນ (Delete Store)</h3>
              <p className="text-sm text-zinc-400 mt-1">ການລຶບຮ້ານຈະເຮັດໃຫ້ຂໍ້ມູນທັງໝົດລວມເຖິງສິນຄ້າ, ພະນັກງານ ແລະ ອໍເດີຖືກລຶບອອກຈາກລະບົບຖາວອນ ບໍ່ສາມາດກູ້ຄືນໄດ້.</p>
            </div>
            
            <Dialog>
              <DialogTrigger 
                render={
                  <Button variant="destructive" className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)]" />
                }
              >
                <Trash2 className="w-4 h-4 mr-2" />
                ລຶບຮ້ານນີ້ (Delete Store)
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-red-900/50">
                <DialogHeader>
                  <DialogTitle className="text-red-500 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> ยืนยันการลบร้านค้า?
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400 text-sm mt-3 leading-relaxed">
                    คุณกำลังจะลบร้าน <strong>{generalSettings.name}</strong> ถาวร การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลทุกอย่างที่เกี่ยวกับร้านนี้จะหายไปทั้งหมด.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6">
                  <DialogTrigger render={<Button variant="ghost" className="text-zinc-400 hover:text-white" />}>
                    ยกเลิก (Cancel)
                  </DialogTrigger>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteStore} 
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    ยืนยันลบถาวร (Confirm Delete)
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
