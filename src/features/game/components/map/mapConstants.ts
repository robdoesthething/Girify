import L from 'leaflet';

export const MAP_PADDING: [number, number] = [80, 80];
export const MAP_PADDING_MOBILE: [number, number] = [40, 40];
export const ANIMATION_DURATION = 2.0;
export const ANIMATION_TIMEOUT = 2100;
export const INITIAL_WAIT = 100;
export const CENTER_LAT = 41.3879;
export const CENTER_LNG = 2.1699;
export const INITIAL_ZOOM = 13;
export const MIN_ZOOM = 11;
export const MAX_ZOOM_ANIMATION = 15;
export const MAX_ZOOM_RECENTER = 18;
export const MAX_BOUNDS: L.LatLngBoundsExpression = [
  [41.2, 2.0],
  [41.6, 2.45],
];
export const BOUNDS_VISCOSITY = 0.5;
export const MOBILE_BREAKPOINT = 768;

export const ICON_SIZE: [number, number] = [30, 30];
export const ICON_ANCHOR: [number, number] = [15, 15];
export const TOOLTIP_OFFSET: [number, number] = [0, 5];
export const TOOLTIP_OPACITY = 0.9;

export const WEIGHT_THIN = 8;
export const WEIGHT_NORMAL = 10;
export const WEIGHT_THICK = 12;
export const WEIGHT_EXTRA_THICK = 16;
export const WEIGHT_HIGHLIGHT = 4;
export const OPACITY_LOW = 0.5;
export const OPACITY_HIGH = 1.0;
export const OPACITY_HIGHLIGHT = 0.8;

export const RECENTER_BUTTON_STYLE = { bottom: '20px', left: '20px', zIndex: 1000 };
