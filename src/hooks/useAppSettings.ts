"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { businessInfo as defaultBusinessInfo, services as defaultServices, offers as defaultOffers, carTypes as defaultCarTypes } from '@/lib/data';

const supabase = createClient();

export function useAppSettings() {
    const [settings, setSettings] = useState<any>(defaultBusinessInfo);
    const [services, setServices] = useState<any[]>(defaultServices);
    const [offers, setOffers] = useState<any[]>(defaultOffers);
    const [carTypes, setCarTypes] = useState<any[]>(defaultCarTypes);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [settingsRes, servicesRes, offersRes, carTypesRes] = await Promise.all([
                supabase.from('app_settings').select('*').eq('key', 'business_info').single(),
                supabase.from('service_packages').select('*').order('sort_order', { ascending: true }),
                supabase.from('active_offers').select('*').eq('active', true),
                supabase.from('car_types').select('*').order('sort_order', { ascending: true })
            ]);

            if (settingsRes.data) setSettings(settingsRes.data.value);
            if (servicesRes.data) setServices(servicesRes.data);
            if (offersRes.data) setOffers(offersRes.data);
            if (carTypesRes.data) setCarTypes(carTypesRes.data);
        } catch (error) {
            console.error("Error loading app settings:", error);
        } finally {
            setLoading(false);
        }
    };

    // Real-time subscriptions
    useRealtimeSubscription({
        table: 'app_settings',
        filter: "key=eq.business_info",
        onUpdate: (payload) => setSettings(payload.value)
    });

    useRealtimeSubscription({
        table: 'service_packages',
        onInsert: (payload) => setServices(prev => [...prev, payload].sort((a, b) => a.sort_order - b.sort_order)),
        onUpdate: (payload) => setServices(prev => prev.map(s => s.id === payload.id ? payload : s).sort((a, b) => a.sort_order - b.sort_order)),
        onDelete: (payload) => setServices(prev => prev.filter(s => s.id !== payload.old.id))
    });

    useRealtimeSubscription({
        table: 'active_offers',
        onInsert: (payload) => setOffers(prev => [...prev, payload]),
        onUpdate: (payload) => setOffers(prev => prev.map(o => o.id === payload.id ? payload : o)),
        onDelete: (payload) => setOffers(prev => prev.filter(o => o.id !== payload.old.id))
    });

    useRealtimeSubscription({
        table: 'car_types',
        onInsert: (payload) => setCarTypes(prev => [...prev, payload]),
        onUpdate: (payload) => setCarTypes(prev => prev.map(c => c.id === payload.id ? payload : c)),
        onDelete: (payload) => setCarTypes(prev => prev.filter(c => c.id !== payload.old.id))
    });

    return {
        businessInfo: settings,
        services,
        offers,
        carTypes,
        loading,
        refresh: fetchAllData
    };
}
