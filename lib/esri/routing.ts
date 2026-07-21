import { solve } from '@arcgis/core/rest/route';
import RouteParameters from '@arcgis/core/rest/support/RouteParameters';
import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polyline from '@arcgis/core/geometry/Polyline';
import esriConfig from '@arcgis/core/config';
import * as turf from '@turf/turf';
import { Coordinates } from '@/types/gis';

export interface CalculatedRoute {
  geometry: Polyline;
  distanceMiles: number;
  durationMinutes: number;
  isFallback: boolean;
  warning?: string;
  paths: number[][][];
}

const ROUTE_SERVICE_URL = 'https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World';

/**
 * Creates a curved geodesic path as fallback when Esri route service is unavailable or key is restricted.
 */
export function generateFallbackRoute(origin: Coordinates, destination: Coordinates, reason?: string): CalculatedRoute {
  const fromPt = turf.point([origin.longitude, origin.latitude]);
  const toPt = turf.point([destination.longitude, destination.latitude]);
  
  const directDistanceMiles = turf.distance(fromPt, toPt, { units: 'miles' });
  const routeDistanceMiles = Math.round((directDistanceMiles * 1.25) * 10) / 10;
  
  const midPt = turf.midpoint(fromPt, toPt);
  const bearing = turf.bearing(fromPt, toPt);
  
  // Offset midpoint perpendicular to route for realistic curve
  const perpBearing = (bearing + 90) % 360;
  const offsetKm = (directDistanceMiles * 1.60934) * 0.15;
  const curvedMidPt = turf.destination(midPt, offsetKm, perpBearing);

  // Sample points along bezier curve
  const lineString = turf.lineString([
    [origin.longitude, origin.latitude],
    curvedMidPt.geometry.coordinates,
    [destination.longitude, destination.latitude]
  ]);
  
  const curvedLine = turf.bezierSpline(lineString, { resolution: 1000, sharpness: 0.85 });
  const rawCoords = curvedLine.geometry.coordinates as number[][];

  const polyline = new Polyline({
    paths: [rawCoords],
    spatialReference: { wkid: 4326 }
  });

  const durationMinutes = Math.max(1, Math.round((routeDistanceMiles / 40) * 60)); // assume 40mph avg speed

  return {
    geometry: polyline,
    distanceMiles: Math.max(0.1, routeDistanceMiles),
    durationMinutes,
    isFallback: true,
    warning: reason || 'ArcGIS Route Service offline or API key missing - using client-side geodesic fallback.',
    paths: [rawCoords]
  };
}

/**
 * Solves real-time driving route using Esri ArcGIS REST Routing Service, falling back seamlessly on failure.
 */
export async function calculateEsriRoute(
  origin: Coordinates,
  destination: Coordinates,
  apiKeyOverride?: string
): Promise<CalculatedRoute> {
  const activeApiKey = apiKeyOverride || process.env.NEXT_PUBLIC_ARCGIS_API_KEY || esriConfig.apiKey;

  if (!activeApiKey) {
    return generateFallbackRoute(origin, destination, 'NEXT_PUBLIC_ARCGIS_API_KEY not configured.');
  }

  try {
    if (activeApiKey) {
      esriConfig.apiKey = activeApiKey;
    }

    const originPoint = new Point({
      longitude: origin.longitude,
      latitude: origin.latitude,
      spatialReference: { wkid: 4326 }
    });

    const destPoint = new Point({
      longitude: destination.longitude,
      latitude: destination.latitude,
      spatialReference: { wkid: 4326 }
    });

    const originGraphic = new Graphic({ geometry: originPoint });
    const destGraphic = new Graphic({ geometry: destPoint });

    const routeParams = new RouteParameters({
      stops: new FeatureSet({
        features: [originGraphic, destGraphic]
      }),
      returnRoutes: true,
      outSpatialReference: { wkid: 4326 },
      apiKey: activeApiKey
    });

    const solveResult = await solve(ROUTE_SERVICE_URL, routeParams);

    if (solveResult && solveResult.routeResults && solveResult.routeResults.length > 0) {
      const firstResult = solveResult.routeResults[0];
      if (firstResult && firstResult.route) {
        const firstRoute = firstResult.route;
        const polyline = firstRoute.geometry as Polyline;
        const attrs = firstRoute.attributes || {};

        const travelTimeMin = attrs.Total_TravelTime || attrs.Total_Time || attrs.Total_Minutes;
        const travelMiles = attrs.Total_Miles || attrs.Total_Distance || attrs.Shape_Length;

        const directMiles = turf.distance(
          turf.point([origin.longitude, origin.latitude]),
          turf.point([destination.longitude, destination.latitude]),
          { units: 'miles' }
        );

        const distanceMiles = typeof travelMiles === 'number' && travelMiles > 0 
          ? Math.round(travelMiles * 10) / 10 
          : Math.round((directMiles * 1.2) * 10) / 10;

        const durationMinutes = typeof travelTimeMin === 'number' && travelTimeMin > 0
          ? Math.round(travelTimeMin)
          : Math.max(1, Math.round((distanceMiles / 40) * 60));

        return {
          geometry: polyline,
          distanceMiles,
          durationMinutes,
          isFallback: false,
          paths: polyline.paths as number[][][]
        };
      }
    }

    return generateFallbackRoute(origin, destination, 'ArcGIS REST Service returned empty route results.');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown routing error';
    console.warn('Esri Route Solve failed, engaging fallback:', errorMsg);
    return generateFallbackRoute(origin, destination, `ArcGIS Route Service warning: ${errorMsg}`);
  }
}
