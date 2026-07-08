import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class MachineGun extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 'MACHINE GUN', 50, 100, 600); 
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo <= 0) return;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? 1600 : -1600;
        
        // Sustained heavy suppression rounds doing 14 damage per hit
        this.scene.spawnProjectile(playerSprite.x, playerSprite.y + 10, dirX, 0, 'bullet_tex', false, shooter, 120, -50, 14);
        this.applyHorizontalRecoil(shooter, 60); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        const playerSprite = shooter.sprite;
        // Heavy rifle stock butt-strike doing 28 damage
        this.scene.spawnMeleeSlash(playerSprite.x, playerSprite.y, shooter.facingDirection, shooter, 400, -100, 28);
    }
}