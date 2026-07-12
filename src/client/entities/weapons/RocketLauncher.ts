import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class RocketLauncher extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 8); // 8 is the Config ID for ROCKET LAUNCHER
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        
        const stats = this.config.primary;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 800) : -(stats.speed ?? 800);
        
        // Standard payload driven by config parameters
        this.scene.spawnRocket(
            playerSprite.x, 
            playerSprite.y, 
            dirX, 
            0, 
            shooter, 
            stats.kbX ?? 900, 
            stats.kbY ?? -600, 
            stats.homing ?? 0, 
            stats.damage
        );
        this.applyHorizontalRecoil(shooter, stats.recoil ?? 300);
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        
        const stats = this.config.secondary;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 600) : -(stats.speed ?? 600);
        
        // Advanced tracking rocket driven by config parameters
        this.scene.spawnRocket(
            playerSprite.x, 
            playerSprite.y, 
            dirX, 
            stats.speedY ?? -200, 
            shooter, 
            stats.kbX ?? 800, 
            stats.kbY ?? -500, 
            stats.homing ?? 0.05, 
            stats.damage
        );
        this.applyHorizontalRecoil(shooter, stats.recoil ?? 300);
        this.consumeAmmo(1);
    }
}