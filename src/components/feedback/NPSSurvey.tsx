"use client";

import { useState } from "react";

interface NPSSurveyProps {
    bookingId: string;
    onSubmit?: () => void;
}

export function NPSSurvey({ bookingId, onSubmit }: NPSSurveyProps) {
    const [score, setScore] = useState<number | null>(null);
    const [feedback, setFeedback] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (score === null) return;

        setLoading(true);
        try {
            const response = await fetch("/api/feedback/nps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    booking_id: bookingId,
                    score,
                    feedback_text: feedback,
                }),
            });

            if (response.ok) {
                setSubmitted(true);
                onSubmit?.();
            }
        } catch (error) {
            console.error("Error submitting NPS:", error);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Thank you for your feedback!
                </h3>
                <p className="text-gray-600">Your input helps us improve our service.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-2">How likely are you to recommend us?</h3>
            <p className="text-sm text-gray-600 mb-6">
                Rate from 0 (Not likely) to 10 (Extremely likely)
            </p>

            {/* Score Buttons */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                        key={num}
                        onClick={() => setScore(num)}
                        className={`w-12 h-12 rounded-lg font-semibold transition-all ${score === num
                                ? num <= 6
                                    ? "bg-red-600 text-white"
                                    : num <= 8
                                        ? "bg-yellow-500 text-white"
                                        : "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {num}
                    </button>
                ))}
            </div>

            {/* Feedback Text */}
            {score !== null && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tell us more (optional)
                    </label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="What can we do to improve?"
                    />
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={score === null || loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
                {loading ? "Submitting..." : "Submit Feedback"}
            </button>
        </div>
    );
}
