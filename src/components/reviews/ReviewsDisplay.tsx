"use client";

import { useEffect, useState } from "react";
import { Star, ThumbsUp, MessageSquare, CheckCircle2, Image as ImageIcon } from "lucide-react";

interface Review {
    id: string;
    rating: number;
    comment: string;
    recommend: boolean;
    photos: string[];
    customer_name: string;
    customer_avatar: string;
    car_model: string;
    admin_response: string | null;
    admin_response_at: string | null;
    is_featured: boolean;
    is_verified: boolean;
    helpful_count: number;
    created_at: string;
}

interface ReviewsDisplayProps {
    serviceId?: string;
    limit?: number;
}

export function ReviewsDisplay({ serviceId, limit = 10 }: ReviewsDisplayProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [ratings, setRatings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, [serviceId]);

    const fetchReviews = async () => {
        try {
            const params = new URLSearchParams();
            if (serviceId) params.append("service_id", serviceId);
            params.append("limit", limit.toString());

            const response = await fetch(`/api/reviews?${params}`);
            const data = await response.json();

            setReviews(data.reviews || []);
            setRatings(data.ratings);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={16}
                        className={
                            star <= rating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                        }
                    />
                ))}
            </div>
        );
    };

    const getRatingPercentage = (rating: number) => {
        if (!ratings || ratings.total_reviews === 0) return 0;
        const count = ratings[`rating_${rating}_count`] || 0;
        return Math.round((count / ratings.total_reviews) * 100);
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading reviews...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Rating Summary */}
            {ratings && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Overall Rating */}
                        <div className="text-center md:text-left">
                            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                <div className="text-5xl font-bold text-gray-900">
                                    {ratings.average_rating?.toFixed(1) || "0.0"}
                                </div>
                                <div>
                                    {renderStars(Math.round(ratings.average_rating || 0))}
                                    <p className="text-sm text-gray-600 mt-1">
                                        {ratings.total_reviews} {ratings.total_reviews === 1 ? "review" : "reviews"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rating Breakdown */}
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((star) => (
                                <div key={star} className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 w-8">{star}★</span>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-500 transition-all"
                                            style={{ width: `${getRatingPercentage(star)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-600 w-12 text-right">
                                        {getRatingPercentage(star)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className={`bg-white rounded-xl border ${review.is_featured ? "border-yellow-400 bg-yellow-50/50" : "border-gray-200"
                            } p-6`}
                    >
                        {/* Review Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={review.customer_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${review.customer_name}`}
                                    alt={review.customer_name}
                                    className="w-12 h-12 rounded-full"
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-gray-900">{review.customer_name}</h4>
                                        {review.is_verified && (
                                            <CheckCircle2 size={16} className="text-green-600" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{review.car_model}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                {renderStars(review.rating)}
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(review.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Review Comment */}
                        <p className="text-gray-700 mb-4">{review.comment}</p>

                        {/* Review Photos */}
                        {review.photos && review.photos.length > 0 && (
                            <div className="flex gap-2 mb-4 overflow-x-auto">
                                {review.photos.map((photo, index) => (
                                    <img
                                        key={index}
                                        src={photo}
                                        alt={`Review photo ${index + 1}`}
                                        className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Recommendation Badge */}
                        {review.recommend !== null && (
                            <div className="mb-4">
                                <span
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${review.recommend
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                >
                                    {review.recommend ? "👍 Recommends" : "Not Recommended"}
                                </span>
                            </div>
                        )}

                        {/* Admin Response */}
                        {review.admin_response && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare size={16} className="text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-900">
                                        Response from Shashti Karz
                                    </span>
                                </div>
                                <p className="text-sm text-blue-800">{review.admin_response}</p>
                                <p className="text-xs text-blue-600 mt-2">
                                    {new Date(review.admin_response_at!).toLocaleDateString()}
                                </p>
                            </div>
                        )}

                        {/* Review Footer */}
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                            <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                                <ThumbsUp size={16} />
                                <span>Helpful ({review.helpful_count})</span>
                            </button>
                            {review.is_featured && (
                                <span className="text-xs text-yellow-700 font-medium bg-yellow-100 px-2 py-1 rounded">
                                    ⭐ Featured Review
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {reviews.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No reviews yet. Be the first to review!</p>
                </div>
            )}
        </div>
    );
}
