"use client";

import { useState, useEffect } from "react";
import { Wrench, AlertCircle, Calendar, TrendingDown, CheckCircle2 } from "lucide-react";

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

    useEffect(() => {
        fetchEquipment();
    }, []);

    const fetchEquipment = async () => {
        try {
            const response = await fetch("/api/equipment");
            const data = await response.json();
            setEquipment(data.equipment || []);
            setAlerts(data.alerts || []);
        } catch (error) {
            console.error("Error fetching equipment:", error);
        } finally {
            setLoading(false);
        }
    };

    const getConditionColor = (condition: string) => {
        const colors: Record<string, string> = {
            excellent: "bg-green-100 text-green-800",
            good: "bg-blue-100 text-blue-800",
            fair: "bg-yellow-100 text-yellow-800",
            poor: "bg-orange-100 text-orange-800",
            critical: "bg-red-100 text-red-800",
        };
        return colors[condition] || "bg-gray-100 text-gray-800";
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: "text-green-600",
            medium: "text-yellow-600",
            high: "text-orange-600",
            critical: "text-red-600",
        };
        return colors[priority] || "text-gray-600";
    };

    const isDueForMaintenance = (dueDate: string) => {
        const daysUntilDue = Math.floor(
            (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilDue <= 7;
    };

    if (loading) {
        return <div className="p-8 text-center">Loading equipment...</div>;
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Equipment Maintenance</h1>
                    <p className="text-gray-600 mt-1">Track and maintain your equipment</p>
                </div>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Wrench size={20} />
                    Add Equipment
                </button>
            </div>

            {/* Maintenance Alerts */}
            {alerts.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="text-red-600" size={24} />
                        <h2 className="text-lg font-bold text-red-900">Maintenance Alerts ({alerts.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {alerts.slice(0, 4).map((alert) => (
                            <div key={alert.id} className="bg-white rounded-lg border border-red-200 p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <p className="font-semibold text-gray-900">{alert.equipment_name}</p>
                                    <span className={`text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                                        {alert.priority.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                                <p className="text-xs text-gray-500">
                                    Due: {new Date(alert.due_date).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Wrench className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Equipment</p>
                            <p className="text-2xl font-bold text-gray-900">{equipment.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {equipment.filter((e) => e.is_active).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Calendar className="text-yellow-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Due Soon</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {equipment.filter((e) => isDueForMaintenance(e.next_maintenance_due)).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <TrendingDown className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Maint. Cost</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₹{equipment.reduce((sum, e) => sum + e.total_maintenance_cost, 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Equipment Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Equipment</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Condition</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Location</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Last Maintenance
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Next Due
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                Maint. Cost
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {equipment.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-3 h-3 rounded-full ${item.is_active ? "bg-green-500" : "bg-gray-300"
                                                }`}
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500">
                                                Purchased: {new Date(item.purchase_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-700 capitalize">
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
                                    <span className="text-sm text-gray-700">{item.location}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-700">
                                        {new Date(item.last_maintenance_date).toLocaleDateString()}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {new Date(item.next_maintenance_due).toLocaleDateString()}
                                        </p>
                                        {isDueForMaintenance(item.next_maintenance_due) && (
                                            <p className="text-xs text-red-600 font-medium">⚠️ Due soon!</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-900">
                                        ₹{item.total_maintenance_cost.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Purchase: ₹{item.purchase_cost.toLocaleString()}
                                    </p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {equipment.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Wrench size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>No equipment registered yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
