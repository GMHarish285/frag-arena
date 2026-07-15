import Phaser from 'phaser';
import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class MachineGun extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 7); // 7 is the Config ID for MACHINE GUN
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        
        const stats = this.config.primary;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 1600) : -(stats.speed ?? 1600);
        
        const spreadRange = stats.spread ?? 50;
        const randomVy = Phaser.Math.Between(-spreadRange, spreadRange);
        
        // Sustained heavy suppression rounds driven by config parameters
        this.scene.spawnProjectile(
            playerSprite.x, 
            playerSprite.y + 10, 
            dirX, 
            randomVy, 
            'bullet_tex', 
            false, 
            shooter, 
            stats.kbX ?? 120, 
            stats.kbY ?? -50, 
            stats.damage
        );
        this.applyHorizontalRecoil(shooter, stats.recoil ?? 60); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        const stats = this.config.secondary;
        const playerSprite = shooter.sprite;
        
        // Heavy rifle stock butt-strike driven by config
        this.scene.spawnMeleeSlash(
            playerSprite.x, 
            playerSprite.y, 
            shooter.facingDirection, 
            shooter, 
            stats.kbX ?? 400, 
            stats.kbY ?? -100, 
            stats.damage
        );
    }
}