import Phaser from 'phaser';

export class Player {
    public id: string;
    public teamId: string;
    public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    
    public jumpCount: number = 0;
    public readonly MAX_JUMPS: number = 2;
    public facingDirection: 'LEFT' | 'RIGHT' = 'RIGHT';

    constructor(scene: Phaser.Scene, x: number, y: number, id: string, teamId: string, color: number) {
        this.id = id;
        this.teamId = teamId;

        // Dynamically generate a distinct colored texture for this player
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
        this.sprite.setDrag(2000, 0);

        // Map this class instance into the sprite data so colliders can access it!
        this.sprite.setData('entity', this);
    }

    public applyKnockback(kbX: number, kbY: number) {
        // Add impact velocity on top of whatever movement they are currently doing
        this.sprite.setVelocity(this.sprite.body.velocity.x + kbX, this.sprite.body.velocity.y + kbY);
    }

    public update(keys?: any) {
        const isGrounded = this.sprite.body.touching.down;
        if (isGrounded) this.jumpCount = 0;
        else if (this.jumpCount === 0) this.jumpCount = 1;

        // Only apply movement if input keys were provided (Dummy ignores this)
        if (keys) {
            const moveSpeed = 500; 
            if (keys.A.isDown) {
                this.sprite.setVelocityX(-moveSpeed);
                this.facingDirection = 'LEFT';
            } else if (keys.D.isDown) {
                this.sprite.setVelocityX(moveSpeed);
                this.facingDirection = 'RIGHT';
            } else {
                // Friction lock: only halt if they aren't actively being knocked back!
                if (Math.abs(this.sprite.body.velocity.x) <= moveSpeed) {
                    this.sprite.setVelocityX(0);
                }
            }

            if (Phaser.Input.Keyboard.JustDown(keys.W) && this.jumpCount < this.MAX_JUMPS) {
                this.sprite.setVelocityY(-850); 
                this.jumpCount++;
            }
        }

        // Global Boundary Death Logic handles itself per-player automatically!
        const padding = 150;
        if (this.sprite.y > 1080 + padding || this.sprite.x < -padding || this.sprite.x > 1920 + padding) {
            this.respawn(960, 200); // Drop back in the center
        }
    }

    public respawn(x: number, y: number) {
        this.sprite.setVelocity(0, 0);
        this.sprite.setPosition(x, y);
        this.jumpCount = 1; // Count the air-drop
    }
}