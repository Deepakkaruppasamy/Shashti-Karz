"use client";

import { motion } from "framer-motion";
import { Star, Quote, MessageSquare } from "lucide-react";
import type { Review } from "@/lib/types";

interface ReviewsSectionProps {
    reviews: Review[];
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
    // Sort by rating and featured
    const topReviews = [...reviews]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);

    if (topReviews.length === 0) return null;

    return (
        <section className="py-20 bg-[#0a0a0a] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                    >
                        <span className="px-4 py-1.5 rounded-full bg-[#ff1744]/10 text-[#ff1744] text-xs font-bold uppercase tracking-widest mb-4 border border-[#ff1744]/20">
                            Testimonials
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-bold font-display mb-4 text-white">
                            Hear from Our <span className="text-gradient">Satisfied</span> Clients
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-[#ff1744] to-[#d4af37] rounded-full" />
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topReviews.map((review, index) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card p-6 rounded-2xl border border-white/5 relative group hover:border-[#ff1744]/30 transition-all duration-500"
                        >
                            <Quote className="absolute top-4 right-4 text-white/5 group-hover:text-[#ff1744]/10 transition-colors" size={40} />

                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={14}
                                        className={i < review.rating ? "text-[#d4af37] fill-[#d4af37]" : "text-white/10"}
                                    />
                                ))}
                            </div>

                            <p className="text-[#ccc] text-sm leading-relaxed mb-6 italic">
                                &quot;{review.comment}&quot;
                            </p>

                            <div className="flex items-center gap-3 mt-auto">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff1744] to-[#d4af37] flex items-center justify-center text-white font-bold text-sm">
                                    {review.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold text-sm">{review.name}</h4>
                                    <p className="text-[#666] text-[10px] uppercase tracking-wider">{review.car}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button className="inline-flex items-center gap-2 text-[#ff1744] hover:text-[#ff1744]/80 text-sm font-bold transition-colors">
                        <MessageSquare size={16} />
                        View All Reviews
                    </button>
                </div>
            </div>
        </section>
    );
}
