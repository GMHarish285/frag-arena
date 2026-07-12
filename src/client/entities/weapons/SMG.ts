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
        
        // Fast, light bullets driven by configuration
        this.scene.spawnProjectile(
            playerSprite.x, 
            playerSprite.y + 10, 
            dirX, 
            0, 
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
        if (this.currentAmmo < 3) return; 
        
        const stats = this.config.secondary;
        const speed = stats.speed ?? 1800;
        const damage = stats.damage;
        const kbX = stats.kbX ?? 140;
        const kbY = stats.kbY ?? -80;
        const recoil = stats.recoil ?? 150;

        // Fire a rhythmic burst pattern using the framework timer hook
        this.scene.addTimer(80, () => {
            if (this.currentAmmo > 0 && !this.isReloading) {
                const playerSprite = shooter.sprite;
                const dirX = shooter.facingDirection === 'RIGHT' ? speed : -speed;
                
                this.scene.spawnProjectile(
                    playerSprite.x, 
                    playerSprite.y + 10, 
                    dirX, 
                    0, 
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
        }, 3); // Executes exactly three burst passes
    }
}