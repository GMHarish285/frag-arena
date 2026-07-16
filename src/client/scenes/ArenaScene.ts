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
import { GameConfig } from '../config/ConfigManager';
import { AIController } from '../entities/AIController';

export class ArenaScene extends Phaser.Scene implements IArena {
  private player1!: Player;
  public dummy!: Player;
  private aiController!: AIController;
  private botControllerP1?: AIController;
  public isBackgroundMode: boolean = false;
  public isGamePaused: boolean = false;

  init(data?: any) {
    this.isBackgroundMode = data?.isBackgroundMode || false;
  }

  private playersGroup!: Phaser.Physics.Arcade.Group;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private crates!: Phaser.Physics.Arcade.StaticGroup; // New crates group

  private projectiles!: Phaser.Physics.Arcade.Group;
  private p1Ammo: number = 0;
  private dummyAmmo: number = 0;
  
  private p1HUD!: Phaser.GameObjects.Text;
  private dummyHUD!: Phaser.GameObjects.Text;

  private rockets!: Phaser.Physics.Arcade.Group;
  private solidBombs!: Phaser.Physics.Arcade.Group;
  private meleeSlashes!: Phaser.Physics.Arcade.Group;

  private uiCamera!: Phaser.Cameras.Scene2D.Camera;
  private keys!: any;
  private scoreText!: Phaser.GameObjects.Text;

  // Weapon instances per player to avoid cooldown/state conflicts
  private p1Weapons: Weapon[] = [];
  private dummyWeapons: Weapon[] = [];

  // Independent Player States
  private p1WeaponIndex: number = 0;

  private dummyWeaponIndex: number = 0;

  private arenaConfig!: IArenaConfig;
  private currentArenaId: string = 'neonClassic';
  private bgLayers: Phaser.GameObjects.Image[] = [];
  private crateSpawnEvent?: Phaser.Time.TimerEvent;
  private gridFlashEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'ArenaScene' });
  }

  preload() {
    // Dynamic generation handles textures, no need to preload background images
  }

  create() {
    // Setup cameras
    this.cameras.main.setBounds(0, 0, 1920, 1080);
    this.uiCamera = this.cameras.add(0, 0, 1920, 1080);

    this.platforms = this.physics.add.staticGroup();
    this.crates = this.physics.add.staticGroup();
    this.playersGroup = this.physics.add.group();

    this.projectiles = this.physics.add.group();
    this.rockets = this.physics.add.group();
    this.solidBombs = this.physics.add.group();
    this.meleeSlashes = this.physics.add.group();

    // Asset Generation
    const p1WepColor = 0x06b6d4; // Cyan
    const dummyWepColor = 0xff2222; // Red

    const createPlayerBullets = (id: string, color: number) => {
        this.generateStripedBulletTexture(`bullet_small_tex_${id}`, 24, 6, 0x000000, color);
        this.generateStripedBulletTexture(`bullet_smg_tex_${id}`, 40, 6, 0x000000, color);
        this.generateStripedBulletTexture(`bullet_medium_tex_${id}`, 32, 10, 0x000000, color);
        this.generateStripedBulletTexture(`bullet_large_tex_${id}`, 48, 14, 0x000000, color);
    };
    
    createPlayerBullets('p1', p1WepColor);
    createPlayerBullets('dummy', dummyWepColor);
    this.generateWeaponTexture(0, 'pistol_thrown_tex'); // Dynamically generate from WeaponConfig model
    this.generateWeaponTexture(2, 'knife_tex');
    this.generateWeaponTexture(3, 'bomb_tex');
    this.generateBetterRocketTexture('rocket_tex');
    this.generateTexture('slash_tex', 60, 60, 0xffffff);
    // Generate Neon Crate Texture
    const crateGraphics = this.add.graphics();
    crateGraphics.fillStyle(0x1a1a1a, 1); // Dark inner body
    crateGraphics.fillRect(0, 0, 64, 64);

    crateGraphics.lineStyle(4, 0x39ff14, 1); // Neon Green border
    crateGraphics.strokeRect(2, 2, 60, 60);

    crateGraphics.beginPath(); // 'X' cross design
    crateGraphics.moveTo(8, 8);
    crateGraphics.lineTo(56, 56);
    crateGraphics.moveTo(56, 8);
    crateGraphics.lineTo(8, 56);
    crateGraphics.strokePath();

    crateGraphics.fillStyle(0xffffff, 1); // Bright center dot
    crateGraphics.fillRect(28, 28, 8, 8);

    crateGraphics.generateTexture('crate_tex', 64, 64);
    crateGraphics.destroy();
    // Background layers placeholder textures
    this.generateTexture('bg_layer_3', 1920, 1080, 0x111133);
    this.generateTexture('bg_layer_2', 1920, 1080, 0x222244);
    this.generateTexture('bg_layer_1', 1920, 1080, 0x333355);

    this.generateNeonBackgrounds();

    this.buildArena(this.currentArenaId);

    const spawnPoints = this.arenaConfig.map.spawnPoints;
    this.player1 = new Player(
      this,
      spawnPoints.player1.x,
      spawnPoints.player1.y,
      'p1',
      'team_A',
      0x3b82f6, // player body color (blue shade)
      p1WepColor // weapon color (cyan)
    );
    this.dummy = new Player(
      this,
      spawnPoints.dummy.x,
      spawnPoints.dummy.y,
      'dummy',
      'team_B',
      0xef4444, // enemy body color (red shade)
      dummyWepColor // weapon color (red)
    );

    this.player1.equipWeapon(0);
    this.dummy.equipWeapon(0);

    if (this.isBackgroundMode) {
      this.aiController = new AIController(this, this.dummy, this.player1, 'HARD');
      this.botControllerP1 = new AIController(this, this.player1, this.dummy, 'HARD');
    } else {
      this.aiController = new AIController(this, this.dummy, this.player1, 'HARD');
    }

    this.playersGroup.add(this.player1.sprite);
    this.playersGroup.add(this.dummy.sprite);

    // Ignore players in UI camera
    this.uiCamera.ignore([
      this.player1.sprite, 
      this.dummy.sprite, 
      this.player1.skeletonGraphics, 
      this.dummy.skeletonGraphics
    ]);

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
    const hudStyle = {
      fontSize: '28px',
      fontFamily: 'Impact, sans-serif',
      color: '#ffffff',
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 4,
    };
    
    this.p1HUD = this.add.text(40, 30, '', hudStyle).setShadow(0, 0, '#00e5ff', 8, false, true);
    this.dummyHUD = this.add.text(1880, 30, '', hudStyle).setOrigin(1, 0).setShadow(0, 0, '#ec4899', 8, false, true).setAlign('right');
    this.cameras.main.ignore([this.p1HUD, this.dummyHUD]);

    const createWeapons = () => [
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
    this.p1Weapons = createWeapons();
    this.dummyWeapons = createWeapons();

    // Equip default weapons based on config
    this.giveWeaponToPlayer(this.player1, this.arenaConfig.defaultWeaponIndex);
    this.giveWeaponToPlayer(this.dummy, this.arenaConfig.defaultWeaponIndex);

    this.keys = this.input.keyboard!.addKeys(
      'W,A,S,D,T,Y,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,NINE,ZERO'
    ) as any;

    if (this.isBackgroundMode) {
      this.uiCamera.setVisible(false);
      if (this.p1HUD) this.p1HUD.setVisible(false);
      if (this.dummyHUD) this.dummyHUD.setVisible(false);
    } else {
      const btnStyle = {
        fontSize: '32px',
        color: '#ffffff',
        backgroundColor: '#111115',
        padding: { x: 15, y: 10 },
      };

      const pauseBtn = this.add.text(960 - 50, 20, '⏸', btnStyle)
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(100)
        .setShadow(0, 0, '#00e5ff', 8, false, true);

      const quitBtn = this.add.text(960 + 50, 20, '✖', btnStyle)
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(100)
        .setShadow(0, 0, '#ff0055', 8, false, true);

      this.cameras.main.ignore([pauseBtn, quitBtn]);

      pauseBtn.on('pointerup', () => {
        this.isGamePaused = !this.isGamePaused;
        if (this.isGamePaused) {
          this.physics.pause();
          pauseBtn.setText('▶');
          pauseBtn.setShadow(0, 0, '#ec4899', 8, false, true);
        } else {
          this.physics.resume();
          pauseBtn.setText('⏸');
          pauseBtn.setShadow(0, 0, '#00e5ff', 8, false, true);
        }
      });

      quitBtn.on('pointerup', () => {
        this.scene.start('MainMenuScene');
      });
    }

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
        .setDepth(1000)
        .setInteractive();

      const txt = this.add.text(x, y, text, { fontSize: '32px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5)
        .setDepth(1001);

      this.cameras.main.ignore([circle, txt]);

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

    createBtn(leftX - leftSpacing, leftY, '←', ['A'], 70);       // LEFT
    createBtn(leftX + leftSpacing, leftY, '→', ['D'], 70);       // RIGHT

    // --- RIGHT SIDE: ACTIONS (W, S, T, Y) ---
    const rightX = 1920 - 300;
    const rightY = 800;
    const rightSpacing = 130;

    createBtn(rightX, rightY - rightSpacing, '↑', ['W'], 65);     // UP / JUMP
    createBtn(rightX, rightY + rightSpacing, '↓', ['S'], 65);     // DOWN / DROP
    
    // Primary Fire (T)
    createBtn(rightX - rightSpacing, rightY, 'FIRE', ['T'], 70);
    
    // Secondary Fire (Y)
    createBtn(rightX + rightSpacing, rightY, 'ALT', ['Y'], 60);
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
      
      // Generalize scaling: calculate the scale needed to cover 1920x1080
      const scaleX = 1920 / bg.width;
      const scaleY = 1080 / bg.height;
      const scale = Math.max(scaleX, scaleY);
      bg.setScale(scale);

      bg.setScrollFactor(layer.scrollFactorX, layer.scrollFactorY);
      if (layer.depth !== undefined) {
        bg.setDepth(layer.depth);
      }
      this.bgLayers.push(bg);
      this.uiCamera.ignore(bg);
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

    // Reset grid flash timer
    if (this.gridFlashEvent) {
      this.gridFlashEvent.destroy();
    }
    if (this.currentArenaId === 'neonClassic') {
      this.gridFlashEvent = this.time.addEvent({
        delay: 400, // spawn flashes much more frequently
        callback: this.spawnGridFlash,
        callbackScope: this,
        loop: true,
      });
    }
  }

  private spawnGridFlash() {
    const isHorizontal = Math.random() > 0.5;
    let startX, startY, endX, endY, angle;

    if (isHorizontal) {
      startX = -320 - 200; // start slightly off-grid left (image left bound is -320)
      endX = 2240 + 200;   // end slightly off-grid right (image right bound is 2240)
      startY = Math.floor(Math.random() * (1080 / 100)) * 100;
      endY = startY;
      angle = 0;
    } else {
      startX = -320 + Math.floor(Math.random() * (2560 / 100)) * 100;
      endX = startX;
      startY = 0 - 200;
      endY = 1080 + 200;
      angle = 90;
    }

    const flash = this.add.image(startX, startY, 'grid_flash');
    flash.setAngle(angle);
    flash.setDepth(-1.9); // Above the grid (-2) but below mountains (-1)
    flash.setScrollFactor(0.3, 0.3); // Match grid scroll factor
    
    // Ignore in UI
    this.uiCamera.ignore(flash);

    this.tweens.add({
      targets: flash,
      x: endX,
      y: endY,
      duration: Phaser.Math.Between(1500, 2500),
      ease: 'Linear',
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  // --- CRATE & WEAPON MANAGEMENT ---

  private spawnCrate() {
    // Clear any existing unclaimed crates from the map first
    this.crates.clear(true, true);

    const platforms = this.arenaConfig.map.platforms;
    if (!platforms || platforms.length === 0) return;

    // Pick a random platform weighted by its width
    const totalWidth = platforms.reduce((sum, p) => sum + p.width, 0);
    let rand = Math.random() * totalWidth;
    let plat = platforms[0];
    if (!plat) return;

    for (const p of platforms) {
      if (rand < p.width) {
        plat = p;
        break;
      }
      rand -= p.width;
    }

    // Calc valid boundaries on top of the platform
    const minX = plat.x - plat.width / 2 + 16;
    const maxX = plat.x + plat.width / 2 - 16;

    const spawnX = Phaser.Math.Between(minX, maxX);
    const spawnY = plat.y - plat.height / 2 - 16; // Rest perfectly on top

    const crate = this.crates.create(spawnX, spawnY, 'crate_tex');
    this.uiCamera.ignore(crate);
  }

  private handleCratePickup(pSprite: any, crateSprite: any) {
    this.spawnParticles(crateSprite.x, crateSprite.y, 0x39ff14, 20);
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
    const weaponConfig = GameConfig.weapons[index];
    const ammo = index === 0 ? -1 : (weaponConfig ? weaponConfig.maxAmmo : 5);

    let weapon;
    if (player.id === this.player1.id) {
      this.p1WeaponIndex = index;
      this.p1Ammo = ammo;
      weapon = this.p1Weapons[index];
    } else {
      this.dummyWeaponIndex = index;
      this.dummyAmmo = ammo;
      weapon = this.dummyWeapons[index];
    }
    
    player.equipWeapon(index);
    
    // Refill the internal weapon ammo when equipping
    if (weapon) {
      weapon.currentAmmo = weapon.maxAmmo;
      weapon.isReloading = false;
      weapon.updateUI();
    }
  }

  public consumeGlobalAmmo(shooter: Player, amount: number) {
    if (shooter.id === this.player1.id && this.p1WeaponIndex !== 0) {
      if (this.p1Ammo !== -1 && this.p1Ammo !== null) {
        this.p1Ammo -= amount;
        if (this.p1Ammo <= 0) this.giveWeaponToPlayer(shooter, 0); // Revert to Pistol
      }
    } else if (shooter.id === this.dummy.id && this.dummyWeaponIndex !== 0) {
      if (this.dummyAmmo !== -1 && this.dummyAmmo !== null) {
        this.dummyAmmo -= amount;
        if (this.dummyAmmo <= 0) this.giveWeaponToPlayer(shooter, 0);
      }
    }
  }

  // --- COMBAT LOGIC ---

  private handleHit(pSprite: any, hazard: any, destroyHazard: boolean = true) {
    const player = pSprite.getData('entity') as Player;
    const shooterId = hazard.getData('shooterId');
    const damage = hazard.getData('damage');

    if (player.id === shooterId || player.teamId === hazard.getData('teamId'))
      return;

    // Ensure persistent hazards (like melee slashes) only hit a given player once
    const hitList: string[] = hazard.getData('hitList') || [];
    if (hitList.includes(player.id)) return;
    hitList.push(player.id);
    hazard.setData('hitList', hitList);

    let finalDamage = damage;
    let finalKbX = hazard.getData('kbX');
    let finalKbY = hazard.getData('kbY');

    // Distance-based falloff for Shotgun AOE blasts
    if (hazard.getData('isShotgun')) {
      const originX = hazard.getData('originX');
      const range = hazard.getData('range');
      const dist = Math.abs(player.sprite.x - originX);
      
      let multiplier = 1 - (dist / range);
      if (multiplier < 0) multiplier = 0;
      
      finalDamage = Math.ceil(damage * multiplier);
      finalKbX = finalKbX * multiplier;
      finalKbY = finalKbY * multiplier;
      
      if (finalDamage <= 0) return;
    }

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
          this.consumeGlobalAmmo(player, damage); // umbrella breaks if ammo reaches 0
        }

        if (destroyHazard) hazard.destroy();
        return;
      }
    }

    player.takeDamage(finalDamage);
    player.applyKnockback(finalKbX, finalKbY);

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
    damage: number,
    angularVelocity: number = 0
  ) {
    const finalTexture = texture.includes('bullet') ? `${texture}_${shooter.id}` : texture;
    const proj = this.projectiles.create(
      x,
      y,
      finalTexture
    ) as Phaser.Physics.Arcade.Sprite;
    (proj.body as any).allowGravity = hasGravity;
    proj.setVelocity(velocityX, velocityY);
    proj.setData('shooterId', shooter.id);
    proj.setData('teamId', shooter.teamId);
    proj.setData('kbX', shooter.facingDirection === 'RIGHT' ? kbX : -kbX);
    proj.setData('kbY', kbY);
    proj.setData('damage', damage);
    proj.setData('isExplosive', false);

    if (angularVelocity !== 0) {
      proj.setAngularVelocity(angularVelocity);
    }

    this.uiCamera.ignore(proj);

    // Consume Ammo (Works perfectly for guns & Knife Throws)
    this.consumeGlobalAmmo(shooter, 1);
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

    this.uiCamera.ignore(r);

    this.consumeGlobalAmmo(shooter, 1);
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
    damage: number,
    detonateDelay: number = 2000
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

    this.uiCamera.ignore(bomb);

    this.consumeGlobalAmmo(shooter, 1);
    this.time.delayedCall(detonateDelay, () => {
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
    slash.setVisible(false);
    slash.setData('shooterId', shooter.id);
    slash.setData('teamId', shooter.teamId);
    slash.setData('kbX', facing === 'RIGHT' ? kbX : -kbX);
    slash.setData('kbY', kbY);
    slash.setData('damage', damage);
    slash.setData('isExplosive', false);

    this.uiCamera.ignore(slash);

    // Notice we DO NOT consume ammo here! This keeps Knife Primary and Umbrella Primary strictly infinite!
    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 150,
      onComplete: () => slash.destroy(),
    });
  }

  spawnShotgunBlast(
    x: number,
    y: number,
    facing: 'LEFT' | 'RIGHT',
    shooter: Player,
    kbX: number,
    kbY: number,
    damage: number,
    range: number,
    spread: number
  ) {
    const offset = facing === 'RIGHT' ? range / 2 : -range / 2;
    const blast = this.meleeSlashes.create(
      x + offset,
      y,
      'slash_tex'
    ) as Phaser.Physics.Arcade.Sprite;
    (blast.body as any).allowGravity = false;
    blast.setDisplaySize(range, spread); // Scale the texture to visually represent the AOE
    blast.setVisible(false);
    blast.setData('shooterId', shooter.id);
    blast.setData('teamId', shooter.teamId);
    blast.setData('kbX', facing === 'RIGHT' ? kbX : -kbX);
    blast.setData('kbY', kbY);
    blast.setData('damage', damage);
    blast.setData('isExplosive', false);
    blast.setData('isShotgun', true);
    blast.setData('originX', x);
    blast.setData('range', range);

    this.uiCamera.ignore(blast);

    // Visuals using Blitter for multiple pellets
    const blitter = this.add.blitter(0, 0, `bullet_medium_tex_${shooter.id}`);
    const visualPellets = 10;
    for(let i = 0; i < visualPellets; i++) {
        const targetX = x + (facing === 'RIGHT' ? range : -range) * Phaser.Math.FloatBetween(0.3, 1);
        const targetY = y + Phaser.Math.FloatBetween(-spread/2, spread/2);
        
        const bob = blitter.create(x, y);
        this.tweens.add({
            targets: bob,
            x: targetX,
            y: targetY,
            alpha: 0,
            duration: 150,
            ease: 'Sine.easeOut'
        });
    }
    this.uiCamera.ignore(blitter);

    this.tweens.add({
      targets: blast,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        blast.destroy();
        blitter.destroy();
      },
    });
  }

  // --- GAME LOOP ---

  override update(time: number, delta: number) {
    if (this.isGamePaused) return;

    if (this.isBackgroundMode && this.botControllerP1) {
      this.botControllerP1.update(time, delta);
      this.player1.update(this.botControllerP1.getKeys(), delta);
    } else {
      this.player1.update(this.keys, delta);
    }
    
    if (this.aiController) {
      this.aiController.update(time, delta);
    } else {
      this.dummy.update(undefined, delta);
    }

    // --- DYNAMIC CAMERA (ZOOM + PAN) ---
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let activePlayers = 0;

    this.playersGroup.getChildren().forEach((p) => {
      const sprite = p as Phaser.Physics.Arcade.Sprite;
      if (sprite.active && sprite.y < this.arenaConfig.map.deathY) {
        minX = Math.min(minX, sprite.x);
        maxX = Math.max(maxX, sprite.x);
        minY = Math.min(minY, sprite.y);
        maxY = Math.max(maxY, sprite.y);
        activePlayers++;
      }
    });

    if (activePlayers > 0) {
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      // Calculate desired zoom based on bounding box
      const paddingX = 600;
      const paddingY = 400;
      const boxWidth = (maxX - minX) + paddingX;
      const boxHeight = (maxY - minY) + paddingY;

      const zoomX = 1920 / boxWidth;
      const zoomY = 1080 / boxHeight;
      let targetZoom = Math.min(zoomX, zoomY);
      
      const camConfig = this.arenaConfig.cameraConfig;
      
      // Clamp zoom between 1.0 (whole arena) and maxZoom
      targetZoom = Phaser.Math.Clamp(targetZoom, 1.0, camConfig.maxZoom);

      const cam = this.cameras.main;
      cam.zoom = Phaser.Math.Linear(cam.zoom, targetZoom, camConfig.zoomInterpolation);

      // Target scrollX/scrollY (Phaser calculates view around center)
      const targetScrollX = centerX - (1920 / 2);
      const targetScrollY = centerY - (1080 / 2);

      cam.scrollX = Phaser.Math.Linear(cam.scrollX, targetScrollX, camConfig.panInterpolation);
      cam.scrollY = Phaser.Math.Linear(cam.scrollY, targetScrollY, camConfig.panInterpolation);
    }
    // -----------------------------------

    // Fix for debug graphics showing up twice (once on each camera)
    if (this.physics.world.debugGraphic) {
      this.uiCamera.ignore(this.physics.world.debugGraphic);
    }

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

    const p1WepName = this.p1Weapons[this.p1WeaponIndex]?.name ?? 'Unknown';
    const dummyWepName = this.dummyWeapons[this.dummyWeaponIndex]?.name ?? 'Unknown';
    const p1Wep = this.p1Weapons[this.p1WeaponIndex];
    const dummyWep = this.dummyWeapons[this.dummyWeaponIndex];

    const getAmmoText = (w: any, ammo: number) => {
      if (w.maxAmmo === Infinity || w.maxAmmo === -1) return 'INF';
      return `${ammo}`;
    };

    this.p1HUD.setText(
      `P1 LIVES: ${this.player1.lives}  |  HP: ${this.player1.health}%\n` +
      `WEAPON: ${p1WepName}  |  AMMO: ${getAmmoText(p1Wep, this.p1Ammo)}`
    );
    this.dummyHUD.setText(
      `ENEMY LIVES: ${this.dummy.lives}  |  HP: ${this.dummy.health}%\n` +
      `WEAPON: ${dummyWepName}  |  AMMO: ${getAmmoText(dummyWep, this.dummyAmmo)}`
    );

    // Dev cheats for weapon switchingon switching
    if (!this.isBackgroundMode) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.giveWeaponToPlayer(this.player1, 0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.giveWeaponToPlayer(this.player1, 1);
      if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.giveWeaponToPlayer(this.player1, 2);
      if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) this.giveWeaponToPlayer(this.player1, 3);
      if (Phaser.Input.Keyboard.JustDown(this.keys.FIVE)) this.giveWeaponToPlayer(this.player1, 4);
      if (Phaser.Input.Keyboard.JustDown(this.keys.SIX)) this.giveWeaponToPlayer(this.player1, 5);
      if (Phaser.Input.Keyboard.JustDown(this.keys.SEVEN)) this.giveWeaponToPlayer(this.player1, 6);
      if (Phaser.Input.Keyboard.JustDown(this.keys.EIGHT)) this.giveWeaponToPlayer(this.player1, 7);
      if (Phaser.Input.Keyboard.JustDown(this.keys.NINE)) this.giveWeaponToPlayer(this.player1, 8);
      if (Phaser.Input.Keyboard.JustDown(this.keys.ZERO)) this.giveWeaponToPlayer(this.player1, 9);
    }

    // Route inputs to the Player 1's currently active weapon state
    const activeWep = this.p1Weapons[this.p1WeaponIndex];
    if (activeWep) {
      if (this.isBackgroundMode && this.botControllerP1) {
        const aiKeysP1 = this.botControllerP1.getKeys();
        if (aiKeysP1.T.isDown) activeWep.primaryAttack(this.player1);
        if (aiKeysP1.Y.isDown) activeWep.secondaryAttack(this.player1);
        activeWep.updateState(aiKeysP1, this.player1);
      } else {
        if (this.keys.T.isDown) activeWep.primaryAttack(this.player1);
        if (this.keys.Y.isDown) activeWep.secondaryAttack(this.player1);
        activeWep.updateState(this.keys, this.player1);
      }
    }

    // Route inputs to Dummy's currently active weapon state from AI
    const dummyActiveWep = this.dummyWeapons[this.dummyWeaponIndex];
    if (dummyActiveWep && this.aiController) {
      const aiKeys = this.aiController.getKeys();
      if (aiKeys.T.isDown) dummyActiveWep.primaryAttack(this.dummy);
      if (aiKeys.Y.isDown) dummyActiveWep.secondaryAttack(this.dummy);
      dummyActiveWep.updateState(aiKeys, this.dummy);
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

    let sJustDown = false;
    const player = playerSprite.getData('entity') as Player;
    
    if (player.id === this.player1.id) {
       sJustDown = Phaser.Input.Keyboard.JustDown(this.keys.S);
    } else if (player.id === this.dummy.id && this.aiController) {
       sJustDown = this.aiController.getKeys().S.justDown;
    }

    if (sJustDown) {
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

  private generateStripedBulletTexture(key: string, width: number, height: number, outerColor: number, innerColor: number) {
    const g = this.add.graphics();
    g.fillStyle(outerColor, 1);
    g.fillRect(0, 0, width, height);
    
    const stripeHeight = Math.max(2, Math.floor(height / 3));
    const stripeY = Math.floor((height - stripeHeight) / 2);
    g.fillStyle(innerColor, 1);
    g.fillRect(0, stripeY, width, stripeHeight);
    
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private generateWeaponTexture(id: number, key: string) {
    const weaponConfig = GameConfig.weapons[id];
    if (!weaponConfig || !weaponConfig.model) return;
    
    const model = weaponConfig.model;
    const pxSize = model.pixelSize;
    
    const width = model.data[0].length * pxSize;
    const height = model.data.length * pxSize;
    
    const g = this.add.graphics();
    for (let y = 0; y < model.data.length; y++) {
      const row = model.data[y];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        if (char !== ' ') {
          const color = model.palette[char];
          if (color !== undefined) {
             g.fillStyle(color, 1);
             g.fillRect(x * pxSize, y * pxSize, pxSize, pxSize);
          }
        }
      }
    }
    
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private generateBetterRocketTexture(key: string) {
    const g = this.add.graphics();
    const pxSize = 3;
    
    // Tail / fire
    g.fillStyle(0xff4500, 1);
    g.fillRect(0 * pxSize, 2 * pxSize, 2 * pxSize, 2 * pxSize);
    g.fillStyle(0xffa500, 1);
    g.fillRect(1 * pxSize, 2 * pxSize, 2 * pxSize, 2 * pxSize);
    
    // Body (Cyan)
    g.fillStyle(0x00ffff, 1);
    g.fillRect(3 * pxSize, 1 * pxSize, 6 * pxSize, 4 * pxSize);
    
    // Darker details
    g.fillStyle(0x555555, 1);
    g.fillRect(4 * pxSize, 2 * pxSize, 4 * pxSize, 2 * pxSize);
    
    // Fins
    g.fillStyle(0x333333, 1);
    g.fillRect(2 * pxSize, 0 * pxSize, 2 * pxSize, 2 * pxSize); // top fin
    g.fillRect(2 * pxSize, 4 * pxSize, 2 * pxSize, 2 * pxSize); // bottom fin
    
    // Tip (Red)
    g.fillStyle(0xff0000, 1);
    g.fillRect(9 * pxSize, 2 * pxSize, 2 * pxSize, 2 * pxSize);
    g.fillRect(11 * pxSize, 2.5 * pxSize, 1 * pxSize, 1 * pxSize);

    g.generateTexture(key, 12 * pxSize, 6 * pxSize);
    g.destroy();
  }

  private generateNeonBackgrounds() {
    // 1. Farthest layer (neon_bg1): gradient black to dark blue
    if (!this.textures.exists('neon_bg1')) {
      const canvasTexture = this.textures.createCanvas('neon_bg1', 2560, 1080);
      if (canvasTexture) {
        const context = canvasTexture.getContext();
        const gradient = context.createLinearGradient(0, 0, 0, 1080);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.33, '#000000'); // Transition starts smoothly at 1/3rd down
        gradient.addColorStop(1, '#000044'); // Ends at dark blue
        context.fillStyle = gradient;
        context.fillRect(0, 0, 2560, 1080);
        canvasTexture.refresh();
      }
    }

    if (!this.textures.exists('grid_flash')) {
      const flashTex = this.textures.createCanvas('grid_flash', 300, 4);
      if (flashTex) {
        const ctx = flashTex.getContext();
        const grd = ctx.createLinearGradient(0, 0, 300, 0);
        grd.addColorStop(0, 'rgba(6, 182, 212, 0)');
        grd.addColorStop(0.5, 'rgba(6, 182, 212, 0.3)');
        grd.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 300, 4);
        flashTex.refresh();
      }
    }

    // 2. Middle layer (neon_bg2): Grid layout like splash screen
    const bg2 = this.add.graphics();
    bg2.lineStyle(2, 0x06b6d4, 0.3); // Cyan
    const gridSize = 100;
    for (let x = 0; x <= 2560; x += gridSize) {
      bg2.beginPath();
      bg2.moveTo(x, 0);
      bg2.lineTo(x, 1080);
      bg2.strokePath();
    }
    for (let y = 0; y <= 1080; y += gridSize) {
      bg2.beginPath();
      bg2.moveTo(0, y);
      bg2.lineTo(2560, y);
      bg2.strokePath();
    }
    bg2.generateTexture('neon_bg2', 2560, 1080);
    bg2.destroy();

    // 3. Nearest layer (neon_bg3-2): simple triangle mountains, some having grids in them
    const bg3 = this.add.graphics();
    
    const mountains = [
      { x: 300, width: 550, height: 350, hasGrid: true },
      { x: 1000, width: 800, height: 500, hasGrid: false },
      { x: 1700, width: 650, height: 400, hasGrid: true },
      { x: 2300, width: 550, height: 300, hasGrid: false },
    ];

    mountains.forEach(m => {
      bg3.fillStyle(0x000000, 1);
      bg3.lineStyle(4, 0xec4899, 1); // Pink
      bg3.beginPath();
      bg3.moveTo(m.x - m.width/2, 1080);
      bg3.lineTo(m.x, 1080 - m.height);
      bg3.lineTo(m.x + m.width/2, 1080);
      bg3.closePath();
      bg3.fillPath();
      bg3.strokePath();

      if (m.hasGrid) {
        bg3.lineStyle(2, 0xec4899, 0.4);
        const mtGridSize = 60;
        // Horizontal lines
        for(let y = 1080 - m.height + mtGridSize; y <= 1080; y += mtGridSize) {
          const progress = (y - (1080 - m.height)) / m.height;
          const currentWidth = m.width * progress;
          bg3.beginPath();
          bg3.moveTo(m.x - currentWidth/2, y);
          bg3.lineTo(m.x + currentWidth/2, y);
          bg3.strokePath();
        }
        // Vertical lines
        for(let x = m.x - m.width/2 + mtGridSize; x < m.x + m.width/2; x += mtGridSize) {
          const dx = Math.abs(x - m.x);
          const progress = dx / (m.width/2);
          const currentHeight = m.height * (1 - progress);
          bg3.beginPath();
          bg3.moveTo(x, 1080);
          bg3.lineTo(x, 1080 - currentHeight);
          bg3.strokePath();
        }
      }
    });

    bg3.generateTexture('neon_bg3-2', 2560, 1080);
    bg3.destroy();
  }

  private createPlatform(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ) {
    const key = `plat_${width}x${height}_${color}`;
    if (!this.textures.exists(key)) {
      const g = this.add.graphics();
      // Main body
      g.fillStyle(color, 1);
      g.fillRect(0, 0, width, height);
      // Neon border (cyan/pink theme)
      g.lineStyle(4, 0x06b6d4, 1);
      g.strokeRect(2, 2, width - 4, height - 4);
      // Grid lines on platform
      g.lineStyle(1, 0xec4899, 0.3);
      for(let px = 20; px < width; px += 20) {
        g.beginPath(); g.moveTo(px, 4); g.lineTo(px, height - 4); g.strokePath();
      }
      g.generateTexture(key, width, height);
      g.destroy();
    }
    const plat = this.platforms.create(x, y, key);
    plat.body.checkCollision.down = false;
    plat.body.checkCollision.left = false;
    plat.body.checkCollision.right = false;
    
    this.uiCamera.ignore(plat);
  }

  public spawnParticles(x: number, y: number, color: number, count: number = 10) {
    if (!this.textures.exists('particle_tex')) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 4, 4);
      g.generateTexture('particle_tex', 4, 4);
      g.destroy();
    }
    const emitter = this.add.particles(0, 0, 'particle_tex', {
      x, y,
      speed: { min: 20, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      tint: color,
      blendMode: 'ADD',
      emitting: false
    });
    emitter.explode(count);
    this.uiCamera.ignore(emitter);
    // Destroy emitter after particles finish
    this.time.delayedCall(500, () => emitter.destroy());
  }
}
