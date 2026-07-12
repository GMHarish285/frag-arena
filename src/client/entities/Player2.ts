import Phaser from 'phaser';
import { GameConfig } from '../config/ConfigManager'; // ◄── Pulls in centralized stats

type Joint = { x: number; y: number };

export class Player {
  public id: string;
  public teamId: string;
  public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  // --- STEP 2: ADD SKELETON BONE CONFIGURATIONS (THE RIG) ---
  private skeletonGraphics!: Phaser.GameObjects.Graphics;
  private readonly spineLength: number = 35;
  private readonly headRadius: number = 12;
  private readonly armLen1: number = 22;
  private readonly armLen2 = 22;
  private readonly legLen1: number = 28;
  private readonly legLen2 = 28;
  
  // --- STEP 4 RUN CYCLE TRACKING ---
  private walkTime: number = 0;

  public jumpCount: number = 0;
  public facingDirection: 'LEFT' | 'RIGHT' = 'RIGHT';

  public isBlocking: boolean = false;
  public isInvisible: boolean = false;

  public health: number;
  public lives: number;

  // Weapon tracking states
  public currentWeaponId: number = 0;
  public currentWeaponAmmo: number = Infinity;
  public lastFiredTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, id: string, teamId: string) {
    this.id = id;
    this.teamId = teamId;

    // Setup player physics sprite
    this.sprite = scene.physics.add.sprite(x, y, 'player_base') as any;
    this.sprite.setCollideWorldBounds(false);
    
    // USE CONFIG: Gravity
    this.sprite.setGravityY(GameConfig.world.physics.gravityY);

    // USE CONFIG: Health & Lives
    this.health = GameConfig.player.stats.maxHealth;
    this.lives = GameConfig.player.stats.startingLives;

    this.skeletonGraphics = scene.add.graphics();
    this.skeletonGraphics.setDepth(5);
  }

  public update(keys?: any) {
    // --- READ FROM CONFIG ---
    const { accelerationRate, groundDrag, airDrag, jumpVelocity, maxJumps } = GameConfig.player.movement;
    const { boundaries } = GameConfig.world;

    if (this.sprite.body.touching.down) {
      this.jumpCount = 0;
      this.sprite.setDragX(groundDrag); // USING CONFIG
    } else {
      // OLD BEHAVIOR STRICTLY PRESERVED: Dropping off a ledge consumes first jump instantly!
      if (this.jumpCount === 0) this.jumpCount = 1; 
      this.sprite.setDragX(airDrag); // USING CONFIG
    }

    if (keys) {
      if (keys.A.isDown) {
        this.sprite.setAccelerationX(-accelerationRate); // USING CONFIG
        this.facingDirection = 'LEFT';
      } else if (keys.D.isDown) {
        this.sprite.setAccelerationX(accelerationRate); // USING CONFIG
        this.facingDirection = 'RIGHT';
      } else {
        // Instantly halt active force addition if no navigation buttons are held down
        this.sprite.setAccelerationX(0);
      }

      if (
        Phaser.Input.Keyboard.JustDown(keys.W) &&
        this.jumpCount < maxJumps // USING CONFIG
      ) {
        this.sprite.setVelocityY(jumpVelocity); // USING CONFIG
        this.jumpCount++;
      }
    } else {
      // For autonomous entities (Dummy), zero active internal thrust addition
      this.sprite.setAccelerationX(0);
    }

    // --- BOUNDARY ENFORCEMENT VIA CONFIG ---
    if (
      this.sprite.y > boundaries.killY ||
      this.sprite.x < boundaries.minX ||
      this.sprite.x > boundaries.maxX
    ) {
      this.lives--;
      if (this.lives > 0) {
        this.respawn(960, 200);
      }
    }

    this.renderSkeleton();
  }

  public takeDamage(amount: number) {
    if (this.isBlocking) amount = Math.floor(amount * 0.2); // Parry protection
    this.health -= amount;
    if (this.health <= 0) {
        this.lives--;
        if (this.lives > 0) this.respawn(960, 200);
    }
  }

  public respawn(x: number, y: number) {
    this.health = GameConfig.player.stats.maxHealth; // USING CONFIG
    this.sprite.setPosition(x, y);
    this.sprite.setVelocity(0, 0);
    this.jumpCount = 0;
  }

  public toggleInvisibility() {
    this.isInvisible = !this.isInvisible;
    this.sprite.setAlpha(this.isInvisible ? 0.2 : 1.0);
  }

  // ---------------------------------------------------------------------------------
  // ⬇️ PASTE YOUR EXACT ORIGINAL `private renderSkeleton()` CODE BELOW THIS LINE! ⬇️
  // ---------------------------------------------------------------------------------
  
  private renderSkeleton() {
      // Replace this entire function block with your old procedural drawing code 
      // so your hands hold the guns and legs move exactly the way you designed them!
  }
}