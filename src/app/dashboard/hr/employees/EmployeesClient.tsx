"use client";

import { askConfirm } from "@/components/ConfirmModal";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  UserCircle2,
  Users,
  Wrench,
  Stethoscope,
  Briefcase,
  DollarSign,
  Building,
  ShieldCheck,
  Calendar,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type EmployeeProfile = {
  department: string | null;
  position: string | null;
  salary: number | null;
  joinDate: string | null;
};

type Employee = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  orgRole: string;
  employeeProfile: EmployeeProfile | null;
};

export function EmployeesClient({ initialEmployees }: { initialEmployees: Employee[] }) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [branches, setBranches] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    position: "",
    salary: "",
    joinDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/dashboard/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDialog = (emp?: Employee) => {
    if (emp) {
      setEditingId(emp.id);
      setFormData({
        name: emp.name || "",
        email: emp.email || "",
        password: "",
        department: emp.employeeProfile?.department || "",
        position: emp.employeeProfile?.position || "",
        salary: emp.employeeProfile?.salary?.toString() || "",
        joinDate: emp.employeeProfile?.joinDate
          ? new Date(emp.employeeProfile.joinDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        department: branches[0]?.name ? `ສາຂາ: ${branches[0].name}` : "ສຳນັກງານໃຫຍ່",
        position: "ພະນັກງານທົ່ວໄປ",
        salary: "",
        joinDate: new Date().toISOString().split("T")[0],
      });
    }
    setIsDialogOpen(true);
  };

  const handleApplyPreset = (pos: string, dept: string) => {
    setFormData((prev) => ({
      ...prev,
      position: pos,
      department: prev.department || dept,
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error("ກະລຸນາປ້ອນຊື່ພະນັກງານ");
    if (!editingId && (!formData.email || !formData.password)) {
      return toast.error("ອີເມວ ແລະ ລະຫັດຜ່ານແມ່ນຈຳເປັນສຳລັບພະນັກງານໃໝ່");
    }

    setLoading(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/hr/employees/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("ບໍ່ສາມາດອັບເດດຂໍ້ມູນໄດ້");

        setEmployees((prev) =>
          prev.map((e) =>
            e.id === editingId
              ? {
                  ...e,
                  name: formData.name,
                  employeeProfile: {
                    department: formData.department,
                    position: formData.position,
                    salary: formData.salary ? parseFloat(formData.salary) : null,
                    joinDate: formData.joinDate,
                  },
                }
              : e
          )
        );
        toast.success("ອັບເດດຂໍ້ມູນພະນັກງານສຳເລັດ");
      } else {
        const res = await fetch(`/api/hr/employees`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "ບໍ່ສາມາດເພີ່ມພະນັກງານໄດ້");
        }

        const newEmp = await res.json();
        setEmployees((prev) => [
          {
            id: newEmp.id,
            name: newEmp.name,
            email: newEmp.email,
            role: newEmp.role,
            orgRole: "STAFF",
            employeeProfile: newEmp.employeeProfile,
          },
          ...prev,
        ]);
        toast.success("ເພີ່ມພະນັກງານໃໝ່ສຳເລັດ");
      }
      setIsDialogOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "ເກີດຂໍ້ຜິດພາດ");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await askConfirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບພະນັກງານຄົນນີ້ອອກຈາກອົງກອນ?", {
      title: "ຢືນຢັນການລຶບພະນັກງານ",
      confirmText: "ລຶບພະນັກງານ",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/hr/employees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ລຶບບໍ່ສຳເລັດ");

      setEmployees((prev) => prev.filter((e) => e.id !== id));
      toast.success("ລຶບພະນັກງານສຳເລັດ");
      router.refresh();
    } catch {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການລຶບ");
    }
  };

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase().trim();
    const nameMatch = (e.name || "").toLowerCase().includes(q);
    const emailMatch = (e.email || "").toLowerCase().includes(q);
    const deptMatch = (e.employeeProfile?.department || "").toLowerCase().includes(q);
    const posMatch = (e.employeeProfile?.position || "").toLowerCase().includes(q);
    const matchesSearch = !q || nameMatch || emailMatch || deptMatch || posMatch;

    if (categoryFilter === "DOCTOR") {
      const isDoc =
        posMatch && (posMatch.includes("ແພດ") || posMatch.includes("ໝໍ") || posMatch.includes("doctor"));
      return matchesSearch && isDoc;
    }
    if (categoryFilter === "TECH") {
      const isTech =
        posMatch && (posMatch.includes("ຊ່າງ") || posMatch.includes("ເຕັກນິກ") || posMatch.includes("tech"));
      return matchesSearch && isTech;
    }
    if (categoryFilter === "SALES") {
      const isSales =
        posMatch &&
        (posMatch.includes("ຂາຍ") || posMatch.includes("ແຄຊ") || posMatch.includes("cashier") || posMatch.includes("sales"));
      return matchesSearch && isSales;
    }
    if (categoryFilter === "MANAGER") {
      const isMgr =
        (e.orgRole === "OWNER" || e.orgRole === "ADMIN") ||
        (posMatch && (posMatch.includes("ຈັດການ") || posMatch.includes("manager")));
      return matchesSearch && isMgr;
    }

    return matchesSearch;
  });

  // KPI Calculations
  const totalStaff = employees.length;
  const totalDoctors = employees.filter((e) => {
    const p = (e.employeeProfile?.position || "").toLowerCase();
    return p.includes("ແພດ") || p.includes("ໝໍ") || p.includes("doctor");
  }).length;
  const totalTechs = employees.filter((e) => {
    const p = (e.employeeProfile?.position || "").toLowerCase();
    return p.includes("ຊ່າງ") || p.includes("ເຕັກນິກ") || p.includes("tech");
  }).length;
  const totalPayroll = employees.reduce((sum, e) => sum + (e.employeeProfile?.salary || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ພະນັກງານທັງໝົດ</p>
              <h3 className="text-2xl font-black text-white mt-2">{totalStaff} ຄົນ</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-2">ລວມທຸກຕຳແໜ່ງໃນອົງກອນ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ແພດ / ໝໍ</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-2">{totalDoctors} ຄົນ</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-400/80 mt-2">ຜູ້ໃຫ້ການກວດ & ປິ່ນປົວ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ຊ່າງສ້ອມແປງ / ເຕັກນິກ</p>
              <h3 className="text-2xl font-black text-amber-400 mt-2">{totalTechs} ຄົນ</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-amber-400/80 mt-2">ຮັບຜິດຊອບການສ້ອມແປງ</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">ເງິນເດືອນລວມຕໍ່ເດືອນ</p>
              <h3 className="text-2xl font-black text-purple-400 mt-2">₭{totalPayroll.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-purple-400/80 mt-2">ຍອດເງິນເດືອນພະນັກງານທັງໝົດ</p>
        </div>
      </div>

      {/* ── Toolbar & Filters ── */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ຄົ້ນຫາຊື່, ອີເມວ, ຕຳແໜ່ງ, ສາຂາ..."
            className="pl-9 bg-zinc-950 border-zinc-800 text-sm focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "ທັງໝົດ", val: "ALL" },
            { label: "ແພດ / ໝໍ", val: "DOCTOR" },
            { label: "ຊ່າງສ້ອມແປງ", val: "TECH" },
            { label: "ພະນັກງານຂາຍ", val: "SALES" },
            { label: "ບໍລິຫານ & ຈັດການ", val: "MANAGER" },
          ].map((cat) => (
            <button
              key={cat.val}
              onClick={() => setCategoryFilter(cat.val)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === cat.val
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-zinc-800/70 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold gap-1.5 shrink-0"
          >
            <Plus size={15} />
            <span>ເພີ່ມພະນັກງານໃໝ່</span>
          </Button>
        </div>
      </div>

      {/* ── Employees Table ── */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-zinc-400 uppercase bg-zinc-950/80 border-b border-zinc-800/80">
              <tr>
                <th className="px-5 py-4">ຊື່ພະນັກງານ & ອີເມວ</th>
                <th className="px-5 py-4">ຕຳແໜ່ງ</th>
                <th className="px-5 py-4">ສາຂາ / ແຜນກ</th>
                <th className="px-5 py-4 text-right">ເງິນເດືອນ</th>
                <th className="px-5 py-4 text-center">ບົດບາດ</th>
                <th className="px-5 py-4 text-right">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-zinc-500">
                    <UserCircle2 className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                    <p className="text-sm">ບໍ່ພົບຂໍ້ມູນພະນັກງານທີ່ກົງກັບເງື່ອນໄຂ</p>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const pos = emp.employeeProfile?.position || "-";
                  const isDoctor = pos.includes("ແພດ") || pos.includes("ໝໍ");
                  const isTech = pos.includes("ຊ່າງ");

                  return (
                    <tr key={emp.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                          <span>{emp.name || "ບໍ່ລະບຸຊື່"}</span>
                          {isDoctor && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ແພດ
                            </span>
                          )}
                          {isTech && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              ຊ່າງ
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{emp.email}</div>
                      </td>
                      <td className="px-5 py-4 text-zinc-300 font-medium">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-xs">
                          {pos}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-zinc-400 text-xs">
                        <span className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{emp.employeeProfile?.department || "ສຳນັກງານໃຫຍ່"}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-emerald-400 whitespace-nowrap">
                        {emp.employeeProfile?.salary
                          ? `₭${emp.employeeProfile.salary.toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                            emp.orgRole === "OWNER"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : emp.orgRole === "ADMIN"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {emp.orgRole}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(emp)}
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            title="ແກ້ໄຂ"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(emp.id)}
                            disabled={emp.orgRole === "OWNER"}
                            className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                            title="ລຶບ"
                          >
                            <Trash2 size={14} />
                          </Button>
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

      {/* ── Dialog for Add/Edit Employee ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span>{editingId ? "ແກ້ໄຂຂໍ້ມູນພະນັກງານ" : "ເພີ່ມພະນັກງານໃໝ່"}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Preset Buttons */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-zinc-400 block">ເລືອກຕຳແໜ່ງດ່ວນ:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { pos: "ແພດ / ໝໍປະຈຳຄລີນິກ", dept: "ພະແນກຄລີນິກ & ການແພດ" },
                { pos: "ຊ່າງສ້ອມແປງ / ເຕັກນິກ", dept: "ພະແນກສ້ອມແປງ & ບໍລິການ" },
                { pos: "ພະນັກງານຂາຍ / ແຄຊເຊຍ", dept: "ພະແນກຂາຍໜ້າຮ້ານ (POS)" },
                { pos: "ຜູ້ຈັດການສາຂາ", dept: "ພະແນກບໍລິຫານສາຂາ" },
                { pos: "ຄູເຝິກ / ໂຄ້ດກິລາ", dept: "ພະແນກສະໜາມ & ຄູເຝິກ" },
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p.pos, p.dept)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] font-medium transition-colors"
                >
                  {p.pos}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5 py-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">ຊື່ ແລະ ນາມສະກຸນ *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ປ້ອນຊື່ພະນັກງານ..."
                className="bg-zinc-950 border-zinc-800 text-sm"
              />
            </div>

            {!editingId && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">ອີເມວເຂົ້າສູ່ລະບົບ *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="bg-zinc-950 border-zinc-800 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">ລະຫັດຜ່ານ *</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="ຕັ້ງລະຫັດຜ່ານ..."
                    className="bg-zinc-950 border-zinc-800 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">ຕຳແໜ່ງ (Position)</label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="ເຊັ່ນ: ແພດ, ຊ່າງ, ແຄຊເຊຍ..."
                  className="bg-zinc-950 border-zinc-800 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ສາຂາ / ພະແນກປະຈຳການ
                </label>
                {branches.length > 0 ? (
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-white"
                  >
                    <option value="ສຳນັກງານໃຫຍ່">ສຳນັກງານໃຫຍ່ (Headquarters)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={`ສາຂາ: ${b.name}`}>
                        ສາຂາ: {b.name} ({b.location})
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="ເຊັ່ນ: ສາຂາ 1, ແຜນກຂາຍ..."
                    className="bg-zinc-950 border-zinc-800 text-sm"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">ເງິນເດືອນພື້ນຖານ (₭)</label>
                <Input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="0"
                  className="bg-zinc-950 border-zinc-800 text-sm font-bold text-emerald-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">ວັນທີເລີ່ມວຽກ</label>
                <Input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-zinc-800 text-zinc-400 hover:text-white"
            >
              ຍົກເລີກ
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingId ? "ອັບເດດຂໍ້ມູນ" : "ບັນທຶກພະນັກງານ"}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
