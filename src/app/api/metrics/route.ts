import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  try {
    // Check for authorization if a secret is configured
    const { searchParams } = new URL(request.url);
    const providedSecret = searchParams.get('token');
    const expectedSecret = process.env.METRICS_SECRET;

    if (expectedSecret && providedSecret !== expectedSecret) {
      return new NextResponse('Unauthorized', { status: 401 });
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
