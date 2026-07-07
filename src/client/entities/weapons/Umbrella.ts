import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Umbrella extends Weapon {
    constructor(scene: IArena) { super(scene, 'UMBRELLA', Infinity, 400, 1500); }

    override onPrimary(shooter: Player) {
        // Short range thwack
        this.scene.spawnMeleeSlash(shooter.sprite.x, shooter.sprite.y, shooter.facingDirection, shooter, 300, -300);
    }

    override onSecondary(shooter: Player) {
        // Deploy shield for 1000ms. Prevents incoming non-explosive damage from the front!
        shooter.isBlocking = true;
        this.scene.addTimer(1000, () => {
            shooter.isBlocking = false;
        });
    }
}