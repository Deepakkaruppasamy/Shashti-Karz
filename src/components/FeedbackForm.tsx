"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, Shield, MessageSquare, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface FeedbackFormProps {
  bookingId: string;
  customerName: string;
  carModel: string;
  serviceName: string;
  userId?: string | null;
  onSuccess?: () => void;
}

export function FeedbackForm({ 
  bookingId, 
  customerName, 
  carModel, 
  serviceName,
  userId,
  onSuccess 
}: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState<"service" | "app" | "staff" | "other">("service");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          user_id: userId,
          name: customerName,
          car: carModel,
          service: serviceName,
          rating,
          comment,
          feedback_category: category,
          is_private: isPrivate,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${customerName}`,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit feedback");

      setIsSubmitted(true);
      toast.success("Thank you for your feedback!");
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="text-green-500" size={32} />
        </div>
        <h3 className="text-2xl font-bold mb-2">Feedback Received!</h3>
        <p className="text-[#888]">
          Your feedback helps us improve Shashti Karz. We appreciate your time!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ff1744]/10 to-transparent rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#ff1744]/20 flex items-center justify-center">
            <MessageSquare className="text-[#ff1744]" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">How was your experience?</h3>
            <p className="text-sm text-[#888]">Share your thoughts on {serviceName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#888] mb-3">Rate your service</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform active:scale-90"
                >
                  <Star
                    size={32}
                    className={`${
                      (hoveredRating || rating) >= star
                        ? "text-[#d4af37] fill-[#d4af37]"
                        : "text-[#333] fill-transparent"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#888] mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#ff1744] focus:outline-none transition-colors appearance-none"
              >
                <option value="service" className="bg-[#111]">Service Quality</option>
                <option value="staff" className="bg-[#111]">Staff Behavior</option>
                <option value="app" className="bg-[#111]">App/Booking Experience</option>
                <option value="other" className="bg-[#111]">Other</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6 sm:pt-0">
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  isPrivate 
                    ? "bg-[#ff1744]/10 border-[#ff1744] text-[#ff1744]" 
                    : "bg-white/5 border-white/10 text-[#888]"
                }`}
              >
                <Shield size={18} />
                <span className="text-sm">{isPrivate ? "Private Feedback" : "Public Review"}</span>
              </button>
              <div className="group relative">
                <Info size={16} className="text-[#555] cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-xs text-[#888] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Private feedback is only visible to admins. Public reviews appear on our website.
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#888] mb-2">Tell us more (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like? What can we improve?"
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#ff1744] focus:outline-none transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full btn-premium py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={20} />
                Submit Feedback
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
