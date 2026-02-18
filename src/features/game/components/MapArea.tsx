/* eslint-disable consistent-return */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { LANDMARKS } from '../../../data/landmarks';
import { logger } from '../../../utils/logger';
import { themeClasses, themeValue } from '../../../utils/themeUtils';

// Constants

const MAP_PADDING: [number, number] = [80, 80];
const MAP_PADDING_MOBILE: [number, number] = [40, 40];
const ANIMATION_DURATION = 2.0;
const ANIMATION_TIMEOUT = 2100;
const INITIAL_WAIT = 100;
const CENTER_LAT = 41.3879;
const CENTER_LNG = 2.1699;
const INITIAL_ZOOM = 13;
const MIN_ZOOM = 11;
const MAX_ZOOM_ANIMATION = 15;
const MAX_ZOOM_RECENTER = 18;
const MAX_BOUNDS: L.LatLngBoundsExpression = [
  [41.2, 2.0],
  [41.6, 2.45],
];
const BOUNDS_VISCOSITY = 0.5;
const MOBILE_BREAKPOINT = 768;

const ICON_SIZE: [number, number] = [30, 30];
const ICON_ANCHOR: [number, number] = [15, 15];
const TOOLTIP_OFFSET: [number, number] = [0, 5];
const TOOLTIP_OPACITY = 0.9;

const WEIGHT_THIN = 8;
const WEIGHT_NORMAL = 10;
const WEIGHT_THICK = 12;
const WEIGHT_EXTRA_THICK = 16;
const WEIGHT_HIGHLIGHT = 4;
const OPACITY_LOW = 0.5;
const OPACITY_HIGH = 1.0;
const OPACITY_HIGHLIGHT = 0.8;

const RECENTER_BUTTON_STYLE = { bottom: '20px', left: '20px', zIndex: 1000 };

interface ChangeViewProps {
  coords: number[][][] | null;
  onAnimationComplete?: () => void;
}

const ChangeView: React.FC<ChangeViewProps> = ({ coords, onAnimationComplete }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const allPoints = coords.flat() as L.LatLngExpression[];
      if (allPoints.length === 0) {
        return;
      }

      let animationTimer: NodeJS.Timeout;

      const flyToStreet = () => {
        // Ensure map has size before flying (prevents grey map issues)
        map.invalidateSize();

        try {
          map.flyToBounds(allPoints as L.LatLngBoundsExpression, {
            padding: MAP_PADDING,
            maxZoom: MAX_ZOOM_ANIMATION,
            duration: ANIMATION_DURATION,
            animate: true,
          });

          if (onAnimationComplete) {
            // Match the duration of flyToBounds
            animationTimer = setTimeout(() => {
              onAnimationComplete();
            }, ANIMATION_TIMEOUT);
          }
        } catch (err) {
          console.warn('Map flyToBounds failed', err);
          // Fallback if animation fails
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }
      };

      // Small delay to ensure container is ready
      const startTimer = setTimeout(flyToStreet, INITIAL_WAIT);

      return () => {
        clearTimeout(startTimer);
        if (animationTimer) {
          clearTimeout(animationTimer);
        }
      };
    }
    return () => {};
  }, [coords, map, onAnimationComplete]);
  return null;
};

interface ZoomHandlerProps {
  setCurrentZoom: (zoom: number) => void;
}

const ZoomHandler: React.FC<ZoomHandlerProps> = ({ setCurrentZoom }) => {
  const map = useMapEvents({
    zoomend: () => {
      setCurrentZoom(map.getZoom());
    },
  });
  return null;
};

interface RecenterControlProps {
  center: [number, number];
  zoom: number;
  bounds: number[][][] | null;
}

const RecenterControl: React.FC<RecenterControlProps> = ({ center, zoom, bounds }) => {
  const map = useMap();

  const handleRecenter = () => {
    if (bounds && bounds.length > 0) {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      const padding: [number, number] = isMobile ? MAP_PADDING_MOBILE : MAP_PADDING;
      const allPoints = bounds.flat() as L.LatLngExpression[];
      map.fitBounds(allPoints as unknown as L.LatLngBoundsExpression, {
        padding,
        maxZoom: MAX_ZOOM_RECENTER,
      });
    } else if (center) {
      map.setView(center, zoom || INITIAL_ZOOM);
    }
  };

  return (
    <div className="leaflet-bottom leaflet-left !pointer-events-auto" style={RECENTER_BUTTON_STYLE}>
      <button
        onClick={handleRecenter}
        className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 p-2 rounded-lg shadow-lg hover:scale-105 transition-transform border border-slate-200 dark:border-slate-700 font-inter"
        title="Re-center Map"
        aria-label="Re-center Map"
        type="button"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      </button>
    </div>
  );
};

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
