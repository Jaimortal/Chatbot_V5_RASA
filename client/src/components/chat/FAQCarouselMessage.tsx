import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FaqConfig } from "@/types/admin";

interface FAQCarouselMessageProps {
  faqs: FaqConfig[];
  onSelect: (payload: string) => void;
}

export function FAQCarouselMessage({ faqs, onSelect }: FAQCarouselMessageProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollAction = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="relative group w-full max-w-[85vw] sm:max-w-md my-2">
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
        <span className="text-xs font-medium text-muted-foreground">Quick Access</span>
      </div>
      
      {/* Scroll controls - visible on hover for desktop */}
      <button 
        onClick={() => scrollAction('left')}
        className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-10 hidden group-hover:flex md:flex h-8 w-8 items-center justify-center rounded-full bg-background border shadow-sm text-foreground hover:bg-muted"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button 
        onClick={() => scrollAction('right')}
        className="absolute right-[-12px] top-1/2 -translate-y-1/2 z-10 hidden group-hover:flex md:flex h-8 w-8 items-center justify-center rounded-full bg-background border shadow-sm text-foreground hover:bg-muted"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {faqs.map((faq, idx) => (
          <button
            key={faq.id || idx}
            onClick={() => onSelect(faq.payload)}
            className="flex-shrink-0 snap-center w-[160px] flex flex-col bg-card hover:bg-accent hover:text-accent-foreground border text-card-foreground rounded-2xl p-3 shadow-sm transition-all duration-200 text-left items-start group/card"
          >
            <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-full bg-primary/10 mb-3 group-hover/card:bg-primary/20 transition-colors">
              <span className="text-xl">{faq.icon || "✨"}</span>
            </div>
            <p className="font-semibold text-sm leading-tight group-hover/card:text-primary transition-colors">
              {faq.displayLabel}
            </p>
            {faq.subtitle && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {faq.subtitle}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
