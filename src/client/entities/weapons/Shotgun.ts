import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Shotgun extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 6); // 6 is the Config ID for SHOTGUN
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo < 1) return;
        const dir = shooter.facingDirection === 'RIGHT' ? 1 : -1;
        const stats = this.config.primary;

        const pellets = stats.pellets ?? 3;
        const spreadRange = stats.spread ?? 150;
        const speed = stats.speed ?? 1000;

        // Automatically space out pellets symmetrically over your chosen spread limit
        for (let i = 0; i < pellets; i++) {
            let vy = 0;
            if (pellets > 1) {
                vy = -spreadRange + (spreadRange * 2 / (pellets - 1)) * i;
            }
            this.scene.spawnProjectile(
                shooter.sprite.x, 
                shooter.sprite.y, 
                speed * dir, 
                vy, 
                'bullet_tex', 
                false, 
                shooter, 
                stats.kbX ?? 200, 
                stats.kbY ?? -50, 
                stats.damage
            );
        }

        this.applyHorizontalRecoil(shooter, stats.recoil ?? 250); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo < 2) return;
        const dir = shooter.facingDirection === 'RIGHT' ? 1 : -1;
        const stats = this.config.secondary;

        const pellets = stats.pellets ?? 5;
        const spreadRange = stats.spread ?? 300;
        const speed = stats.speed ?? 1200;

        // Symmetrical spacing for heavy secondary burst configuration
        for (let i = 0; i < pellets; i++) {
            let vy = 0;
            if (pellets > 1) {
                vy = -spreadRange + (spreadRange * 2 / (pellets - 1)) * i;
            }
            this.scene.spawnProjectile(
                shooter.sprite.x, 
                shooter.sprite.y, 
                speed * dir, 
                vy, 
                'bullet_tex', 
                false, 
                shooter, 
                stats.kbX ?? 300, 
                stats.kbY ?? -100, 
                stats.damage
            );
        }

        this.applyHorizontalRecoil(shooter, stats.recoil ?? 400); 
        this.consumeAmmo(2);
    }
}