import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from 'react-leaflet';
import { LANDMARKS } from '../../../data/landmarks';
import { logger } from '../../../utils/logger';
import { themeClasses, themeValue } from '../../../utils/themeUtils';
import ChangeView from './map/ChangeView';
import {
  BOUNDS_VISCOSITY,
  CENTER_LAT,
  CENTER_LNG,
  ICON_ANCHOR,
  ICON_SIZE,
  INITIAL_ZOOM,
  MAX_BOUNDS,
  MAX_ZOOM_ANIMATION,
  MIN_ZOOM,
  OPACITY_HIGH,
  OPACITY_HIGHLIGHT,
  OPACITY_LOW,
  TOOLTIP_OFFSET,
  TOOLTIP_OPACITY,
  WEIGHT_EXTRA_THICK,
  WEIGHT_HIGHLIGHT,
  WEIGHT_NORMAL,
  WEIGHT_THICK,
  WEIGHT_THIN,
} from './map/mapConstants';
import RecenterControl from './map/RecenterControl';
import ZoomHandler from './map/ZoomHandler';

const createEmojiIcon = (emoji: string) => {
  return L.divIcon({
    className: 'custom-emoji-icon',
    html: `<div style="font-size: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${emoji}</div>`,
    iconSize: ICON_SIZE,
    iconAnchor: ICON_ANCHOR,
  });
};

// Pre-compute landmark icons since LANDMARKS is static
const LANDMARK_ICONS = new Map(LANDMARKS.map(l => [l.icon, createEmojiIcon(l.icon)]));

interface MapAreaProps {
  currentStreet: {
    id: string;
    name: string;
    geometry: number[][][];
  } | null;
  hintStreets?: Array<{
    id: string;
    name: string;
    geometry: number[][][];
  }>;
  theme?: 'dark' | 'light';
  onAnimationComplete?: () => void;
}

const MapArea: React.FC<MapAreaProps> = ({
  currentStreet,
  hintStreets = [],
  theme = 'dark',
  onAnimationComplete,
}) => {
  const [boundary, setBoundary] = useState<L.LatLngExpression[] | null>(null);
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [mapError, setMapError] = useState(false);
  const geometry = currentStreet ? currentStreet.geometry : null;

  useEffect(() => {
    if (currentStreet) {
      logger.info('[MapArea] Current Street:', currentStreet.name);
      logger.info('[MapArea] Geometry points:', currentStreet.geometry.length);
    }
  }, [currentStreet]);

  useEffect(() => {
    import('../../../data/boundary.json')
      .then(mod => setBoundary(mod.default as unknown as L.LatLngExpression[]))
      .catch(() => logger.info('No boundary data found'));
  }, []);

  const [useFallbackTiles, setUseFallbackTiles] = useState(false);

  const cartoUrl = themeValue(
    theme,
    'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
  );

  const fallbackUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileUrl = useFallbackTiles ? fallbackUrl : cartoUrl;

  if (mapError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center p-6">
          <p className="text-slate-600 dark:text-slate-400 mb-4 font-inter">Map failed to load</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-inter"
            type="button"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="h-full w-full relative z-0">
        <MapContainer
          center={[CENTER_LAT, CENTER_LNG]}
          zoom={INITIAL_ZOOM}
          minZoom={MIN_ZOOM}
          scrollWheelZoom={true}
          zoomControl={false}
          attributionControl={false}
          touchZoom={true}
          maxBounds={MAX_BOUNDS}
          maxBoundsViscosity={BOUNDS_VISCOSITY}
          className="h-full w-full outline-none"
          aria-label="Game Map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={tileUrl}
            eventHandlers={{
              tileerror: () => {
                if (!useFallbackTiles) {
                  console.warn('[Map] CARTO tiles failed, switching to OSM fallback');
                  setUseFallbackTiles(true);
                }
              },
            }}
          />

          <ChangeView coords={geometry} onAnimationComplete={onAnimationComplete} />

          <RecenterControl
            center={[CENTER_LAT, CENTER_LNG]}
            zoom={INITIAL_ZOOM}
            bounds={geometry}
          />

          <ZoomHandler setCurrentZoom={setCurrentZoom} />

          {boundary && (
            <Polyline
              positions={boundary}
              pathOptions={{
                color: themeValue(theme, '#334155', '#cbd5e1'),
                weight: 2,
                opacity: OPACITY_LOW,
                dashArray: '5, 10',
                fill: false,
              }}
            />
          )}

          {currentZoom >= MIN_ZOOM &&
            LANDMARKS.map((l, idx) => (
              <Marker key={idx} position={l.pos} icon={LANDMARK_ICONS.get(l.icon)!}>
                {currentZoom >= MAX_ZOOM_ANIMATION && (
                  <Tooltip
                    permanent
                    direction="bottom"
                    offset={TOOLTIP_OFFSET}
                    opacity={TOOLTIP_OPACITY}
                    className="font-bold text-sm font-inter"
                  >
                    {l.name}
                  </Tooltip>
                )}
              </Marker>
            ))}

          {hintStreets.map(street => (
            <Polyline
              key={street.id}
              positions={street.geometry as L.LatLngExpression[][]}
              pathOptions={{
                className: 'neon-highlight',
                color: '#00FFFF',
                weight: WEIGHT_HIGHLIGHT,
                opacity: OPACITY_HIGHLIGHT,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          ))}

          {geometry && (
            <Polyline
              positions={geometry as L.LatLngExpression[][]}
              pathOptions={{
                color: '#FFFFFF',
                weight: currentZoom < INITIAL_ZOOM ? WEIGHT_EXTRA_THICK : WEIGHT_THICK,
                opacity: OPACITY_LOW,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {geometry && (
            <Polyline
              positions={geometry as L.LatLngExpression[][]}
              pathOptions={{
                color: themeValue(theme, '#38bdf8', '#000080'), // Sky-400 for dark, Navy for light
                weight: currentZoom < INITIAL_ZOOM ? WEIGHT_NORMAL : WEIGHT_THIN,
                opacity: OPACITY_HIGH,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}
        </MapContainer>

        <div
          className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${themeClasses(theme, 'from-slate-900', 'from-slate-50')} to-transparent pointer-events-none z-[400]`}
        />
        <div
          className={`absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t ${themeClasses(theme, 'from-slate-900', 'from-slate-50')} to-transparent pointer-events-none z-[400]`}
        />
      </div>
    );
  } catch (error) {
    console.error('Map rendering error:', error);
    setMapError(true);
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center p-6">
          <p className="text-slate-600 dark:text-slate-400 font-inter">Map error occurred</p>
        </div>
      </div>
    );
  }
};

export default React.memo(MapArea);
