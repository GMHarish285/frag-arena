import Phaser from 'phaser';
import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class SMG extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 1); // 1 is the Config ID for SMG
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        
        const stats = this.config.primary;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 1400) : -(stats.speed ?? 1400);
        
        const spread = stats.spread ?? 0;
        const dirY = spread > 0 ? Phaser.Math.Between(-spread / 2, spread / 2) : 0;
        
        // Fast, light bullets driven by configuration
        this.scene.spawnProjectile(
            playerSprite.x, 
            playerSprite.y + 10, 
            dirX, 
            dirY, 
            'bullet_tex', 
            false, 
            shooter, 
            stats.kbX ?? 90, 
            stats.kbY ?? -40, 
            stats.damage
        );
        this.applyHorizontalRecoil(shooter, stats.recoil ?? 90); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo <= 0) return; 
        
        const stats = this.config.secondary;
        const speed = stats.speed ?? 1800;
        const damage = stats.damage;
        const kbX = stats.kbX ?? 140;
        const kbY = stats.kbY ?? -80;
        const recoil = stats.recoil ?? 150;

        const spread = stats.spread ?? 0;

        const fireBurstShot = () => {
            if (this.currentAmmo > 0 && !this.isReloading) {
                const playerSprite = shooter.sprite;
                const dirX = shooter.facingDirection === 'RIGHT' ? speed : -speed;
                const dirY = spread > 0 ? Phaser.Math.Between(-spread / 2, spread / 2) : 0;
                
                this.scene.spawnProjectile(
                    playerSprite.x, 
                    playerSprite.y + 10, 
                    dirX, 
                    dirY, 
                    'bullet_tex', 
                    false, 
                    shooter, 
                    kbX, 
                    kbY, 
                    damage
                );
                this.applyHorizontalRecoil(shooter, recoil);
                this.consumeAmmo(1);
            }
        };

        // Fire first shot instantly
        fireBurstShot();

        // Fire remaining 2 shots in burst
        this.scene.addTimer(80, fireBurstShot, 1);
    }
}