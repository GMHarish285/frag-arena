import Phaser from 'phaser';
import { Player } from './Player';
import { ArenaScene } from '../scenes/ArenaScene';

export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export class AIController {
  scene: ArenaScene;
  bot: Player;
  target: Player;
  difficulty: AIDifficulty;

  private lastTick: number = 0;
  private tickDelay: number = 100; 

  private fakeKeys: any = {
    A: { isDown: false, isFake: true, justDown: false, wasDown: false },
    D: { isDown: false, isFake: true, justDown: false, wasDown: false },
    W: { isDown: false, isFake: true, justDown: false, wasDown: false },
    S: { isDown: false, isFake: true, justDown: false, wasDown: false },
    T: { isDown: false, isFake: true, justDown: false, wasDown: false },
    Y: { isDown: false, isFake: true, justDown: false, wasDown: false },
  };

  constructor(scene: ArenaScene, bot: Player, target: Player, difficulty: AIDifficulty = 'HARD') {
    this.scene = scene;
    this.bot = bot;
    this.target = target;
    this.setDifficulty(difficulty);
  }

  setDifficulty(diff: AIDifficulty) {
    this.difficulty = diff;
    if (diff === 'EASY') this.tickDelay = 400;
    else if (diff === 'MEDIUM') this.tickDelay = 200;
    else if (diff === 'HARD') this.tickDelay = 80;
  }

  getKeys() {
    return this.fakeKeys;
  }

  update(time: number, delta: number) {
    // Reset justDown flags every frame
    this.fakeKeys.W.justDown = false;
    this.fakeKeys.S.justDown = false;
    this.fakeKeys.T.justDown = false;
    this.fakeKeys.Y.justDown = false;

    if (time - this.lastTick > this.tickDelay) {
      this.lastTick = time;
      this.think();
    }

    // Process fake "justDown" logic specifically for jumping and dropping
    if (this.fakeKeys.W.isDown && !this.fakeKeys.W.wasDown) this.fakeKeys.W.justDown = true;
    if (this.fakeKeys.S.isDown && !this.fakeKeys.S.wasDown) this.fakeKeys.S.justDown = true;
    
    this.fakeKeys.W.wasDown = this.fakeKeys.W.isDown;
    this.fakeKeys.S.wasDown = this.fakeKeys.S.isDown;

    this.bot.update(this.fakeKeys, delta);
  }

  private setKey(key: string, down: boolean) {
    this.fakeKeys[key].isDown = down;
  }

  private releaseAll() {
    this.setKey('A', false);
    this.setKey('D', false);
    this.setKey('W', false);
    this.setKey('S', false);
    this.setKey('T', false);
    this.setKey('Y', false);
  }

  private think() {
    this.releaseAll();

    if (!this.bot.sprite.active || !this.target.sprite.active) return;

    const bX = this.bot.sprite.x;
    const bY = this.bot.sprite.y;

    // ---------------------------------------------------------
    // 1. DETERMINE OBJECTIVE (Crate vs Player)
    // ---------------------------------------------------------
    let objX = this.target.sprite.x;
    let objY = this.target.sprite.y;
    let targetingCrate = false;

    // If we only have a Pistol (ID 0) and a crate exists, ALWAYS go for crate
    if (this.bot.activeWeaponId === 0) {
        const crates = (this.scene as any).crates.getChildren();
        if (crates.length > 0 && crates[0].active) {
            objX = crates[0].x;
            objY = crates[0].y;
            targetingCrate = true;
        }
    }

    const distToObjX = objX - bX;
    const distToObjY = objY - bY;
    const absDistX = Math.abs(distToObjX);

    // ---------------------------------------------------------
    // 2. HORIZONTAL MOVEMENT
    // ---------------------------------------------------------
    let optimalRange = 250;
    if (this.bot.activeWeaponId === 2 || this.bot.activeWeaponId === 5) optimalRange = 50; // Melee rush
    if (this.bot.activeWeaponId === 4 || this.bot.activeWeaponId === 8) optimalRange = 600; // Sniper/Rocket keep distance

    if (targetingCrate) {
        // Run directly at the crate
        if (absDistX > 20) this.setKey(distToObjX > 0 ? 'D' : 'A', true);
    } else {
        // Combat spacing against player
        if (absDistX > optimalRange + 50) {
            // Move towards player
            this.setKey(distToObjX > 0 ? 'D' : 'A', true);
        } else if (absDistX < optimalRange - 50) {
            // Move away from player (Backpedal)
            this.setKey(distToObjX > 0 ? 'A' : 'D', true);
        } else {
            // Wiggle or maintain facing direction
            this.setKey(distToObjX > 0 ? 'D' : 'A', true);
        }
    }

    // ---------------------------------------------------------
    // 3. VERTICAL MOVEMENT (Platforming)
    // ---------------------------------------------------------
    // Jump if objective is above us
    if (distToObjY < -40) {
        this.setKey('W', true);
    } 
    // Drop if objective is below us and we are roughly horizontally aligned
    else if (distToObjY > 80 && absDistX < 200) {
        this.setKey('S', true);
    }

    // ---------------------------------------------------------
    // 4. COMBAT & SHOOTING
    // ---------------------------------------------------------
    const distToPlayerX = this.target.sprite.x - bX;
    const distToPlayerY = this.target.sprite.y - bY;
    const facingRight = this.bot.facingDirection === 'RIGHT';
    const isFacingPlayer = (distToPlayerX > 0 && facingRight) || (distToPlayerX < 0 && !facingRight);

    // If looking at the player and roughly on the same level, pull the trigger!
    if (isFacingPlayer && Math.abs(distToPlayerY) < 150) {
        if (this.difficulty !== 'EASY' || Math.random() > 0.5) {
            this.setKey('T', true);
            // Use secondary occasionally
            if (Math.random() > 0.8) this.setKey('Y', true);
        }
    }

    // ---------------------------------------------------------
    // 5. DODGING (HARD Difficulty only)
    // ---------------------------------------------------------
    if (this.difficulty === 'HARD') {
        const hazards = [
            ...(this.scene as any).projectiles.getChildren(),
            ...(this.scene as any).rockets.getChildren()
        ];
        
        for (const p of hazards) {
            const proj = p as Phaser.Physics.Arcade.Sprite;
            if (!proj.active || proj.getData('shooterId') === this.bot.id) continue;
            
            const pdx = proj.x - bX;
            const pdy = proj.y - bY;
            
            // If hazard is within 150px and moving towards us
            if (Math.abs(pdx) < 150 && Math.abs(pdy) < 100) {
                // If it's a bit high, drop down. Otherwise jump over it.
                if (pdy < 0 && Math.random() > 0.3) {
                    this.setKey('S', true);
                } else {
                    this.setKey('W', true);
                }
                break; 
            }
        }
    }
  }
}
