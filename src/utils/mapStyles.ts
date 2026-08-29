export interface MapStyleOption {
  id: string;
  name: string;
  url: string | any;
  previewColor: string;
}

export const MAP_STYLES: MapStyleOption[] = [
  {
    id: 'google-streets',
    name: 'Google Maps (Streets & Buildings)',
    url: {
      version: 8,
      sources: {
        'google-streets': {
          type: 'raster',
          tiles: [
            'https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          ],
          tileSize: 256,
          attribution: '© Google Maps',
        },
      },
      layers: [
        {
          id: 'google-streets-layer',
          type: 'raster',
          source: 'google-streets',
          minzoom: 0,
          maxzoom: 21,
        },
      ],
    },
    previewColor: '#4285F4',
  },
  {
    id: 'google-hybrid',
    name: 'Google Satellite & Buildings',
    url: {
      version: 8,
      sources: {
        'google-hybrid': {
          type: 'raster',
          tiles: [
            'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          ],
          tileSize: 256,
          attribution: '© Google Maps Satellite',
        },
      },
      layers: [
        {
          id: 'google-hybrid-layer',
          type: 'raster',
          source: 'google-hybrid',
          minzoom: 0,
          maxzoom: 21,
        },
      ],
    },
    previewColor: '#105652',
  },
  {
    id: 'cyberpunk',
    name: 'Cyber Dark (Neon)',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    previewColor: '#090a0f',
  },
  {
    id: 'buildings-3d',
    name: '3D Vector City',
    url: 'https://tiles.openfreemap.org/styles/liberty',
    previewColor: '#1e293b',
  },
];
