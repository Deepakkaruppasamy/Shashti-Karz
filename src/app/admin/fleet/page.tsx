"use client";

import { useState, useEffect } from "react";
import {
    Map,
    Navigation,
    Truck,
    MapPin,
    Clock,
    CheckCircle,
    AlertTriangle,
    RotateCcw,
    Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { BrandedLoader } from "@/components/animations/BrandedLoader";

interface WorkerRoute {
    id: string;
    worker: { name: string; avatar_url?: string };
    status: string;
    stops: RouteStop[];
    total_distance: number;
    eta: string;
}

interface RouteStop {
    id: string;
    address: string;
    status: string;
    eta: string;
}

export default function FleetPage() {
    const [loading, setLoading] = useState(true);
    const [routes, setRoutes] = useState<WorkerRoute[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<WorkerRoute | null>(null);
    const [mapCenter, setMapCenter] = useState({ lat: 12.9716, lng: 77.5946 }); // Bangalore Default

    const supabase = createClient();

    useEffect(() => {
        fetchData();

        // Simulate real-time updates
        const interval = setInterval(() => {
            setRoutes(prev => prev.map(r => ({ ...r, eta: updateEta(r.eta) })));
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const updateEta = (eta: string) => {
        // Logic to update ETA time
        return eta;
    };

    const fetchData = async () => {
        try {
            // Fetch Active Routes
            // This is a complex query, simplified for demo
            const { data: routesData } = await supabase
                .from('worker_routes')
                .select(`
          *,
          worker:worker_id(name),
          stops:route_stops(*)
        `)
                .eq('route_date', new Date().toISOString().split('T')[0]);

            if (routesData && routesData.length > 0) {
                setRoutes(routesData.map(r => ({
                    id: r.id,
                    worker: r.worker,
                    status: r.status,
                    stops: r.stops,
                    total_distance: r.total_distance_km,
                    eta: r.estimated_duration_minutes + " mins"
                })));
            } else {
                // Mock data if no real routes today
                const mockRoutes = [
                    {
                        id: '1',
                        worker: { name: 'Dinesh Kumar' },
                        status: 'in_progress',
                        total_distance: 24.5,
                        eta: '45 mins',
                        stops: [
                            { id: 's1', address: 'Indiranagar, Bangalore', status: 'completed', eta: '10:00 AM' },
                            { id: 's2', address: 'Koramangala, Bangalore', status: 'en_route', eta: '11:30 AM' },
                            { id: 's3', address: 'Whitefield, Bangalore', status: 'pending', eta: '02:00 PM' },
                        ]
                    },
                    {
                        id: '2',
                        worker: { name: 'Rahul Singh' },
                        status: 'planned',
                        total_distance: 18.2,
                        eta: '120 mins',
                        stops: [
                            { id: 's4', address: 'Jayanagar, Bangalore', status: 'pending', eta: '09:00 AM' },
                            { id: 's5', address: 'JP Nagar, Bangalore', status: 'pending', eta: '11:00 AM' },
                        ]
                    }
                ];
                // @ts-ignore
                setRoutes(mockRoutes);
            }
        } catch (error) {
            console.error('Error loading fleet data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptimize = async () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Optimizing routes with AI...',
                success: 'Routes optimized for max efficiency!',
                error: 'Optimization failed'
            }
        );
    };

    if (loading) return <BrandedLoader fullPage />;

    return (
        <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
            {/* Sidebar List */}
            <div className="w-96 border-r border-white/5 bg-[#111] flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <h1 className="text-2xl font-bold font-display text-white mb-2 flex items-center gap-2">
                        <Truck className="text-blue-500" /> Fleet Command
                    </h1>
                    <div className="flex justify-between items-center text-xs text-[#888]">
                        <span>{routes.length} Active Vehicles</span>
                        <button onClick={handleOptimize} className="flex items-center gap-1 text-blue-500 hover:text-white transition-colors font-bold uppercase tracking-wider">
                            <Zap size={12} fill="currentColor" /> Optimize
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {routes.map((route) => (
                        <div
                            key={route.id}
                            onClick={() => setSelectedRoute(route)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedRoute?.id === route.id
                                    ? 'bg-blue-500/10 border-blue-500/30'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">
                                        {route.worker.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">{route.worker.name}</h3>
                                        <p className={`text-[10px] uppercase font-bold tracking-wider ${route.status === 'in_progress' ? 'text-green-500' : 'text-blue-500'
                                            }`}>
                                            {route.status.replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-mono text-[#d4af37]">{route.eta}</p>
                                </div>
                            </div>

                            <div className="space-y-2 pl-4 border-l-2 border-white/10 ml-4">
                                {route.stops.slice(0, 2).map((stop, i) => (
                                    <div key={stop.id} className="text-xs flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${stop.status === 'completed' ? 'bg-green-500' :
                                                stop.status === 'en_route' ? 'bg-yellow-500 animate-pulse' :
                                                    'bg-[#666]'
                                            }`} />
                                        <span className={stop.status === 'completed' ? 'text-[#666] line-through' : 'text-[#ccc]'}>
                                            {stop.address.split(',')[0]}
                                        </span>
                                    </div>
                                ))}
                                {route.stops.length > 2 && (
                                    <div className="text-[10px] text-[#666] pl-4">+{route.stops.length - 2} more stops</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-[#050505]">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <Map size={120} className="text-[#333]" />
                    <p className="absolute mt-40 font-bold uppercase tracking-widest text-[#444]">Map Visualization Layer</p>
                </div>

                {/* This would be the actual map component (Google Maps / Mapbox) */}
                <div className="absolute inset-0 bg-[url('/map-pattern.png')] opacity-10 mix-blend-overlay" />

                {selectedRoute && (
                    <div className="absolute bottom-8 left-8 right-8 glass-card bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Route Details: {selectedRoute.worker.name}</h2>
                            <div className="flex gap-4 text-sm text-[#888]">
                                <span className="flex items-center gap-2"><Navigation size={16} /> {selectedRoute.total_distance} km</span>
                                <span className="flex items-center gap-2"><Clock size={16} /> Est. {selectedRoute.eta}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {selectedRoute.stops.map((stop, idx) => (
                                <div key={stop.id} className="flex-shrink-0 flex items-center">
                                    <div className={`p-4 rounded-xl border min-w-[200px] ${stop.status === 'en_route' ? 'bg-blue-500/20 border-blue-500/50' :
                                            stop.status === 'completed' ? 'bg-green-500/10 border-green-500/20 opacity-60' :
                                                'bg-white/5 border-white/10'
                                        }`}>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#888]">Stop {idx + 1}</span>
                                            <span className="text-xs text-white">{stop.eta}</span>
                                        </div>
                                        <p className="font-bold text-sm truncate">{stop.address}</p>
                                        <p className="text-[10px] uppercase mt-2 font-bold tracking-wider text-blue-400">{stop.status.replace('_', ' ')}</p>
                                    </div>
                                    {idx < selectedRoute.stops.length - 1 && (
                                        <div className="w-8 h-0.5 bg-white/10 mx-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
