"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SubscriptionPlans } from "@/components/subscriptions/SubscriptionPlans";
import {
    ShieldCheck,
    Zap,
    Crown,
    Clock,
    Car,
    Sparkles,
    Gem,
    CheckCircle2,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

export default function MembershipsPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Navbar />

            <main className="pt-32 pb-20">
                {/* Elite Header */}
                <section className="px-4 max-w-7xl mx-auto text-center mb-20">
                    <ScrollReveal variant="fadeUp">
                        <span className="px-4 py-1.5 bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-[10px] font-black rounded-full uppercase tracking-widest mb-6 inline-block">
                            Exclusive Access
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-6">
                            SHASHTI <span className="text-gradient">ELITE CLUB</span>
                        </h1>
                        <p className="text-[#888] text-lg max-w-2xl mx-auto font-medium">
                            Elevate your vehicle ownership experience. Join a community of enthusiasts who demand nothing but perfection for their machines.
                        </p>
                    </ScrollReveal>
                </section>

                {/* Membership Plans Integrated */}
                <ScrollReveal variant="scale">
                    <SubscriptionPlans />
                </ScrollReveal>

                {/* Priority Pass Section */}
                <section className="px-4 max-w-7xl mx-auto mt-32">
                    <div className="glass-card rounded-[3rem] p-8 md:p-16 border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#ff1744]/10 to-transparent blur-3xl pointer-events-none" />

                        <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                            <div>
                                <div className="w-16 h-16 bg-[#ff1744] rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-[#ff1744]/20">
                                    <Clock className="text-white" size={32} />
                                </div>
                                <h2 className="text-4xl font-bold italic tracking-tighter mb-6">THE PRIORITY PASS™</h2>
                                <p className="text-[#888] text-lg mb-8 leading-relaxed">
                                    Elite members receive our signature Priority Pass, guaranteeing service even during peak holiday seasons. Skip the 2-week waiting list and get your car detailed exactly when you need it.
                                </p>

                                <div className="space-y-4">
                                    {[
                                        "Guaranteed 24H turn-around time",
                                        "Dedicated Service Concierge",
                                        "Emergency spot cleaning (birds/sap)",
                                        "Complimentary seasonal checkups"
                                    ].map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <CheckCircle2 className="text-[#ff1744]" size={20} />
                                            <span className="font-bold uppercase tracking-widest text-[10px] text-white/80">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <motion.div
                                    animate={{
                                        y: [0, -10, 0],
                                        rotateY: [0, 5, 0]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="bg-gradient-to-br from-[#111] to-black p-1 rounded-[2.5rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
                                >
                                    <div className="bg-[#0a0a0a] rounded-[2.3rem] p-8 border border-white/5 relative overflow-hidden">
                                        {/* Card Content */}
                                        <div className="flex justify-between items-start mb-16">
                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                                                <Gem className="text-[#d4af37]" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-[#ff1744] uppercase tracking-widest">Priority Pass</p>
                                                <p className="text-sm font-bold text-white tracking-widest">#### 2026</p>
                                            </div>
                                        </div>

                                        <div className="mb-12">
                                            <p className="text-[8px] font-black text-[#444] uppercase tracking-[0.4em] mb-1">Elite Cardholder</p>
                                            <h3 className="text-2xl font-black italic tracking-tighter text-white">NEXUS PRIME MEMBER</h3>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] font-bold text-[#888]">Status: <span className="text-green-500">ACTIVE</span></p>
                                            </div>
                                            <Car className="text-[#222]" size={60} />
                                        </div>

                                        {/* Gloss Effect */}
                                        <motion.div
                                            animate={{
                                                left: ["-100%", "200%"]
                                            }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                                            className="absolute top-0 bottom-0 w-20 bg-white/10 skew-x-12 blur-xl"
                                        />
                                    </div>
                                </motion.div>

                                {/* Floating Elements */}
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-4 -right-4 w-12 h-12 bg-[#d4af37]/20 rounded-full blur-xl"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tier Comparison */}
                <section className="px-4 max-w-7xl mx-auto mt-32 text-center">
                    <h2 className="text-3xl font-black italic tracking-tighter mb-16">BENEFIT MATRIX</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="py-6 font-black uppercase text-[10px] tracking-[0.3em] text-[#444]">Benefit</th>
                                    <th className="py-6 font-black uppercase text-[10px] tracking-[0.3em] text-center">Basic</th>
                                    <th className="py-6 font-black uppercase text-[10px] tracking-[0.3em] text-center text-[#d4af37]">Premium</th>
                                    <th className="py-6 font-black uppercase text-[10px] tracking-[0.3em] text-center text-[#ff1744]">Ultimate</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {[
                                    ["Monthly Washes", "4 Washes", "8 Washes", "Unlimited"],
                                    ["Detailing Frequency", "No", "1 Session", "2 Sessions"],
                                    ["Ceramic Top-up", "Discounted", "Included", "Monthly"],
                                    ["Priority Booking", "Low", "Medium", "Critical"],
                                    ["Concierge Service", "No", "No", "Yes"],
                                    ["Interior Spa", "1x Yearly", "Quarterly", "Monthly"],
                                ].map((row, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="py-6 font-medium text-[#888]">{row[0]}</td>
                                        <td className="py-6 text-center">{row[1]}</td>
                                        <td className="py-6 text-center font-bold">{row[2]}</td>
                                        <td className="py-6 text-center font-black text-white">{row[3]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* CTA */}
                <section className="px-4 max-w-4xl mx-auto mt-32 text-center">
                    <div className="glass-card rounded-[3rem] p-12 border border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                        <Sparkles className="mx-auto text-[#d4af37] mb-8" size={32} />
                        <h2 className="text-4xl font-black italic tracking-tighter mb-6 underline decoration-[#ff1744]">START YOUR JOURNEY</h2>
                        <p className="text-[#888] mb-10 font-medium italic">"Once you experience Shashti Elite, you'll never settle for a standard car wash again."</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/login" className="btn-premium px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-[#ff1744]/20">
                                Join Today
                            </Link>
                            <Link href="/contact" className="bg-white/5 border border-white/10 hover:bg-white/10 px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                                Speak to Advisor
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
