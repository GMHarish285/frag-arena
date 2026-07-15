import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Shotgun extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 6); // 6 is the Config ID for SHOTGUN
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo !== -1 && this.currentAmmo < 1) return;
        const stats = this.config.primary;
        
        const pellets = stats.pellets ?? 3;
        const range = stats.speed ?? 500; // Shotgun range is much shorter now
        const spread = stats.spread ?? 200; // Vertical height of the AOE blast
        const totalDamage = (stats.damage ?? 12) * pellets;

        const spawnPos = shooter.getWeaponBarrelPosition();

        this.scene.spawnShotgunBlast(
            spawnPos.x, 
            spawnPos.y, 
            shooter.facingDirection, 
            shooter, 
            stats.kbX ?? 800, 
            stats.kbY ?? -200, 
            totalDamage,
            range,
            spread
        );

        this.applyHorizontalRecoil(shooter, stats.recoil ?? 250); 
        this.scene.consumeGlobalAmmo(shooter, 1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo !== -1 && this.currentAmmo < 2) return;
        const stats = this.config.secondary;

        const pellets = stats.pellets ?? 5;
        const range = stats.speed ?? 400; // Secondary is shorter but wider
        const spread = stats.spread ?? 400;
        const totalDamage = (stats.damage ?? 15) * pellets;

        const spawnPos = shooter.getWeaponBarrelPosition();

        this.scene.spawnShotgunBlast(
            spawnPos.x, 
            spawnPos.y, 
            shooter.facingDirection, 
            shooter, 
            stats.kbX ?? 1500, 
            stats.kbY ?? -300, 
            totalDamage,
            range,
            spread
        );

        this.applyHorizontalRecoil(shooter, stats.recoil ?? 400); 
        this.scene.consumeGlobalAmmo(shooter, 2);
    }
}