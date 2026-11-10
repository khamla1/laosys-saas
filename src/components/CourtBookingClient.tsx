"use client";

import { useState, useEffect } from "react";
import { Plus, CalendarDays, Loader2, Clock, User, Trash2, Map } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type ServiceResource = { id: string; name: string; type: string };
type Appointment = {
  id: string;
  customerName: string;
  customerPhone?: string;
  startTime: string;
  endTime: string;
  status: string;
  resourceId: string;
  resource?: ServiceResource;
};

export function CourtBookingClient() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [resources, setResources] = useState<ServiceResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resApps, resResources] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/resources")
      ]);
      if (resApps.ok && resResources.ok) {
        const appsData = await resApps.json();
        const resData = await resResources.json();
        
        // Only get courts
        const courts = resData.filter((r: any) => r.type === "COURT");
        setResources(courts);
        
        // Filter appointments that belong to courts
        const courtIds = courts.map((c: any) => c.id);
        setAppointments(appsData.filter((a: any) => courtIds.includes(a.resourceId)));
      }
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!customerName || !resourceId || !bookingDate || !startTime || !endTime) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const startDateTime = new Date(`${bookingDate}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${bookingDate}T${endTime}:00`).toISOString();

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          resourceId,
          startTime: startDateTime,
          endTime: endDateTime,
          status: "SCHEDULED"
        }),
      });
      
      if (res.ok) {
        toast.success("Booking created!");
        setIsDialogOpen(false);
        fetchData(); // Refresh list
        
        // Reset form
        setCustomerName(""); setCustomerPhone(""); setResourceId(""); 
        setBookingDate(""); setStartTime(""); setEndTime("");
      } else {
        toast.error("Failed to create booking");
      }
    } catch (error) {
      toast.error("Error creating booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <CalendarDays className="text-blue-500" />
            ตารางจองคอร์ท (Court Bookings)
          </h1>
          <p className="text-zinc-400 mt-1">จัดการและดูคิวจองสนามหรือคอร์ทของคุณ</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl h-11">
          <Plus size={18} />
          เพิ่มการจอง (New Booking)
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-zinc-500" size={32} />
        </div>
      ) : appointments.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/50 border-zinc-800 border-dashed border-2 rounded-2xl">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <CalendarDays size={24} className="text-zinc-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">ยังไม่มีการจอง (No Bookings)</h3>
          <p className="text-zinc-400 mb-6 max-w-sm">
            คลิกปุ่ม "เพิ่มการจอง" ด้านบนเพื่อเริ่มลงคิวการจองสนามของคุณ
          </p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="rounded-xl border-zinc-700 text-white hover:bg-zinc-800">
            <Plus size={16} className="mr-2" /> สร้างการจองทันที
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {appointments.map((app) => (
            <Card key={app.id} className="p-5 bg-zinc-900 border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between hover:border-zinc-700 transition-colors gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 text-blue-500 p-4 rounded-xl flex flex-col items-center justify-center w-20 shrink-0">
                  <span className="text-xs font-semibold uppercase">{new Date(app.startTime).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-2xl font-bold">{new Date(app.startTime).getDate()}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{app.customerName}</h3>
                  <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {formatTime(app.startTime)} - {formatTime(app.endTime)}</span>
                    <span className="flex items-center gap-1.5"><Map size={14} /> {app.resource?.name || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <div className="flex md:flex-col items-center md:items-end justify-between gap-3 border-t border-zinc-800/50 md:border-t-0 pt-4 md:pt-0">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                  {app.status}
                </span>
                {app.customerPhone && (
                  <span className="text-sm text-zinc-500 flex items-center gap-1.5"><User size={14}/> {app.customerPhone}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 sm:rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">สร้างการจองคอร์ทใหม่</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            
            {resources.length === 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm mb-2">
                คุณยังไม่มีสนาม/คอร์ทในระบบ กรุณาไปเพิ่มสนามก่อนครับ
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">เลือกสนาม (Court)</label>
              <select 
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl h-11 px-3 outline-none focus:ring-2 focus:ring-blue-500/50"
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
              >
                <option value="">-- กรุณาเลือกสนาม --</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">ชื่อลูกค้า (Name)</label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" placeholder="ชื่อ" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">เบอร์โทร (Phone)</label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11" placeholder="เบอร์โทรศัพท์" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800/50">
              <label className="text-sm font-medium text-zinc-300">วันที่จอง (Date)</label>
              <Input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 [color-scheme:dark]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">เวลาเริ่ม (Start)</label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 [color-scheme:dark]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">เวลาสิ้นสุด (End)</label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white rounded-xl h-11 [color-scheme:dark]" />
              </div>
            </div>
            
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl text-zinc-400 hover:text-white">
              ยกเลิก
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || resources.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              บันทึกคิวจอง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
