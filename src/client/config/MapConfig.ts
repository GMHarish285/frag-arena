export interface IPlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
}

export interface IMapData {
  id: string;
  name: string;
  platforms: IPlatformConfig[];
  spawnPoints: {
    player1: { x: number; y: number };
    dummy: { x: number; y: number };
  };
  deathY: number; // Y-coordinate benchmark below which players count as knocked off-stage
}

export const MAP_REGISTRY: Record<string, IMapData> = {
  classic: {
    id: 'classic',
    name: 'Classic Mayhem Arena',
    spawnPoints: {
      player1: { x: 760, y: 500 },
      dummy: { x: 1160, y: 500 },
    },
    deathY: 1100,
    platforms: [
      { x: 960, y: 800, width: 800, height: 40, color: 0x888888 }, // Main floor
      { x: 450, y: 600, width: 500, height: 40, color: 0x888888 }, // Left platform
      { x: 1470, y: 600, width: 500, height: 40, color: 0x888888 }, // Right platform
    ],
  },
  verticalChasm: {
    id: 'verticalChasm',
    name: 'Vertical Chasm',
    spawnPoints: {
      player1: { x: 500, y: 300 },
      dummy: { x: 1420, y: 300 },
    },
    deathY: 1100,
    platforms: [
      { x: 960, y: 950, width: 400, height: 40, color: 0xaa4444 }, // Small risky bottom center
      { x: 500, y: 700, width: 450, height: 40, color: 0x555555 },
      { x: 1420, y: 700, width: 450, height: 40, color: 0x555555 },
      { x: 960, y: 450, width: 500, height: 40, color: 0x666666 }, // High floating bridge
    ],
  },
  neonClassic: {
    id: 'neonClassic',
    name: 'Neon Complex Arena',
    spawnPoints: {
      player1: { x: 500, y: 300 },
      dummy: { x: 1420, y: 300 },
    },
    deathY: 1200,
    platforms: [
      { x: 960, y: 900, width: 800, height: 40, color: 0x111111 }, // Base floor
      { x: 400, y: 750, width: 350, height: 40, color: 0x222222 }, // Left lower
      { x: 1520, y: 750, width: 350, height: 40, color: 0x222222 }, // Right lower
      { x: 960, y: 600, width: 400, height: 40, color: 0x333333 }, // Center mid
      { x: 250, y: 500, width: 250, height: 40, color: 0x444444 }, // Far left high
      { x: 1670, y: 500, width: 250, height: 40, color: 0x444444 }, // Far right high
      { x: 960, y: 350, width: 200, height: 40, color: 0x555555 }, // Center high peak
    ],
  },
};
