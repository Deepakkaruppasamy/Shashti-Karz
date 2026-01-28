import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { sendPaymentNotification } from '@/lib/notification-service';
import { updateLoyaltyPoints } from '@/lib/loyalty';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, service:services(*)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.payment_status === 'paid') {
      return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: booking.service?.name || 'Car Detailing Service',
              description: `Booking ID: ${booking.booking_id} | ${booking.car_model} | ${booking.date} at ${booking.time}`,
              metadata: {
                booking_id: booking.id,
                service_id: booking.service_id,
              },
            },
            unit_amount: Math.round(booking.price * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: booking.customer_email,
      metadata: {
        booking_id: booking.id,
        booking_display_id: booking.booking_id,
        service_name: booking.service?.name || 'Service',
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        car_model: booking.car_model,
      },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Invoice for ${booking.service?.name || 'Car Detailing'} - ${booking.car_model}`,
          metadata: {
            booking_id: booking.id,
          },
        },
      },
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${origin}/payment/cancel?booking_id=${booking.id}`,
    });

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent', 'invoice'],
    });

    if (session.payment_status === 'paid' && session.metadata?.booking_id) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*, service:services(*)')
        .eq('id', session.metadata.booking_id)
        .single();

      if (booking && booking.payment_status !== 'paid') {
          await supabase
            .from('bookings')
            .update({ payment_status: 'paid', status: 'confirmed' })
            .eq('id', session.metadata.booking_id);

          try {
            await updateLoyaltyPoints(
              booking.user_id,
              booking.id,
              booking.price,
              "earned",
              `Earned for booking ${booking.booking_id}`
            );

            await sendPaymentNotification(

            booking.user_id,
            {
              customerName: session.metadata.customer_name || booking.customer_name,
              customerEmail: session.customer_details?.email || booking.customer_email,
              amount: (session.amount_total || 0) / 100,
              serviceName: session.metadata.service_name || booking.service?.name || 'Service',
              paymentId: session.id,
              bookingId: booking.id,
            }
          );
        } catch (notifError) {
          console.error('Failed to send payment notification:', notifError);
        }
      }
    }

    return NextResponse.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total,
      currency: session.currency,
      invoice_url: (session.invoice as { hosted_invoice_url?: string })?.hosted_invoice_url || null,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error('Session retrieve error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
