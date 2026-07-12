import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Branding Title
        this.add.text(width / 2, height * 0.25, '[ IMAGE PLACEHOLDER: frag arena ]', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#555562',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5).setPadding(20).setStyle({ border: '2px dashed #33333a' });

        // Reusable Button Builder Helper
        const createButton = (y: number, text: string, isPrimary: boolean, onClick: () => void) => {
            const btnContainer = this.add.container(width / 2, y);
            
            // Base button styling
            const bgColor = isPrimary ? 0xff4500 : 0x222226;
            const strokeColor = isPrimary ? 0xff4500 : 0x33333c;
            const hoverColor = isPrimary ? 0xff5722 : 0x33333a;
            const clickColor = isPrimary ? 0xcc3700 : 0x111111;

            const bg = this.add.rectangle(0, 0, 300, 60, bgColor)
                .setStrokeStyle(2, strokeColor)
                .setInteractive({ useHandCursor: true });
                
            const txt = this.add.text(0, 0, text, {
                fontSize: '20px',
                fontFamily: 'monospace',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            btnContainer.add([bg, txt]);

            // Interactive Event Listeners
            bg.on('pointerover', () => bg.setFillStyle(hoverColor));
            bg.on('pointerout', () => bg.setFillStyle(bgColor));
            bg.on('pointerdown', () => {
                bg.setFillStyle(clickColor);
                btnContainer.y += 2; // Press down effect
            });
            bg.on('pointerup', () => {
                bg.setFillStyle(hoverColor);
                btnContainer.y -= 2; // Release effect
                onClick();
            });
        };

        // Generate the 4 Menu Options
        createButton(height * 0.45, 'DAILY MAYHEM', true, () => this.scene.start('ArenaScene'));
        createButton(height * 0.55, 'STORY MODE', false, () => this.scene.start('StoryModeScene'));
        createButton(height * 0.65, 'LEADERBOARD', false, () => this.scene.start('LeaderboardScene'));
        createButton(height * 0.75, 'SETTINGS', false, () => this.scene.start('SettingsScene'));
    }
}