"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Zap, Star, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscriptionPlan {
    id: string;
    name: string;
    tier: "basic" | "premium" | "ultimate";
    price: number;
    billing_cycle: string;
    features: string[];
    popular: boolean;
    discount_percentage: number;
}

export function SubscriptionPlans() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "annual">("monthly");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchPlans();
    }, [billingCycle]);

    const fetchPlans = async () => {
        try {
            const res = await fetch(`/api/subscriptions/plans?billing_cycle=${billingCycle}`);
            const data = await res.json();
            setPlans(data.plans || []);
        } catch (error) {
            console.error("Failed to fetch plans:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId: string) => {
        try {
            const res = await fetch("/api/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan_id: planId }),
            });

            if (res.ok) {
                router.push("/dashboard?tab=subscription");
            }
        } catch (error) {
            console.error("Failed to subscribe:", error);
        }
    };

    const getTierIcon = (tier: string) => {
        switch (tier) {
            case "basic":
                return <Star className="text-gray-400" size={24} />;
            case "premium":
                return <Zap className="text-[#d4af37]" size={24} />;
            case "ultimate":
                return <Crown className="text-[#ff1744]" size={24} />;
            default:
                return null;
        }
    };

    const getTierGradient = (tier: string) => {
        switch (tier) {
            case "basic":
                return "from-gray-600 to-gray-800";
            case "premium":
                return "from-[#d4af37] to-[#ff8c00]";
            case "ultimate":
                return "from-[#ff1744] to-[#d4af37]";
            default:
                return "from-gray-600 to-gray-800";
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Choose Your <span className="text-gradient">Subscription Plan</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Save time and money with our flexible subscription plans. Enjoy priority service and exclusive benefits.
                </p>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-12">
                <div className="bg-white/5 backdrop-blur-lg rounded-full p-1 inline-flex">
                    {["monthly", "quarterly", "annual"].map((cycle) => (
                        <button
                            key={cycle}
                            onClick={() => setBillingCycle(cycle as any)}
                            className={`px-6 py-2 rounded-full font-medium transition-all ${billingCycle === cycle
                                    ? "bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white"
                                    : "text-gray-400 hover:text-white"
                                }`}
                        >
                            {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                            {cycle === "annual" && (
                                <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                    Save 35%
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan, index) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative bg-white/5 backdrop-blur-lg rounded-2xl p-8 border ${plan.popular
                                ? "border-[#d4af37] shadow-2xl shadow-[#d4af37]/20 scale-105"
                                : "border-white/10"
                            }`}
                    >
                        {/* Popular Badge */}
                        {plan.popular && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <div className="bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                                    <TrendingUp size={16} />
                                    Most Popular
                                </div>
                            </div>
                        )}

                        {/* Tier Icon */}
                        <div className="flex justify-center mb-4">
                            <div className={`p-4 rounded-full bg-gradient-to-br ${getTierGradient(plan.tier)}`}>
                                {getTierIcon(plan.tier)}
                            </div>
                        </div>

                        {/* Plan Name */}
                        <h3 className="text-2xl font-bold text-white text-center mb-2">
                            {plan.name}
                        </h3>

                        {/* Price */}
                        <div className="text-center mb-6">
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-4xl font-bold text-white">₹{plan.price.toLocaleString()}</span>
                                <span className="text-gray-400">/{billingCycle}</span>
                            </div>
                            {plan.discount_percentage > 0 && (
                                <div className="text-green-400 text-sm mt-2">
                                    Save {plan.discount_percentage}% on all services
                                </div>
                            )}
                        </div>

                        {/* Features */}
                        <ul className="space-y-3 mb-8">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <Check className="text-green-400 flex-shrink-0 mt-1" size={20} />
                                    <span className="text-gray-300">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Subscribe Button */}
                        <button
                            onClick={() => handleSubscribe(plan.id)}
                            className={`w-full py-3 rounded-lg font-semibold transition-all ${plan.popular
                                    ? "bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white hover:shadow-lg hover:shadow-[#ff1744]/50"
                                    : "bg-white/10 text-white hover:bg-white/20"
                                }`}
                        >
                            Subscribe Now
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Benefits Section */}
            <div className="mt-16 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                    All Plans Include
                </h3>
                <div className="grid md:grid-cols-4 gap-6">
                    {[
                        { icon: "🎯", title: "Priority Booking", desc: "Skip the queue" },
                        { icon: "🚗", title: "Free Pickup", desc: "We come to you" },
                        { icon: "💳", title: "Flexible Billing", desc: "Cancel anytime" },
                        { icon: "⭐", title: "VIP Support", desc: "24/7 assistance" },
                    ].map((benefit, i) => (
                        <div key={i} className="text-center">
                            <div className="text-4xl mb-2">{benefit.icon}</div>
                            <h4 className="text-white font-semibold mb-1">{benefit.title}</h4>
                            <p className="text-gray-400 text-sm">{benefit.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
