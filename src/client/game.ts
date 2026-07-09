import Phaser from 'phaser';
import { ArenaScene } from './scenes/ArenaScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-app',
  width: 1920, // Base resolution width
  height: 1080, // Base resolution height
  backgroundColor: '#2a2a2b',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 2400 }, // Heavy gravity for snappy platformer feel
      debug: true, // Set to true to see hitboxes!
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [ArenaScene],
};

new Phaser.Game(config);
