import { Player } from '../Player';
import { GameConfig } from '../../config/ConfigManager';
import { WeaponBlueprint } from '../../config/WeaponConfig';

export interface IArena {
  spawnProjectile(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    texture: string,
    hasGravity: boolean,
    shooter: Player,
    kbX: number,
    kbY: number,
    damage: number,
    angularVelocity?: number
  ): void;
  spawnBomb(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    isSolid: boolean,
    shooter: Player,
    kbX: number,
    kbY: number,
    damage: number,
    detonateDelay: number
  ): void;
  spawnMeleeSlash(
    x: number,
    y: number,
    facing: 'LEFT' | 'RIGHT',
    shooter: Player,
    kbX: number,
    kbY: number,
    damage: number
  ): void;
  spawnShotgunBlast(
    x: number,
    y: number,
    facing: 'LEFT' | 'RIGHT',
    shooter: Player,
    kbX: number,
    kbY: number,
    damage: number,
    range: number,
    spread: number
  ): void;
  spawnRocket(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    shooter: Player,
    kbX: number,
    kbY: number,
    homingStrength: number,
    damage: number
  ): void;

  updateAmmoUI(text: string): void;
  getTime(): number;
  addTimer(delay: number, callback: () => void, repeat?: number): void;
  consumeGlobalAmmo(shooter: Player, amount: number): void;
}

export abstract class Weapon {
  public id: number;
  public name: string;
  public maxAmmo: number;
  public currentAmmo: number;
  public isReloading: boolean = false;

  public config: WeaponBlueprint;

  protected scene: IArena;
  protected primaryCooldown: number;
  protected secondaryCooldown: number;
  protected lastPrimary: number = 0;
  protected lastSecondary: number = 0;

  /**
   * Refactored to read configuration parameters cleanly out of GameConfig memory.
   * Allows live mods and runtime adjustments without mutating asset files!
   */
  constructor(scene: IArena, weaponId: number) {
    this.scene = scene;

    const weaponStats: WeaponBlueprint = GameConfig.weapons[weaponId]!;
    if (!weaponStats) {
      throw new Error(
        `Weapon Initialization Panic: ID ${weaponId} is missing from configuration registries.`
      );
    }

    this.config = weaponStats;
    this.id = weaponId;
    this.name = weaponStats.name;
    this.maxAmmo = weaponStats.maxAmmo;
    this.currentAmmo = weaponStats.maxAmmo;
    
    // Only the Pistol (id 0) uses internal magazines/reloads. Other weapons are 1-time use.
    if (weaponId !== 0) {
      this.maxAmmo = -1;
      this.currentAmmo = -1;
    }

    this.primaryCooldown = weaponStats.primaryCooldown;
    this.secondaryCooldown = weaponStats.secondaryCooldown;
  }

  public abstract onPrimary(shooter: Player): void;
  public abstract onSecondary(shooter: Player): void;
  
  // Optional frame-by-frame state management for held attacks/shields
  public updateState(keys: any, shooter: Player): void {}

  public primaryAttack(shooter: Player) {
    if (
      this.isReloading ||
      this.scene.getTime() < this.lastPrimary
    )
      return;
    this.lastPrimary = this.scene.getTime() + this.primaryCooldown;
    this.onPrimary(shooter);
  }

  public secondaryAttack(shooter: Player) {
    if (
      this.isReloading ||
      this.scene.getTime() < this.lastSecondary
    )
      return;
    this.lastSecondary = this.scene.getTime() + this.secondaryCooldown;
    this.onSecondary(shooter);
  }

  public triggerReload(duration: number = 1200, shooter?: Player) {
    // Safety exit check: Fallback defaults with Infinity capacity cannot enter reload sequences
    if (this.isReloading || this.maxAmmo === -1) return;

    this.isReloading = true;
    this.scene.updateAmmoUI(`${this.name}: RELOADING...`);

    if (shooter) {
       shooter.equipWeapon(this.id, duration); // Draw the weapon slowly over the reload duration
    }

    this.scene.addTimer(duration, () => {
      this.currentAmmo = this.maxAmmo;
      this.isReloading = false;
      this.updateUI();
    });
  }

  protected consumeAmmo(amount: number = 1, shooter?: Player) {
    if (this.maxAmmo === -1) return;
    this.currentAmmo -= amount;
    this.updateUI();
    if (this.currentAmmo <= 0) this.triggerReload(1200, shooter);
  }

  public updateUI() {
    const ammoStr = this.maxAmmo === -1 ? '∞' : this.currentAmmo;
    this.scene.updateAmmoUI(
      `${this.name}: ${ammoStr} / ${this.maxAmmo === -1 ? '∞' : this.maxAmmo}`
    );
  }

  protected applyHorizontalRecoil(shooter: Player, force: number) {
    if (!shooter.sprite || !shooter.sprite.body) return;
    const knockbackDirection = shooter.facingDirection === 'RIGHT' ? -1 : 1;
    
    // Apply visual recoil to pull arms backward
    shooter.applyVisualRecoil(Math.min(force * 0.05, 20));
    
    // Apply raw impulse. The new deterministic custom movement controller in Player.ts 
    // perfectly handles decay, drag, and speed caps without truncating impulses!
    shooter.sprite.body.velocity.x += force * knockbackDirection;
  }
}
