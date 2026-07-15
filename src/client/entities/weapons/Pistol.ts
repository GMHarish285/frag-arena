import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Pistol extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 0); // 0 is the Config ID for PISTOL
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo !== -1 && this.currentAmmo <= 0) return;
        
        const stats = this.config.primary;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 1200) : -(stats.speed ?? 1200);
        const spawnPos = shooter.getWeaponBarrelPosition();
        
        // Straight shot driven by config
        this.scene.spawnProjectile(
            spawnPos.x, 
            spawnPos.y, 
            dirX, 
            0, 
            'bullet_medium_tex', 
            false, 
            shooter, 
            stats.kbX ?? 400, 
            stats.kbY ?? -100, 
            stats.damage
        );
        this.applyHorizontalRecoil(shooter, stats.recoil ?? 150); 
        this.consumeAmmo(1, shooter);
    }

    override onSecondary(shooter: Player) {
        const stats = this.config.secondary;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 800) : -(stats.speed ?? 800);
        const spawnPos = shooter.getWeaponBarrelPosition();
        
        const angularVelocity = shooter.facingDirection === 'RIGHT' ? 500 : -500;
        
        // Thrown empty pistol weapon frame arc payload driven by config
        this.scene.spawnProjectile(
            spawnPos.x, 
            spawnPos.y, 
            dirX, 
            stats.speedY ?? -300, 
            'pistol_thrown_tex', 
            true, 
            shooter, 
            stats.kbX ?? 600, 
            stats.kbY ?? -200, 
            stats.damage,
            angularVelocity
        );
        this.currentAmmo = 0; 
        this.triggerReload(2000, shooter); 
        shooter.playThrowAnimation();
    }
}