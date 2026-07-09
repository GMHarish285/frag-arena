import Phaser from 'phaser';

export class Player {
  public id: string;
  public teamId: string;
  public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  // --- STEP 2: ADD SKELETON BONE CONFIGURATIONS (THE RIG) ---
  private skeletonGraphics!: Phaser.GameObjects.Graphics;
  private readonly spineLength: number = 35;
  private readonly headRadius: number = 12;
  // Limb segment lengths (Upper, Lower)
  private readonly armLen1: number = 22;
  private readonly armLen2 = 22;
  private readonly legLen1: number = 28;
  private readonly legLen2 = 28;

  public jumpCount: number = 0;
  public readonly MAX_JUMPS: number = 2;
  public facingDirection: 'LEFT' | 'RIGHT' = 'RIGHT';

  public isBlocking: boolean = false;
  public isInvisible: boolean = false;

  public health: number;
  public lives: number;
  private maxHealth: number;

  // --- EASY BALANCE PROPERTIES FOR INERTIAL MOVEMENT ---
  private readonly maxMoveSpeed: number = 50; // Sprintf top threshold speed limits
  private readonly accelerationRate: number = 1800; // How fast you ramp up to top speed (px/sec^2)
  private readonly groundDrag: number = 4400; // Deceleration slide factor when keys are released
  private readonly airDrag: number = 4400; // Less friction restriction while airborne

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: string,
    teamId: string,
    color: number,
    maxHealth: number = 100,
    maxLives: number = 10
  ) {
    this.id = id;
    this.teamId = teamId;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.lives = maxLives;

    const texKey = `player_tex_${color}`;
    if (!scene.textures.exists(texKey)) {
      const g = scene.add.graphics();
      g.fillStyle(color);
      g.fillRect(0, 0, 70, 70);
      g.generateTexture(texKey, 70, 70);
      g.destroy();
    }

    this.sprite = scene.physics.add.sprite(x, y, texKey);
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setData('entity', this);

    this.sprite.setSize(32, 95);
    // Enforce maximum absolute movement limits so acceleration doesn't scale infinitely
    this.sprite.setMaxVelocity(this.maxMoveSpeed, 1200);

    // ◄--- ADD THIS LINE: Hides the block image but leaves debug hitbox visible
    this.sprite.setAlpha(0);

    // ◄--- ADD THIS LINE: Initializes our procedural skeleton graphics layer
    this.skeletonGraphics = scene.add.graphics();
  }

  public takeDamage(amount: number) {
    this.health -= amount;
    if (this.health <= 0) {
      this.lives--;
      if (this.lives > 0) {
        this.respawn(960, 200);
      } else {
        this.sprite.destroy();
      }
    }
  }

  private renderSkeleton() {
    const g = this.skeletonGraphics;
    g.clear();

    const currentAlpha = this.isInvisible ? 0.15 : 1;

    // Line styling (4px thick white strokes)
    g.lineStyle(4, 0xffffff, currentAlpha);
    g.fillStyle(0xffffff, currentAlpha);

    // Fetch the absolute middle point coordinates of your moving physics body box
    const px = this.sprite.x;
    const py = this.sprite.y;

    // --- POSITION SHIFT FIX ---
    // By sliding our vertical anchors up slightly relative to the center (py),
    // we guarantee the total length of the body + legs fits exactly inside the 95px hitbox height.
    const neck = { x: px, y: py - 32 };
    const pelvis = { x: px, y: py + 3 };

    // 1. Draw Head and Torso Spine
    g.fillCircle(neck.x, neck.y - this.headRadius, this.headRadius);
    g.lineBetween(neck.x, neck.y, pelvis.x, pelvis.y);

    // 2. Draw T-POSE ARMS (Strictly Horizontal from neck)
    const leftElbowX = neck.x - this.armLen1;
    const leftHandX = leftElbowX - this.armLen2;
    g.lineBetween(neck.x, neck.y, leftElbowX, neck.y);
    g.lineBetween(leftElbowX, neck.y, leftHandX, neck.y);

    const rightElbowX = neck.x + this.armLen1;
    const rightHandX = rightElbowX + this.armLen2;
    g.lineBetween(neck.x, neck.y, rightElbowX, neck.y);
    g.lineBetween(rightElbowX, neck.y, rightHandX, neck.y);

    // 3. Draw T-POSE LEGS (Branching straight from the bottom of the body spine)
    // Instead of separate left/right hip starting blocks, both start exactly at 'pelvis'
    // and angle outwards slightly to look structurally correct.
    const legSpreadAngle = 0.15; // Radians (~8 degrees) outward angle split

    // Left Leg Math
    const leftKneeX = pelvis.x - Math.sin(legSpreadAngle) * this.legLen1;
    const leftKneeY = pelvis.y + Math.cos(legSpreadAngle) * this.legLen1;
    const leftFootX = leftKneeX - Math.sin(legSpreadAngle) * this.legLen2;
    const leftFootY = leftKneeY + Math.cos(legSpreadAngle) * this.legLen2;
    g.lineBetween(pelvis.x, pelvis.y, leftKneeX, leftKneeY); // Pelvis to Knee
    g.lineBetween(leftKneeX, leftKneeY, leftFootX, leftFootY); // Knee to Foot

    // Right Leg Math
    const rightKneeX = pelvis.x + Math.sin(legSpreadAngle) * this.legLen1;
    const rightKneeY = pelvis.y + Math.cos(legSpreadAngle) * this.legLen1;
    const rightFootX = rightKneeX + Math.sin(legSpreadAngle) * this.legLen2;
    const rightFootY = rightKneeY + Math.cos(legSpreadAngle) * this.legLen2;
    g.lineBetween(pelvis.x, pelvis.y, rightKneeX, rightKneeY); // Pelvis to Knee
    g.lineBetween(rightKneeX, rightKneeY, rightFootX, rightFootY); // Knee to Foot
  }

  public applyKnockback(kbX: number, kbY: number) {
    if (this.isBlocking) {
      kbX *= 0.2;
      kbY *= 0.2;
    }
    // Temporarily reset acceleration on hit so your inputs don't instantly fight the knockback vector
    this.sprite.setAccelerationX(0);
    this.sprite.setVelocity(
      this.sprite.body.velocity.x + kbX,
      this.sprite.body.velocity.y + kbY
    );
  }

  public toggleInvisibility() {
    this.isInvisible = !this.isInvisible;
    this.sprite.setAlpha(this.isInvisible ? 0.15 : 1);
  }

  public update(keys?: any) {
    const isGrounded = this.sprite.body.touching.down;
    if (isGrounded) this.jumpCount = 0;
    else if (this.jumpCount === 0) this.jumpCount = 1;

    // Dynamic Drag Balancing depending on environment state layers
    if (isGrounded) {
      this.sprite.setDragX(this.groundDrag); // Slides cleanly to a stop on solid platforms
    } else {
      this.sprite.setDragX(this.airDrag); // Maintains forward horizontal momentum while airborne
    }

    if (keys) {
      if (keys.A.isDown) {
        this.sprite.setAccelerationX(-this.accelerationRate);
        this.facingDirection = 'LEFT';
      } else if (keys.D.isDown) {
        this.sprite.setAccelerationX(this.accelerationRate);
        this.facingDirection = 'RIGHT';
      } else {
        // Instantly halt active force addition if no navigation buttons are held down
        // The native 'setDragX' engine property takes over and decelerates smoothly!
        this.sprite.setAccelerationX(0);
      }

      if (
        Phaser.Input.Keyboard.JustDown(keys.W) &&
        this.jumpCount < this.MAX_JUMPS
      ) {
        this.sprite.setVelocityY(-850);
        this.jumpCount++;
      }
    } else {
      // For autonomous entities (Dummy), zero active internal thrust addition
      this.sprite.setAccelerationX(0);
    }

    const padding = 150;
    if (
      this.sprite.y > 1080 + padding ||
      this.sprite.x < -padding ||
      this.sprite.x > 1920 + padding
    ) {
      this.lives--;
      if (this.lives > 0) {
        this.respawn(960, 200);
      }
    }

    this.renderSkeleton();
  }

  public respawn(x: number, y: number) {
    this.health = this.maxHealth;
    this.sprite.setVelocity(0, 0);
    this.sprite.setAcceleration(0, 0);
    this.sprite.setPosition(x, y);
    this.jumpCount = 1;
    this.isBlocking = false;
    if (this.isInvisible) this.toggleInvisibility();
  }
}
