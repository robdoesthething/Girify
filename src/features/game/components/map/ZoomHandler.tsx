import React from 'react';
import { useMapEvents } from 'react-leaflet';

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

export default ZoomHandler;
