import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Sniper extends Weapon {
    constructor(scene: IArena) { super(scene, 'SNIPER', 5, 1200, 500); }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        // Bullet goes incredibly fast (2500) and hits very hard
        this.scene.spawnProjectile(shooter.sprite.x, shooter.sprite.y, shooter.facingDirection === 'RIGHT' ? 2500 : -2500, 0, 'bullet_tex', false, shooter, 800, -200);
        this.applyHorizontalRecoil(shooter, 300); 
        this.consumeAmmo(1);
        
        // Firing breaks invisibility!
        if (shooter.isInvisible) shooter.toggleInvisibility();
    }

    override onSecondary(shooter: Player) {
        // Toggle stealth
        shooter.toggleInvisibility();
    }
}