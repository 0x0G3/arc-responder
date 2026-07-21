import esriConfig from '@arcgis/core/config';
import WebTileLayer from '@arcgis/core/layers/WebTileLayer';

export function configureEsri() {
  if (process.env.NEXT_PUBLIC_ARCGIS_API_KEY) {
    esriConfig.apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY;
  }
  // Point assets to matching 5.1 CDN assets to ensure WASM module resolution works correctly
  esriConfig.assetsPath = 'https://js.arcgis.com/5.1/@arcgis/core/assets';
}

// Execute configuration immediately upon module load
configureEsri();

export const DEFAULT_MAP_CENTER: [number, number] = [-117.1611, 32.7157]; // San Diego region
export const DEFAULT_MAP_ZOOM = 12;

/**
 * Constructs a custom WebTileLayer dark canvas base layer.
 * Added directly to the map's `layers` array instead of wrapping in a `Basemap` object,
 * completely bypassing Esri Portal metadata checks and eliminating #load() errors.
 */
export function getDarkBaseLayer(): WebTileLayer {
  return new WebTileLayer({
    id: 'arcresponder-dark-base-layer',
    urlTemplate: 'https://{subDomain}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    subDomains: ['a', 'b', 'c', 'd'],
    copyright: '© OpenStreetMap contributors, © CARTO'
  });
}