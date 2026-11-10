"use client";

import { askConfirm } from "@/components/ConfirmModal";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  User,
  Calendar,
  XCircle,
  Loader2,
  Shield,
  Building,
  KeyRound,
  Copy,
  ClipboardList,
  Mail,
  Phone,
  MapPin,
  RotateCw,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { PaginationControls } from "@/components/PaginationControls";
import { copyToClipboard } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseLaoAddress } from "@/lib/laoAddressData";

export function OrganizationsClient({
  initialOrgs,
  initialRequests = [],
}: {
  initialOrgs: any[];
  initialRequests?: any[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"ORGS" | "REQUESTS">("ORGS");
  const [orgs, setOrgs] = useState<any[]>(initialOrgs || []);
  const [requests, setRequests] = useState<any[]>(initialRequests || []);
  const [filter, setFilter] = useState("ALL");
  const [requestFilter, setRequestFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [requestCurrentPage, setRequestCurrentPage] = useState(1);
  const [requestItemsPerPage, setRequestItemsPerPage] = useState(10);
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null);
  const [isRejectingId, setIsRejectingId] = useState<string | null>(null);
  const [detailRequestModal, setDetailRequestModal] = useState<any | null>(null);
  const [isRefreshingRequests, setIsRefreshingRequests] = useState(false);
  const now = new Date();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [businessType, setBusinessType] = useState("RETAIL");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password reset states
  const [resetModalOrg, setResetModalOrg] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalOrg || !resetModalOrg.ownerId) {
      toast.error("ບໍ່ພົບຂໍ້ມູນເຈົ້າຂອງຮ້ານ (Owner ID not found)");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ (At least 6 characters)");
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetModalOrg.ownerId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`ປ່ຽນລະຫັດຜ່ານໃຫ້ "${resetModalOrg.ownerName}" ສຳເລັດແລ້ວ!`);
        setResetModalOrg(null);
        setNewPassword("");
      } else {
        toast.error(data.error || "ບໍ່ສາມາດປ່ຽນລະຫັດຜ່ານໄດ້");
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsResetting(false);
    }
  };


  const filteredOrgs = orgs.filter((org) => {
    const matchesFilter = filter === "ALL" || org.businessType === filter;
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org.ownerName && org.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (org.address && org.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrgs.length / itemsPerPage);
  const paginatedOrgs = filteredOrgs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const filteredRequests = requests.filter((r) => {
    const matchesFilter =
      requestFilter === "ALL" ||
      (r.status || "").toLowerCase() === requestFilter.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (r.name && r.name.toLowerCase().includes(query)) ||
      (r.email && r.email.toLowerCase().includes(query)) ||
      (r.phone && r.phone.toLowerCase().includes(query)) ||
      (r.address && r.address.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  const requestTotalPages = Math.ceil(filteredRequests.length / requestItemsPerPage) || 1;
  const paginatedRequests = filteredRequests.slice(
    (requestCurrentPage - 1) * requestItemsPerPage,
    requestCurrentPage * requestItemsPerPage
  );

  const fetchRequests = async () => {
    setIsRefreshingRequests(true);
    try {
      const res = await fetch("/api/admin/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
        toast.success("ອັບເດດຂໍ້ມູນຄຳຂໍສະໝັກແລ້ວ");
      }
    } catch {
      toast.error("ບໍ່ສາມາດດຶງຂໍ້ມູນຄຳຂໍສະໝັກໄດ້");
    } finally {
      setIsRefreshingRequests(false);
    }
  };

  const handleApproveRequest = async (reqItem: any) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການອະນຸມັດຄຳຂໍເປີດບັນຊີຮ້ານຄ້າ "${reqItem.name}" ແທ້ບໍ່? ລະບົບຈະສ້າງບັນຊີ ແລະ ຮ້ານຄ້າໃໝ່ໃຫ້ທັນທີ.`
    );
    if (!confirmed) return;

    setIsApprovingId(reqItem.id);
    try {
      const res = await fetch(`/api/admin/approve/${reqItem.id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`ອະນຸມັດຮ້ານ "${reqItem.name}" ສຳເລັດແລ້ວ!`);
        setRequests((prev) =>
          prev.map((r) => (r.id === reqItem.id ? { ...r, status: "approved" } : r))
        );
        router.refresh();
      } else {
        toast.error(data.error || "ອະນຸມັດບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsApprovingId(null);
    }
  };

  const handleRejectRequest = async (reqItem: any) => {
    const confirmed = await askConfirm(
      `ທ່ານຕ້ອງການປະຕິເສດຄຳຂໍເປີດບັນຊີຂອງ "${reqItem.name}" ແທ້ບໍ່?`
    );
    if (!confirmed) return;

    setIsRejectingId(reqItem.id);
    try {
      const res = await fetch(`/api/admin/reject/${reqItem.id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`ປະຕິເສດຄຳຂໍ "${reqItem.name}" ແລ້ວ`);
        setRequests((prev) =>
          prev.map((r) => (r.id === reqItem.id ? { ...r, status: "rejected" } : r))
        );
      } else {
        toast.error(data.error || "ປະຕິເສດບໍ່ສຳເລັດ");
      }
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsRejectingId(null);
    }
  };

  const handleCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      return toast.error("ກະລຸນາປ້ອນຊື່ຮ້ານຄ້າ ແລະ Slug");
    }

    setIsSubmitting(true);
    try {
      if (editingOrg) {
        // Edit existing org
        const res = await fetch(`/api/admin/stores/${editingOrg.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, slug, businessType }),
        });
        if (res.ok) {
          toast.success("ແກ້ໄຂຂໍ້ມູນຮ້ານຄ້າສຳເລັດແລ້ວ");
          setOrgs(
            orgs.map((o) =>
              o.id === editingOrg.id ? { ...o, name, slug, businessType } : o
            )
          );
          setShowAddModal(false);
          resetForm();
        } else {
          const err = await res.json();
          toast.error(err.error || "ແກ້ໄຂຮ້ານຄ້າບໍ່ສຳເລັດ");
        }
      } else {
        // Create new org
        const res = await fetch("/api/admin/organizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
            businessType,
            ownerName,
            ownerEmail,
          }),
        });
        if (res.ok) {
          const newOrg = await res.json();
          toast.success("ສ້າງຮ້ານຄ້າໃໝ່ສຳເລັດແລ້ວ");
          setOrgs([newOrg, ...orgs]);
          setShowAddModal(false);
          resetForm();
        } else {
          const err = await res.json();
          toast.error(err.error || "ບໍ່ສາມາດສ້າງຮ້ານຄ້າໄດ້");
        }
      }
    } catch (err) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, orgName: string) => {
    if (!(await askConfirm(`ທ່ານຕ້ອງການລຶບຮ້ານຄ້າ "${orgName}" ແທ້ບໍ່? ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້`)))
      return;
    try {
      const res = await fetch(`/api/admin/stores/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`ລຶບຮ້ານຄ້າ "${orgName}" ສຳເລັດ`);
        setOrgs(orgs.filter((o) => o.id !== id));
      } else {
        toast.error("ບໍ່ສາມາດລຶບຮ້ານຄ້າໄດ້");
      }
    } catch (err) {
      toast.error("ລຶບບໍ່ສຳເລັດ");
    }
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setBusinessType("RETAIL");
    setOwnerName("");
    setOwnerEmail("");
    setEditingOrg(null);
  };

  const openEditModal = (org: any) => {
    setEditingOrg(org);
    setName(org.name || "");
    setSlug(org.slug || "");
    setBusinessType(org.businessType || "RETAIL");
    setShowAddModal(true);
  };

  const activeCount = orgs.length;
  const restaurantCount = orgs.filter((o) => o.businessType === "RESTAURANT").length;
  const retailCount = orgs.filter((o) => o.businessType === "RETAIL").length;
  const serviceCount = orgs.filter(
    (o) => o.businessType !== "RESTAURANT" && o.businessType !== "RETAIL"
  ).length;
  const pendingRequestsCount = requests.filter(
    (r) => (r.status || "").toLowerCase() === "pending"
  ).length;
  const approvedRequestsCount = requests.filter(
    (r) => (r.status || "").toLowerCase() === "approved"
  ).length;
  const rejectedRequestsCount = requests.filter(
    (r) => (r.status || "").toLowerCase() === "rejected"
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <Store className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              ຈັດການຮ້ານຄ້າ ແລະ ອົງກອນ
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Tenant Management
              </span>
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              ຄວບຄຸມຮ້ານຄ້າທັງໝົດໃນລະບົບ SaaS, ຈັດການສິດ, ຕິດຕາມວັນໝົດອາຍຸ ແລະ ອະນຸມັດບັນຊີ
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> ເພີ່ມຮ້ານຄ້າໃໝ່ (Add Tenant)
        </button>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ຮ້ານຄ້າທັງໝົດ (Total Stores)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-2">
                {activeCount} <span className="text-sm font-normal text-zinc-500">ຮ້ານ</span>
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Store className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ຮ້ານຄ້າທີ່ລົງທະບຽນໃນລະບົບທັງໝົດ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ຮ້ານອາຫານ / ເຄື່ອງດື່ມ (Restaurant)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-400 mt-2">
                {restaurantCount} <span className="text-sm font-normal text-zinc-500">ຮ້ານ</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Building className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ລະບົບ POS ຮ້ານອາຫານ ແລະ ຄົວ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ຮ້ານຂາຍຍ່ອຍ / ຊຸບເປີມາເກັດ (Retail)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-400 mt-2">
                {retailCount} <span className="text-sm font-normal text-zinc-500">ຮ້ານ</span>
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Store className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ລະບົບຂາຍຍ່ອຍ ແລະ ຈັດການສະຕັອກ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ບໍລິການ & ອື່ນໆ (Service/Other)
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-purple-400 mt-2">
                {serviceCount} <span className="text-sm font-normal text-zinc-500">ຮ້ານ</span>
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Shield className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">ບໍລິການສ້ອມແປງ, ເຊົ່າອຸປະກອນ ແລະ ສະໜາມກິລາ</p>
        </div>

        <div
          onClick={() => {
            setActiveTab("REQUESTS");
            setRequestFilter("pending");
            setRequestCurrentPage(1);
          }}
          className={`cursor-pointer border rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group transition-all duration-300 ${
            pendingRequestsCount > 0
              ? "bg-amber-950/40 border-amber-500/60 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/15"
              : "bg-zinc-900/80 border-zinc-800/80 hover:border-amber-500/40"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                {pendingRequestsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                )}
                ສະໝັກໃໝ່ລໍຖ້າອະນຸມັດ
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-400 mt-2">
                {pendingRequestsCount}{" "}
                <span className="text-sm font-normal text-zinc-500">ລາຍການ</span>
              </h3>
            </div>
            <div className="p-3 bg-amber-500/15 rounded-xl text-amber-400 border border-amber-500/30">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-3 flex items-center justify-between">
            <span>ຄຳຮ້ອງຂໍເປີດຮ້ານຄ້າ</span>
            <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform text-xs font-semibold">
              ກວດສອບ →
            </span>
          </p>
        </div>
      </div>

      {/* ── Main View Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("ORGS");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
              activeTab === "ORGS"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/40"
                : "bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>ຮ້ານຄ້າໃນລະບົບ (Active Stores)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === "ORGS" ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("REQUESTS");
              setRequestCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 relative ${
              activeTab === "REQUESTS"
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/40"
                : "bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>ຜູ້ສະໝັກເຂົ້າມາໃຊ້ (Account Signups)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === "REQUESTS" ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {requests.length}
            </span>
            {pendingRequestsCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[11px] shadow-sm animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
                {pendingRequestsCount} ໃໝ່
              </span>
            )}
          </button>
        </div>

        {activeTab === "REQUESTS" && (
          <button
            onClick={fetchRequests}
            disabled={isRefreshingRequests}
            className="px-3.5 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-zinc-700/60 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshingRequests ? "animate-spin" : ""}`} />
            <span>ຣີເຟຣຊຂໍ້ມູນ</span>
          </button>
        )}
      </div>

      {/* ── Toolbar & Filters ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72 md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder={
              activeTab === "ORGS"
                ? "ຄົ້ນຫາຊື່ຮ້ານຄ້າ, Slug, ຫຼື ຊື່ເຈົ້າຂອງຮ້ານ..."
                : "ຄົ້ນຫາຊື່ຮ້ານ, ຊື່ຜູ້ສະໝັກ, ອີເມວ, ເບີໂທ..."
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
              setRequestCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {activeTab === "ORGS" ? (
            [
              { label: "ທັງໝົດ (All)", value: "ALL" },
              { label: "ຮ້ານອາຫານ", value: "RESTAURANT" },
              { label: "ຂາຍຍ່ອຍ", value: "RETAIL" },
              { label: "ບໍລິການ/ກິລາ", value: "SERVICE" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setFilter(item.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filter === item.value
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))
          ) : (
            [
              { label: `ທັງໝົດ (${requests.length})`, value: "ALL" },
              { label: `ລໍຖ້າອະນຸມັດ (${pendingRequestsCount})`, value: "pending" },
              { label: `ອະນຸມັດແລ້ວ (${approvedRequestsCount})`, value: "approved" },
              { label: `ປະຕິເສດ (${rejectedRequestsCount})`, value: "rejected" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setRequestFilter(item.value);
                  setRequestCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  requestFilter === item.value
                    ? item.value === "pending"
                      ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20"
                      : item.value === "approved"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                      : "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/20"
                    : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Desktop & Mobile Responsive View ── */}
      {activeTab === "ORGS" ? (
        filteredOrgs.length === 0 ? (
          <div className="p-8 sm:p-12 md:p-20 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
            <div className="w-20 h-20 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
              <Store className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-zinc-300 text-lg font-semibold">ບໍ່ພົບຂໍ້ມູນຮ້ານຄ້າ</p>
            <p className="text-zinc-500 text-sm mt-1">
              ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເພີ່ມຮ້ານຄ້າໃໝ່ໂດຍກົດປຸ່ມດ້ານເທິງ
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {paginatedOrgs.map((org) => {
                const expiry = org.subscriptionExpiresAt;
                const isExpired = expiry && new Date(expiry) < now;
                const expiresInDays = expiry
                  ? Math.ceil((new Date(expiry).getTime() - now.getTime()) / 86400000)
                  : null;

                return (
                  <div
                    key={org.id}
                    className="bg-zinc-900/90 border border-zinc-800/80 hover:border-blue-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          {org.businessType || "RETAIL"}
                        </span>

                        {expiry ? (
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                              isExpired
                                ? "bg-red-500/15 text-red-400 border-red-500/30"
                                : expiresInDays && expiresInDays <= 7
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {isExpired
                              ? "ໝົດອາຍຸແລ້ວ"
                              : `ເຫຼືອ ${expiresInDays} ວັນ`}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">ບໍ່ຈຳກັດເວລາ</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-zinc-800 flex items-center justify-center font-black text-lg text-white shrink-0">
                          {org.name ? org.name[0]?.toUpperCase() : "S"}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg leading-tight group-hover:text-blue-400 transition-colors">
                            {org.name}
                          </h3>
                          <p className="text-xs text-zinc-400 font-mono">@{org.slug}</p>
                        </div>
                      </div>

                      <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3 my-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-400" /> ເຈົ້າຂອງຮ້ານ:
                          </span>
                          <span className="text-white font-semibold">
                            {org.ownerName || "ຜູ້ໃຊ້ລະບົບ"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" /> ສ້າງເມື່ອ:
                          </span>
                          <span className="text-zinc-300">
                            {org.createdAt ? new Date(org.createdAt).toLocaleDateString("lo-LA") : "-"}
                          </span>
                        </div>

                        {org.address && (
                          <div className="flex items-start gap-1.5 text-xs text-zinc-400 pt-1.5 border-t border-zinc-800/60">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{org.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Action Buttons */}
                    <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                      <Link
                        href={`/admin/stores/${org.id}`}
                        className="px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> ຈັດການຮ້ານຄ້າ
                      </Link>

                      <div className="flex items-center gap-1">
                        {org.ownerId && (
                          <button
                            onClick={() => {
                              setResetModalOrg(org);
                              setNewPassword("123456");
                            }}
                            className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="ປ່ຽນລະຫັດຜ່ານເຈົ້າຂອງຮ້ານ (Reset Owner Password)"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(org)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          title="ແກ້ໄຂ"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(org.id, org.name)}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="ລຶບ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOrgs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
            />
          </div>
        )
      ) : (
        /* ── Account Signup Requests View ── */
        filteredRequests.length === 0 ? (
          <div className="p-8 sm:p-12 md:p-20 text-center flex flex-col items-center border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/40">
            <div className="w-20 h-20 bg-zinc-800/60 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-zinc-300 text-lg font-semibold">ບໍ່ພົບຄຳຮ້ອງຂໍສະໝັກເປີດຮ້ານຄ້າ</p>
            <p className="text-zinc-500 text-sm mt-1">
              ບໍ່ມີຂໍ້ມູນຜູ້ສະໝັກທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາໃນຂະນະນີ້
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {paginatedRequests.map((req) => {
                const isPending = (req.status || "").toLowerCase() === "pending";
                const isApproved = (req.status || "").toLowerCase() === "approved";
                return (
                  <div
                    key={req.id}
                    className={`bg-zinc-900/90 border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-lg ${
                      isPending
                        ? "border-amber-500/40 hover:border-amber-400 hover:shadow-amber-500/10"
                        : isApproved
                        ? "border-emerald-500/30 hover:border-emerald-500/60"
                        : "border-zinc-800/80 opacity-75"
                    }`}
                  >
                    <div>
                      {/* Header Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                            isPending
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : isApproved
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {isPending ? (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>ລໍຖ້າອະນຸມັດ</span>
                            </>
                          ) : isApproved ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>ອະນຸມັດແລ້ວ</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ປະຕິເສດແລ້ວ</span>
                            </>
                          )}
                        </span>

                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {req.businessType || "GENERIC"}
                        </span>
                      </div>

                      {/* Store / Applicant Name */}
                      <h3 className="font-bold text-white text-lg group-hover:text-amber-400 transition-colors flex items-center gap-2 mt-1">
                        <Store className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                        <span className="line-clamp-1">{req.name}</span>
                      </h3>

                      {/* Contact Info Box */}
                      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 my-3.5 space-y-2 text-xs shadow-inner">
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="flex items-center gap-1.5 text-zinc-400 truncate max-w-[210px]">
                            <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">{req.email}</span>
                          </span>
                          <button
                            onClick={() => {
                              copyToClipboard(req.email);
                              toast.success("ກັອບປີ້ອີເມວແລ້ວ");
                            }}
                            className="text-zinc-500 hover:text-white p-1 rounded transition-colors"
                            title="ກັອບປີ້ອີເມວ"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {req.phone && req.phone !== "—" && (
                          <div className="flex items-center justify-between text-zinc-300">
                            <span className="flex items-center gap-1.5 text-zinc-400">
                              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{req.phone}</span>
                            </span>
                            <button
                              onClick={() => {
                                copyToClipboard(req.phone);
                                toast.success("ກັອບປີ້ເບີໂທແລ້ວ");
                              }}
                              className="text-zinc-500 hover:text-white p-1 rounded transition-colors"
                              title="ກັອບປີ້ເບີໂທ"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {req.address && req.address !== "—" && (
                          <div className="flex items-start gap-1.5 text-zinc-400 pt-1.5 border-t border-zinc-800/60">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{req.address}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1.5 border-t border-zinc-800/60">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            <span>ສະໝັກເມື່ອ:</span>
                          </span>
                          <span className="font-mono text-zinc-400">
                            {new Date(req.createdAt).toLocaleDateString("lo-LA", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-zinc-800/80 mt-1 flex items-center justify-between gap-2">
                      {isPending ? (
                        <div className="flex items-center gap-2 w-full">
                          <button
                            onClick={() => handleApproveRequest(req)}
                            disabled={isApprovingId === req.id || isRejectingId === req.id}
                            className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {isApprovingId === req.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            <span>ອະນຸມັດ</span>
                          </button>

                          <button
                            onClick={() => handleRejectRequest(req)}
                            disabled={isApprovingId === req.id || isRejectingId === req.id}
                            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            title="ປະຕິເສດຄຳຮ້ອງຂໍ"
                          >
                            {isRejectingId === req.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => setDetailRequestModal(req)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-colors"
                            title="ເບິ່ງລາຍລະອຽດ"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-semibold flex items-center gap-1.5 ${
                              isApproved ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isApproved ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" /> ສຳເລັດການອະນຸມັດ
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> ຖືກປະຕິເສດແລ້ວ
                              </>
                            )}
                          </span>

                          <button
                            onClick={() => setDetailRequestModal(req)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ລາຍລະອຽດ</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <PaginationControls
              currentPage={requestCurrentPage}
              totalPages={requestTotalPages}
              totalItems={filteredRequests.length}
              itemsPerPage={requestItemsPerPage}
              onPageChange={setRequestCurrentPage}
              onItemsPerPageChange={(size) => {
                setRequestItemsPerPage(size);
                setRequestCurrentPage(1);
              }}
              t={{
                showing: "Showing",
                to: "to",
                of: "of",
                entries: "entries",
                page: "Page",
                perPage: "ແຖວຕໍ່ໜ້າ (Rows):",
                previous: "Previous",
                next: "Next",
              }}
            />
          </div>
        )
      )}

      {/* ── Add / Edit Tenant Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {editingOrg ? "ແກ້ໄຂຂໍ້ມູນຮ້ານຄ້າ" : "ສ້າງຮ້ານຄ້າໃໝ່ (Add Tenant)"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateOrEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ຊື່ຮ້ານຄ້າ / ອົງກອນ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ເຊັ່ນ: ຮ້ານ ກິລາລາວ (Lao Sports)..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  URL Slug (ຊື່ຍາວພາສາອັງກິດ) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ເຊັ່ນ: lao-sports"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                  ປະເພດທຸລະກິດ
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="RETAIL">RETAIL (ຂາຍຍ່ອຍ / ສະຕັອກ)</option>
                  <option value="RESTAURANT">RESTAURANT (ຮ້ານອາຫານ / ຄົວ)</option>
                  <option value="SERVICE">SERVICE (ບໍລິການ / ກິລາ / ເຊົ່າ)</option>
                </select>
              </div>

              {!editingOrg && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                      ຊື່ເຈົ້າຂອງຮ້ານ
                    </label>
                    <input
                      type="text"
                      placeholder="ເຊັ່ນ: ສົມຊາຍ ວິໄລ"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5">
                      ອີເມວເຈົ້າຂອງຮ້ານ
                    </label>
                    <input
                      type="email"
                      placeholder="owner@example.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingOrg ? "ບັນທຶກການແກ້ໄຂ" : "ສ້າງຮ້ານຄ້າໃໝ່"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Owner Password Modal ── */}
      {resetModalOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                ປ່ຽນລະຫັດຜ່ານເຈົ້າຂອງຮ້ານ
              </h3>
              <button
                onClick={() => setResetModalOrg(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">ຊື່ຮ້ານຄ້າ:</span>
                <span className="text-white font-bold">{resetModalOrg.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">ເຈົ້າຂອງຮ້ານ:</span>
                <span className="text-amber-300 font-semibold">{resetModalOrg.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">ອີເມວ (Email):</span>
                <span className="text-zinc-300 font-mono">{resetModalOrg.ownerEmail}</span>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-white block">
                  ລະຫັດຜ່ານໃໝ່ (New Password)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="ໃສ່ລະຫັດຜ່ານໃໝ່ຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.random().toString(36).slice(-8);
                      setNewPassword(rand);
                    }}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                    title="ສຸ່ມລະຫັດຜ່ານ"
                  >
                    ສຸ່ມ
                  </button>
                </div>
                <p className="text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> ເມື່ອບັນທຶກແລ້ວ ໃຫ້ສົ່ງລະຫັດຜ່ານໃໝ່ນີ້ໃຫ້ເຈົ້າຂອງຮ້ານ ເພື່ອໃຊ້ເຂົ້າລະບົບ.</span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOrg(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  {isResetting && <Loader2 className="w-4 h-4 animate-spin" />}
                  ບັນທຶກລະຫັດຜ່ານ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Request Detail Modal ── */}
      <Dialog
        open={!!detailRequestModal}
        onOpenChange={(open) => !open && setDetailRequestModal(null)}
      >
        <DialogContent className="w-[96vw] max-w-lg bg-zinc-950 border border-zinc-800 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="border-b border-zinc-800 pb-3 mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-400">
              <ClipboardList className="w-6 h-6" />
              <span>ລາຍລະອຽດຜູ້ສະໝັກເປີດຮ້ານຄ້າ</span>
            </DialogTitle>
          </DialogHeader>

          {detailRequestModal && (
            <div className="space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 uppercase font-semibold">
                    ສະຖານະຄຳຂໍ
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      (detailRequestModal.status || "").toLowerCase() === "pending"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : (detailRequestModal.status || "").toLowerCase() === "approved"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {(detailRequestModal.status || "").toLowerCase() === "pending"
                      ? "ລໍຖ້າອະນຸມັດ"
                      : (detailRequestModal.status || "").toLowerCase() === "approved"
                      ? "ອະນຸມັດແລ້ວ"
                      : "ປະຕິເສດແລ້ວ"}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-500 text-xs block">ຊື່ຮ້ານຄ້າ / ຜູ້ສະໝັກ:</span>
                  <span className="font-bold text-white text-lg">
                    {detailRequestModal.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs block">ປະເພດທຸລະກິດ:</span>
                    <span className="font-semibold text-cyan-400">
                      {detailRequestModal.businessType || "GENERIC"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs block">ວັນທີສະໝັກ:</span>
                    <span className="font-mono text-zinc-300 text-xs">
                      {new Date(detailRequestModal.createdAt).toLocaleDateString("lo-LA")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Box */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  ຂໍ້ມູນຕິດຕໍ່
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="flex items-center gap-2 text-zinc-300 truncate max-w-[280px]">
                      <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">{detailRequestModal.email}</span>
                    </span>
                    <button
                      onClick={() => {
                        copyToClipboard(detailRequestModal.email);
                        toast.success("ກັອບປີ້ອີເມວແລ້ວ");
                      }}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-semibold transition-colors shrink-0"
                    >
                      Copy
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>{detailRequestModal.phone || "—"}</span>
                    </span>
                    {detailRequestModal.phone && detailRequestModal.phone !== "—" && (
                      <button
                        onClick={() => {
                          copyToClipboard(detailRequestModal.phone);
                          toast.success("ກັອບປີ້ເບີໂທແລ້ວ");
                        }}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-semibold transition-colors"
                      >
                        Copy
                      </button>
                    )}
                  </div>

                  {detailRequestModal.address && detailRequestModal.address !== "—" && (() => {
                    const parsed = parseLaoAddress(detailRequestModal.address);
                    return (
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-2.5 text-zinc-300">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-bold text-amber-400">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span>ທີ່ຢູ່ / ສະຖານທີ່ຕັ້ງຮ້ານ (Store Address)</span>
                          </span>
                          <button
                            onClick={() => {
                              copyToClipboard(detailRequestModal.address);
                              toast.success("ກັອບປີ້ທີ່ຢູ່ແລ້ວ");
                            }}
                            className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-semibold transition-colors"
                          >
                            Copy
                          </button>
                        </div>

                        {(parsed.province || parsed.district || parsed.village) && (
                          <div className="flex flex-wrap gap-1.5">
                            {parsed.province && (
                              <span className="px-2.5 py-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-lg">
                                {parsed.province}
                              </span>
                            )}
                            {parsed.district && (
                              <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg">
                                {parsed.district.startsWith("ເມືອງ") || parsed.district.startsWith("ນະຄອນ") ? parsed.district : `ເມືອງ ${parsed.district}`}
                              </span>
                            )}
                            {parsed.village && (
                              <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg">
                                {parsed.village.startsWith("ບ້ານ") ? parsed.village : `ບ້ານ ${parsed.village}`}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-zinc-300 pt-1 border-t border-zinc-800/60 leading-relaxed font-mono">
                          {detailRequestModal.address}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Action buttons inside modal */}
              {(detailRequestModal.status || "").toLowerCase() === "pending" && (
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      handleRejectRequest(detailRequestModal);
                      setDetailRequestModal(null);
                    }}
                    disabled={isApprovingId === detailRequestModal.id || isRejectingId === detailRequestModal.id}
                    className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-bold transition-colors"
                  >
                    ປະຕິເສດ (Reject)
                  </button>
                  <button
                    onClick={() => {
                      handleApproveRequest(detailRequestModal);
                      setDetailRequestModal(null);
                    }}
                    disabled={isApprovingId === detailRequestModal.id || isRejectingId === detailRequestModal.id}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    ອະນຸມັດ (Approve)
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OrganizationsClient;
