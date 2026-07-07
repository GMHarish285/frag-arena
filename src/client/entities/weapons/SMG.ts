import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class SMG extends Weapon {
    constructor(scene: IArena) { super(scene, 'SMG', 30, 80, 500); }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        this.scene.spawnProjectile(shooter.sprite.x, shooter.sprite.y + 10, shooter.facingDirection === 'RIGHT' ? 1400 : -1400, 'bullet_tex', false, shooter, 150, -50);
        this.applyHorizontalRecoil(shooter, 90); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo < 3) return; 
        this.scene.addTimer(80, () => {
            if (this.currentAmmo > 0 && !this.isReloading) {
                this.scene.spawnProjectile(shooter.sprite.x, shooter.sprite.y + 10, shooter.facingDirection === 'RIGHT' ? 1800 : -1800, 'bullet_tex', false, shooter, 250, -100);
                this.applyHorizontalRecoil(shooter, 140); 
                this.consumeAmmo(1);
            }
        }, 2); 
    }
}