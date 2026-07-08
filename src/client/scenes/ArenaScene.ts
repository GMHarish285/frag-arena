import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { IArena, Weapon } from '../entities/weapons/Weapon';
import { Pistol } from '../entities/weapons/Pistol';
import { SMG } from '../entities/weapons/SMG';
import { Knife } from '../entities/weapons/Knife';
import { BombWeapon } from '../entities/weapons/Bomb';
import { Sniper } from '../entities/weapons/Sniper';
import { Umbrella } from '../entities/weapons/Umbrella';
import { Shotgun } from '../entities/weapons/Shotgun';
import { MachineGun } from '../entities/weapons/MachineGun';
import { RocketLauncher } from '../entities/weapons/RocketLauncher';
import { Uzi } from '../entities/weapons/Uzi';

export class ArenaScene extends Phaser.Scene implements IArena {
  private player1!: Player;
  public dummy!: Player;
  private playersGroup!: Phaser.Physics.Arcade.Group;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private rockets!: Phaser.Physics.Arcade.Group;
  private solidBombs!: Phaser.Physics.Arcade.Group;
  private meleeSlashes!: Phaser.Physics.Arcade.Group;

  private keys!: any;
  private ammoText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text; // Secondary scoreboard element

  private weapons: Weapon[] = [];
  private currentWeaponIndex: number = 0;

  constructor() {
    super({ key: 'ArenaScene' });
  }

  create() {
    this.platforms = this.physics.add.staticGroup();
    this.createPlatform(960, 800, 800, 40, 0x888888);
    this.createPlatform(450, 600, 500, 40, 0x888888);
    this.createPlatform(1470, 600, 500, 40, 0x888888);

    this.playersGroup = this.physics.add.group();

    // EASY BALANCE DEFAULTS: Configured to 100 Health and 10 Lives
    this.player1 = new Player(
      this,
      960,
      200,
      'p1',
      'team_A',
      0xff4500,
      100,
      10
    );
    this.dummy = new Player(
      this,
      1200,
      200,
      'dummy',
      'team_B',
      0x0088ff,
      100,
      10
    );

    this.playersGroup.add(this.player1.sprite);
    this.playersGroup.add(this.dummy.sprite);

    this.generateTexture('bullet_tex', 20, 8, 0xffd700);
    this.generateTexture('pistol_thrown_tex', 30, 20, 0x555555);
    this.generateTexture('knife_tex', 40, 10, 0xcccccc);
    this.generateTexture('bomb_tex', 30, 30, 0xff0000);
    this.generateTexture('rocket_tex', 40, 15, 0xff8800);
    this.generateTexture('slash_tex', 60, 60, 0xffffff);

    this.projectiles = this.physics.add.group();
    this.rockets = this.physics.add.group();
    this.solidBombs = this.physics.add.group();
    this.meleeSlashes = this.physics.add.group();

    this.physics.add.collider(
      this.playersGroup,
      this.platforms,
      undefined,
      this.oneWayCallback,
      this
    );
    this.physics.add.collider(
      this.solidBombs,
      this.platforms,
      undefined,(bomb: any) => {
            return !bomb.getData('isGhostBomb');
        },
      this
    );

    // Overlaps tracking and routing
    this.physics.add.overlap(this.playersGroup, this.projectiles, (p, proj) =>
      this.handleHit(p, proj)
    );
    this.physics.add.overlap(this.playersGroup, this.rockets, (p, r) =>
      this.handleHit(p, r, true)
    );
    this.physics.add.overlap(this.playersGroup, this.solidBombs, (p, bomb) =>
      this.handleHit(p, bomb)
    );
    this.physics.add.overlap(this.playersGroup, this.meleeSlashes, (p, slash) =>
      this.handleHit(p, slash, false)
    );

    this.ammoText = this.add.text(50, 50, '', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // Displays current stocks and current damage parameters dynamically
    this.scoreText = this.add.text(50, 100, '', {
      fontSize: '24px',
      color: '#818384',
      fontFamily: 'sans-serif',
    });

    this.weapons = [
      new Pistol(this),
      new SMG(this),
      new Knife(this),
      new BombWeapon(this),
      new Sniper(this),
      new Umbrella(this),
      new Shotgun(this),
      new MachineGun(this),
      new RocketLauncher(this),
      new Uzi(this),
    ];
    this.equipWeapon(0);

    this.keys = this.input.keyboard!.addKeys(
      'W,A,S,D,T,Y,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,NINE,ZERO'
    ) as any;
    this.setupDropdown();
  }

  private handleHit(pSprite: any, hazard: any, destroyHazard: boolean = true) {
    const player = pSprite.getData('entity') as Player;
    const shooterId = hazard.getData('shooterId');

    if (player.id === shooterId || player.teamId === hazard.getData('teamId'))
      return;

    if (player.isBlocking && !hazard.getData('isExplosive')) {
      const attackFromRight = hazard.x > player.sprite.x;
      if (
        (attackFromRight && player.facingDirection === 'RIGHT') ||
        (!attackFromRight && player.facingDirection === 'LEFT')
      ) {
        if (destroyHazard) hazard.destroy();
        return;
      }
    }

    // Apply health pool impact
    player.takeDamage(hazard.getData('damage'));
    player.applyKnockback(hazard.getData('kbX'), hazard.getData('kbY'));

    if (destroyHazard) {
      if (hazard.getData('isExplosive')) this.detonateExplosive(hazard);
      else hazard.destroy();
    }
  }

  private detonateExplosive(entity: any) {
    if (!entity.active) return;
    this.spawnMeleeSlash(entity.x, entity.y, 'RIGHT', this.player1, 0, 0, 0);
    entity.destroy();
  }

  getTime() {
    return this.time.now;
  }
  addTimer(delay: number, callback: () => void, repeat: number = 0) {
    this.time.addEvent({ delay, callback, repeat });
  }
  updateAmmoUI(text: string) {
    this.ammoText.setText(text);
  }

  // --- SPANWERS RECEIVING DATA PACKETS ---
  spawnProjectile(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    texture: string,
    hasGravity: boolean,
    shooter: Player,
    kbX: number,
    kbY: number,
    damage: number
  ) {
    const proj = this.projectiles.create(
      x,
      y,
      texture
    ) as Phaser.Physics.Arcade.Sprite;
    (proj.body as any).allowGravity = hasGravity;
    proj.setVelocity(velocityX, velocityY);

    proj.setData('shooterId', shooter.id);
    proj.setData('teamId', shooter.teamId);
    proj.setData('kbX', shooter.facingDirection === 'RIGHT' ? kbX : -kbX);
    proj.setData('kbY', kbY);
    proj.setData('damage', damage);
    proj.setData('isExplosive', false);
  }

  spawnRocket(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    shooter: Player,
    kbX: number,
    kbY: number,
    homingStrength: number,
    damage: number
  ) {
    const r = this.rockets.create(
      x,
      y,
      'rocket_tex'
    ) as Phaser.Physics.Arcade.Sprite;
    (r.body as any).allowGravity = false;
    r.setVelocity(velocityX, velocityY);

    r.setData('shooterId', shooter.id);
    r.setData('teamId', shooter.teamId);
    r.setData('kbX', shooter.facingDirection === 'RIGHT' ? kbX : -kbX);
    r.setData('kbY', kbY);
    r.setData('damage', damage);
    r.setData('isExplosive', true);
    r.setData('homingStrength', homingStrength);

    this.time.delayedCall(2500, () => {
      this.detonateExplosive(r);
    });
  }

  spawnBomb(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    isSolid: boolean,
    shooter: Player,
    kbX: number,
    kbY: number,
    damage: number
  ) {
    const bomb = this.solidBombs.create(
      x,
      y,
      'bomb_tex'
    ) as Phaser.Physics.Arcade.Sprite;
    (bomb.body as any).allowGravity = true;
    bomb.setBounce(0.5);
    bomb.setDrag(100, 0);
    bomb.setVelocity(velocityX, velocityY);

    bomb.setData('shooterId', shooter.id);
    bomb.setData('teamId', shooter.teamId);
    bomb.setData('kbX', shooter.facingDirection === 'RIGHT' ? kbX : -kbX);
    bomb.setData('kbY', kbY);
    bomb.setData('damage', damage);
    bomb.setData('isExplosive', true);
    bomb.setData('isGhostBomb', !isSolid);

    this.time.delayedCall(2000, () => {
      if (bomb.active) this.detonateExplosive(bomb);
    });
  }

  spawnMeleeSlash(
    x: number,
    y: number,
    facing: 'LEFT' | 'RIGHT',
    shooter: Player,
    kbX: number,
    kbY: number,
    damage: number
  ) {
    const offset = facing === 'RIGHT' ? 50 : -50;
    const slash = this.meleeSlashes.create(
      x + offset,
      y,
      'slash_tex'
    ) as Phaser.Physics.Arcade.Sprite;
    (slash.body as any).allowGravity = false;
    slash.setAlpha(0.8);

    slash.setData('shooterId', shooter.id);
    slash.setData('teamId', shooter.teamId);
    slash.setData('kbX', facing === 'RIGHT' ? kbX : -kbX);
    slash.setData('kbY', kbY);
    slash.setData('damage', damage);
    slash.setData('isExplosive', false);

    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 150,
      onComplete: () => slash.destroy(),
    });
  }

  override update(time: number) {
    this.player1.update(this.keys);
    this.dummy.update();

    // Update score HUD dynamically
    this.scoreText.setText(
      `P1: HP ${this.player1.health} | Stocks: ${this.player1.lives}\n` +
        `DUMMY: HP ${this.dummy.health} | Stocks: ${this.dummy.lives}`
    );

    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.equipWeapon(0);
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.equipWeapon(1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.equipWeapon(2);
    if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) this.equipWeapon(3);
    if (Phaser.Input.Keyboard.JustDown(this.keys.FIVE)) this.equipWeapon(4);
    if (Phaser.Input.Keyboard.JustDown(this.keys.SIX)) this.equipWeapon(5);
    if (Phaser.Input.Keyboard.JustDown(this.keys.SEVEN)) this.equipWeapon(6);
    if (Phaser.Input.Keyboard.JustDown(this.keys.EIGHT)) this.equipWeapon(7);
    if (Phaser.Input.Keyboard.JustDown(this.keys.NINE)) this.equipWeapon(8);
    if (Phaser.Input.Keyboard.JustDown(this.keys.ZERO)) this.equipWeapon(9);

    const currentWeapon = this.weapons[this.currentWeaponIndex];
    if (currentWeapon) {
      if (this.keys.T.isDown) currentWeapon.primaryAttack(this.player1);
      if (this.keys.Y.isDown) currentWeapon.secondaryAttack(this.player1);
    }

    this.rockets.getChildren().forEach((r) => {
      const rocket = r as Phaser.Physics.Arcade.Sprite;
      if (!rocket.active) return;
      const body = rocket.body as Phaser.Physics.Arcade.Body;
      if (!body) return;
      const homing = rocket.getData('homingStrength');
      if (homing > 0 && this.dummy.sprite.active) {
        const idealAngle = Phaser.Math.Angle.Between(
          rocket.x,
          rocket.y,
          this.dummy.sprite.x,
          this.dummy.sprite.y
        );
        const currentAngle = Math.atan2(body.velocity.y, body.velocity.x);
        const newAngle = Phaser.Math.Angle.RotateTo(
          currentAngle,
          idealAngle,
          homing
        );
        const speed = 700;
        rocket.setVelocity(
          Math.cos(newAngle) * speed,
          Math.sin(newAngle) * speed
        );
        rocket.setRotation(newAngle);
      }
    });

    this.projectiles.getChildren().forEach((b) => {
      const bullet = b as Phaser.Physics.Arcade.Sprite;
      if (bullet.active && (bullet.x < -200 || bullet.x > 2120))
        this.projectiles.killAndHide(bullet);
    });
  }

  private equipWeapon(index: number) {
    this.currentWeaponIndex = index;
    this.weapons[this.currentWeaponIndex]?.updateUI();
    const dropdown = document.getElementById(
      'weapon-selector'
    ) as HTMLSelectElement | null;
    if (dropdown) dropdown.value = String(index);
  }

  private setupDropdown() {
    const dropdown = document.getElementById(
      'weapon-selector'
    ) as HTMLSelectElement | null;
    if (dropdown) {
      dropdown.innerHTML = this.weapons
        .map((w, i) => `<option value="${i}">${w.name}</option>`)
        .join('');
      dropdown.value = String(this.currentWeaponIndex);
      dropdown.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const index = parseInt(target.value, 10);
        if (!isNaN(index) && this.weapons[index]) {
          this.equipWeapon(index);
          target.blur();
        }
      });
    }
  }

  private oneWayCallback(playerSprite: any, platform: any) {
    if (playerSprite === this.player1.sprite && this.keys.S.isDown)
      return false;
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

  private createPlatform(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ) {
    this.generateTexture(`plat_${width}x${height}`, width, height, color);
    const plat = this.platforms.create(x, y, `plat_${width}x${height}`);
    plat.body.checkCollision.down = false;
    plat.body.checkCollision.left = false;
    plat.body.checkCollision.right = false;
  }
}
