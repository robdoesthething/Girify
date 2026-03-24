/* eslint-disable consistent-return */
import L from 'leaflet';
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import {
  ANIMATION_DURATION,
  ANIMATION_TIMEOUT,
  INITIAL_WAIT,
  MAP_PADDING,
  MAX_ZOOM_ANIMATION,
} from './mapConstants';

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

export default ChangeView;
