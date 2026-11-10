"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, Package, Info, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { askConfirm } from "@/components/ConfirmModal";

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      // Silently fail, it will retry on the next interval
      // console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 8s and listen for instant real-time events
    const interval = setInterval(fetchNotifications, 8000);

    const handleSync = () => {
      fetchNotifications();
    };

    window.addEventListener("refresh-orders", handleSync);
    window.addEventListener("new-orders-detected", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-orders", handleSync);
      window.removeEventListener("new-orders-detected", handleSync);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch("/api/notifications/mark-read", { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await askConfirm({
      title: "ຢືນຢັນການລຶບແຈ້ງເຕືອນທັງໝົດ",
      message: "ທ່ານຕ້ອງການລຶບລາຍການແຈ້ງເຕືອນທັງໝົດອອກຈາກລະບົບແທ້ບໍ່?",
      variant: "danger",
      confirmText: "ຢືນຢັນລຶບທັງໝົດ",
      cancelText: "ຍົກເລີກ",
    });
    if (!confirmed) return;
    setIsLoading(true);
    try {
      await fetch("/api/notifications", { method: "DELETE" });
      setNotifications([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);
    if (n.link) {
      setIsOpen(false);
      router.push(n.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "ORDER": return <Package className="w-5 h-5 text-blue-400" />;
      case "ALERT": return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default: return <Info className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-zinc-300 hover:text-white bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-blue-900/20"
      >
        <Bell size={22} className={unreadCount > 0 ? "animate-[ring_2s_ease-in-out_infinite] text-blue-400" : "text-blue-400"} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900 animate-pulse" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-72 md:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
            <h3 className="font-bold text-white flex items-center gap-2">
               <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{unreadCount} </span>
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors" title="Mark all as read">
                  <Check size={16} />
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} disabled={isLoading} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" title="Clear all">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center">
                <Bell size={32} className="mb-3 opacity-20" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 border-b border-zinc-800/50 cursor-pointer transition-colors flex gap-4 ${n.isRead ? 'bg-zinc-900 hover:bg-zinc-800/80 opacity-70' : 'bg-zinc-800/30 hover:bg-zinc-800'}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm ${n.isRead ? 'text-zinc-300 font-medium' : 'text-white font-bold'}`}>{n.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-zinc-500 mt-2 block">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {!n.isRead && (
                      <div className="shrink-0 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 bg-zinc-950/50 border-t border-zinc-800 text-center">
              <span className="text-xs text-zinc-500"> {notifications.length} </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
