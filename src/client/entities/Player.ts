import Phaser from 'phaser';

export class Player {
    public id: string;
    public teamId: string;
    public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    
    public jumpCount: number = 0;
    public readonly MAX_JUMPS: number = 2;
    public facingDirection: 'LEFT' | 'RIGHT' = 'RIGHT';

    public isBlocking: boolean = false;
    public isInvisible: boolean = false;

    public health: number;
    public lives: number;
    private maxHealth: number;

    // --- EASY BALANCE PROPERTIES FOR INERTIAL MOVEMENT ---
    private readonly maxMoveSpeed: number = 50;      // Sprintf top threshold speed limits
    private readonly accelerationRate: number = 1800; // How fast you ramp up to top speed (px/sec^2)
    private readonly groundDrag: number = 4400;       // Deceleration slide factor when keys are released
    private readonly airDrag: number = 4400;           // Less friction restriction while airborne

    constructor(scene: Phaser.Scene, x: number, y: number, id: string, teamId: string, color: number, maxHealth: number = 100, maxLives: number = 10) {
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
        
        // Enforce maximum absolute movement limits so acceleration doesn't scale infinitely
        this.sprite.setMaxVelocity(this.maxMoveSpeed, 1200);
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

    public applyKnockback(kbX: number, kbY: number) {
        if (this.isBlocking) {
            kbX *= 0.2;
            kbY *= 0.2;
        }
        // Temporarily reset acceleration on hit so your inputs don't instantly fight the knockback vector
        this.sprite.setAccelerationX(0);
        this.sprite.setVelocity(this.sprite.body.velocity.x + kbX, this.sprite.body.velocity.y + kbY);
    }

    public toggleInvisibility() {
        this.isInvisible = !this.isInvisible;
        this.sprite.setAlpha(this.isInvisible ? 0.2 : 1);
    }

    public update(keys?: any) {
        const isGrounded = this.sprite.body.touching.down;
        if (isGrounded) this.jumpCount = 0;
        else if (this.jumpCount === 0) this.jumpCount = 1;

        // Dynamic Drag Balancing depending on environment state layers
        if (isGrounded) {
            this.sprite.setDragX(this.groundDrag); // Slides cleanly to a stop on solid platforms
        } else {
            this.sprite.setDragX(this.airDrag);    // Maintains forward horizontal momentum while airborne
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

            if (Phaser.Input.Keyboard.JustDown(keys.W) && this.jumpCount < this.MAX_JUMPS) {
                this.sprite.setVelocityY(-850); 
                this.jumpCount++;
            }
        } else {
            // For autonomous entities (Dummy), zero active internal thrust addition
            this.sprite.setAccelerationX(0);
        }

        const padding = 150;
        if (this.sprite.y > 1080 + padding || this.sprite.x < -padding || this.sprite.x > 1920 + padding) {
            this.lives--;
            if (this.lives > 0) {
                this.respawn(960, 200);
            }
        }
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