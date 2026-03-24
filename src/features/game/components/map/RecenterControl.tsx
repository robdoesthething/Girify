import L from 'leaflet';
import React from 'react';
import { useMap } from 'react-leaflet';
import {
  INITIAL_ZOOM,
  MAP_PADDING,
  MAP_PADDING_MOBILE,
  MAX_ZOOM_RECENTER,
  MOBILE_BREAKPOINT,
  RECENTER_BUTTON_STYLE,
} from './mapConstants';

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

export default RecenterControl;
