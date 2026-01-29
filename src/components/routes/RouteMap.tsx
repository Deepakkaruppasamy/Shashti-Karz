"use client";

import { useEffect, useState } from "react";

interface RouteStop {
    id: string;
    booking_id: string;
    stop_order: number;
    address: string;
    estimated_arrival: string;
    status: string;
    distance_from_previous_km: number;
}

interface WorkerRoute {
    id: string;
    total_distance_km: number;
    estimated_duration_minutes: number;
    status: string;
    stops: RouteStop[];
}

interface RouteMapProps {
    workerId: string;
    date: string;
}

export function RouteMap({ workerId, date }: RouteMapProps) {
    const [route, setRoute] = useState<WorkerRoute | null>(null);
    const [loading, setLoading] = useState(true);
    const [optimizing, setOptimizing] = useState(false);

    useEffect(() => {
        fetchRoute();
    }, [workerId, date]);

    const fetchRoute = async () => {
        try {
            const response = await fetch(
                `/api/routes/optimize?worker_id=${workerId}&date=${date}`
            );
            const data = await response.json();
            setRoute(data.route);
        } catch (error) {
            console.error("Error fetching route:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptimize = async () => {
        setOptimizing(true);
        try {
            const response = await fetch("/api/routes/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ worker_id: workerId, date }),
            });
            const data = await response.json();
            setRoute(data.route);
        } catch (error) {
            console.error("Error optimizing route:", error);
        } finally {
            setOptimizing(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-gray-100 text-gray-800",
            en_route: "bg-blue-100 text-blue-800",
            arrived: "bg-green-100 text-green-800",
            completed: "bg-green-600 text-white",
            skipped: "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    if (loading) {
        return <div className="text-center py-8">Loading route...</div>;
    }

    return (
        <div className="space-y-4">
            {/* Route Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Today's Route</h3>
                    <button
                        onClick={handleOptimize}
                        disabled={optimizing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {optimizing ? "Optimizing..." : "🗺️ Optimize Route"}
                    </button>
                </div>

                {route && (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {route.stops?.length || 0}
                            </div>
                            <div className="text-sm text-gray-600">Stops</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {route.total_distance_km?.toFixed(1) || 0} km
                            </div>
                            <div className="text-sm text-gray-600">Distance</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                                {Math.round((route.estimated_duration_minutes || 0) / 60)} hrs
                            </div>
                            <div className="text-sm text-gray-600">Duration</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Route Stops */}
            <div className="space-y-3">
                {route?.stops?.map((stop, index) => (
                    <div
                        key={stop.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                    {stop.stop_order}
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{stop.address}</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            ETA: {new Date(stop.estimated_arrival).toLocaleTimeString()}
                                        </p>
                                        {stop.distance_from_previous_km > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                📍 {stop.distance_from_previous_km.toFixed(1)} km from previous
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                            stop.status
                                        )}`}
                                    >
                                        {stop.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {(!route || !route.stops || route.stops.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p>No bookings scheduled for this date</p>
                </div>
            )}
        </div>
    );
}
