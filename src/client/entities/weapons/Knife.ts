import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Knife extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 2); // 2 is the Config ID for KNIFE
    }

    override onPrimary(shooter: Player) {
        const stats = this.config.primary;
        const playerSprite = shooter.sprite;
        
        // Melee slash sweep driven by config
        this.scene.spawnMeleeSlash(
            playerSprite.x, 
            playerSprite.y, 
            shooter.facingDirection, 
            shooter, 
            stats.kbX ?? 300, 
            stats.kbY ?? -200, 
            stats.damage
        );
    }

    override onSecondary(shooter: Player) {
        const stats = this.config.secondary;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? (stats.speed ?? 1000) : -(stats.speed ?? 1000);
        
        // Ballistic thrown dagger arc driven by config
        this.scene.spawnProjectile(
            playerSprite.x, 
            playerSprite.y, 
            dirX, 
            0, 
            'knife_tex', 
            true, 
            shooter, 
            stats.kbX ?? 400, 
            stats.kbY ?? -150, 
            stats.damage
        );
    }
}