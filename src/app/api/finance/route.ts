import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100');

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = startDate ? new Date(startDate) : defaultStart;
    const end = endDate ? new Date(endDate) : now;

    const startTimestamp = Math.floor(start.getTime() / 1000);
    const endTimestamp = Math.floor(end.getTime() / 1000);

    const [paymentsResult, refundsResult] = await Promise.all([
      stripe.paymentIntents.list({
        created: { gte: startTimestamp, lte: endTimestamp },
        limit,
      }),
      stripe.refunds.list({
        created: { gte: startTimestamp, lte: endTimestamp },
        limit,
      }),
    ]);

    const payments = paymentsResult.data;
    const refunds = refundsResult.data;

    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, service:services(name)')
      .in('payment_id', payments.map(p => p.id).filter(Boolean));

    const paymentMap = new Map(
      (bookings || []).map(b => [b.payment_id, b])
    );

    const successfulPayments = payments.filter(p => p.status === 'succeeded');
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount_received || 0), 0) / 100;
    const totalRefunds = refunds.reduce((sum, r) => sum + (r.amount || 0), 0) / 100;
    const netRevenue = totalRevenue - totalRefunds;

    const taxRate = 0.18;
    const estimatedTax = (netRevenue / (1 + taxRate)) * taxRate;
    const preGSTAmount = netRevenue - estimatedTax;

    const dailyRevenue: Record<string, { date: string; revenue: number; count: number }> = {};
    successfulPayments.forEach(payment => {
      const date = new Date(payment.created * 1000).toISOString().split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { date, revenue: 0, count: 0 };
      }
      dailyRevenue[date].revenue += (payment.amount_received || 0) / 100;
      dailyRevenue[date].count += 1;
    });

    const transactions = payments.map(payment => {
      const booking = paymentMap.get(payment.id);
      return {
        id: payment.id,
        amount: (payment.amount || 0) / 100,
        status: payment.status,
        created: new Date(payment.created * 1000).toISOString(),
        currency: payment.currency.toUpperCase(),
        customer_email: payment.receipt_email || booking?.customer_email || 'N/A',
        booking_id: booking?.booking_id || 'N/A',
        service_name: booking?.service?.name || 'N/A',
        customer_name: booking?.customer_name || payment.metadata?.customer_name || 'N/A',
        payment_method: payment.payment_method_types?.[0] || 'card',
      };
    });

    const refundTransactions = refunds.map(refund => ({
      id: refund.id,
      amount: (refund.amount || 0) / 100,
      status: refund.status,
      created: new Date(refund.created * 1000).toISOString(),
      currency: refund.currency.toUpperCase(),
      reason: refund.reason || 'Not specified',
      payment_intent: typeof refund.payment_intent === 'string' ? refund.payment_intent : refund.payment_intent?.id,
    }));

    const serviceRevenue: Record<string, { name: string; revenue: number; count: number }> = {};
    transactions.forEach(t => {
      if (t.status === 'succeeded' && t.service_name !== 'N/A') {
        if (!serviceRevenue[t.service_name]) {
          serviceRevenue[t.service_name] = { name: t.service_name, revenue: 0, count: 0 };
        }
        serviceRevenue[t.service_name].revenue += t.amount;
        serviceRevenue[t.service_name].count += 1;
      }
    });

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalRefunds,
        netRevenue,
        estimatedTax,
        preGSTAmount,
        successfulPaymentsCount: successfulPayments.length,
        refundsCount: refunds.length,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
      dailyRevenue: Object.values(dailyRevenue).sort((a, b) => a.date.localeCompare(b.date)),
      serviceRevenue: Object.values(serviceRevenue).sort((a, b) => b.revenue - a.revenue),
      transactions,
      refunds: refundTransactions,
    });
  } catch (error) {
    console.error('Finance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance data' },
      { status: 500 }
    );
  }
}
