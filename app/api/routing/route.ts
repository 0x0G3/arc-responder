import { NextResponse } from 'next/server';
import { calculateEsriRoute } from '@/lib/esri/routing';
import { Coordinates } from '@/types/gis';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { origin, destination }: { origin: Coordinates; destination: Coordinates } = body;

    if (!origin || !destination || typeof origin.latitude !== 'number' || typeof destination.latitude !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid origin or destination coordinates provided.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY || process.env.ARCGIS_API_KEY;
    const routeResult = await calculateEsriRoute(origin, destination, apiKey);

    return NextResponse.json({
      success: true,
      route: {
        distanceMiles: routeResult.distanceMiles,
        durationMinutes: routeResult.durationMinutes,
        isFallback: routeResult.isFallback,
        warning: routeResult.warning,
        paths: routeResult.paths
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
