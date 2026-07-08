import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Knife extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 'KNIFE', Infinity, 400, 800); 
    }

    override onPrimary(shooter: Player) {
        const playerSprite = shooter.sprite;
        // Melee slash sweep doing 25 slice damage
        this.scene.spawnMeleeSlash(playerSprite.x, playerSprite.y, shooter.facingDirection, shooter, 300, -200, 25);
    }

    override onSecondary(shooter: Player) {
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? 1000 : -1000;
        
        // Ballistic thrown dagger arc doing 35 pierce damage
        this.scene.spawnProjectile(playerSprite.x, playerSprite.y, dirX, 0, 'knife_tex', true, shooter, 400, -150, 35);
    }
}