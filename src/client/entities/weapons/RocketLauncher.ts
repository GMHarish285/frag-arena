import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class RocketLauncher extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 'ROCKET LAUNCHER', 4, 1500, 1500); 
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? 800 : -800;
        
        // Standard dummy dumb rocket payload doing 45 base explosion damage
        this.scene.spawnRocket(playerSprite.x, playerSprite.y, dirX, 0, shooter, 900, -600, 0, 45);
        this.applyHorizontalRecoil(shooter, 300);
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? 600 : -600;
        
        // Advanced tracking missile doing 35 explosion damage
        this.scene.spawnRocket(playerSprite.x, playerSprite.y, dirX, -200, shooter, 800, -500, 0.05, 35);
        this.applyHorizontalRecoil(shooter, 300);
        this.consumeAmmo(1);
    }
}