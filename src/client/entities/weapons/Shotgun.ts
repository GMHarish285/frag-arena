import { Weapon, IArena } from './Weapon';
import { Player } from '../Player';

export class Shotgun extends Weapon {
    // --- EASY PARAMETER BALANCING CONFIGURATIONS ---
    private readonly primaryPellets = 3;
    private readonly primarySpreadRange = 150; // Vertical variance
    private readonly primaryDamagePerPellet = 12;

    private readonly secondaryPellets = 5;
    private readonly secondarySpreadRange = 300; // Vertical variance
    private readonly secondaryDamagePerPellet = 15;

    constructor(scene: IArena) { 
        super(scene, 'SHOTGUN', 6, 800, 1200); 
    }

    override onPrimary(shooter: Player) {
        if (this.currentAmmo < 1) return;
        const dir = shooter.facingDirection === 'RIGHT' ? 1 : -1;

        // Automatically space out pellets symmetrically over your chosen spread limit
        for (let i = 0; i < this.primaryPellets; i++) {
            let vy = 0;
            if (this.primaryPellets > 1) {
                vy = -this.primarySpreadRange + (this.primarySpreadRange * 2 / (this.primaryPellets - 1)) * i;
            }
            this.scene.spawnProjectile(
                shooter.sprite.x, shooter.sprite.y, 
                1000 * dir, vy, 'bullet_tex', false, shooter, 
                200, -50, this.primaryDamagePerPellet // Pass damage directly
            );
        }

        this.applyHorizontalRecoil(shooter, 250); 
        this.consumeAmmo(1);
    }

    override onSecondary(shooter: Player) {
        if (this.currentAmmo < 2) return;
        const dir = shooter.facingDirection === 'RIGHT' ? 1 : -1;

        // Symmetrical spacing for heavy secondary burst configuration
        for (let i = 0; i < this.secondaryPellets; i++) {
            let vy = 0;
            if (this.secondaryPellets > 1) {
                vy = -this.secondarySpreadRange + (this.secondarySpreadRange * 2 / (this.secondaryPellets - 1)) * i;
            }
            this.scene.spawnProjectile(
                shooter.sprite.x, shooter.sprite.y, 
                1200 * dir, vy, 'bullet_tex', false, shooter, 
                300, -100, this.secondaryDamagePerPellet // Pass damage directly
            );
        }

        this.applyHorizontalRecoil(shooter, 450); 
        this.consumeAmmo(2);
    }
}