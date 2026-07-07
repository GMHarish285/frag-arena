import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Knife extends Weapon {
    constructor(scene: IArena) { super(scene, 'KNIFE', Infinity, 400, 800); }

    override onPrimary(shooter: Player) {
        this.scene.spawnMeleeSlash(shooter.sprite.x, shooter.sprite.y, shooter.facingDirection, shooter, 300, -200);
    }

    override onSecondary(shooter: Player) {
        this.scene.spawnProjectile(shooter.sprite.x, shooter.sprite.y, shooter.facingDirection === 'RIGHT' ? 1000 : -1000, 'knife_tex', true, shooter, 400, -150);
    }
}