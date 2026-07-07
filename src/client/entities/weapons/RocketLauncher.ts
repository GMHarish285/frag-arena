import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class RocketLauncher extends Weapon {
    constructor(scene: IArena) { super(scene, 'ROCKET LAUNCHER', 4, 1500, 1500); }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        // Standard straight rocket (Homing Strength = 0)
        this.scene.spawnRocket(shooter.sprite.x, shooter.sprite.y, shooter.facingDirection === 'RIGHT' ? 800 : -800, 0, shooter, 900, -600, 0);
        this.applyHorizontalRecoil(shooter, 300);
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        // Homing Missile (Homing Strength = 0.05 interpolation)
        this.scene.spawnRocket(shooter.sprite.x, shooter.sprite.y, shooter.facingDirection === 'RIGHT' ? 600 : -600, -200, shooter, 800, -500, 0.05);
        this.applyHorizontalRecoil(shooter, 300);
        this.consumeAmmo(1);
    }
}