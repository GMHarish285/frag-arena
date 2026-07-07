import Phaser from 'phaser'; 
import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Uzi extends Weapon {
  constructor(scene: IArena) {
    // Primary Cooldown: 60ms | Secondary Cooldown: 60ms (Fast spray!)
    super(scene, 'UZI', 40, 60, 60);
  }

  override onPrimary(shooter: Player) {
    // Strict guard: If reloading or out of ammo, do absolutely nothing
    if (this.isReloading || this.currentAmmo <= 0) return;

    this.scene.spawnProjectile(
      shooter.sprite.x,
      shooter.sprite.y + 10,
      shooter.facingDirection === 'RIGHT' ? 1200 : -1200,
      0, // Straight shot
      'bullet_tex',
      false,
      shooter,
      80,
      -20
    );

    this.applyHorizontalRecoil(shooter, 40);
    this.consumeAmmo(1);
  }

  override onSecondary(shooter: Player) {
    // Strict guard: Stop execution immediately if clip is empty or reloading
    if (this.isReloading || this.currentAmmo <= 0) return;

    const dir = shooter.facingDirection === 'RIGHT' ? 1 : -1;
    // Generate a random vertical angle for the wild spray cone
    const randomVy = Phaser.Math.Between(-300, 300);

    this.scene.spawnProjectile(
      shooter.sprite.x,
      shooter.sprite.y + 10,
      1000 * dir,
      randomVy, // Dynamic angled shot
      'bullet_tex',
      false,
      shooter,
      100,
      -40
    );

    this.applyHorizontalRecoil(shooter, 50);
    this.consumeAmmo(1);
  }
}
