import { IMapData, MAP_REGISTRY } from './MapConfig';

export interface ILayerConfig {
  texture: string;
  scrollFactorX: number;
  scrollFactorY: number;
  depth: number;
}

export interface ICrateConfig {
  enabled: boolean;
  spawnDelayMs: number;
  availableWeapons: number[];
}

export interface ICameraConfig {
  maxZoom: number;
  zoomInterpolation: number;
  panInterpolation: number;
}

export interface IArenaConfig {
  id: string;
  name: string;
  map: IMapData;
  layers: ILayerConfig[];
  crateConfig: ICrateConfig;
  defaultWeaponIndex: number;
  cameraConfig: ICameraConfig;
}

export const ARENA_REGISTRY: Record<string, IArenaConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic Arena',
    map: MAP_REGISTRY['classic']!,
    layers: [
      { texture: 'bg_layer_3', scrollFactorX: 0.2, scrollFactorY: 0.2, depth: -3 },
      { texture: 'bg_layer_2', scrollFactorX: 0.5, scrollFactorY: 0.5, depth: -2 },
      { texture: 'bg_layer_1', scrollFactorX: 0.8, scrollFactorY: 0.8, depth: -1 },
    ],
    crateConfig: {
      enabled: true,
      spawnDelayMs: 6000,
      availableWeapons: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    defaultWeaponIndex: 0,
    cameraConfig: {
      maxZoom: 1.6,
      zoomInterpolation: 0.05,
      panInterpolation: 0.1,
    },
  },
  verticalChasm: {
    id: 'verticalChasm',
    name: 'Vertical Chasm',
    map: MAP_REGISTRY['verticalChasm']!,
    layers: [
      { texture: 'bg_layer_3', scrollFactorX: 0.2, scrollFactorY: 0.2, depth: -3 },
      { texture: 'bg_layer_2', scrollFactorX: 0.5, scrollFactorY: 0.5, depth: -2 },
      { texture: 'bg_layer_1', scrollFactorX: 0.8, scrollFactorY: 0.8, depth: -1 },
    ],
    crateConfig: {
      enabled: true,
      spawnDelayMs: 6000,
      availableWeapons: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    defaultWeaponIndex: 0,
    cameraConfig: {
      maxZoom: 1.6,
      zoomInterpolation: 0.05,
      panInterpolation: 0.1,
    },
  },
  neonClassic: {
    id: 'neonClassic',
    name: 'Neon Classic Arena',
    map: MAP_REGISTRY['classic']!,
    layers: [
      { texture: 'neon_bg1', scrollFactorX: 0, scrollFactorY: 0.0, depth: -3 },
      { texture: 'neon_bg2', scrollFactorX: 0.3, scrollFactorY: 0.3, depth: -2 },
      { texture: 'neon_bg3', scrollFactorX: 0.7, scrollFactorY: 0.7, depth: -1 },
    ],
    crateConfig: {
      enabled: true,
      spawnDelayMs: 6000,
      availableWeapons: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    defaultWeaponIndex: 0,
    cameraConfig: {
      maxZoom: 1.0,
      zoomInterpolation: 0.05,
      panInterpolation: 0.1,
    },
  },
};
