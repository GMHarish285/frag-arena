import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Pistol extends Weapon {
    constructor(scene: IArena) { super(scene, 'PISTOL', 12, 250, 1000); }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        this.scene.spawnProjectile(shooter.sprite.x, shooter.sprite.y + 10, shooter.facingDirection === 'RIGHT' ? 1200 : -1200, 'bullet_tex', false, shooter, 400, -100);
        this.applyHorizontalRecoil(shooter, 150); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        this.scene.spawnProjectile(shooter.sprite.x, shooter.sprite.y, shooter.facingDirection === 'RIGHT' ? 800 : -800, 'pistol_thrown_tex', true, shooter, 600, -200);
        this.currentAmmo = 0; 
        this.triggerReload(2000); 
    }
}