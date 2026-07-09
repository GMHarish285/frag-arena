import Phaser from 'phaser';
import { ArenaScene } from './scenes/ArenaScene'; // Ensure this path matches exactly!

// Note: We changed 'containerId' to 'parentEl: HTMLDivElement'
export function launchPhaserGame(parentEl: HTMLDivElement): Phaser.Game {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: parentEl, // Phaser will inject directly into this explicit DOM node
        width: 1920,
        height: 1080,
        backgroundColor: '#1a1a1a',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: 2400 },
                debug: true 
            }
        },
        scene: [ArenaScene]
    };

    return new Phaser.Game(config);
}