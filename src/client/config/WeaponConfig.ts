export type WeaponTier = 'DEFAULT' | 'CRATE';

export interface AttackConfig {
  damage: number;
  speed?: number; // Linear speed for physics-based projectiles
  speedY?: number; // Vertical velocity for arcs/lobbed items (e.g. Bomb)
  recoil?: number; // Knockback applied to the shooter when firing
  kbX?: number; // Horizontal knockback applied to the target hit
  kbY?: number; // Vertical knockback applied to the target hit
  pellets?: number; // Count of multi-pellet configurations (Shotgun)
  spread?: number; // Total vertical variation range for multi-pellets
  isSolid?: boolean; // Structural property flag for explosives
  homing?: number; // Homing scaling multiplier coefficients (Rockets)
}

export interface WeaponBlueprint {
  id: number;
  name: string;
  maxAmmo: number; // Evaluates to Infinity for starter fallback classes
  tier: WeaponTier;
  primaryCooldown: number;
  secondaryCooldown: number;
  primary: AttackConfig;
  secondary: AttackConfig;
}

export const BaseWeaponConfig: Record<number, WeaponBlueprint> = {
  // 0: PISTOL (Default Starter Fallback Loadout)
  0: {
    id: 0,
    name: 'PISTOL',
    maxAmmo: 12, // Standard capacity before triggers enforce reload limits
    tier: 'DEFAULT',
    primaryCooldown: 250,
    secondaryCooldown: 1000,
    primary: { damage: 15, speed: 1200, recoil: 150, kbX: 400, kbY: -100 },
    secondary: { damage: 30, speed: 800, recoil: 0, kbX: 600, kbY: -200 }, // Thrown weapon payload frame
  },

  // 1: SMG (Submachine Gun Crate Drop)
  1: {
    id: 1,
    name: 'SMG',
    maxAmmo: 30,
    tier: 'CRATE',
    primaryCooldown: 80,
    secondaryCooldown: 500,
    primary: { damage: 8, speed: 1400, recoil: 90, kbX: 90, kbY: -40 },
    secondary: { damage: 12, speed: 1800, recoil: 150, kbX: 140, kbY: -80 }, // Heavy tracer burst logic
  },

  // 2: TACTICAL KNIFE (Melee / Bladed Fallback Drop Variant)
  2: {
    id: 2,
    name: 'KNIFE',
    maxAmmo: Infinity, // Melee weapon frame that never depletes or locks down
    tier: 'DEFAULT',
    primaryCooldown: 400,
    secondaryCooldown: 800,
    primary: { damage: 25, kbX: 300, kbY: -200 }, // Melee sweep slice coordinates
    secondary: { damage: 35, speed: 1000, kbX: 400, kbY: -150 }, // Thrown dagger velocity profiles
  },

  // 3: EXPLOSIVE BOMB (Grenade/Mine Weapon Node)
  3: {
    id: 3,
    name: 'BOMB',
    maxAmmo: 5,
    tier: 'CRATE',
    primaryCooldown: 800,
    secondaryCooldown: 800,
    primary: {
      damage: 40,
      speed: 400,
      speedY: -500,
      kbX: 800,
      kbY: -700,
      isSolid: true,
    }, // High-explosive bouncing mine
    secondary: {
      damage: 30,
      speed: 200,
      speedY: 100,
      kbX: 600,
      kbY: -500,
      isSolid: false,
    }, // Proximity capsule bypass module
  },

  // 4: SNIPER RIFLE (High-Velocity Piercing Rail Variant)
  4: {
    id: 4,
    name: 'SNIPER',
    maxAmmo: 5,
    tier: 'CRATE',
    primaryCooldown: 1200,
    secondaryCooldown: 500,
    primary: { damage: 55, speed: 2500, recoil: 300, kbX: 800, kbY: -200 }, // Armor piercing heavy bullet trace
    secondary: { damage: 0 }, // Cloaking tracking loop hook (handled procedurally by player visibility)
  },

  // 5: PARASOL UMBRELLA (Defensive Tactical Shield Asset)
  5: {
    id: 5,
    name: 'UMBRELLA',
    maxAmmo: Infinity,
    tier: 'DEFAULT',
    primaryCooldown: 400,
    secondaryCooldown: 1500,
    primary: { damage: 18, kbX: 300, kbY: -300 }, // Steel rib jab melee tracking vector
    secondary: { damage: 0 }, // Blocking active parry tracking shield duration loop
  },

  // 6: COMBAT SHOTGUN (Symmetrical Multi-Pellet Scatter Blaster)
  6: {
    id: 6,
    name: 'SHOTGUN',
    maxAmmo: 6,
    tier: 'CRATE',
    primaryCooldown: 800,
    secondaryCooldown: 1200,
    primary: {
      damage: 12,
      speed: 1000,
      recoil: 250,
      kbX: 200,
      kbY: -50,
      pellets: 3,
      spread: 150,
    },
    secondary: {
      damage: 15,
      speed: 1200,
      recoil: 400,
      kbX: 300,
      kbY: -100,
      pellets: 5,
      spread: 300,
    },
  },

  // 7: HEAVY MACHINE GUN (Sustained Automatic Suppression Frame)
  7: {
    id: 7,
    name: 'MACHINE GUN',
    maxAmmo: 50,
    tier: 'CRATE',
    primaryCooldown: 1000, // Safe threshold interval for tracking core loop cycles
    secondaryCooldown: 600,
    primary: { damage: 14, speed: 1600, recoil: 60, kbX: 120, kbY: -50 }, // Rapid automatic fire cycles
    secondary: { damage: 28, kbX: 400, kbY: -100 }, // Heavy rifle stock butt-strike physical push
  },

  // 8: TACTICAL ROCKET LAUNCHER (Heavy Ballistic Blast Cannon)
  8: {
    id: 8,
    name: 'ROCKET LAUNCHER',
    maxAmmo: 4,
    tier: 'CRATE',
    primaryCooldown: 1500,
    secondaryCooldown: 1500,
    primary: {
      damage: 45,
      speed: 800,
      recoil: 300,
      kbX: 900,
      kbY: -600,
      homing: 0,
    }, // Direct dumb rocket deployment
    secondary: {
      damage: 35,
      speed: 600,
      speedY: -200,
      recoil: 300,
      kbX: 800,
      kbY: -500,
      homing: 0.05,
    }, // Core guided tracking missile logic
  },

  // 9: COMPACT UZI (High-Spread Spray Machine Pistol)
  9: {
    id: 9,
    name: 'UZI',
    maxAmmo: 40,
    tier: 'CRATE',
    primaryCooldown: 60,
    secondaryCooldown: 60,
    primary: { damage: 7, speed: 1200, recoil: 40, kbX: 80, kbY: -20 }, // Linear straight vector spray stream
    secondary: {
      damage: 9,
      speed: 1000,
      recoil: 40,
      kbX: 100,
      kbY: -40,
      spread: 300,
    }, // Cone-based angular variance calculation
  },
};
