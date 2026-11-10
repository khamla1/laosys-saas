

import Link from "next/link";
import { LucideIcon } from "lucide-react";

export interface AppLauncherItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  // Full tailwind classes to prevent purging
  colorClasses: {
    bgGlow: string;
    iconBg: string;
    iconBgHover: string;
    iconBorder: string;
    iconBorderHover: string;
    iconColor: string;
    iconColorHover: string;
    cardBorderHover: string;
  };
}

export function AppLauncherGrid({ items }: { items: AppLauncherItem[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 md:gap-6 mt-4 md:mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Link href={item.href} key={idx} style={{ animationDelay: `${idx * 100}ms` }} className="animate-in fade-in zoom-in-95 fill-mode-both duration-500">
            <div className={`group relative flex flex-col items-center justify-center p-3 sm:p-5 md:p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl md:rounded-3xl backdrop-blur-xl hover:bg-zinc-800/60 ${item.colorClasses.cardBorderHover} transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden cursor-pointer h-full`}>
              
              {/* Background Glow */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 ${item.colorClasses.bgGlow} rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              {/* Icon Container */}
              <div className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-2 sm:mb-4 rounded-xl sm:rounded-2xl ${item.colorClasses.iconBg} flex items-center justify-center shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border ${item.colorClasses.iconBorder} group-hover:scale-110 ${item.colorClasses.iconBgHover} ${item.colorClasses.iconBorderHover} transition-all duration-500`}>
                <Icon className={`w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 ${item.colorClasses.iconColor} ${item.colorClasses.iconColorHover} drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`} />
              </div>
              
              {/* Text */}
              <h3 className="text-[11px] sm:text-sm md:text-base font-bold text-zinc-200 group-hover:text-white transition-colors duration-300 text-center leading-tight line-clamp-2">
                {item.name}
              </h3>
              <p className="hidden sm:block text-[10px] md:text-xs text-zinc-500 text-center mt-1.5 opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-0.5 line-clamp-2">
                {item.description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
