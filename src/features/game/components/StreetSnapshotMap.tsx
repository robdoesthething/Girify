import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet';
import { Street } from '../../../types/game';
import { CENTER_LAT, CENTER_LNG } from './map/mapConstants';

const FitBounds: React.FC<{ geometry: number[][][] }> = ({ geometry }) => {
  const map = useMap();
  useEffect(() => {
    const allPoints = geometry.flat() as L.LatLngExpression[];
    if (allPoints.length === 0) {
      return;
    }
    try {
      map.fitBounds(allPoints as L.LatLngBoundsExpression, { padding: [24, 24], maxZoom: 16 });
    } catch {
      // ignore if map is unmounted
    }
  }, [geometry, map]);
  return null;
};

interface StreetSnapshotMapProps {
  street: Street;
  theme?: 'light' | 'dark';
}

const StreetSnapshotMap: React.FC<StreetSnapshotMapProps> = ({ street, theme = 'dark' }) => {
  const tileUrl =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

  return (
    <MapContainer
      key={street.id}
      center={[CENTER_LAT, CENTER_LNG]}
      zoom={14}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      attributionControl={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
      style={{ height: '160px', width: '100%', borderRadius: '0.75rem' }}
      className="pointer-events-none"
    >
      <TileLayer url={tileUrl} />
      <Polyline
        positions={street.geometry as L.LatLngExpression[][]}
        pathOptions={{ color: '#38bdf8', weight: 5, opacity: 1, lineCap: 'round' }}
      />
      <FitBounds geometry={street.geometry} />
    </MapContainer>
  );
};

export default StreetSnapshotMap;
