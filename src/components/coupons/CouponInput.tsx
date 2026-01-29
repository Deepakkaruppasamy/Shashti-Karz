"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CouponInputProps {
    amount: number;
    onApply: (discount: number, code: string) => void;
}

export function CouponInput({ amount, onApply }: CouponInputProps) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleValidate = async () => {
        if (!code.trim()) {
            setError("Please enter a coupon code");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.toUpperCase(), amount }),
            });

            const data = await response.json();

            if (!response.ok || !data.valid) {
                setError(data.error || "Invalid coupon code");
                return;
            }

            setSuccess(`Coupon applied! You save ₹${data.discount_amount}`);
            onApply(data.discount_amount, code.toUpperCase());
        } catch (err) {
            setError("Failed to validate coupon");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                Have a coupon code?
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                />
                <button
                    onClick={handleValidate}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? "Validating..." : "Apply"}
                </button>
            </div>
            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                    <span>❌</span> {error}
                </p>
            )}
            {success && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                    <span>✅</span> {success}
                </p>
            )}
        </div>
    );
}
