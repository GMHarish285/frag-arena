import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Pistol extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 0); // 0 is the Config ID for PISTOL
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        
        const stats = this.config.primary;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 1200) : -(stats.speed ?? 1200);
        
        // Straight shot driven by config
        this.scene.spawnProjectile(
            playerSprite.x, 
            playerSprite.y + 10, 
            dirX, 
            0, 
            'bullet_tex', 
            false, 
            shooter, 
            stats.kbX ?? 400, 
            stats.kbY ?? -100, 
            stats.damage
        );
        this.applyHorizontalRecoil(shooter, stats.recoil ?? 150); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        const stats = this.config.secondary;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 800) : -(stats.speed ?? 800);
        
        // Thrown empty pistol weapon frame arc payload driven by config
        this.scene.spawnProjectile(
            playerSprite.x, 
            playerSprite.y, 
            dirX, 
            0, 
            'pistol_thrown_tex', 
            true, 
            shooter, 
            stats.kbX ?? 600, 
            stats.kbY ?? -200, 
            stats.damage
        );
        this.currentAmmo = 0; 
        this.triggerReload(2000); 
    }
}