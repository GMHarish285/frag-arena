import Phaser from 'phaser';

export class Player {
    public id: string;
    public teamId: string;
    public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    
    public jumpCount: number = 0;
    public readonly MAX_JUMPS: number = 2;
    public facingDirection: 'LEFT' | 'RIGHT' = 'RIGHT';

    // NEW COMBAT STATES
    public isBlocking: boolean = false;
    public isInvisible: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, id: string, teamId: string, color: number) {
        this.id = id;
        this.teamId = teamId;

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
        this.sprite.setData('entity', this);
    }

    public applyKnockback(kbX: number, kbY: number) {
        // If blocking, reduce physical knockback by 80%
        if (this.isBlocking) {
            kbX *= 0.2;
            kbY *= 0.2;
        }
        this.sprite.setVelocity(this.sprite.body.velocity.x + kbX, this.sprite.body.velocity.y + kbY);
    }

    public toggleInvisibility() {
        this.isInvisible = !this.isInvisible;
        // 0.2 alpha so the owner can still vaguely see themselves, but enemies struggle
        this.sprite.setAlpha(this.isInvisible ? 0.2 : 1);
    }

    public update(keys?: any) {
        const isGrounded = this.sprite.body.touching.down;
        if (isGrounded) this.jumpCount = 0;
        else if (this.jumpCount === 0) this.jumpCount = 1;

        if (keys) {
            const moveSpeed = 500; 
            if (keys.A.isDown) {
                this.sprite.setVelocityX(-moveSpeed);
                this.facingDirection = 'LEFT';
            } else if (keys.D.isDown) {
                this.sprite.setVelocityX(moveSpeed);
                this.facingDirection = 'RIGHT';
            } else {
                if (Math.abs(this.sprite.body.velocity.x) <= moveSpeed) {
                    this.sprite.setVelocityX(0);
                }
            }

            if (Phaser.Input.Keyboard.JustDown(keys.W) && this.jumpCount < this.MAX_JUMPS) {
                this.sprite.setVelocityY(-850); 
                this.jumpCount++;
            }
        }

        const padding = 150;
        if (this.sprite.y > 1080 + padding || this.sprite.x < -padding || this.sprite.x > 1920 + padding) {
            this.respawn(960, 200);
        }
    }

    public respawn(x: number, y: number) {
        this.sprite.setVelocity(0, 0);
        this.sprite.setPosition(x, y);
        this.jumpCount = 1;
        this.isBlocking = false;
        if (this.isInvisible) this.toggleInvisibility();
    }
}