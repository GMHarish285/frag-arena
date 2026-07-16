import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        this.scene.launch('ArenaScene', { isBackgroundMode: true });
        this.scene.bringToTop('MainMenuScene');

        // Branding Title Stack for Neon Glow
        const titleStyle = {
            fontSize: '72px',
            fontFamily: 'Impact, sans-serif',
            color: '#ffffff',
            fontStyle: 'italic',
            align: 'center'
        };

        const titleX = width / 2;
        const titleY = height * 0.25;
        
        this.add.text(titleX, titleY, 'FRAG ARENA', titleStyle).setOrigin(0.5).setShadow(0, 0, '#ec4899', 40, false, true);
        this.add.text(titleX, titleY, 'FRAG ARENA', titleStyle).setOrigin(0.5).setShadow(0, 0, '#00e5ff', 20, false, true);
        this.add.text(titleX, titleY, 'FRAG ARENA', titleStyle).setOrigin(0.5).setShadow(0, 0, '#00e5ff', 10, false, true);
        this.add.text(titleX, titleY, 'FRAG ARENA', titleStyle).setOrigin(0.5);

        // Reusable Button Builder Helper
        const createButton = (y: number, text: string, isPrimary: boolean, onClick: () => void) => {
            const btnContainer = this.add.container(width / 2, y);
            
            // Base button styling - semi-transparent
            const bgColor = isPrimary ? 0xec4899 : 0x000000;
            const bgAlpha = isPrimary ? 0.2 : 0.4;
            const strokeColor = isPrimary ? 0xec4899 : 0x00e5ff;
            const hoverAlpha = isPrimary ? 0.4 : 0.6;
            const clickAlpha = isPrimary ? 0.6 : 0.8;

            const bg = this.add.rectangle(0, 0, 320, 60, bgColor, bgAlpha)
                .setStrokeStyle(2, strokeColor)
                .setInteractive({ useHandCursor: true });
                
            const txt = this.add.text(0, 0, text, {
                fontSize: '24px',
                fontFamily: 'Impact, sans-serif',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setShadow(0, 0, '#ffffff', 8, false, true);

            btnContainer.add([bg, txt]);

            // Interactive Event Listeners
            bg.on('pointerover', () => bg.setFillStyle(bgColor, hoverAlpha));
            bg.on('pointerout', () => bg.setFillStyle(bgColor, bgAlpha));
            bg.on('pointerdown', () => {
                bg.setFillStyle(bgColor, clickAlpha);
                btnContainer.y += 2;
                btnContainer.setScale(0.96);
            });
            bg.on('pointerup', () => {
                bg.setFillStyle(bgColor, hoverAlpha);
                btnContainer.y -= 2;
                btnContainer.setScale(1);
                onClick();
            });
        };

        const showComingSoon = (y: number) => {
            const popup = this.add.text(width / 2, y, 'COMING SOON', {
                fontSize: '28px',
                fontFamily: 'Impact, sans-serif',
                color: '#ff0055',
                fontStyle: 'italic'
            }).setOrigin(0.5).setShadow(0, 0, '#ff0055', 10, false, true).setDepth(100);
            
            this.tweens.add({
                targets: popup,
                y: y - 40,
                alpha: 0,
                duration: 1200,
                ease: 'Power2',
                onComplete: () => popup.destroy()
            });
        };

        // Generate the 4 Menu Options
        createButton(height * 0.45, 'DAILY MAYHEM', true, () => {
            this.scene.stop('ArenaScene');
            this.scene.start('ArenaScene', { isBackgroundMode: false });
        });
        createButton(height * 0.55, 'STORY MODE', false, () => {
            showComingSoon(height * 0.55);
        });
        createButton(height * 0.65, 'LEADERBOARD', false, () => {
            showComingSoon(height * 0.65);
        });
        createButton(height * 0.75, 'SETTINGS', false, () => {
            showComingSoon(height * 0.75);
        });
    }
}