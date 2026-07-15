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
  angle?: number; // Throw angle in degrees (0 is straight ahead)
  detonateDelay?: number; // Time in milliseconds before auto-detonating
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
    primaryCooldown: 450,
    secondaryCooldown: 1000,
    primary: { damage: 10, speed: 1200, recoil: 250, kbX: 1200, kbY: 0 },
    secondary: { damage: 10, speed: 2200, speedY: -400, recoil: 0, kbX: 1000, kbY: -300 }, // Thrown weapon payload frame
  },

  // 1: SMG (Submachine Gun Crate Drop)
  1: {
    id: 1,
    name: 'SMG',
    maxAmmo: 20,
    tier: 'CRATE',
    primaryCooldown: 150,
    secondaryCooldown: 500,
    primary: { damage: 5, speed: 1800, recoil: 80, kbX: 800, kbY: 0, spread: 170 },
    secondary: { damage: 5, speed: 1800, recoil: 50, kbX: 800, kbY: 0, spread: 100 }, // Heavy tracer burst logic
  },

  // 2: TACTICAL KNIFE (Melee / Bladed Fallback Drop Variant)
  2: {
    id: 2,
    name: 'KNIFE',
    maxAmmo: Infinity, // Melee weapon frame that never depletes or locks down
    tier: 'DEFAULT',
    primaryCooldown: 400,
    secondaryCooldown: 500,
    primary: { damage: 20, kbX: 1200, kbY: 0 }, // Melee sweep slice coordinates
    secondary: { damage: 15, speed: 3000, speedY: -350, kbX: 1500, kbY: 0 }, // Thrown dagger velocity profiles
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
      damage: 30,
      speed: 900,
      angle: -25,
      kbX: 800,
      kbY: -700,
      isSolid: true,
      detonateDelay: 2000,
    }, // High-explosive bouncing mine
    secondary: {
      damage: 30,
      speed: 1200,
      angle: -25,
      kbX: 600,
      kbY: -500,
      isSolid: false,
      detonateDelay: 1000,
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
    primary: { damage: 40, speed: 3500, recoil: 1200, kbX: 2400, kbY: 0 }, // Armor piercing heavy bullet trace
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
      damage: 15,
      speed: 100, // Effective Range
      recoil: 800,
      kbX: 1800,
      kbY: -300,
      pellets: 3, // Total Damage = 75 point-blank
      spread: 150, // Vertical AOE Height
    },
    secondary: {
      damage: 15,
      speed: 100, // Shorter range
      recoil: 1200,
      kbX: 3000,
      kbY: -400,
      pellets: 5, // Total Damage = 120 point-blank
      spread: 150, // Massive vertical spread
    },
  },

  // 7: HEAVY MACHINE GUN (Sustained Automatic Suppression Frame)
  7: {
    id: 7,
    name: 'MACHINE GUN',
    maxAmmo: 50,
    tier: 'CRATE',
    primaryCooldown: 200, // Safe threshold interval for tracking core loop cycles
    secondaryCooldown: 300,
    primary: { damage: 7, speed: 1600, recoil: 120, kbX: 900, kbY: 0, spread: 50 }, // Rapid automatic fire cycles
    secondary: { damage: 18, kbX: 800, kbY: -100 }, // Heavy rifle stock butt-strike physical push
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
      recoil: 900,
      kbX: 900,
      kbY: -600,
      homing: 0,
    }, // Direct dumb rocket deployment
    secondary: {
      damage: 35,
      speed: 600,
      speedY: -200,
      recoil: 900,
      kbX: 800,
      kbY: -500,
      homing: 0.015,
    }, // Core guided tracking missile logic
  },

  // 9: COMPACT UZI (High-Spread Spray Machine Pistol)
  9: {
    id: 9,
    name: 'UZI',
    maxAmmo: 40,
    tier: 'CRATE',
    primaryCooldown: 100,
    secondaryCooldown: 100,
    primary: { damage: 4, speed: 1200, recoil: 60, kbX: 300, kbY: 0, spread: 100 }, // Linear straight vector spray stream
    secondary: {
      damage: 9,
      speed: 1000,
      recoil: 180,
      kbX: 300,
      kbY: 0,
      spread: 300,
    }, // Cone-based angular variance calculation
  },
};
