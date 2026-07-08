import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Sniper extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 'SNIPER', 5, 1200, 500); 
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? 2500 : -2500;
        
        // High-velocity armor piercing round doing 55 damage
        this.scene.spawnProjectile(playerSprite.x, playerSprite.y, dirX, 0, 'bullet_tex', false, shooter, 800, -200, 55);
        this.applyHorizontalRecoil(shooter, 300); 
        this.consumeAmmo(1);
        
        if (shooter.isInvisible) {
            shooter.toggleInvisibility();
        }
    }

    override onSecondary(shooter: Player) {
        shooter.toggleInvisibility();
    }
}