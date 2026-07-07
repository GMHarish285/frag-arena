import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Shotgun extends Weapon {
    constructor(scene: IArena) { super(scene, 'SHOTGUN', 6, 800, 1200); }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo < 1) return;
        const dir = shooter.facingDirection === 'RIGHT' ? 1 : -1;
        // Shoot 3 pellets in a spread
        [-150, 0, 150].forEach(vy => {
            this.scene.spawnProjectile(shooter.sprite.x, shooter.sprite.y, 1000 * dir, vy, 'bullet_tex', false, shooter, 200, -50);
        });
        this.applyHorizontalRecoil(shooter, 250); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo < 2) return;
        const dir = shooter.facingDirection === 'RIGHT' ? 1 : -1;
        // Powerful 5 pellet blast
        [-300, -150, 0, 150, 300].forEach(vy => {
            this.scene.spawnProjectile(shooter.sprite.x, shooter.sprite.y, 1200 * dir, vy, 'bullet_tex', false, shooter, 300, -100);
        });
        this.applyHorizontalRecoil(shooter, 450); 
        this.consumeAmmo(2);
    }
}