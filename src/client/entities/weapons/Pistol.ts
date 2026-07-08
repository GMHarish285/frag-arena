import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Pistol extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 'PISTOL', 12, 250, 1000); 
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? 1200 : -1200;
        
        // Straight shot doing 15 damage
        this.scene.spawnProjectile(playerSprite.x, playerSprite.y + 10, dirX, 0, 'bullet_tex', false, shooter, 400, -100, 15);
        this.applyHorizontalRecoil(shooter, 150); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? 800 : -800;
        
        // Thrown empty pistol weapon frame arc payload doing 30 heavy blunt damage
        this.scene.spawnProjectile(playerSprite.x, playerSprite.y, dirX, 0, 'pistol_thrown_tex', true, shooter, 600, -200, 30);
        this.currentAmmo = 0; 
        this.triggerReload(2000); 
    }
}