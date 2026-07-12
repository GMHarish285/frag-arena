import Phaser from 'phaser';
import { ArenaScene } from './scenes/ArenaScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { StoryModeScene } from './scenes/StoryModeScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { SettingsScene } from './scenes/SettingsScene';

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
        scene: [MainMenuScene, ArenaScene, StoryModeScene, LeaderboardScene, SettingsScene]
    };

    return new Phaser.Game(config);
}