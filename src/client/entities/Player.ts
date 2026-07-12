import Phaser from 'phaser';
import { GameConfig } from '../config/ConfigManager';

type Joint = { x: number; y: number };

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

  // --- STEP 4 RUN CYCLE TRACKING ---
  private walkTime: number = 0;

  private lastGroundedTime: number = 0;

  public jumpCount: number = 0;
  public facingDirection: 'LEFT' | 'RIGHT' = 'RIGHT';

  public isBlocking: boolean = false;
  public isInvisible: boolean = false;

  public health: number;
  public lives: number;
  private maxHealth: number;

  // Enforced specific sprite caps not present in standard physics config
  private readonly maxMoveSpeed: number = 50;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: string,
    teamId: string,
    color: number,
    maxHealth: number = 100, // Kept signature for backwards compatibility with ArenaScene
    maxLives: number = 10
  ) {
    this.id = id;
    this.teamId = teamId;

    // USE CONFIG: Health & Lives
    this.maxHealth = GameConfig.player.stats.maxHealth;
    this.health = this.maxHealth;
    this.lives = GameConfig.player.stats.startingLives;

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

    // USE CONFIG: World Gravity
    this.sprite.setGravityY(GameConfig.world.physics.gravityY);

    // Enforce maximum absolute movement limits so acceleration doesn't scale infinitely
    this.sprite.setMaxVelocity(this.maxMoveSpeed, 1200);

    // Hides the block image but leaves debug hitbox visible
    this.sprite.setAlpha(0);

    // Initializes our procedural skeleton graphics layer
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

  /**
   * Solves a 2-joint Inverse Kinematics system (Shoulder->Elbow->Hand or Hip->Knee->Foot)
   * Returns the position of the middle joint (Elbow/Knee).
   */
  private solveIK(
    root: Joint,
    target: Joint,
    len1: number,
    len2: number,
    flipJoint: boolean
  ): Joint {
    const dx = target.x - root.x;
    const dy = target.y - root.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    // Max Reach Constraint: If the target is too far away, clamp it to maximum extension
    const maxReach = len1 + len2 - 0.1;
    if (dist > maxReach) {
      const angle = Math.atan2(dy, dx);
      target.x = root.x + Math.cos(angle) * maxReach;
      target.y = root.y + Math.sin(angle) * maxReach;
      dist = maxReach;
    }

    // Apply Law of Cosines to extract the internal joint angle
    const cosAngle =
      (len1 * len1 + dist * dist - len2 * len2) / (2 * len1 * dist);
    const innerAngle = Math.acos(Phaser.Math.Clamp(cosAngle, -1, 1));
    const baseAngle = Math.atan2(dy, dx);

    // Flip joint bend direction depending on structural mapping
    const finalAngle = flipJoint
      ? baseAngle - innerAngle
      : baseAngle + innerAngle;

    return {
      x: root.x + Math.cos(finalAngle) * len1,
      y: root.y + Math.sin(finalAngle) * len1,
    };
  }

  private renderSkeleton() {
    const g = this.skeletonGraphics;
    g.clear();

    const currentAlpha = this.isInvisible ? 0.15 : 1;
    g.lineStyle(4, 0xffffff, currentAlpha);
    g.fillStyle(0xffffff, currentAlpha);

    const px = this.sprite.x;
    const py = this.sprite.y;

    // 1. Central spine structural coordinates
    const neck = { x: px, y: py - 32 };
    const pelvis = { x: px, y: py + 3 };

    // Draw Head and Torso Spine
    g.fillCircle(neck.x, neck.y - this.headRadius, this.headRadius);
    g.lineBetween(neck.x, neck.y, pelvis.x, pelvis.y);

    const isRight = this.facingDirection === 'RIGHT';
    const directionSign = isRight ? 1 : -1;

    // 2. ARMS: Dynamic IK Execution
    const backHandTarget: Joint = {
      x: neck.x + directionSign * 32,
      y: neck.y + 14,
    };
    const frontHandTarget: Joint = {
      x: neck.x + directionSign * 45,
      y: neck.y + 8,
    };

    const backElbow = this.solveIK(
      neck,
      backHandTarget,
      this.armLen1,
      this.armLen2,
      !isRight
    );
    g.lineBetween(neck.x, neck.y, backElbow.x, backElbow.y);
    g.lineBetween(backElbow.x, backElbow.y, backHandTarget.x, backHandTarget.y);

    const frontElbow = this.solveIK(
      neck,
      frontHandTarget,
      this.armLen1,
      this.armLen2,
      !isRight
    );
    g.lineBetween(neck.x, neck.y, frontElbow.x, frontElbow.y);
    g.lineBetween(
      frontElbow.x,
      frontElbow.y,
      frontHandTarget.x,
      frontHandTarget.y
    );

    // 3. LEGS: Procedural Walk Cycle & Jump Pose Math
    const groundY = py + 47.5;
    const vx = this.sprite.body.velocity.x;
    const vy = this.sprite.body.velocity.y;
    const isGrounded =
      this.sprite.body.touching.down || this.sprite.body.blocked.down;

    // Initialize default baseline foot coordinates
    let leftFootTarget: Joint = { x: pelvis.x - 12, y: groundY };
    let rightFootTarget: Joint = { x: pelvis.x + 12, y: groundY };

    if (isGrounded) {
      // GROUNDED RUNNING POSE LOGIC
      // Advance the walk cycle timeline proportionally to horizontal physics speed
      if (Math.abs(vx) > 5) {
        this.walkTime += Math.abs(vx) * 0.0006;
      }

      // Stride size constraints
      const strideLength = 16;
      const stepHeight = 10;

      // Check how fast we are moving relative to average velocity to blend the legs seamlessly
      const runningIntensity = Phaser.Math.Clamp(Math.abs(vx) / 300, 0, 1);

      // Left Leg Cycle (Phase angle 0)
      const leftAngle = this.walkTime;
      const leftXOffset = Math.cos(leftAngle) * strideLength;
      // Only lift foot on forward swing (when sin is positive)
      const leftYOffset =
        Math.sin(leftAngle) > 0 ? -Math.sin(leftAngle) * stepHeight : 0;

      // Right Leg Cycle (Phase offset by PI radians / 180 degrees to alternate footsteps)
      const rightAngle = this.walkTime + Math.PI;
      const rightXOffset = Math.cos(rightAngle) * strideLength;
      const rightYOffset =
        Math.sin(rightAngle) > 0 ? -Math.sin(rightAngle) * stepHeight : 0;

      // Apply calculated cyclic offsets scaled by current movement intensity
      leftFootTarget.x += leftXOffset * runningIntensity;
      leftFootTarget.y += leftYOffset * runningIntensity;

      rightFootTarget.x += rightXOffset * runningIntensity;
      rightFootTarget.y += rightYOffset * runningIntensity;
    } else {
      // AIRBORNE JUMP POSE LOGIC
      // If flying upward, pull knees up into a compact jumping stance
      if (vy < 0) {
        leftFootTarget.y = groundY - 14;
        leftFootTarget.x = pelvis.x - 6;

        rightFootTarget.y = groundY - 8;
        rightFootTarget.x = pelvis.x + 4;
      } else {
        // If falling downward, extend legs straight down anticipating ground contact
        leftFootTarget.y = groundY + 4;
        leftFootTarget.x = pelvis.x - 8;

        rightFootTarget.y = groundY + 4;
        rightFootTarget.x = pelvis.x + 8;
      }
    }

    // Solve for the dynamic Knee coordinate targets using your IK core
    const leftKnee = this.solveIK(
      pelvis,
      leftFootTarget,
      this.legLen1,
      this.legLen2,
      isRight
    );
    const rightKnee = this.solveIK(
      pelvis,
      rightFootTarget,
      this.legLen1,
      this.legLen2,
      isRight
    );

    // Draw Left Leg (Hip -> Knee -> Foot)
    g.lineBetween(pelvis.x, pelvis.y, leftKnee.x, leftKnee.y);
    g.lineBetween(leftKnee.x, leftKnee.y, leftFootTarget.x, leftFootTarget.y);

    // Draw Right Leg (Hip -> Knee -> Foot)
    g.lineBetween(pelvis.x, pelvis.y, rightKnee.x, rightKnee.y);
    g.lineBetween(
      rightKnee.x,
      rightKnee.y,
      rightFootTarget.x,
      rightFootTarget.y
    );
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
    // --- READ FROM CENTRAL CONFIG ---
    const {
      accelerationRate,
      groundDrag,
      airDrag,
      jumpVelocity,
      maxJumps,
      coyoteTimeMs,
    } = GameConfig.player.movement;
    const { boundaries } = GameConfig.world;

    // Get the current game time for our timer checks
    const currentTime = this.sprite.scene.time.now;

    const isGrounded =
      this.sprite.body.touching.down || this.sprite.body.blocked.down;

    // --- COYOTE TIME & DRAG LOGIC ---
    if (isGrounded) {
      this.jumpCount = 0;
      this.lastGroundedTime = currentTime;
      this.sprite.setDragX(groundDrag);
    } else {
      this.sprite.setDragX(airDrag);

      // If we are airborne and haven't jumped yet, check the coyote grace period.
      // If the time since we left the ground exceeds the config window, consume the first jump.
      if (
        this.jumpCount === 0 &&
        currentTime - this.lastGroundedTime > coyoteTimeMs
      ) {
        this.jumpCount = 1;
      }
    }

    // --- MOVEMENT INPUTS ---
    if (keys) {
      if (keys.A.isDown) {
        this.sprite.setAccelerationX(-accelerationRate);
        this.facingDirection = 'LEFT';
      } else if (keys.D.isDown) {
        this.sprite.setAccelerationX(accelerationRate);
        this.facingDirection = 'RIGHT';
      } else {
        // Instantly halt active force addition if no navigation buttons are held down
        this.sprite.setAccelerationX(0);
      }

      // --- JUMPING ---
      if (Phaser.Input.Keyboard.JustDown(keys.W) && this.jumpCount < maxJumps) {
        this.sprite.setVelocityY(jumpVelocity);
        this.jumpCount++;

        // Instantly zero out the grounded timer so the jump cancels the coyote window
        this.lastGroundedTime = 0;
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
      } else {
        this.sprite.destroy();
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
