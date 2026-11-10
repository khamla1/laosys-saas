import Link from "next/link";
import { Check, X } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Scale your business with plans designed for sellers of all sizes. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FREE PLAN */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col hover:border-zinc-700 transition-all">
            <h3 className="text-xl font-bold text-zinc-100">Starter</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-black">Free</span>
              <span className="text-zinc-500 font-medium"> / forever</span>
            </div>
            <p className="text-sm text-zinc-400 mb-8">Perfect for individuals starting a small online shop.</p>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-5 h-5 text-zinc-500" /> Max 10 Products</li>
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-5 h-5 text-zinc-500" /> Standard Order Management</li>
              <li className="flex items-center gap-3 text-sm font-medium text-zinc-600"><X className="w-5 h-5" /> Analytics Dashboard</li>
              <li className="flex items-center gap-3 text-sm font-medium text-zinc-600"><X className="w-5 h-5" /> Priority Support</li>
            </ul>

            <Link href="/login" className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-center rounded-xl text-sm font-bold transition-colors">
              Get Started
            </Link>
          </div>

          {/* PRO PLAN */}
          <div className="bg-blue-500/5 border-2 border-blue-500 rounded-3xl p-8 flex flex-col relative scale-105 shadow-[0_0_40px_rgba(59,130,246,0.15)] z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-blue-400">Pro</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-black">₭99,000</span>
              <span className="text-zinc-500 font-medium"> / month</span>
            </div>
            <p className="text-sm text-zinc-400 mb-8">Everything you need to grow your e-commerce empire.</p>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-5 h-5 text-blue-500" /> Unlimited Products</li>
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-5 h-5 text-blue-500" /> Standard Analytics</li>
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-5 h-5 text-blue-500" /> Custom Store URL</li>
              <li className="flex items-center gap-3 text-sm font-medium text-zinc-600"><X className="w-5 h-5" /> Dedicated Manager</li>
            </ul>

            <Link href="/dashboard/billing" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-center rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
              Upgrade to Pro
            </Link>
          </div>

          {/* BUSINESS PLAN */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col hover:border-zinc-700 transition-all">
            <h3 className="text-xl font-bold text-purple-400">Business</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-black">₭299,000</span>
              <span className="text-zinc-500 font-medium"> / month</span>
            </div>
            <p className="text-sm text-zinc-400 mb-8">Advanced features for high-volume enterprises.</p>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-5 h-5 text-purple-500" /> Everything in Pro</li>
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-5 h-5 text-purple-500" /> Advanced Analytics</li>
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-5 h-5 text-purple-500" /> Priority 24/7 Support</li>
              <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-5 h-5 text-purple-500" /> Dedicated Manager</li>
            </ul>

            <Link href="/dashboard/billing" className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 hover:text-purple-400 text-center rounded-xl text-sm font-bold transition-colors">
              Go Business
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
