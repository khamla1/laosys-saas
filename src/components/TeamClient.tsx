"use client";

import { useState, useEffect } from "react";
import { Gamepad2, Trophy, BarChart3, CalendarDays, Crosshair, Users, Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  game: string;
  stat: string;
};

type TeamSchedule = {
  id: string;
  title: string;
  date: string;
  type: string;
};

export function TeamClient({ defaultTab = 'roster' }: { defaultTab?: 'roster' | 'schedule' | 'analytics' }) {
  const [activeTab, setActiveTab] = useState<'roster' | 'schedule' | 'analytics'>(defaultTab);
  const [isLoading, setIsLoading] = useState(true);
  
  const [roster, setRoster] = useState<TeamMember[]>([]);
  const [schedule, setSchedule] = useState<TeamSchedule[]>([]);

  // Dialog states
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberGame, setMemberGame] = useState("");
  const [memberStat, setMemberStat] = useState("");

  const [schedTitle, setSchedTitle] = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedType, setSchedType] = useState("Practice");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rosterRes, schedRes] = await Promise.all([
        fetch("/api/team/roster"),
        fetch("/api/team/schedule")
      ]);
      if (rosterRes.ok) setRoster(await rosterRes.json());
      if (schedRes.ok) setSchedule(await schedRes.json());
    } catch (e) {
      toast.error("Failed to load team data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMember = async () => {
    if (!memberName || !memberRole || !memberGame) {
      toast.error("Please fill required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/team/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: memberName, role: memberRole, game: memberGame, stat: memberStat || "N/A" }),
      });
      if (res.ok) {
        toast.success("Team member added!");
        setIsRosterDialogOpen(false);
        fetchData();
        setMemberName(""); setMemberRole(""); setMemberGame(""); setMemberStat("");
      }
    } catch (e) {
      toast.error("Error creating member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!schedTitle || !schedDate) {
      toast.error("Please fill required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/team/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: schedTitle, date: schedDate, type: schedType }),
      });
      if (res.ok) {
        toast.success("Schedule added!");
        setIsScheduleDialogOpen(false);
        fetchData();
        setSchedTitle(""); setSchedDate(""); setSchedType("Practice");
      }
    } catch (e) {
      toast.error("Error creating schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Gamepad2 className="text-indigo-500" />
            ທີມ ແລະ ສະໂມສອນ (Team & E-Sports)
          </h1>
          <p className="text-zinc-400 mt-1">ບໍລິຫານນັກກິລາ ຕາຕະລາງຊ້ອມ ແລະ ວິເຄາະຟອມການຫຼິ້ນຂອງທີມ</p>
        </div>
        
        {activeTab === 'roster' && (
          <Button onClick={() => setIsRosterDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl h-11">
            <Plus size={18} /> ເພີ່ມນັກກິລາ
          </Button>
        )}
        {activeTab === 'schedule' && (
          <Button onClick={() => setIsScheduleDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl h-11">
            <Plus size={18} /> ຈັດຕາຕະລາງໃໝ່
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-px">
        <button 
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'roster' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          ຈັດການນັກກິລາໃນທີມ
        </button>
        <button 
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'schedule' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          ຕາຕະລາງຊ້ອມ ແລະ ແຂ່ງ
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'analytics' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          ວິເຄາະສະຖິຕິທີມ
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-zinc-500" /></div>
      ) : activeTab === 'roster' && (
        roster.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/50 border-zinc-800 border-dashed border-2 rounded-2xl">
            <Users size={48} className="text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-white">ຍັງບໍ່ມີນັກກິລາໃນທີມ</h3>
            <Button onClick={() => setIsRosterDialogOpen(true)} variant="outline" className="mt-4 rounded-xl text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10">ເພີ່ມນັກກິລາຄົນທຳອິດ</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roster.map(r => (
              <Card key={r.id} className="p-5 bg-zinc-900 border-zinc-800 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Gamepad2 size={64} className="text-indigo-500" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white">{r.name}</h3>
                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded">{r.role}</span>
                  </div>
                  <div className="text-sm text-zinc-400 mb-2">ເກມ/ປະເພດ: {r.game}</div>
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-950 rounded border border-zinc-800 text-xs text-white font-mono">
                    <Crosshair size={12} className="text-green-500" /> {r.stat}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {!isLoading && activeTab === 'schedule' && (
        schedule.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/50 border-zinc-800 border-dashed border-2 rounded-2xl">
            <CalendarDays size={48} className="text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-white">ຍັງບໍ່ມີຕາຕະລາງກິດຈະກຳ</h3>
            <Button onClick={() => setIsScheduleDialogOpen(true)} variant="outline" className="mt-4 rounded-xl text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10">ຈັດຕາຕະລາງທຳອິດ</Button>
          </Card>
        ) : (
          <Card className="bg-zinc-900 border-zinc-800 rounded-2xl p-6">
            <div className="space-y-4">
              {schedule.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${s.type === 'Tournament' ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-500'}`}>
                      {s.type === 'Tournament' ? <Trophy size={20} /> : <CalendarDays size={20} />}
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{s.title}</h4>
                      <p className="text-xs text-zinc-400">{new Date(s.date).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${s.type === 'Tournament' ? 'text-amber-500' : 'text-indigo-400'}`}>
                    {s.type}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )
      )}

      {!isLoading && activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-zinc-900 border-zinc-800 rounded-2xl flex flex-col items-center justify-center min-h-[200px] text-center">
            <BarChart3 size={48} className="text-zinc-600 mb-4" />
            <h3 className="text-lg font-bold text-white">Win Rate Analysis</h3>
            <p className="text-zinc-400 text-sm mt-2">ກຳລັງປະມວນຜົນສະຖິຕິຂອງທີມຈາກ {roster.length} ຜູ້ຫຼິ້ນ...</p>
          </Card>
          <Card className="p-6 bg-zinc-900 border-zinc-800 rounded-2xl flex flex-col items-center justify-center min-h-[200px] text-center">
            <Users size={48} className="text-zinc-600 mb-4" />
            <h3 className="text-lg font-bold text-white">Player Synergy</h3>
            <p className="text-zinc-400 text-sm mt-2">ໂມເດລປະມວນຜົນຄວາມເຂົ້າກັນໄດ້ຂອງທີມ (Coming Soon)</p>
          </Card>
        </div>
      )}

      {/* Roster Modal */}
      <Dialog open={isRosterDialogOpen} onOpenChange={setIsRosterDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">ເພີ່ມນັກກິລາໃນທີມ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="ຊື່ຜູ້ຫຼິ້ນ (IGN)" value={memberName} onChange={e => setMemberName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            <Input placeholder="ບົດບາດ (ເຊັ່ນ Captain, Mid Laner)" value={memberRole} onChange={e => setMemberRole(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            <Input placeholder="ຊື່ເກມ (ເຊັ່ນ Valorant, ROV)" value={memberGame} onChange={e => setMemberGame(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            <Input placeholder="ສະຖິຕິເດັ່ນ (ເຊັ່ນ KDA 4.5)" value={memberStat} onChange={e => setMemberStat(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRosterDialogOpen(false)} className="text-zinc-400 hover:text-white">ຍົກເລີກ</Button>
            <Button onClick={handleCreateMember} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">ບັນທຶກ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">ເພີ່ມຕາຕະລາງຊ້ອມ/ແຂ່ງ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="ຊື່ລາຍການ (ເຊັ່ນ ຊ້ອມທີມ, ROV Pro League)" value={schedTitle} onChange={e => setSchedTitle(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            <Input type="datetime-local" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl [color-scheme:dark]" />
            <div className="flex gap-2">
              <Button type="button" variant={schedType === 'Practice' ? 'default' : 'outline'} onClick={() => setSchedType('Practice')} className={`flex-1 rounded-xl ${schedType === 'Practice' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-zinc-800 text-zinc-400'}`}>ຊ້ອມ (Practice)</Button>
              <Button type="button" variant={schedType === 'Tournament' ? 'default' : 'outline'} onClick={() => setSchedType('Tournament')} className={`flex-1 rounded-xl ${schedType === 'Tournament' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'border-zinc-800 text-zinc-400'}`}>ແຂ່ງຈິງ (Tournament)</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsScheduleDialogOpen(false)} className="text-zinc-400 hover:text-white">ຍົກເລີກ</Button>
            <Button onClick={handleCreateSchedule} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">ບັນທຶກ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
