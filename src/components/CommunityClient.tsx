"use client";

import { useState } from "react";
import { Users, Megaphone, CalendarPlus, Search, MessageSquare, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function CommunityClient() {
  const [activeTab, setActiveTab] = useState<'members' | 'events' | 'noticeboard'>('members');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock Data
  const [members, setMembers] = useState([
    { id: 1, name: "ສົມຊາຍ ເຂັມກັດ", role: "ປະທານຊົມລົມ", sport: "ແລ່ນມາຣາທອນ", joinedAt: "2023-01-15" },
    { id: 2, name: "ວິໄຊ ໃຈດີ", role: "ສະມາຊິກ", sport: "ປັ່ນຈັກກະຍານ", joinedAt: "2023-06-20" },
    { id: 3, name: "ສຸດາພອນ ນາມສະກຸນ", role: "ສະມາຊິກ", sport: "ບານດອກປີກໄກ່", joinedAt: "2024-02-10" },
  ]);

  const [events, setEvents] = useState([
    { id: 1, title: "ປັ່ນຈັກກະຍານທາງໄກ 100km", date: "2026-08-15", location: "ພູເຂົາໃຫຍ່", participants: 24 },
    { id: 2, title: "ແຂ່ງຂັນບານດອກປີກໄກ່ກະຊັບມິດ", date: "2026-09-01", location: "ຄອດ A1-A4", participants: 16 },
  ]);

  const [notices, setNotices] = useState([
    { id: 1, title: "ແຈ້ງປິດປັບປຸງຄອດ 1 ຊົ່ວຄາວ", author: "Admin", date: "2026-07-20", type: "ປະກາດ" },
    { id: 2, title: "ຮັບສະໝັກຄົນຫານຄ່າຄອດວັນເສົາຣ໌ນີ້", author: "ສຸດາພອນ", date: "2026-07-22", type: "ສົນທະນາ" },
  ]);

  const handleCreateEvent = () => {
    toast.success("ສ້າງອີເວັນໃໝ່ສຳເລັດ");
    setIsDialogOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="text-blue-400" />
            ຊົມລົມ ແລະ ຄອມມູນິຕີ້ (Community & Clubs)
          </h1>
          <p className="text-zinc-400 mt-1">ພື້ນທີ່ສົນທະນາ ຈັດກິດຈະກຳ ແລະ ລວມກຸ່ມນັກກິລາ</p>
        </div>
        {activeTab === 'events' && (
          <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl h-11">
            <CalendarPlus size={18} /> ຈັດອີເວັນໃໝ່
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-px">
        <button 
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'members' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          ລາຍຊື່ສະມາຊິກ
        </button>
        <button 
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'events' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          ກິດຈະກຳ / ອີເວັນ
        </button>
        <button 
          onClick={() => setActiveTab('noticeboard')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'noticeboard' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          ບອດປະກາດ
        </button>
      </div>

      {activeTab === 'members' && (
        <Card className="bg-zinc-900 border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
            <Search size={18} className="text-zinc-500" />
            <input type="text" placeholder="ຄົ້ນຫາສະມາຊິກ..." className="bg-transparent border-none text-white focus:outline-none w-full text-sm" />
          </div>
          <div className="divide-y divide-zinc-800">
            {members.map(m => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{m.name}</h4>
                    <p className="text-xs text-zinc-400">ກິລາທີ່ມັກ: {m.sport}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${m.role === 'ປະທານຊົມລົມ' ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-400'}`}>
                    {m.role}
                  </span>
                  <p className="text-xs text-zinc-500 mt-1">ເຂົ້າຮ່ວມ {m.joinedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(e => (
            <Card key={e.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-colors">
              <div>
                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-bold mb-3 inline-block">Upcoming</span>
                <h3 className="text-lg font-bold text-white">{e.title}</h3>
                <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
                  <MapPin size={14} className="text-zinc-400 shrink-0" /> {e.location}
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-zinc-800 pt-3 mt-4">
                <div className="text-xs text-zinc-500 font-mono">{e.date}</div>
                <div className="flex items-center gap-1 text-sm font-bold text-white bg-zinc-950 px-3 py-1 rounded-lg">
                  <Users size={14} className="text-blue-400" /> {e.participants} ເຂົ້າຮ່ວມ
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'noticeboard' && (
        <div className="space-y-3">
          {notices.map(n => (
            <Card key={n.id} className="p-4 bg-zinc-900 border-zinc-800 rounded-xl flex items-start gap-4 hover:border-zinc-700 transition-colors">
              <div className="mt-1">
                {n.type === 'ປະກາດ' ? <Megaphone className="text-amber-500" size={20} /> : <MessageSquare className="text-blue-400" size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-white font-bold">{n.title}</h4>
                  <span className="text-xs text-zinc-500">{n.date}</span>
                </div>
                <p className="text-sm text-zinc-400 mt-1">ໂພສຕ໌ໂດຍ: {n.author}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">ສ້າງກິດຈະກຳ/ອີເວັນໃໝ່</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="ຊື່ກິດຈະກຳ" className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
            <Input type="date" className="bg-zinc-900 border-zinc-800 text-white rounded-xl [color-scheme:dark]" />
            <Input placeholder="ສະຖານທີ່ຈັດ" className="bg-zinc-900 border-zinc-800 text-white rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-zinc-400 hover:text-white">ຍົກເລີກ</Button>
            <Button onClick={handleCreateEvent} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">ສ້າງກິດຈະກຳ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
