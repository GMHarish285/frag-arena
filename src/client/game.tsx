import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { launchPhaserGame } from './phaser-init'; 

function GameView() {
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && !gameRef.current) {
            console.log("🎮 Handing control to Phaser Scene Manager...");
            gameRef.current = launchPhaserGame(containerRef.current);
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0a0a0c', overflow: 'hidden' }}>
            {/* Phaser has absolute control over this container now */}
            <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
        </div>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<GameView />);
}