"use client";

import { useState, useEffect } from "react";
import { Wrench, AlertCircle, Calendar, TrendingDown, CheckCircle2, Plus } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

interface Equipment {
    id: string;
    name: string;
    equipment_type: string;
    purchase_date: string;
    purchase_cost: number;
    current_condition: string;
    last_maintenance_date: string;
    next_maintenance_due: string;
    total_maintenance_cost: number;
    is_active: boolean;
    location: string;
}

interface MaintenanceAlert {
    id: string;
    equipment_id: string;
    equipment_name: string;
    alert_type: string;
    priority: string;
    message: string;
    due_date: string;
}

export default function EquipmentAdminPage() {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user) {
            fetchEquipment();
        }
    }, [user]);

    const fetchEquipment = async () => {
        try {
            const response = await fetch("/api/equipment");

            if (response.status === 401) {
                toast.error("Please login to access this page");
                router.push("/login");
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch equipment");
            }

            const data = await response.json();
            setEquipment(data.equipment || []);
            setAlerts(data.alerts || []);
        } catch (error) {
            console.error("Error fetching equipment:", error);
            toast.error("Failed to load equipment data");
        } finally {
            setLoading(false);
        }
    };

    const getConditionColor = (condition: string) => {
        const colors: Record<string, string> = {
            excellent: "bg-green-500/20 text-green-400 border border-green-500/30",
            good: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
            fair: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
            poor: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
            critical: "bg-red-500/20 text-red-400 border border-red-500/30",
        };
        return colors[condition] || "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: "text-green-400",
            medium: "text-yellow-400",
            high: "text-orange-400",
            critical: "text-red-400",
        };
        return colors[priority] || "text-gray-400";
    };

    const isDueForMaintenance = (dueDate: string) => {
        const daysUntilDue = Math.floor(
            (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilDue <= 7;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#0a0a0a]">
                <AdminSidebar />
                <div className="flex-1 p-8">
                    <div className="text-center text-white">Loading equipment...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0a]">
            <AdminSidebar />
            <div className="flex-1 p-8 space-y-6 overflow-auto">{/* Header */}
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Equipment Maintenance</h1>
                        <p className="text-[#888] mt-1">Track and maintain your equipment</p>
                    </div>
                    <button className="px-6 py-3 bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                        <Plus size={20} />
                        Add Equipment
                    </button>
                </div>

                {/* Maintenance Alerts */}
                {alerts.length > 0 && (
                    <div className="glass-card border-2 border-red-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="text-red-500" size={24} />
                            <h2 className="text-lg font-bold text-white">Maintenance Alerts ({alerts.length})</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {alerts.slice(0, 4).map((alert) => (
                                <div key={alert.id} className="bg-white/5 rounded-lg border border-red-500/20 p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="font-semibold text-white">{alert.equipment_name}</p>
                                        <span className={`text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                                            {alert.priority.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#aaa] mb-2">{alert.message}</p>
                                    <p className="text-xs text-[#666]">
                                        Due: {new Date(alert.due_date).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Wrench className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[#888]">Total Equipment</p>
                                <p className="text-2xl font-bold text-white">{equipment.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="text-green-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[#888]">Active</p>
                                <p className="text-2xl font-bold text-white">
                                    {equipment.filter((e) => e.is_active).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                <Calendar className="text-yellow-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[#888]">Due Soon</p>
                                <p className="text-2xl font-bold text-white">
                                    {equipment.filter((e) => isDueForMaintenance(e.next_maintenance_due)).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <TrendingDown className="text-purple-500" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[#888]">Maint. Cost</p>
                                <p className="text-2xl font-bold text-white">
                                    ₹{equipment.reduce((sum, e) => sum + e.total_maintenance_cost, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Equipment Table */}
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Equipment</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Type</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Condition</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Location</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Last Maintenance
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Next Due
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                                        Maint. Cost
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {equipment.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${item.is_active ? "bg-green-500" : "bg-gray-500"
                                                        }`}
                                                />
                                                <div>
                                                    <p className="font-semibold text-white">{item.name}</p>
                                                    <p className="text-xs text-[#666]">
                                                        Purchased: {new Date(item.purchase_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-[#aaa] capitalize">
                                                {item.equipment_type.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${getConditionColor(
                                                    item.current_condition
                                                )}`}
                                            >
                                                {item.current_condition}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-[#aaa]">{item.location}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-[#aaa]">
                                                {new Date(item.last_maintenance_date).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {new Date(item.next_maintenance_due).toLocaleDateString()}
                                                </p>
                                                {isDueForMaintenance(item.next_maintenance_due) && (
                                                    <p className="text-xs text-red-500 font-medium">⚠️ Due soon!</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-white">
                                                ₹{item.total_maintenance_cost.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-[#666]">
                                                Purchase: ₹{item.purchase_cost.toLocaleString()}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {equipment.length === 0 && (
                            <div className="text-center py-12 text-[#666]">
                                <Wrench size={48} className="mx-auto mb-4 text-[#333]" />
                                <p>No equipment registered yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
