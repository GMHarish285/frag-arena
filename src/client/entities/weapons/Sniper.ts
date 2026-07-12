import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Sniper extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 4); // 4 is the Config ID for SNIPER
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        
        const stats = this.config.primary;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 2500) : -(stats.speed ?? 2500);
        
        // High-velocity armor piercing round driven by configuration parameters
        this.scene.spawnProjectile(
            playerSprite.x, 
            playerSprite.y, 
            dirX, 
            0, 
            'bullet_tex', 
            false, 
            shooter, 
            stats.kbX ?? 800, 
            stats.kbY ?? -200, 
            stats.damage
        );
        this.applyHorizontalRecoil(shooter, stats.recoil ?? 300); 
        this.consumeAmmo(1);
        
        // Force break invisibility parameters upon generating dynamic combat signatures
        if (shooter.isInvisible && typeof shooter.toggleInvisibility === 'function') {
            shooter.toggleInvisibility();
        }
    }

    override onSecondary(shooter: Player) {
        // Triggers safe tactical cloaking mechanism loops
        if (typeof shooter.toggleInvisibility === 'function') {
            shooter.toggleInvisibility();
        }
    }
}