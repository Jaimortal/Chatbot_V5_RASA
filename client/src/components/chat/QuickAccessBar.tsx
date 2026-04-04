import { useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { FaqConfig } from "@/types/admin";
import { Button } from "@/components/ui/button";

interface QuickAccessBarProps {
  faqs: FaqConfig[];
  onSelect: (payload: string, label: string) => void;
  onClose: () => void;
}

export function QuickAccessBar({ faqs, onSelect, onClose }: QuickAccessBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollAction = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 150;
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="relative group w-full bg-white border-t border-gray-100 flex items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] py-2 px-2 z-10 transition-all">
      <div className="absolute right-2 top-0 -translate-y-1/2 flex items-center justify-center p-0.5 rounded-full bg-white shadow border border-gray-200">
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-700 rounded-full bg-transparent hover:bg-gray-100 p-1 transition-colors"
          title="Hide quick access"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <button 
        onClick={() => scrollAction('left')}
        className="hidden md:flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 mr-1"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide snap-x items-center w-full min-w-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {faqs.map((faq, idx) => (
          <button
            key={faq.id || idx}
            onClick={() => onSelect(faq.payload, faq.displayLabel)}
            className="flex-shrink-0 snap-center flex items-center gap-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-gray-700 rounded-full px-3 py-1.5 shadow-sm transition-all duration-200 whitespace-nowrap h-9"
          >
            <span className="text-[13px]">{faq.icon || "✨"}</span>
            <span className="font-medium text-[13px] truncate max-w-[140px]">{faq.displayLabel}</span>
          </button>
        ))}
      </div>

      <button 
        onClick={() => scrollAction('right')}
        className="hidden md:flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 ml-1"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
