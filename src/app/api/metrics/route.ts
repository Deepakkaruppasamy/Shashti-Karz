import { NextResponse } from 'next/server';
import { register } from '@/lib/metrics';

export async function GET() {
  try {
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
