"use client";

import { useState } from "react";
import { Watch, ArrowRightLeft, Activity, Server, Smartphone, HeartPulse, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function TechClient() {
  const [activeTab, setActiveTab] = useState<'sync' | 'health' | 'firmware'>('sync');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const devices = [
    { name: "Garmin Forerunner 955", type: "Smartwatch", status: "Connected", lastSync: "2 mins ago" },
    { name: "Polar H10", type: "Heart Rate Monitor", status: "Disconnected", lastSync: "Yesterday" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Watch className="text-cyan-500" />
          ອຸປະກອນອັດສະລິຍະ (Tech & Wearables)
        </h1>
        <p className="text-zinc-400 mt-1">ຊິ້ງຂໍ້ມູນຈາກ Smartwatch, ວິເຄາະສຸຂະພາບ ແລະ ຈັດການເຟີມແວຣ໌</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-px overflow-x-auto whitespace-nowrap">
        <button 
          onClick={() => setActiveTab('sync')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'sync' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          ຊິ້ງຂໍ້ມູນ (Garmin/Strava)
        </button>
        <button 
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'health' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          ວິເຄາະຂໍ້ມູນສຸຂະພາບ
        </button>
        <button 
          onClick={() => setActiveTab('firmware')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'firmware' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          ອັບເດດເຟີມແວຣ໌
        </button>
      </div>

      {activeTab === 'sync' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((d, i) => (
              <Card key={i} className="p-5 bg-zinc-900 border-zinc-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${d.status === 'Connected' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{d.name}</h3>
                    <p className="text-xs text-zinc-400">{d.type} • Last sync: {d.lastSync}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold ${d.status === 'Connected' ? 'text-green-500' : 'text-zinc-500'}`}>
                    {d.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-8 bg-zinc-900 border-zinc-800 border-dashed border-2 rounded-2xl flex flex-col items-center justify-center text-center">
            <ArrowRightLeft size={48} className={`text-zinc-600 mb-4 ${isSyncing ? 'animate-pulse text-cyan-500' : ''}`} />
            <h3 className="text-lg font-bold text-white mb-2">Sync with 3rd Party Platforms</h3>
            <p className="text-zinc-400 text-sm mb-6 max-w-md">Connect your store's dashboard with Garmin Connect, Strava, or Apple Health to pull athletes' data automatically.</p>
            <Button onClick={handleSync} disabled={isSyncing} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl gap-2">
              {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
              {isSyncing ? 'Syncing Data...' : 'Force Sync Now'}
            </Button>
          </Card>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 bg-zinc-900 border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <HeartPulse className="text-red-500" size={24} />
              <h3 className="text-white font-bold">Avg. Heart Rate</h3>
            </div>
            <div className="text-4xl font-bold text-white mb-1">142 <span className="text-sm text-zinc-500 font-normal">bpm</span></div>
            <div className="text-xs text-green-400">+2% from last week</div>
          </Card>
          <Card className="p-5 bg-zinc-900 border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="text-cyan-500" size={24} />
              <h3 className="text-white font-bold">VO2 Max</h3>
            </div>
            <div className="text-4xl font-bold text-white mb-1">54 <span className="text-sm text-zinc-500 font-normal">ml/kg/min</span></div>
            <div className="text-xs text-zinc-400">Excellent level</div>
          </Card>
          <Card className="p-5 bg-zinc-900 border-zinc-800 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Watch className="text-amber-500" size={24} />
              <h3 className="text-white font-bold">Sleep Score</h3>
            </div>
            <div className="text-4xl font-bold text-white mb-1">82 <span className="text-sm text-zinc-500 font-normal">/100</span></div>
            <div className="text-xs text-red-400">-5% from last week</div>
          </Card>
        </div>
      )}

      {activeTab === 'firmware' && (
        <Card className="p-6 bg-zinc-900 border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-4 mb-6">
            <Server className="text-cyan-500" size={32} />
            <div>
              <h3 className="text-xl font-bold text-white">Firmware Management</h3>
              <p className="text-sm text-zinc-400">Manage updates for rented smart devices</p>
            </div>
          </div>
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-white font-bold">System Tracker v2.4</div>
              <div className="text-xs text-zinc-500">Update available (v2.5.1) - Critical Security Patch</div>
            </div>
            <Button variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 rounded-lg">
              Update All Devices
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
