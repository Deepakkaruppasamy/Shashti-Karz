
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Shield, Sparkles, TrendingUp, Info } from "lucide-react";

interface AIRatingDisplayProps {
  serviceId: string;
  className?: string;
  showDetails?: boolean;
}

export function AIRatingDisplay({ serviceId, className = "", showDetails = false }: AIRatingDisplayProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRating() {
      try {
        const res = await fetch(`/api/ai/ratings?serviceId=${serviceId}`);
        if (res.ok) {
          const ratingData = await res.json();
          setData(ratingData);
        }
      } catch (error) {
        console.error("Failed to fetch AI rating:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRating();
  }, [serviceId]);

  if (isLoading) {
    return (
      <div className={`animate-pulse flex items-center gap-2 ${className}`}>
        <div className="w-12 h-6 bg-white/10 rounded" />
        <div className="w-20 h-4 bg-white/5 rounded" />
      </div>
    );
  }

  if (!data || data.total_reviews === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ff1744]/20 to-[#d4af37]/20 border border-[#ff1744]/20">
          <Star className="text-[#d4af37] fill-[#d4af37]" size={18} />
          <span className="text-xl font-bold text-white">{data.finalRating}</span>
          <span className="text-[#888] text-sm">/ 5</span>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[10px] text-[#888] uppercase tracking-wider font-semibold">
            <Shield size={10} className="text-green-500" />
            AI Validated
          </div>
          <div className="text-xs text-[#666]">
            Based on {data.totalReviews} verified customers
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="flex flex-wrap gap-2 mt-2">
          {data.indicators?.map((indicator: string, i: number) => (
            <span 
              key={i} 
              className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-[#aaa] flex items-center gap-1"
            >
              <TrendingUp size={10} className="text-[#ff1744]" />
              {indicator}
            </span>
          ))}
          <span className={`px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] flex items-center gap-1 ${
            data.confidence === 'High' ? 'text-green-400' : data.confidence === 'Medium' ? 'text-yellow-400' : 'text-gray-400'
          }`}>
            Confidence: {data.confidence}
          </span>
        </div>
      )}
    </div>
  );
}
