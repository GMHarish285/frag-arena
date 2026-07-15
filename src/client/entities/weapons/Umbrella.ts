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
        // Replaced by frame-by-frame hold logic in updateState
    }

    override updateState(keys: any, shooter: Player) {
        // Keep the umbrella open and active as long as the secondary button (Y) is held
        if (keys && keys.Y && keys.Y.isDown) {
            shooter.isBlocking = true;
        } else {
            shooter.isBlocking = false;
        }
    }
}