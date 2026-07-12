import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';
import { GameConfig } from '../../config/ConfigManager';

export class BombWeapon extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 3); // 3 is the Config ID for BOMB
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        
        const stats = this.config.primary;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 400) : -(stats.speed ?? 400);
        
        // Standard high explosive bouncing mine driven by config
        this.scene.spawnBomb(
            playerSprite.x, 
            playerSprite.y - 20, 
            dirX, 
            stats.speedY ?? -500, 
            stats.isSolid ?? true, 
            shooter, 
            stats.kbX ?? 800, 
            stats.kbY ?? -700, 
            stats.damage
        );
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        
        const stats = this.config.secondary;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 200) : -(stats.speed ?? 200);
        
        // Phasing phantom proximity blast capsule driven by config
        this.scene.spawnBomb(
            playerSprite.x, 
            playerSprite.y - 20, 
            dirX, 
            stats.speedY ?? 100, 
            stats.isSolid ?? false, 
            shooter, 
            stats.kbX ?? 600, 
            stats.kbY ?? -500, 
            stats.damage
        );
        this.consumeAmmo(1);
    }
}