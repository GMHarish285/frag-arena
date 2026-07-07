import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { IArena, Weapon } from '../entities/weapons/Weapon';
import { Pistol } from '../entities/weapons/Pistol';
import { SMG } from '../entities/weapons/SMG';
import { Knife } from '../entities/weapons/Knife';
import { BombWeapon } from '../entities/weapons/Bomb';

export class ArenaScene extends Phaser.Scene implements IArena {
    private player1!: Player;
    private dummy!: Player;
    private playersGroup!: Phaser.Physics.Arcade.Group;

    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private projectiles!: Phaser.Physics.Arcade.Group;
    private solidBombs!: Phaser.Physics.Arcade.Group;
    private ghostBombs!: Phaser.Physics.Arcade.Group;
    private meleeSlashes!: Phaser.Physics.Arcade.Group;
    
    private keys!: any;
    private ammoText!: Phaser.GameObjects.Text;
    
    private weapons: Weapon[] = [];
    private currentWeaponIndex: number = 0;

    constructor() { super({ key: 'ArenaScene' }); }

    create() {
        this.platforms = this.physics.add.staticGroup();
        this.createPlatform(960, 800, 800, 40, 0x888888);
        this.createPlatform(450, 600, 500, 40, 0x888888);
        this.createPlatform(1470, 600, 500, 40, 0x888888);

        // Initialize Players!
        this.playersGroup = this.physics.add.group();
        this.player1 = new Player(this, 960, 200, 'p1', 'team_A', 0xff4500); // Red
        this.dummy = new Player(this, 1200, 200, 'dummy', 'team_B', 0x0088ff); // Blue
        
        this.playersGroup.add(this.player1.sprite);
        this.playersGroup.add(this.dummy.sprite);

        // Projectile Textures & Groups
        this.generateTexture('bullet_tex', 20, 8, 0xffd700);
        this.generateTexture('pistol_thrown_tex', 30, 20, 0x555555);
        this.generateTexture('knife_tex', 40, 10, 0xcccccc);
        this.generateTexture('bomb_tex', 30, 30, 0xff0000);
        this.generateTexture('slash_tex', 60, 60, 0xffffff);

        this.projectiles = this.physics.add.group();
        this.solidBombs = this.physics.add.group();
        this.ghostBombs = this.physics.add.group();
        this.meleeSlashes = this.physics.add.group();

        // Environment Collisions
        this.physics.add.collider(this.playersGroup, this.platforms, undefined, this.oneWayCallback, this);
        this.physics.add.collider(this.solidBombs, this.platforms);

        // COMBAT OVERLAPS
        this.physics.add.overlap(this.playersGroup, this.projectiles, (p, proj) => this.handleHit(p, proj));
        this.physics.add.overlap(this.playersGroup, this.solidBombs, (p, bomb) => this.handleHit(p, bomb));
        this.physics.add.overlap(this.playersGroup, this.ghostBombs, (p, bomb) => this.handleHit(p, bomb));
        this.physics.add.overlap(this.playersGroup, this.meleeSlashes, (p, slash) => this.handleHit(p, slash, false));

        this.ammoText = this.add.text(50, 50, '', { fontSize: '32px', color: '#ffffff', fontStyle: 'bold' });

        this.weapons = [ new Pistol(this), new SMG(this), new Knife(this), new BombWeapon(this) ];
        this.equipWeapon(0);

        this.keys = this.input.keyboard!.addKeys('W,A,S,D,T,Y,ONE,TWO,THREE,FOUR') as any;
        this.setupDropdown();
    }

    // --- DAMAGE REGISTRATION & KNOCKBACK ---
    private handleHit(pSprite: any, hazard: any, destroyHazard: boolean = true) {
        const player = pSprite.getData('entity') as Player;
        const shooterId = hazard.getData('shooterId');
        const teamId = hazard.getData('teamId');

        // Friendly Fire & Self-Hit Protection
        if (player.id === shooterId || player.teamId === teamId) return;

        player.applyKnockback(hazard.getData('kbX'), hazard.getData('kbY'));
        
        if (destroyHazard) hazard.destroy();
    }

    // --- INTERFACE IMPLEMENTATIONS ---
    getTime() { return this.time.now; }
    addTimer(delay: number, callback: () => void, repeat: number = 0) { this.time.addEvent({ delay, callback, repeat }); }
    updateAmmoUI(text: string) { this.ammoText.setText(text); }

    spawnProjectile(x: number, y: number, velocityX: number, texture: string, hasGravity: boolean, shooter: Player, kbX: number, kbY: number) {
        const proj = this.projectiles.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;
        (proj.body as any).allowGravity = hasGravity;
        proj.setVelocityX(velocityX);
        if (hasGravity) proj.setVelocityY(-200);

        // Inject memory so the engine knows who owns it and how hard it hits
        proj.setData('shooterId', shooter.id);
        proj.setData('teamId', shooter.teamId);
        const directionMult = shooter.facingDirection === 'RIGHT' ? 1 : -1;
        proj.setData('kbX', kbX * directionMult);
        proj.setData('kbY', kbY);
    }

    spawnBomb(x: number, y: number, velocityX: number, velocityY: number, isSolid: boolean, shooter: Player, kbX: number, kbY: number) {
        const group = isSolid ? this.solidBombs : this.ghostBombs;
        const bomb = group.create(x, y, 'bomb_tex') as Phaser.Physics.Arcade.Sprite;
        if (!isSolid) (bomb.body as any).allowGravity = true;
        
        bomb.setBounce(0.5);
        bomb.setDrag(100, 0);
        bomb.setVelocity(velocityX, velocityY);

        bomb.setData('shooterId', shooter.id);
        bomb.setData('teamId', shooter.teamId);
        const directionMult = shooter.facingDirection === 'RIGHT' ? 1 : -1;
        bomb.setData('kbX', kbX * directionMult);
        bomb.setData('kbY', kbY);

        this.time.delayedCall(2000, () => { if (bomb.active) bomb.destroy(); });
    }

    spawnMeleeSlash(x: number, y: number, facing: 'LEFT' | 'RIGHT', shooter: Player, kbX: number, kbY: number) {
        const offset = facing === 'RIGHT' ? 50 : -50;
        const slash = this.meleeSlashes.create(x + offset, y, 'slash_tex') as Phaser.Physics.Arcade.Sprite;
        (slash.body as any).allowGravity = false;
        slash.setAlpha(0.8);
        
        slash.setData('shooterId', shooter.id);
        slash.setData('teamId', shooter.teamId);
        slash.setData('kbX', facing === 'RIGHT' ? kbX : -kbX);
        slash.setData('kbY', kbY);

        this.tweens.add({ targets: slash, alpha: 0, duration: 150, onComplete: () => slash.destroy() });
    }

    // --- GAME LOOP ---
    override update(time: number) {
        // Player 1 updates based on keys. Dummy updates autonomously (just receives gravity & knockback!)
        this.player1.update(this.keys);
        this.dummy.update();

        if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.equipWeapon(0);
        if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.equipWeapon(1);
        if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.equipWeapon(2);
        if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) this.equipWeapon(3);

        const currentWeapon = this.weapons[this.currentWeaponIndex];
        if (currentWeapon) {
            // Player 1 fires the weapon!
            if (this.keys.T.isDown) currentWeapon.primaryAttack(this.player1);
            if (this.keys.Y.isDown) currentWeapon.secondaryAttack(this.player1);
        }

        // Cleanup offscreen bullets
        this.projectiles.getChildren().forEach((b) => {
            const bullet = b as Phaser.Physics.Arcade.Sprite;
            if (bullet.active && (bullet.x < 0 || bullet.x > 1920)) this.projectiles.killAndHide(bullet);
        });
    }

    private equipWeapon(index: number) {
        this.currentWeaponIndex = index;
        const activeWeapon = this.weapons[this.currentWeaponIndex];
        if (activeWeapon) {
            activeWeapon.updateUI();
        }
        const dropdown = document.getElementById('weapon-selector') as HTMLSelectElement | null;
        if (dropdown) dropdown.value = String(index);
    }

    private setupDropdown() {
        const dropdown = document.getElementById('weapon-selector') as HTMLSelectElement | null;
        if (dropdown) {
            dropdown.value = String(this.currentWeaponIndex);
            dropdown.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                const index = parseInt(target.value, 10);
                if (!isNaN(index) && this.weapons[index]) { this.equipWeapon(index); target.blur(); }
            });
        }
    }

    private oneWayCallback(playerSprite: any, platform: any) {
        // Only let Player 1 actively drop down through platforms via the S key
        if (playerSprite === this.player1.sprite && this.keys.S.isDown) return false; 
        const pBody = playerSprite.body as Phaser.Physics.Arcade.Body;
        const platBody = platform.body as Phaser.Physics.Arcade.StaticBody;
        return pBody.prev.y + pBody.height <= platBody.position.y;
    }

    private generateTexture(key: string, w: number, h: number, color: number) {
        const g = this.add.graphics();
        g.fillStyle(color);
        g.fillRect(0, 0, w, h);
        g.generateTexture(key, w, h);
        g.destroy();
    }

    private createPlatform(x: number, y: number, width: number, height: number, color: number) {
        this.generateTexture(`plat_${width}x${height}`, width, height, color);
        const plat = this.platforms.create(x, y, `plat_${width}x${height}`);
        plat.body.checkCollision.down = false;
        plat.body.checkCollision.left = false;
        plat.body.checkCollision.right = false;
    }
}