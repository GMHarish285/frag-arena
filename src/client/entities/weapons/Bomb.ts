import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class BombWeapon extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 'BOMB', 5, 800, 800); 
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? 400 : -400;
        
        // Standard high explosive bouncing mine doing 40 blast damage
        this.scene.spawnBomb(playerSprite.x, playerSprite.y - 20, dirX, -500, true, shooter, 800, -700, 40);
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? 200 : -200;
        
        // Phasing phantom proximity blast capsule doing 30 bypass damage
        this.scene.spawnBomb(playerSprite.x, playerSprite.y - 20, dirX, 100, false, shooter, 600, -500, 30);
        this.consumeAmmo(1);
    }
}