import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Umbrella extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 'UMBRELLA', Infinity, 400, 1500); 
    }

    override onPrimary(shooter: Player) {
        const playerSprite = shooter.sprite;
        // Steel rib jab doing 18 melee impact damage
        this.scene.spawnMeleeSlash(playerSprite.x, playerSprite.y, shooter.facingDirection, shooter, 300, -300, 18);
    }

    override onSecondary(shooter: Player) {
        shooter.isBlocking = true;
        this.scene.addTimer(1000, () => {
            shooter.isBlocking = false;
        });
    }
}