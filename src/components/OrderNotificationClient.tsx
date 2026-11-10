"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ShoppingBag, Bell, UtensilsCrossed } from "lucide-react";

/**
 * Play a crisp, pleasant notification chime using Web Audio API
 * (Synthesized directly in browser: 0 network requests, never 404s, Works in all modern browsers)
 */
function playOrderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: A5 (880.00 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0.35, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);

    // Tone 3: C#6 (1108.73 Hz) - Crisp finish
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "triangle";
    osc3.frequency.setValueAtTime(1108.73, now + 0.25);
    gain3.gain.setValueAtTime(0.3, now + 0.25);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.25);
    osc3.stop(now + 0.85);
  } catch {
    // Autoplay restrictions or audio disabled, ignore gracefully
  }
}

export function OrderNotificationClient() {
  const router = useRouter();
  const lastCheckRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAuthedRef = useRef<boolean>(false);
  const isPollingRef = useRef<boolean>(false);
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const originalTitleRef = useRef<string>("");

  useEffect(() => {
    if (typeof document !== "undefined") {
      originalTitleRef.current = document.title;
    }

    const checkNewOrders = async () => {
      if (!lastCheckRef.current || !isAuthedRef.current || isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        // Query orders with a 5-second buffer back to eliminate clock skew
        const bufferDate = new Date(lastCheckRef.current.getTime() - 5000);
        const res = await fetch(`/api/orders/latest?since=${bufferDate.toISOString()}`);

        if (res.status === 401 || res.status === 403) {
          isAuthedRef.current = false;
          return;
        }

        if (!res.ok) return;

        const data = await res.json();

        // Update server timestamp reference
        if (data.serverTime) {
          lastCheckRef.current = new Date(data.serverTime);
        } else {
          lastCheckRef.current = new Date();
        }

        if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
          // Filter out orders we have already notified about
          const trulyNewOrders = data.orders.filter(
            (order: any) => !seenOrderIdsRef.current.has(order.id)
          );

          if (trulyNewOrders.length > 0) {
            // Mark as seen
            trulyNewOrders.forEach((o: any) => seenOrderIdsRef.current.add(o.id));

            // 1. Play audible chime
            playOrderChime();

            // 2. Dispatch global browser events for open pages (Orders, KDS, Cashier, POS)
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("refresh-orders", { detail: { orders: trulyNewOrders } })
              );
              window.dispatchEvent(
                new CustomEvent("new-orders-detected", { detail: { orders: trulyNewOrders } })
              );
            }

            // 3. Auto-refresh server components in Next.js
            router.refresh();

            // 4. Temporarily update browser tab title
            if (typeof document !== "undefined") {
              document.title = `(${trulyNewOrders.length} ອໍເດີໃໝ່!) ${originalTitleRef.current}`;
              setTimeout(() => {
                if (typeof document !== "undefined") {
                  document.title = originalTitleRef.current;
                }
              }, 10000);
            }

            // 5. Display high-visibility Pop-up Toast for each new order
            trulyNewOrders.forEach((order: any) => {
              const orderRef = `#ORD-${order.id.slice(-6).toUpperCase()}`;
              const itemsCount =
                order.items && order.items.length > 0
                  ? order.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0)
                  : order.metadata?.itemCount || 1;

              toast.custom(
                (t) => (
                  <div className="flex items-start gap-3.5 p-4 bg-zinc-950/95 backdrop-blur-xl border-2 border-emerald-500/80 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] max-w-sm w-full relative overflow-hidden text-white animate-in slide-in-from-top-4 duration-300">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                    
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5 border border-emerald-500/30">
                      <ShoppingBag size={22} className="animate-bounce" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-500 text-zinc-950">
                          NEW
                        </span>
                        <h4 className="font-bold text-white text-sm truncate">
                          ອໍເດີໃໝ່ {orderRef}
                        </h4>
                      </div>

                      <p className="text-xs text-zinc-300 mt-1 line-clamp-1">
                        {order.customerName ? (
                          <span className="font-semibold text-zinc-200">{order.customerName}</span>
                        ) : order.table?.name ? (
                          <span className="font-semibold text-blue-400">ໂຕະ {order.table.name}</span>
                        ) : (
                          "ລູກຄ້າທົ່ວໄປ"
                        )}{" "}
                        • {itemsCount} ລາຍການ
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80">
                        <span className="font-black text-emerald-400 text-base leading-none">
                          ₭{order.totalAmount?.toLocaleString()}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              toast.dismiss(t);
                              router.push("/dashboard/orders");
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-blue-600/30 whitespace-nowrap"
                          >
                            ເບິ່ງອໍເດີ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
                { duration: 10000 }
              );
            });
          }
        }
      } catch {
        // Silently ignore network failures
      } finally {
        isPollingRef.current = false;
      }
    };

    // Probe session status once on mount
    const init = async () => {
      try {
        const now = new Date();
        const res = await fetch("/api/orders/latest?since=" + now.toISOString());
        if (res.status === 401 || res.status === 403) {
          return;
        }
        isAuthedRef.current = true;
        lastCheckRef.current = now;

        // Populate seen order ids to prevent re-alerting initial items
        if (res.ok) {
          const initData = await res.json().catch(() => null);
          if (initData?.orders && Array.isArray(initData.orders)) {
            initData.orders.forEach((o: any) => seenOrderIdsRef.current.add(o.id));
          }
        }

        // Fast real-time polling every 3.5 seconds
        intervalRef.current = setInterval(checkNewOrders, 3500);
      } catch {
        // Network error — silently ignore
      }
    };

    init();

    // Re-check immediately when user switches back to this browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkNewOrders();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
