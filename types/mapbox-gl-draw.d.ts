declare module '@mapbox/mapbox-gl-draw' {
  import { IControl, ControlPosition } from 'mapbox-gl';
  
  export default class MapboxDraw implements IControl {
    constructor(options?: any);
    onAdd(map: any): HTMLElement;
    onRemove(map: any): void;
    getDefaultPosition(): ControlPosition;
    changeMode(mode: string): void;
    [key: string]: any;
  }
}

