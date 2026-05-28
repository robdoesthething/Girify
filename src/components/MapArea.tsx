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
import { logger } from '../utils/logger';

interface ChangeViewProps {
  coords: number[][][] | null;
  onAnimationComplete?: () => void;
}

const ChangeView: React.FC<ChangeViewProps> = ({ coords, onAnimationComplete }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const allPoints = coords.flat() as L.LatLngExpression[];

      const handleLoad = () => {
        setTimeout(() => {
          map.flyToBounds(allPoints as L.LatLngBoundsExpression, {
            padding: [80, 80],
            maxZoom: 15,
            duration: 2.0,
          });
          if (onAnimationComplete) {
            setTimeout(() => {
              onAnimationComplete();
            }, 2100);
          }
        }, 100);
      };

      // If map is already loaded/ready
      handleLoad();
    }
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
      const isMobile = window.innerWidth < 768;
      const padding: [number, number] = isMobile ? [40, 40] : [80, 80];
      const allPoints = bounds.flat() as L.LatLngExpression[];
      map.fitBounds(allPoints as unknown as L.LatLngBoundsExpression, { padding, maxZoom: 18 });
    } else if (center) {
      map.setView(center, zoom || 13);
    }
  };

  return (
    <div
      className="leaflet-bottom leaflet-left !pointer-events-auto"
      style={{ bottom: '20px', left: '20px', zIndex: 1000 }}
    >
      <button
        onClick={handleRecenter}
        className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 p-2 rounded-lg shadow-lg hover:scale-105 transition-transform border border-slate-200 dark:border-slate-700 font-inter"
        title="Re-center Map"
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

interface Landmark {
  name: string;
  pos: [number, number];
  icon: string;
}

const LANDMARKS: Landmark[] = [
  // Tourist Sites
  { name: 'Sagrada Familia', pos: [41.4036, 2.1744], icon: '⛪' },
  { name: 'Torre Glòries', pos: [41.4036, 2.1894], icon: '🥒' },
  { name: 'Tibidabo', pos: [41.4218, 2.1186], icon: '🎡' },
  { name: 'Park Güell', pos: [41.4145, 2.1527], icon: '🦎' },
  { name: 'Camp Nou', pos: [41.3809, 2.1228], icon: '⚽' },
  { name: 'MNAC', pos: [41.3688, 2.1534], icon: '🏛️' },
  { name: 'W Hotel', pos: [41.3684, 2.191], icon: '⛵' },
  { name: 'Casa Batlló', pos: [41.3916, 2.1649], icon: '🎭' },
  { name: 'La Pedrera', pos: [41.3954, 2.1619], icon: '🗿' },
  { name: 'Arc de Triomf', pos: [41.3911, 2.1806], icon: '🧱' },
  { name: 'Catedral', pos: [41.384, 2.1762], icon: '⛪' },
  { name: 'Monument a Colom', pos: [41.3758, 2.1778], icon: '👉' },
  { name: 'Boqueria', pos: [41.3817, 2.1716], icon: '🍇' },
  { name: 'Palau de la Música', pos: [41.3875, 2.1753], icon: '🎻' },
  { name: 'Santa Maria del Mar', pos: [41.3837, 2.182], icon: '⛪' },
  { name: 'Poble Espanyol', pos: [41.3675, 2.1469], icon: '🏘️' },

  // Parks
  { name: 'Parc de la Ciutadella', pos: [41.3881, 2.1873], icon: '🌳' },
  { name: "Parc del Laberint d'Horta", pos: [41.4397, 2.1465], icon: '🌳' },
  { name: 'Parc de Montjuïc', pos: [41.3636, 2.1578], icon: '🌳' },
  { name: 'Parc del Guinardó', pos: [41.4187, 2.1642], icon: '🌳' },
  { name: 'Jardins de Mossèn Costa i Llobera', pos: [41.3661, 2.1659], icon: '🌵' },
  { name: 'Parc de Diagonal Mar', pos: [41.4103, 2.2168], icon: '🌳' },
  { name: "Parc de l'Espanya Industrial", pos: [41.3768, 2.1378], icon: '🌳' },
  { name: 'Parc de Joan Miró', pos: [41.3773, 2.1461], icon: '🌳' },

  // Museums
  { name: 'Museu Picasso', pos: [41.3851, 2.1811], icon: '🖼️' },
  { name: 'MACBA', pos: [41.3833, 2.1667], icon: '🖼️' },
  { name: 'Museu Marítim', pos: [41.3755, 2.1754], icon: '⚓' },
  { name: 'CosmoCaixa', pos: [41.413, 2.1317], icon: '🔬' },
  { name: 'Fundació Joan Miró', pos: [41.3685, 2.16], icon: '🖼️' },
  { name: 'CaixaForum', pos: [41.371, 2.1492], icon: '🖼️' },
  { name: "Museu d'Història de Barcelona", pos: [41.384, 2.1773], icon: '🏺' },

  // Mountains & Viewpoints
  { name: 'Montjuïc', pos: [41.3636, 2.1578], icon: '⛰️' },
  { name: 'Bunkers del Carmel', pos: [41.4186, 2.1579], icon: '🏔️' },
  { name: 'Turó de la Rovira', pos: [41.4189, 2.158], icon: '👀' },
  { name: 'Collserola Tower', pos: [41.4175, 2.115], icon: '📡' },

  // Shopping Malls
  { name: 'Heron City (Som Multiespai)', pos: [41.435, 2.1818], icon: '🛍️' },
  { name: 'Diagonal Mar', pos: [41.412, 2.2163], icon: '🛍️' },
  { name: 'Westfield Glòries', pos: [41.4042, 2.1913], icon: '🛍️' },
  { name: "L'Illa Diagonal", pos: [41.3892, 2.1384], icon: '🛍️' },
  { name: 'Las Arenas', pos: [41.3758, 2.1492], icon: '🛍️' },
  { name: 'Maremagnum', pos: [41.3753, 2.1828], icon: '🛍️' },
  { name: 'Gran Via 2', pos: [41.361, 2.1287], icon: '🛍️' },
  { name: 'Splau', pos: [41.3551, 2.0722], icon: '🛍️' },

  // Beaches
  { name: 'Platja de Sant Sebastià', pos: [41.3712, 2.1895], icon: '🏖️' },
  { name: 'Platja de la Barceloneta', pos: [41.3784, 2.1925], icon: '🏖️' },
  { name: 'Platja de Somorrostro', pos: [41.3834, 2.1963], icon: '🏖️' },
  { name: 'Platja de la Nova Icària', pos: [41.3907, 2.2035], icon: '🏖️' },
  { name: 'Platja del Bogatell', pos: [41.3948, 2.2078], icon: '🏖️' },
  { name: 'Platja de la Mar Bella', pos: [41.3995, 2.2132], icon: '🏖️' },
  { name: 'Platja de la Nova Mar Bella', pos: [41.4035, 2.2173], icon: '🏖️' },
  { name: 'Platja de Llevant', pos: [41.4072, 2.2215], icon: '🏖️' },

  // Hospitals
  { name: 'Hospital Clínic', pos: [41.3896, 2.1539], icon: '🏥' },
  { name: 'Hospital Sant Pau', pos: [41.4116, 2.1749], icon: '🏥' },
  { name: "Vall d'Hebron", pos: [41.4277, 2.1444], icon: '🏥' },
  { name: 'Hospital del Mar', pos: [41.3845, 2.1936], icon: '🏥' },

  // Sarrià-Sant Gervasi District
  { name: 'Monestir de Pedralbes', pos: [41.3957, 2.1113], icon: '⛪' },
  { name: "Parc de l'Oreneta", pos: [41.4003, 2.1147], icon: '🌳' },
  { name: 'Parc de Cervantes', pos: [41.3875, 2.1123], icon: '🌹' },
  { name: 'Jardins de la Vil·la Amèlia', pos: [41.3965, 2.1318], icon: '🌳' },
  { name: 'Jardins de la Tamarita', pos: [41.4041, 2.1362], icon: '🌳' },
  { name: 'Sarrià', pos: [41.4003, 2.1213], icon: '🏘️' },
  { name: 'Plaça de Sarrià', pos: [41.4005, 2.1218], icon: '⛲' },

  // Sant Andreu District
  { name: 'Fabra i Coats', pos: [41.4367, 2.1899], icon: '🏭' },
  { name: 'Parc de la Trinitat', pos: [41.4478, 2.1856], icon: '🌳' },
  { name: 'Mercat de Sant Andreu', pos: [41.4355, 2.1903], icon: '🛒' },
  { name: 'Plaça del Comerç', pos: [41.4339, 2.1902], icon: '⛲' },
  { name: 'Sant Andreu Arenal', pos: [41.4312, 2.1888], icon: '🏟️' },
  { name: 'Parc de la Pegaso', pos: [41.4243, 2.1924], icon: '🌳' },

  // Nou Barris District
  { name: 'Parc Central de Nou Barris', pos: [41.4418, 2.1732], icon: '🌳' },
  { name: 'Parc del Turó de la Peira', pos: [41.4344, 2.1611], icon: '🌳' },
  { name: 'Mundet', pos: [41.4395, 2.1518], icon: '🏫' },
  { name: 'Roquetes', pos: [41.4486, 2.1651], icon: '🏘️' },
  { name: 'Torre Baró', pos: [41.4568, 2.1785], icon: '🏔️' },
  { name: 'Ciutat Meridiana', pos: [41.4613, 2.1792], icon: '🏘️' },
  { name: 'Parc de les Aigües', pos: [41.4391, 2.1653], icon: '💧' },
  { name: 'Can Dragó', pos: [41.435, 2.1818], icon: '🏟️' },
];

const createEmojiIcon = (emoji: string) => {
  return L.divIcon({
    className: 'custom-emoji-icon',
    html: `<div style="font-size: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

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
  const [currentZoom, setCurrentZoom] = useState(13);
  const [mapError, setMapError] = useState(false);
  const geometry = currentStreet ? currentStreet.geometry : null;

  useEffect(() => {
    if (currentStreet) {
      logger.info('[MapArea] Current Street:', currentStreet.name);
      logger.info('[MapArea] Geometry points:', currentStreet.geometry.length);
    }
  }, [currentStreet]);
  useEffect(() => {
    import('../data/boundary.json')
      .then(mod => setBoundary(mod.default as unknown as L.LatLngExpression[]))
      .catch(() => logger.info('No boundary data found'));
  }, []);

  const [useFallbackTiles, setUseFallbackTiles] = useState(false);

  const cartoUrl =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

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
          center={[41.3879, 2.1699]}
          zoom={13}
          minZoom={11}
          scrollWheelZoom={true}
          zoomControl={false}
          attributionControl={false}
          touchZoom={true}
          maxBounds={[
            [41.2, 2.0],
            [41.6, 2.45],
          ]}
          maxBoundsViscosity={0.5}
          className="h-full w-full outline-none"
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

          <RecenterControl center={[41.3879, 2.1699]} zoom={13} bounds={geometry} />

          <ZoomHandler setCurrentZoom={setCurrentZoom} />

          {boundary && (
            <Polyline
              positions={boundary}
              pathOptions={{
                color: theme === 'dark' ? '#334155' : '#cbd5e1',
                weight: 2,
                opacity: 0.5,
                dashArray: '5, 10',
                fill: false,
              }}
            />
          )}

          {currentZoom >= 11 &&
            LANDMARKS.map((l, idx) => (
              <Marker key={idx} position={l.pos} icon={createEmojiIcon(l.icon)}>
                {currentZoom >= 15 && (
                  <Tooltip
                    permanent
                    direction="bottom"
                    offset={[0, 5]}
                    opacity={0.9}
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
                weight: 4,
                opacity: 0.8,
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
                weight: 12,
                opacity: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {geometry && (
            <Polyline
              positions={geometry as L.LatLngExpression[][]}
              pathOptions={{
                color: '#000080',
                weight: 6,
                opacity: 1.0,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}
        </MapContainer>

        <div
          className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${theme === 'dark' ? 'from-slate-900' : 'from-slate-50'} to-transparent pointer-events-none z-[400]`}
        />
        <div
          className={`absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t ${theme === 'dark' ? 'from-slate-900' : 'from-slate-50'} to-transparent pointer-events-none z-[400]`}
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

export default MapArea;
