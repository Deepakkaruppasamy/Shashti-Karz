
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            return new NextResponse('Failed to fetch image', { status: response.status });
        }

        const contentType = response.headers.get('content-type');
        const imageBuffer = await response.arrayBuffer();

        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': contentType || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*', // Allow WebGL access
            },
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Error proxying image', { status: 500 });
    }
}
