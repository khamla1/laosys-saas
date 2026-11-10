"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { BrandTelegram } from "@/components/icons/BrandIcons";

interface StoreTelegramSettingsProps {
  initialChatId: string;
  initialEnabled: boolean;
}

export function StoreTelegramSettings({ initialChatId, initialEnabled }: StoreTelegramSettingsProps) {
  const [chatId, setChatId] = useState(initialChatId || "");
  const [enabled, setEnabled] = useState(initialEnabled || false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setChatId(initialChatId || "");
    setEnabled(initialEnabled || false);
  }, [initialChatId, initialEnabled]);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    // Frontend validation
    if (enabled && !chatId.trim()) {
      setMessage({ type: "error", text: "Chat ID cannot be empty when Telegram is enabled." });
      setLoading(false);
      return;
    }

    if (enabled && chatId) {
      if (!/^-?\d+$/.test(chatId)) {
        setMessage({ type: "error", text: "Invalid Chat ID: Must contain numbers only." });
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/store/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chatId.trim(), enabled }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Telegram settings saved successfully." });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save settings." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Connection error." });
    }
    setLoading(false);
  };

  const handleTest = async () => {
    setTestLoading(true);
    setMessage(null);

    if (!chatId.trim()) {
      setMessage({ type: "error", text: "Please enter a Chat ID to test." });
      setTestLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chatId.trim() }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Test message sent successfully!" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to send test message." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Connection error." });
    }
    setTestLoading(false);
  };

  return (
    <div className="space-y-4 relative">
      {message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-semibold mb-4 ${
          message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label className="text-zinc-200 font-bold flex items-center gap-2"><BrandTelegram size={16} color="#24A1DE" /><span>Telegram Chat ID</span></Label>
        <div className="flex items-center gap-2">
          {chatId && enabled ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Not Connected
            </span>
          )}
        </div>
      </div>

      <Input
        value={chatId}
        onChange={(e) => setChatId(e.target.value)}
        className="bg-zinc-950/80 border-zinc-800 text-white font-mono rounded-xl focus:border-blue-500/40"
        placeholder="e.g. -100123456789"
      />

      <div className="flex items-center justify-between pt-2">
        <Label className="text-zinc-300">Enable Notifications</Label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-zinc-800/50">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save
        </Button>
        <Button
          onClick={handleTest}
          disabled={testLoading || !chatId}
          variant="secondary"
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
        >
          {testLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Test
        </Button>
      </div>
    </div>
  );
}
