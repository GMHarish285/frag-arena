import { Player } from '../Player';

export interface IArena {
    // Spawners now require the shooter and the knockback (kbX, kbY) variables
    spawnProjectile(x: number, y: number, velocityX: number, texture: string, hasGravity: boolean, shooter: Player, kbX: number, kbY: number): void;
    spawnBomb(x: number, y: number, velocityX: number, velocityY: number, isSolid: boolean, shooter: Player, kbX: number, kbY: number): void;
    spawnMeleeSlash(x: number, y: number, facing: 'LEFT' | 'RIGHT', shooter: Player, kbX: number, kbY: number): void;
    
    updateAmmoUI(text: string): void;
    getTime(): number;
    addTimer(delay: number, callback: () => void, repeat?: number): void;
}

export abstract class Weapon {
    public name: string;
    public maxAmmo: number;
    public currentAmmo: number;
    public isReloading: boolean = false;
    
    protected scene: IArena;
    protected primaryCooldown: number;
    protected secondaryCooldown: number;
    protected lastPrimary: number = 0;
    protected lastSecondary: number = 0;

    constructor(scene: IArena, name: string, maxAmmo: number, primaryCd: number, secondaryCd: number) {
        this.scene = scene;
        this.name = name;
        this.maxAmmo = maxAmmo;
        this.currentAmmo = maxAmmo;
        this.primaryCooldown = primaryCd;
        this.secondaryCooldown = secondaryCd;
    }

    // Attacks now require the player holding the gun
    abstract onPrimary(shooter: Player): void;
    abstract onSecondary(shooter: Player): void;

    public primaryAttack(shooter: Player) {
        if (this.isReloading || this.scene.getTime() < this.lastPrimary) return;
        this.lastPrimary = this.scene.getTime() + this.primaryCooldown;
        this.onPrimary(shooter);
    }

    public secondaryAttack(shooter: Player) {
        if (this.isReloading || this.scene.getTime() < this.lastSecondary) return;
        this.lastSecondary = this.scene.getTime() + this.secondaryCooldown;
        this.onSecondary(shooter);
    }

    public triggerReload(duration: number = 1200) {
        if (this.isReloading || this.maxAmmo === Infinity) return;
        this.isReloading = true;
        this.scene.updateAmmoUI(`${this.name}: RELOADING...`);
        this.scene.addTimer(duration, () => {
            this.currentAmmo = this.maxAmmo;
            this.isReloading = false;
            this.updateUI();
        });
    }

    protected consumeAmmo(amount: number = 1) {
        if (this.maxAmmo === Infinity) return;
        this.currentAmmo -= amount;
        this.updateUI();
        if (this.currentAmmo <= 0) this.triggerReload();
    }

    public updateUI() {
        const ammoStr = this.maxAmmo === Infinity ? '∞' : this.currentAmmo;
        this.scene.updateAmmoUI(`${this.name}: ${ammoStr} / ${this.maxAmmo === Infinity ? '∞' : this.maxAmmo}`);
    }

    protected applyHorizontalRecoil(shooter: Player, power: number) {
        const pushVelocity = shooter.facingDirection === 'RIGHT' ? -power : power;
        shooter.sprite.setVelocityX(shooter.sprite.body.velocity.x + pushVelocity);
    }
}