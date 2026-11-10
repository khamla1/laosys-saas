"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Banner = {
  url: string;
  type: "image" | "video";
};

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    // Auto slide every 5 seconds for images
    // For videos, we could wait for 'ended' event, but a fixed interval is simpler for a mix
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const nextIndex = (activeIndex + 1) % banners.length;
        scrollTo(nextIndex);
      }
    }, 6000);
    
    return () => clearInterval(interval);
  }, [activeIndex, banners.length]);

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    const scrollWidth = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: scrollWidth * index,
      behavior: "smooth"
    });
    setActiveIndex(index);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const scrollWidth = scrollRef.current.clientWidth;
    const index = Math.round(scrollLeft / scrollWidth);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-full group">
      <div 
        ref={scrollRef}
        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {banners.map((banner, idx) => (
          <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
            {banner.type === "video" ? (
              <video 
                src={banner.url} 
                className="w-full h-full object-cover"
                autoPlay 
                muted 
                loop 
                playsInline
              />
            ) : (
              <img 
                src={banner.url} 
                alt={`Banner ${idx + 1}`} 
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Dark Overlay for Text Readability - moved from page.tsx to here so it overlays properly on all slides */}
            <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.preventDefault(); scrollTo(Math.max(0, activeIndex - 1)); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 p-0 m-0 border-0 outline-none rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 z-20 cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); scrollTo(Math.min(banners.length - 1, activeIndex + 1)); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 p-0 m-0 border-0 outline-none rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 z-20 cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          {/* Small Sleek Indicator Pills / Dots (iOS Style) - Foolproof span styling */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 z-20">
            {banners.map((_, idx) => (
              <button 
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(idx);
                }}
                aria-label={`Slide ${idx + 1}`}
                className="p-1 m-0 border-0 outline-none bg-transparent cursor-pointer flex items-center justify-center"
              >
                <span
                  className={`block rounded-full transition-all duration-500 ${
                    idx === activeIndex
                      ? "w-5 h-1.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
