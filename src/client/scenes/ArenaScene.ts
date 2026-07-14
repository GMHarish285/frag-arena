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
import { IMapData } from '../config/MapConfig';
import { ARENA_REGISTRY, IArenaConfig } from '../config/ArenaConfig';

// Define ammo/durability rules for crates (Index 0 is Pistol, handled as infinite)
const AMMO_CONFIG: Record<number, number> = {
  1: 30, // SMG (bullets)
  2: 5, // Knife (throws)
  3: 3, // Bomb (bombs)
  4: 5, // Sniper (bullets)
  5: 100, // Umbrella (health capacity)
  6: 8, // Shotgun (blasts)
  7: 50, // MachineGun (bullets)
  8: 4, // Rocket Launcher (rockets)
  9: 40, // Uzi (bullets)
};

export class ArenaScene extends Phaser.Scene implements IArena {
  private player1!: Player;
  public dummy!: Player;
  private playersGroup!: Phaser.Physics.Arcade.Group;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private crates!: Phaser.Physics.Arcade.StaticGroup; // New crates group

  private projectiles!: Phaser.Physics.Arcade.Group;
  private rockets!: Phaser.Physics.Arcade.Group;
  private solidBombs!: Phaser.Physics.Arcade.Group;
  private meleeSlashes!: Phaser.Physics.Arcade.Group;

  private keys!: any;
  private scoreText!: Phaser.GameObjects.Text;

  // Single instances of weapons to route logic
  private weapons: Weapon[] = [];

  // Independent Player States
  private p1WeaponIndex: number = 0;
  private p1Ammo: number = -1; // -1 represents infinite (Pistol)

  private dummyWeaponIndex: number = 0;
  private dummyAmmo: number = -1;

  private arenaConfig!: IArenaConfig;
  private currentArenaId: string = 'neonClassic';
  private bgLayers: Phaser.GameObjects.Image[] = [];
  private crateSpawnEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'ArenaScene' });
  }

  preload() {
    this.load.image('neon_bg1', 'assets/background/neon_arena_bg1.png');
    this.load.image('neon_bg2', 'assets/background/neon_arena_bg2.png');
    this.load.image('neon_bg3', 'assets/background/neon_arena_bg3.png');
  }

  create() {
    this.platforms = this.physics.add.staticGroup();
    this.crates = this.physics.add.staticGroup();
    this.playersGroup = this.physics.add.group();

    this.projectiles = this.physics.add.group();
    this.rockets = this.physics.add.group();
    this.solidBombs = this.physics.add.group();
    this.meleeSlashes = this.physics.add.group();

    // Asset Generation
    this.generateTexture('bullet_tex', 20, 8, 0xffd700);
    this.generateTexture('pistol_thrown_tex', 30, 20, 0x555555);
    this.generateTexture('knife_tex', 40, 10, 0xcccccc);
    this.generateTexture('bomb_tex', 30, 30, 0xff0000);
    this.generateTexture('rocket_tex', 40, 15, 0xff8800);
    this.generateTexture('slash_tex', 60, 60, 0xffffff);
    this.generateTexture('crate_tex', 32, 32, 0xd2b48c); // Supply Crate

    // Background layers placeholder textures
    this.generateTexture('bg_layer_3', 1920, 1080, 0x111133);
    this.generateTexture('bg_layer_2', 1920, 1080, 0x222244);
    this.generateTexture('bg_layer_1', 1920, 1080, 0x333355);

    this.buildArena(this.currentArenaId);

    const spawnPoints = this.arenaConfig.map.spawnPoints;
    this.player1 = new Player(
      this,
      spawnPoints.player1.x,
      spawnPoints.player1.y,
      'p1',
      'team_A',
      0xff4500,
      100,
      10
    );
    this.dummy = new Player(
      this,
      spawnPoints.dummy.x,
      spawnPoints.dummy.y,
      'dummy',
      'team_B',
      0x0088ff,
      100,
      10
    );

    this.playersGroup.add(this.player1.sprite);
    this.playersGroup.add(this.dummy.sprite);

    // Colliders & Overlaps
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
      undefined,
      (bomb: any) => !bomb.getData('isGhostBomb'),
      this
    );

    // Crate Pickup Overlap
    this.physics.add.overlap(this.playersGroup, this.crates, (p, c) =>
      this.handleCratePickup(p, c)
    );

    // We use a processCallback to COMPLETELY IGNORE physics checks between a player and their own projectiles.
    // This prevents Arcade Physics from falsely populating `touching` properties (which resets jump counts).
    const ignoreSelf = (p: any, hazard: any) => p.getData('entity').id !== hazard.getData('shooterId');

    this.physics.add.overlap(this.playersGroup, this.projectiles, 
      (p, proj) => this.handleHit(p, proj),
      ignoreSelf,
      this
    );
    this.physics.add.overlap(this.playersGroup, this.rockets, 
      (p, r) => this.handleHit(p, r, true),
      ignoreSelf,
      this
    );
    this.physics.add.overlap(this.playersGroup, this.solidBombs, 
      (p, bomb) => this.handleHit(p, bomb),
      ignoreSelf,
      this
    );
    this.physics.add.overlap(this.playersGroup, this.meleeSlashes, 
      (p, slash) => this.handleHit(p, slash, false),
      ignoreSelf,
      this
    );

    this.scoreText = this.add.text(50, 50, '', {
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

    // Equip default weapons based on config
    this.giveWeaponToPlayer(this.player1, this.arenaConfig.defaultWeaponIndex);
    this.giveWeaponToPlayer(this.dummy, this.arenaConfig.defaultWeaponIndex);

    this.keys = this.input.keyboard!.addKeys(
      'W,A,S,D,T,Y,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,NINE,ZERO'
    ) as any;

    // Add this inside ArenaScene's create() method:
    const quitBtn = this.add
      .text(20, 20, 'QUIT TO MENU', {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#ffffff',
        backgroundColor: '#ff3333',
        padding: { x: 10, y: 5 },
      })
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0) // Keeps the button glued to the camera so it doesn't move away
      .setDepth(100); // Keeps it rendered above the stickman

    quitBtn.on('pointerup', () => {
      // Tells the Scene Manager to shut down the arena and boot the menu
      this.scene.start('MainMenuScene');
    });

    this.createMobileHUD();
  }
  
  private createMobileHUD() {
    // Only show on touch devices
    if (!this.sys.game.device.input.touch) return;

    // We increase max pointers so multi-touch works flawlessly (e.g. holding run + shoot + jump)
    this.input.addPointer(3);

    const dispatchKey = (type: 'keydown' | 'keyup', keyName: string) => {
      const keyCode = keyName.charCodeAt(0);
      window.dispatchEvent(new KeyboardEvent(type, { 
        key: keyName.toLowerCase(), 
        code: `Key${keyName}`, 
        keyCode: keyCode,
        which: keyCode,
        bubbles: true
      }));
    };

    const createBtn = (x: number, y: number, text: string, keyNames: string[], radius: number = 60) => {
      const circle = this.add.circle(x, y, radius, 0x333333, 0.6)
        .setScrollFactor(0)
        .setDepth(1000)
        .setInteractive();

      this.add.text(x, y, text, { fontSize: '32px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1001);

      let isPressed = false;

      const press = () => {
        if (isPressed) return;
        isPressed = true;
        circle.setFillStyle(0x888888, 0.9);
        keyNames.forEach(k => dispatchKey('keydown', k));
      };

      const release = () => {
        if (!isPressed) return;
        isPressed = false;
        circle.setFillStyle(0x333333, 0.6);
        keyNames.forEach(k => dispatchKey('keyup', k));
      };

      circle.on('pointerdown', press);
      
      // Allow sliding finger into the button
      circle.on('pointerover', (pointer: Phaser.Input.Pointer) => {
        if (pointer.isDown) press();
      });

      circle.on('pointerup', release);
      circle.on('pointerout', release); // Allow sliding finger off the button

      return circle;
    };

    // --- LEFT SIDE: MOVEMENT (A, D) ---
    const leftX = 250;
    const leftY = 850;
    const leftSpacing = 130;

    createBtn(leftX - leftSpacing, leftY, 'A', ['A'], 70);       // LEFT
    createBtn(leftX + leftSpacing, leftY, 'D', ['D'], 70);       // RIGHT

    // --- RIGHT SIDE: ACTIONS (W, S, T, Y) ---
    const rightX = 1920 - 300;
    const rightY = 800;
    const rightSpacing = 130;

    createBtn(rightX, rightY - rightSpacing, 'W\n(JUMP)', ['W'], 65);     // UP / JUMP
    createBtn(rightX, rightY + rightSpacing, 'S\n(DROP)', ['S'], 65);     // DOWN / DROP
    
    // Primary Fire (T)
    createBtn(rightX - rightSpacing, rightY, 'PRI\n(T)', ['T'], 70);
    
    // Secondary Fire (Y)
    createBtn(rightX + rightSpacing, rightY, 'SEC\n(Y)', ['Y'], 60);
  }

  public buildArena(arenaId: string) {
    const config = ARENA_REGISTRY[arenaId];
    if (!config) return;
    this.currentArenaId = arenaId;
    
    // Deep copy the arena configuration for runtime mods
    this.arenaConfig = JSON.parse(JSON.stringify(config));
    
    this.platforms.clear(true, true);
    
    // Clear old background layers
    this.bgLayers.forEach((bg) => bg.destroy());
    this.bgLayers = [];
    
    // Build Background Layers
    this.arenaConfig.layers.forEach((layer) => {
      const bg = this.add.image(960, 540, layer.texture); // screen center ish
      bg.setScrollFactor(layer.scrollFactorX, layer.scrollFactorY);
      if (layer.depth !== undefined) {
        bg.setDepth(layer.depth);
      }
      this.bgLayers.push(bg);
    });

    this.arenaConfig.map.platforms.forEach((plat) => {
      this.createPlatform(plat.x, plat.y, plat.width, plat.height, plat.color);
    });

    if (this.player1 && this.dummy) {
      this.player1.sprite.setPosition(
        this.arenaConfig.map.spawnPoints.player1.x,
        this.arenaConfig.map.spawnPoints.player1.y
      );
      this.dummy.sprite.setPosition(
        this.arenaConfig.map.spawnPoints.dummy.x,
        this.arenaConfig.map.spawnPoints.dummy.y
      );
    }
    
    // Reset crate spawning timer
    if (this.crateSpawnEvent) {
      this.crateSpawnEvent.destroy();
    }
    if (this.arenaConfig.crateConfig.enabled) {
      this.crateSpawnEvent = this.time.addEvent({
        delay: this.arenaConfig.crateConfig.spawnDelayMs,
        callback: this.spawnCrate,
        callbackScope: this,
        loop: true,
      });
    }
  }

  // --- CRATE & WEAPON MANAGEMENT ---

  private spawnCrate() {
    // Clear any existing unclaimed crates from the map first
    this.crates.clear(true, true);

    const platforms = this.arenaConfig.map.platforms;
    if (!platforms || platforms.length === 0) return;

    // Pick a random platform
    const plat = Phaser.Utils.Array.GetRandom(platforms);

    // Calc valid boundaries on top of the platform
    const minX = plat.x - plat.width / 2 + 16;
    const maxX = plat.x + plat.width / 2 - 16;

    const spawnX = Phaser.Math.Between(minX, maxX);
    const spawnY = plat.y - plat.height / 2 - 16; // Rest perfectly on top

    this.crates.create(spawnX, spawnY, 'crate_tex');
  }

  private handleCratePickup(pSprite: any, crateSprite: any) {
    crateSprite.destroy(); // Consume crate
    const player = pSprite.getData('entity') as Player;

    const availableWeapons = this.arenaConfig.crateConfig.availableWeapons;
    let randomWepIndex = 0;
    if (availableWeapons.length > 0) {
      randomWepIndex = Phaser.Utils.Array.GetRandom(availableWeapons);
    }
    
    this.giveWeaponToPlayer(player, randomWepIndex);
  }

  private giveWeaponToPlayer(player: Player, index: number) {
    const ammo = index === 0 ? -1 : (AMMO_CONFIG[index] as number);

    if (player.id === this.player1.id) {
      this.p1WeaponIndex = index;
      this.p1Ammo = ammo;
    } else {
      this.dummyWeaponIndex = index;
      this.dummyAmmo = ammo;
    }
    this.weapons[index]?.updateUI(); // Optional hook for UI updates
  }

  private consumeAmmo(shooter: Player, amount: number) {
    if (shooter.id === this.player1.id && this.p1WeaponIndex !== 0) {
      this.p1Ammo -= amount;
      if (this.p1Ammo <= 0) this.giveWeaponToPlayer(shooter, 0); // Revert to Pistol
    } else if (shooter.id === this.dummy.id && this.dummyWeaponIndex !== 0) {
      this.dummyAmmo -= amount;
      if (this.dummyAmmo <= 0) this.giveWeaponToPlayer(shooter, 0);
    }
  }

  // --- COMBAT LOGIC ---

  private handleHit(pSprite: any, hazard: any, destroyHazard: boolean = true) {
    const player = pSprite.getData('entity') as Player;
    const shooterId = hazard.getData('shooterId');
    const damage = hazard.getData('damage');

    if (player.id === shooterId || player.teamId === hazard.getData('teamId'))
      return;

    // Umbrella Block Interception
    if (player.isBlocking && !hazard.getData('isExplosive')) {
      const attackFromRight = hazard.x > player.sprite.x;
      if (
        (attackFromRight && player.facingDirection === 'RIGHT') ||
        (!attackFromRight && player.facingDirection === 'LEFT')
      ) {
        // Damage Umbrella Health directly if blocked
        const wepIndex =
          player.id === this.player1.id
            ? this.p1WeaponIndex
            : this.dummyWeaponIndex;
        if (wepIndex === 5) {
          this.consumeAmmo(player, damage); // umbrella breaks if ammo reaches 0
        }

        if (destroyHazard) hazard.destroy();
        return;
      }
    }

    player.takeDamage(damage);
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
  updateAmmoUI(text: string) {}

  // --- SPAWNERS (Auto-consume ammo upon firing) ---

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

    // Consume Ammo (Works perfectly for guns & Knife Throws)
    this.consumeAmmo(shooter, 1);
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

    this.consumeAmmo(shooter, 1);
    this.time.delayedCall(2500, () => this.detonateExplosive(r));
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

    this.consumeAmmo(shooter, 1);
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

    // Notice we DO NOT consume ammo here! This keeps Knife Primary and Umbrella Primary strictly infinite!
    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 150,
      onComplete: () => slash.destroy(),
    });
  }

  // --- GAME LOOP ---

  override update(time: number) {
    this.player1.update(this.keys);
    this.dummy.update();

    if (this.player1.sprite.y > this.arenaConfig.map.deathY)
      this.handleOutOfBoundsRespawn(
        this.player1,
        this.arenaConfig.map.spawnPoints.player1
      );
    if (this.dummy.sprite.y > this.arenaConfig.map.deathY)
      this.handleOutOfBoundsRespawn(
        this.dummy,
        this.arenaConfig.map.spawnPoints.dummy
      );

    const p1WepName = this.weapons[this.p1WeaponIndex]?.name ?? 'Unknown';
    const dummyWepName = this.weapons[this.dummyWeaponIndex]?.name ?? 'Unknown';
    const formatAmmo = (ammo: number) => (ammo === -1 ? '∞' : ammo);

    this.scoreText.setText(
      `P1 [${p1WepName}]: HP ${this.player1.health} | Stocks: ${this.player1.lives} | Ammo: ${formatAmmo(this.p1Ammo)}\n` +
        `DUMMY [${dummyWepName}]: HP ${this.dummy.health} | Stocks: ${this.dummy.lives} | Ammo: ${formatAmmo(this.dummyAmmo)}`
    );

    // Dev cheats for weapon switching
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE))
      this.giveWeaponToPlayer(this.player1, 0);
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO))
      this.giveWeaponToPlayer(this.player1, 1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.THREE))
      this.giveWeaponToPlayer(this.player1, 2);
    if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR))
      this.giveWeaponToPlayer(this.player1, 3);
    if (Phaser.Input.Keyboard.JustDown(this.keys.FIVE))
      this.giveWeaponToPlayer(this.player1, 4);
    if (Phaser.Input.Keyboard.JustDown(this.keys.SIX))
      this.giveWeaponToPlayer(this.player1, 5);
    if (Phaser.Input.Keyboard.JustDown(this.keys.SEVEN))
      this.giveWeaponToPlayer(this.player1, 6);
    if (Phaser.Input.Keyboard.JustDown(this.keys.EIGHT))
      this.giveWeaponToPlayer(this.player1, 7);
    if (Phaser.Input.Keyboard.JustDown(this.keys.NINE))
      this.giveWeaponToPlayer(this.player1, 8);
    if (Phaser.Input.Keyboard.JustDown(this.keys.ZERO))
      this.giveWeaponToPlayer(this.player1, 9);

    // Route inputs to the Player 1's currently active weapon state
    const p1Wep = this.weapons[this.p1WeaponIndex];
    if (p1Wep) {
      if (this.keys.T.isDown) p1Wep.primaryAttack(this.player1);
      if (this.keys.Y.isDown) p1Wep.secondaryAttack(this.player1);
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

  private handleOutOfBoundsRespawn(
    player: Player,
    spawnLoc: { x: number; y: number }
  ) {
    player.sprite.setPosition(spawnLoc.x, spawnLoc.y);
    player.sprite.setVelocity(0, 0);
    this.giveWeaponToPlayer(player, 0); // Lose weapon on death
    if (typeof (player as any).handleRespawn === 'function') {
      (player as any).handleRespawn();
    } else {
      player.takeDamage(0);
    }
  }

  private oneWayCallback(playerSprite: any, platform: any) {
    const pBody = playerSprite.body as Phaser.Physics.Arcade.Body;
    const platBody = platform.body as Phaser.Physics.Arcade.StaticBody;

    if (playerSprite === this.player1.sprite && Phaser.Input.Keyboard.JustDown(this.keys.S)) {
      const player = playerSprite.getData('entity') as Player;
      const timeSinceLanded = this.time.now - player.lastLandedTime;
      // Ensure they have been on the platform (or spawned) for at least 200ms before allowing drop
      if (timeSinceLanded > 200) {
        return false;
      }
    }
    
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
