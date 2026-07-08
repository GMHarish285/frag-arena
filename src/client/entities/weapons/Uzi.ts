import Phaser from 'phaser';
import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Uzi extends Weapon {
    constructor(scene: IArena) { 
        super(scene, 'UZI', 40, 60, 60); 
    }

    override onPrimary(shooter: Player) {
        if (this.isReloading || this.currentAmmo <= 0) return;
        const playerSprite = shooter.sprite;
        const dirX = shooter.facingDirection === 'RIGHT' ? 1200 : -1200;

        // Straight-shot spray doing 7 damage per bullet
        this.scene.spawnProjectile(playerSprite.x, playerSprite.y + 10, dirX, 0, 'bullet_tex', false, shooter, 80, -20, 7);
        this.applyHorizontalRecoil(shooter, 40); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.isReloading || this.currentAmmo <= 0) return;
        const playerSprite = shooter.sprite;
        const dir = shooter.facingDirection === 'RIGHT' ? 1 : -1;
        const randomVy = Phaser.Math.Between(-300, 300);
        
        // Wild angled cone projectiles doing 9 damage per bullet
        this.scene.spawnProjectile(playerSprite.x, playerSprite.y + 10, 1000 * dir, randomVy, 'bullet_tex', false, shooter, 100, -40, 9);
        this.applyHorizontalRecoil(shooter, 50); 
        this.consumeAmmo(1);
    }
}