
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Sparkles, MessageSquare, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ReviewModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({ booking, isOpen, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (rating <= 3 && comment.length < 10) {
      toast.error("Please provide a more detailed comment for a lower rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: booking.user_id,
          booking_id: booking.id,
          service_id: booking.service_id,
          name: booking.customer_name,
          car: booking.car_model,
          rating,
          comment,
          service: booking.service?.name || "Service",
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${booking.customer_name}`,
          recommend,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast.success("Review submitted! Thank you for your feedback.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg glass-card rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#ff1744]/10 to-[#d4af37]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center">
                  <Star className="text-white fill-white" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Rate Your Service</h3>
                  <p className="text-xs text-[#888]">{booking.service?.name || "Premium Detailing"}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Star Rating */}
              <div className="text-center">
                <p className="text-sm text-[#888] mb-4">How was your experience?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-90"
                    >
                      <Star
                        size={40}
                        className={`${
                          star <= (hoveredRating || rating)
                            ? "text-[#d4af37] fill-[#d4af37]"
                            : "text-[#333]"
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm font-medium text-gradient">
                  {rating === 5 ? "Excellent!" : rating === 4 ? "Good" : rating === 3 ? "Okay" : rating === 2 ? "Poor" : rating === 1 ? "Very Poor" : "Select a rating"}
                </p>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#ff1744]" />
                  Your Feedback {rating <= 3 && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors resize-none text-sm"
                  placeholder="Tell us what you liked or what we can improve..."
                />
              </div>

              {/* Recommendation */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div>
                  <h4 className="text-sm font-medium">Would you recommend us?</h4>
                  <p className="text-xs text-[#666]">Help others choose the best care</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRecommend(true)}
                    className={`p-2 rounded-lg transition-all ${
                      recommend === true ? "bg-green-500 text-white" : "bg-white/5 text-[#888]"
                    }`}
                  >
                    <ThumbsUp size={20} />
                  </button>
                  <button
                    onClick={() => setRecommend(false)}
                    className={`p-2 rounded-lg transition-all ${
                      recommend === false ? "bg-red-500 text-white" : "bg-white/5 text-[#888]"
                    }`}
                  >
                    <ThumbsDown size={20} />
                  </button>
                </div>
              </div>

              <button
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-full btn-premium py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Sparkles size={20} />
                    Submit AI-Validated Review
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
