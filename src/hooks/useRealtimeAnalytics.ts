import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export interface AnalyticsData {
    // Revenue Metrics
    totalRevenue: number;
    todayRevenue: number;
    yesterdayRevenue: number;
    revenueGrowth: number;

    // Booking Metrics
    totalBookings: number;
    todayBookings: number;
    yesterdayBookings: number;
    bookingsGrowth: number;
    pendingBookings: number;
    completedBookings: number;
    cancelledBookings: number;

    // Service Metrics
    popularServices: Array<{ name: string; count: number; revenue: number }>;
    serviceCompletion: number;

    // Worker Metrics
    activeWorkers: number;
    topWorkers: Array<{ name: string; completions: number; rating: number }>;

    // Customer Metrics
    averageRating: number;
    totalReviews: number;
    satisfactionScore: number;

    // Inventory Metrics
    lowStockItems: number;
    totalInventoryValue: number;

    // Time-series data
    revenueByHour: Array<{ hour: string; revenue: number }>;
    bookingsByDay: Array<{ date: string; bookings: number }>;
}

export function useRealtimeAnalytics(timeRange: string = 'today') {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Calculate date ranges
    const getDateRange = useCallback(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        switch (timeRange) {
            case 'today':
                return { start: today, end: now };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(weekStart.getDate() - 7);
                return { start: weekStart, end: now };
            case 'month':
                const monthStart = new Date(today);
                monthStart.setMonth(monthStart.getMonth() - 1);
                return { start: monthStart, end: now };
            default:
                return { start: today, end: now };
        }
    }, [timeRange]);

    // Fetch analytics data
    const fetchAnalytics = useCallback(async () => {
        try {
            const { start, end } = getDateRange();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Fetch bookings
            const { data: bookings } = await supabase
                .from('bookings')
                .select('*, service:services(name)')
                .gte('created_at', start.toISOString())
                .lte('created_at', end.toISOString());

            const { data: todayBookings } = await supabase
                .from('bookings')
                .select('*')
                .gte('created_at', today.toISOString());

            const { data: yesterdayBookings } = await supabase
                .from('bookings')
                .select('*')
                .gte('created_at', yesterday.toISOString())
                .lt('created_at', today.toISOString());

            // Fetch reviews
            const { data: reviews } = await supabase
                .from('reviews')
                .select('rating');

            // Fetch workers
            const { data: workers } = await supabase
                .from('workers')
                .select('*')
                .eq('status', 'active');

            // Fetch inventory
            const { data: inventory } = await supabase
                .from('inventory')
                .select('*');

            // Calculate metrics
            const totalRevenue = bookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;
            const todayRev = todayBookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;
            const yesterdayRev = yesterdayBookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0;
            const revenueGrowth = yesterdayRev > 0 ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : 0;

            const bookingsGrowth = (yesterdayBookings?.length || 0) > 0
                ? (((todayBookings?.length || 0) - (yesterdayBookings?.length || 0)) / (yesterdayBookings?.length || 0)) * 100
                : 0;

            // Service popularity
            const serviceMap = new Map<string, { count: number; revenue: number }>();
            bookings?.forEach(b => {
                const serviceName = b.service?.name || 'Unknown';
                const current = serviceMap.get(serviceName) || { count: 0, revenue: 0 };
                serviceMap.set(serviceName, {
                    count: current.count + 1,
                    revenue: current.revenue + (b.price || 0)
                });
            });
            const popularServices = Array.from(serviceMap.entries())
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Reviews
            const avgRating = reviews?.length
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;

            // Inventory
            const lowStock = inventory?.filter(i => i.quantity <= i.min_quantity).length || 0;
            const inventoryValue = inventory?.reduce((sum, i) => sum + (i.quantity * i.price_per_unit), 0) || 0;

            // Time-series data
            const revenueByHour: Array<{ hour: string; revenue: number }> = [];
            for (let h = 0; h < 24; h++) {
                const hourBookings = todayBookings?.filter(b => {
                    const bookingHour = new Date(b.created_at).getHours();
                    return bookingHour === h;
                }) || [];
                const hourRevenue = hourBookings.reduce((sum, b) => sum + (b.price || 0), 0);
                revenueByHour.push({
                    hour: `${h}:00`,
                    revenue: hourRevenue
                });
            }

            setAnalytics({
                totalRevenue,
                todayRevenue: todayRev,
                yesterdayRevenue: yesterdayRev,
                revenueGrowth,
                totalBookings: bookings?.length || 0,
                todayBookings: todayBookings?.length || 0,
                yesterdayBookings: yesterdayBookings?.length || 0,
                bookingsGrowth,
                pendingBookings: bookings?.filter(b => b.status === 'pending').length || 0,
                completedBookings: bookings?.filter(b => b.status === 'completed').length || 0,
                cancelledBookings: bookings?.filter(b => b.status === 'cancelled').length || 0,
                popularServices,
                serviceCompletion: bookings?.length ? (bookings.filter(b => b.status === 'completed').length / bookings.length) * 100 : 0,
                activeWorkers: workers?.length || 0,
                topWorkers: [], // TODO: Calculate from bookings
                averageRating: avgRating,
                totalReviews: reviews?.length || 0,
                satisfactionScore: avgRating * 20, // Convert 5-star to 100-point scale
                lowStockItems: lowStock,
                totalInventoryValue: inventoryValue,
                revenueByHour,
                bookingsByDay: [] // TODO: Calculate
            });

            setLastUpdate(new Date());
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setIsLoading(false);
        }
    }, [timeRange, getDateRange]);

    // Initial fetch
    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Real-time updates - refetch on any data change
    useRealtimeSubscription({
        table: 'bookings',
        event: '*',
        onInsert: () => fetchAnalytics(),
        onUpdate: () => fetchAnalytics(),
        onDelete: () => fetchAnalytics()
    });

    useRealtimeSubscription({
        table: 'reviews',
        event: 'INSERT',
        onInsert: () => fetchAnalytics()
    });

    useRealtimeSubscription({
        table: 'inventory',
        event: '*',
        onInsert: () => fetchAnalytics(),
        onUpdate: () => fetchAnalytics()
    });

    return {
        analytics,
        isLoading,
        lastUpdate,
        refresh: fetchAnalytics
    };
}
