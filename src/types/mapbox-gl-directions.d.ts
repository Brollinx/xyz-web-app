declare module '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions' {
  import { Map, ControlPosition, IControl } from 'mapbox-gl';

  interface MapboxDirectionsOptions {
    accessToken: string;
    unit?: 'metric' | 'imperial';
    profile?: 'mapbox/driving' | 'mapbox/walking' | 'mapbox/cycling';
    alternatives?: boolean;
    geometries?: 'geojson' | 'polyline' | 'polyline6';
    controls?: {
      inputs?: boolean;
      instructions?: boolean;
      profileSwitcher?: boolean;
    };
    flyTo?: boolean;
    placeholderOrigin?: string;
    placeholderDestination?: string;
    zoom?: number;
    language?: string;
    interactive?: boolean;
    proximity?: [number, number];
    trackProximity?: boolean;
    steps?: boolean;
    container?: string | HTMLElement;
  }

  class MapboxDirections implements IControl { // Implement IControl
    constructor(options: MapboxDirectionsOptions);
    on(event: string, callback: (...args: any[]) => void): this;
    setOrigin(coordinates: [number, number]): this;
    setDestination(coordinates: [number, number]): this;
    removeRoutes(): this;
    addControl(map: Map, position?: ControlPosition): void;
    removeControl(map: Map): void;

    // IControl methods
    onAdd(map: Map): HTMLElement;
    onRemove(map: Map): void;
  }

  export default MapboxDirections;
}