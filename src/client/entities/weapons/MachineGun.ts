import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class MachineGun extends Weapon {
    constructor(scene: IArena) { super(scene, 'MACHINE GUN', 50, 100, 600); }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        this.scene.spawnProjectile(shooter.sprite.x, shooter.sprite.y + 10, shooter.facingDirection === 'RIGHT' ? 1600 : -1600, 0, 'bullet_tex', false, shooter, 120, -50);
        this.applyHorizontalRecoil(shooter, 60); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        // Short range gun bash
        this.scene.spawnMeleeSlash(shooter.sprite.x, shooter.sprite.y, shooter.facingDirection, shooter, 400, -100);
    }
}