import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class BombWeapon extends Weapon {
    constructor(scene: IArena) { super(scene, 'BOMB', 5, 800, 800); }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        this.scene.spawnBomb(shooter.sprite.x, shooter.sprite.y - 20, shooter.facingDirection === 'RIGHT' ? 400 : -400, -500, true, shooter, 800, -700);
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        this.scene.spawnBomb(shooter.sprite.x, shooter.sprite.y - 20, shooter.facingDirection === 'RIGHT' ? 200 : -200, 100, false, shooter, 600, -500);
        this.consumeAmmo(1);
    }
}