import Phaser from 'phaser';

export class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        this.add.text(width / 2, height * 0.4, 'STORY MODE', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ffffff',
            letterSpacing: 4
        }).setOrigin(0.5);

        const backBtn = this.add.text(width / 2, height * 0.6, '< BACK TO MENU', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ff4500'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
        backBtn.on('pointerout', () => backBtn.setColor('#ff4500'));
        backBtn.on('pointerup', () => this.scene.start('MainMenuScene'));
    }
}