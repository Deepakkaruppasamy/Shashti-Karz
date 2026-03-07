import React from "react";
import { motion } from "framer-motion";
import { Shield, Award, CheckCircle2, TrendingUp, Sparkles, FileText, Download, Brain } from "lucide-react";
import { VehicleHealthScore, UserVehicle } from "@/lib/types";

interface ResaleValueReportProps {
    vehicle: UserVehicle;
    healthData: any; // The extended AI data from our new API
    onDownload?: () => void;
}

export const ResaleValueReport: React.FC<ResaleValueReportProps> = ({ vehicle, healthData, onDownload }) => {
    if (!healthData) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-[#0d0d0d] border-2 border-[#d4af37]/30 shadow-[0_0_50px_rgba(212,175,55,0.1)]"
        >
            {/* Premium Watermark/Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#ff1744]/5 to-transparent rounded-full blur-3xl -ml-20 -mb-20" />

            {/* Header Section */}
            <div className="relative p-8 border-b border-white/5 bg-white/[0.02]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#111] flex items-center justify-center shadow-lg shadow-black/50">
                            <Shield className="text-white w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                                {healthData.journal_header || "Automotive Excellence Passport"}
                            </h2>
                            <p className="text-[#d4af37] text-xs font-bold tracking-[0.2em] uppercase">
                                Official Maintenance Certification
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-[#666] font-black uppercase tracking-widest mb-1">Authenticity Code</div>
                        <div className="text-sm font-mono text-white/40">SK-{vehicle.id.slice(0, 8).toUpperCase()}-2024</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-8 grid md:grid-cols-12 gap-8">
                {/* Left Column: Health Score Circular */}
                <div className="md:col-span-4 flex flex-col items-center justify-center py-6 border-r border-white/5 px-4 text-center">
                    <div className="relative w-40 h-40 mb-6">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth="8"
                            />
                            <motion.circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="url(#goldGradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: "0, 283" }}
                                animate={{ strokeDasharray: `${(healthData.health_score / 100) * 283}, 283` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                            <defs>
                                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#d4af37" />
                                    <stop offset="100%" stopColor="#ff1744" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white">{healthData.health_score}</span>
                            <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-tighter">Health Grade</span>
                        </div>
                    </div>

                    <div className="space-y-4 w-full">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-[10px] text-[#666] uppercase font-bold mb-1">Resale Impact</div>
                            <div className="text-green-500 font-black text-lg flex items-center justify-center gap-1">
                                <TrendingUp size={18} />
                                {healthData.resale_value_impact || "+12.5% Value"}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-[10px] text-[#666] uppercase font-bold mb-1">Maintenance Status</div>
                            <div className="text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                <CheckCircle2 size={14} className="text-[#d4af37]" />
                                Mint Condition
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Insights */}
                <div className="md:col-span-8 space-y-6">
                    <section>
                        <h3 className="text-sm font-black text-[#666] uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Brain size={16} className="text-[#ff1744]" />
                            AI Master Detailer Summary
                        </h3>
                        <div className="prose prose-invert prose-sm max-w-none text-[#aaa] leading-relaxed italic">
                            {healthData.health_summary}
                        </div>
                    </section>

                    <section className="bg-gradient-to-br from-[#d4af37]/10 to-transparent p-5 rounded-2xl border border-[#d4af37]/20 relative overflow-hidden">
                        <Sparkles className="absolute top-2 right-2 text-[#d4af37]/20" size={40} />
                        <h3 className="text-sm font-black text-[#d4af37] uppercase tracking-widest mb-3">
                            Premium Protection Verification
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed">
                            {healthData.premium_product_proof || "This vehicle has been exclusively maintained using Gtechniq Ceramic Coatings and Koch Chemie polishing compounds, ensuring factory-grade paint preservation."}
                        </p>
                    </section>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-[#444] uppercase">Surface Integrity</span>
                            <p className="text-sm font-bold text-white">{healthData.paint_status || "Exemplary Gloss"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-[#444] uppercase">Interior Hygiene</span>
                            <p className="text-sm font-bold text-white">{healthData.interior_status || "Pristine Leather"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-[#444] uppercase">Protection Level</span>
                            <p className="text-sm font-bold text-white">{healthData.protection_status || "Ceramic Active"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-[#444] uppercase">Resale Outlook</span>
                            <p className="text-sm font-bold text-white">{getResaleLabel(healthData.health_score)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Certification Seal */}
            <div className="p-8 pt-0 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-white/5 text-[#888]">
                        <Award size={32} />
                    </div>
                    <div>
                        <p className="text-[8px] text-[#444] uppercase font-black">Certified By</p>
                        <p className="text-xs font-black text-white italic">Master Detailer, Shashti Karz</p>
                    </div>
                </div>

                <button
                    onClick={onDownload}
                    className="bg-white text-black px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#d4af37] transition-all flex items-center gap-2 shadow-xl"
                >
                    <Download size={16} />
                    Export Resale Certificate
                </button>
            </div>
        </motion.div>
    );
};

function getResaleLabel(score: number): string {
    if (score >= 90) return "Collector Grade";
    if (score >= 80) return "Excellent Investment";
    if (score >= 70) return "Well Preserved";
    return "Stable Market Value";
}
