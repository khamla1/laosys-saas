"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Clock, MapPin, Loader2, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Resource {
  id: string;
  name: string;
  type: string;
}

interface Appointment {
  id: string;
  resourceId: string;
  startTime: string;
  endTime: string;
}

export function StorefrontBookingUI({ storeId }: { storeId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Set today as default date
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    fetchBookingData();
  }, [storeId]);

  const fetchBookingData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/storefront/${storeId}/booking`);
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources);
        setAppointments(data.appointments);
        if (data.resources.length > 0) {
          setSelectedResource(data.resources[0].id);
        }
      }
    } catch (error) {
      toast.error("Failed to load booking data");
    } finally {
      setIsLoading(false);
    }
  };

  const timeSlots = [
    "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  const isSlotBooked = (time: string) => {
    if (!selectedResource || !selectedDate) return false;
    
    // Check if there is an appointment for this resource at this date and time
    const slotStart = new Date(`${selectedDate}T${time}:00`);
    
    return appointments.some(app => {
      if (app.resourceId !== selectedResource) return false;
      const appStart = new Date(app.startTime);
      // Rough check if hours and date match
      return appStart.getDate() === slotStart.getDate() && 
             appStart.getMonth() === slotStart.getMonth() &&
             appStart.getFullYear() === slotStart.getFullYear() &&
             appStart.getHours() === slotStart.getHours();
    });
  };

  const handleBooking = async () => {
    if (!selectedResource || !selectedDate || !selectedTime || !customerName) {
      toast.error("ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
      // Default duration 1 hour
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      const res = await fetch(`/api/storefront/${storeId}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: selectedResource,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          customerName,
          customerPhone
        })
      });

      if (res.ok) {
        setIsSuccess(true);
        fetchBookingData(); // Refresh unavailable slots
      } else {
        toast.error("ເກີດຂໍ້ຜິດພາດໃນການຈອງ");
      }
    } catch (error) {
      toast.error("ເກີດຂໍ້ຜິດພາດໃນການຈອງ");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-500" /></div>;
  }

  if (isSuccess) {
    return (
      <Card className="p-8 bg-zinc-900/50 border-zinc-800 rounded-2xl flex flex-col items-center text-center backdrop-blur-xl">
        <CheckCircle size={64} className="text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">ຈອງຄອດສຳເລັດແລ້ວ!</h2>
        <p className="text-zinc-400 mb-6">ຂໍ້ມູນການຈອງຂອງທ່ານຖືກສົ່ງໄປຫາທາງຮ້ານຮຽບຮ້ອຍແລ້ວ<br/>ກະລຸນາມາຮອດກ່ອນເວລາ 15 ນາທີ</p>
        <Button onClick={() => setIsSuccess(false)} variant="outline" className="rounded-xl border-zinc-700 text-zinc-300">
          ຈອງອີກຄັ້ງ
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-zinc-900/30 border-zinc-800/80 rounded-2xl backdrop-blur-xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <MapPin className="text-blue-400" />
          1. ເລືອກຄອດ / ບໍລິການ
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {resources.map(res => (
            <button
              key={res.id}
              onClick={() => { setSelectedResource(res.id); setSelectedTime(null); }}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedResource === res.id 
                ? 'bg-blue-600/20 border-blue-500 text-blue-400 border-2' 
                : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 border hover:border-zinc-600'
              }`}
            >
              <div className="font-bold">{res.name}</div>
              <div className="text-[10px] mt-1 opacity-70 uppercase tracking-wider">{res.type}</div>
            </button>
          ))}
          {resources.length === 0 && <div className="text-zinc-500 text-sm">ຮ້ານນີ້ຍັງບໍ່ໄດ້ເພີ່ມບໍລິການຫຼືຄອດ</div>}
        </div>
      </Card>

      <Card className="p-6 bg-zinc-900/30 border-zinc-800/80 rounded-2xl backdrop-blur-xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <CalendarDays className="text-purple-400" />
          2. ເລືອກວັນທີ ແລະ ເວລາ
        </h2>
        
        <div className="mb-4 max-w-xs">
          <label className="text-sm text-zinc-400 mb-1 block">ວັນທີຕ້ອງການຈອງ</label>
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(null); }}
            className="bg-zinc-950 border-zinc-800 text-white rounded-xl [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-2 block">ເວລາຫວ່າງ (1 ຊົ່ວໂມງ/ຮອບ)</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {timeSlots.map(time => {
              const isBooked = isSlotBooked(time);
              return (
                <button
                  key={time}
                  disabled={isBooked}
                  onClick={() => setSelectedTime(time)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    isBooked 
                    ? 'bg-zinc-900/20 border-zinc-800/50 text-zinc-600 cursor-not-allowed border line-through' 
                    : selectedTime === time 
                      ? 'bg-purple-600 border-purple-500 text-white border-2' 
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 border hover:border-purple-500/50 hover:bg-zinc-900'
                  }`}
                >
                  {time}
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-zinc-900/30 border-zinc-800/80 rounded-2xl backdrop-blur-xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="text-emerald-400" />
          3. ຂໍ້ມູນຜູ້ຈอง
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">ຊື່ - ນາມສະກຸນ <span className="text-red-500">*</span></label>
            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="ເຊັ່ນ: ສົມຊາຍ ໃຈດີ" className="bg-zinc-950 border-zinc-800 text-white rounded-xl" />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">ເບີໂທລະສັບ</label>
            <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="08x-xxx-xxxx" className="bg-zinc-950 border-zinc-800 text-white rounded-xl" />
          </div>
        </div>
        
        <Button 
          onClick={handleBooking} 
          disabled={!selectedResource || !selectedDate || !selectedTime || !customerName || isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl h-12 font-bold text-lg shadow-lg shadow-blue-900/20"
        >
          {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
          ຢືນຢັນການຈອງຄອດ
        </Button>
      </Card>
    </div>
  );
}
