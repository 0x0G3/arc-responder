import esriConfig from '@arcgis/core/config';

export function configureEsri() {
  if (process.env.NEXT_PUBLIC_ARCGIS_API_KEY) {
    esriConfig.apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY;
  } else {
    console.warn('NEXT_PUBLIC_ARCGIS_API_KEY is not defined in the environment.');
  }
}

export const DEFAULT_MAP_CENTER: [number, number] = [-117.1611, 32.7157]; // San Diego region
export const DEFAULT_MAP_ZOOM = 12;
export const DEFAULT_BASEMAP = 'arcgis/dark-gray';
