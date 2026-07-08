import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class SMG extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 'SMG', 30, 80, 500); 
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? 1400 : -1400;
        
        // Fast, light bullets doing 8 damage per hit
        this.scene.spawnProjectile(playerSprite.x, playerSprite.y + 10, dirX, 0, 'bullet_tex', false, shooter, 90, -40, 8);
        this.applyHorizontalRecoil(shooter, 90); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo < 3) return; 
        
        this.scene.addTimer(80, () => {
            if (this.currentAmmo > 0 && !this.isReloading) {
                const playerSprite = shooter.sprite;
                const dirX = shooter.facingDirection === 'RIGHT' ? 1800 : -1800;
                
                // Heavy burst tracers doing 12 damage each
                this.scene.spawnProjectile(playerSprite.x, playerSprite.y + 10, dirX, 0, 'bullet_tex', false, shooter, 140, -80, 12);
                this.applyHorizontalRecoil(shooter, 140); 
                this.consumeAmmo(1);
            }
        }, 2); 
    }
}