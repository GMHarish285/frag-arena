import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';
import { GameConfig } from '../../config/ConfigManager';
import Phaser from 'phaser';

export class BombWeapon extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 3); // 3 is the Config ID for BOMB
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        
        const stats = this.config.primary;
        const playerSprite = shooter.sprite;
        const speed = stats.speed ?? 400;
        let dirX = shooter.facingDirection === 'RIGHT' ? speed : -speed;
        let dirY = stats.speedY ?? -500;
        
        if (stats.angle !== undefined) {
            const rad = Phaser.Math.DegToRad(stats.angle);
            const facingMult = shooter.facingDirection === 'RIGHT' ? 1 : -1;
            dirX = Math.cos(rad) * speed * facingMult;
            dirY = Math.sin(rad) * speed;
        }
        
        // Standard high explosive bouncing mine driven by config
        this.scene.spawnBomb(
            playerSprite.x, 
            playerSprite.y - 20, 
            dirX, 
            dirY, 
            stats.isSolid ?? true, 
            shooter, 
            stats.kbX ?? 800, 
            stats.kbY ?? -700, 
            stats.damage,
            stats.detonateDelay ?? 2000
        );
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        
        const stats = this.config.secondary;
        const playerSprite = shooter.sprite;
        const speed = stats.speed ?? 200;
        let dirX = shooter.facingDirection === 'RIGHT' ? speed : -speed;
        let dirY = stats.speedY ?? 100;
        
        if (stats.angle !== undefined) {
            const rad = Phaser.Math.DegToRad(stats.angle);
            const facingMult = shooter.facingDirection === 'RIGHT' ? 1 : -1;
            dirX = Math.cos(rad) * speed * facingMult;
            dirY = Math.sin(rad) * speed;
        }
        
        // Phasing phantom proximity blast capsule driven by config
        this.scene.spawnBomb(
            playerSprite.x, 
            playerSprite.y - 20, 
            dirX, 
            dirY, 
            stats.isSolid ?? false, 
            shooter, 
            stats.kbX ?? 600, 
            stats.kbY ?? -500, 
            stats.damage,
            stats.detonateDelay ?? 2000
        );
        this.consumeAmmo(1);
    }
}