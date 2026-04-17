import { NextRequest, NextResponse } from 'next/server';
import { register, totalBookings, totalRevenue, serviceBookings, activeUsers } from '@/lib/metrics';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Check for authorization if a secret is configured
    const { searchParams } = new URL(request.url);
    const providedSecret = searchParams.get('token');
    const expectedSecret = process.env.METRICS_SECRET;

    if (expectedSecret && providedSecret !== expectedSecret) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch and update business metrics
    const supabase = await createServiceClient();
    
    // 1. Total Bookings
    const { count: bookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    if (bookingsCount !== null) {
      totalBookings.reset();
      totalBookings.inc(bookingsCount);
    }

    // 2. Total Revenue
    const { data: revenueData } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('status', 'completed');
    
    if (revenueData) {
      const sum = revenueData.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
      totalRevenue.reset();
      totalRevenue.inc(sum);
    }

    // 3. Service Distribution
    const { data: serviceData } = await supabase
      .from('bookings')
      .select('service_type');
    
    if (serviceData) {
      const counts: Record<string, number> = {};
      serviceData.forEach(b => {
        if (b.service_type) {
          counts[b.service_type] = (counts[b.service_type] || 0) + 1;
        }
      });
      serviceBookings.reset();
      Object.entries(counts).forEach(([type, count]) => {
        serviceBookings.labels(type).inc(count);
      });
    }

    // 4. Online Users
    const { count: onlineCount } = await supabase
      .from('online_users')
      .select('*', { count: 'exact', head: true });
    
    if (onlineCount !== null) {
      activeUsers.observe(onlineCount);
    }

    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (ex) {
    console.error('Error getting metrics:', ex);
    return new NextResponse('Error getting metrics', { status: 500 });
  }
}

// Next.js config to ensure the route is dynamic
export const dynamic = 'force-dynamic';
