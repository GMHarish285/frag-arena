import Phaser from 'phaser';
import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Uzi extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 9); // 9 is the Config ID for UZI
    }

    override onPrimary(shooter: Player) {
        if (this.isReloading || this.currentAmmo <= 0) return;
        
        const stats = this.config.primary;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 1200) : -(stats.speed ?? 1200);

        // Straight-shot spray mechanics driven by config numbers
        this.scene.spawnProjectile(
            playerSprite.x, 
            playerSprite.y + 10, 
            dirX, 
            0, 
            'bullet_tex', 
            false, 
            shooter, 
            stats.kbX ?? 80, 
            stats.kbY ?? -20, 
            stats.damage
        );
        this.applyHorizontalRecoil(shooter, stats.recoil ?? 40); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.isReloading || this.currentAmmo <= 0) return;
        
        const stats = this.config.secondary;
        const playerSprite = shooter.sprite;
        const dir = shooter.facingDirection === 'RIGHT' ? 1 : -1;
        
        // Grab spread threshold out of configuration or fallback safely
        const spreadRange = stats.spread ?? 300;
        const randomVy = Phaser.Math.Between(-spreadRange, spreadRange);
        const speed = stats.speed ?? 1000;
        
        // Wild angled cone projectiles driven by config numbers
        this.scene.spawnProjectile(
            playerSprite.x, 
            playerSprite.y + 10, 
            speed * dir, 
            randomVy, 
            'bullet_tex', 
            false, 
            shooter, 
            stats.kbX ?? 100, 
            stats.kbY ?? -40, 
            stats.damage
        );
        this.applyHorizontalRecoil(shooter, stats.recoil ?? 40); 
        this.consumeAmmo(1);
    }
}