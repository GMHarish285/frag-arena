import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Umbrella extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 5); // 5 is the Config ID for UMBRELLA
    }

    override onPrimary(shooter: Player) {
        const stats = this.config.primary;
        const playerSprite = shooter.sprite;
        
        // Melee impact check driven by configuration numbers
        this.scene.spawnMeleeSlash(
            playerSprite.x, 
            playerSprite.y, 
            shooter.facingDirection, 
            shooter, 
            stats.kbX ?? 300, 
            stats.kbY ?? -300, 
            stats.damage
        );
    }

    override onSecondary(shooter: Player) {
        // Enforce active damage reduction bounds via an engine-timed cycle
        shooter.isBlocking = true;
        this.scene.addTimer(1000, () => {
            shooter.isBlocking = false;
        });
    }
}