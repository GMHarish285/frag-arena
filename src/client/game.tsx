import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { launchPhaserGame } from './phaser-init'; 

type MenuState = 'MAIN_MENU' | 'LEADERBOARD' | 'SETTINGS' | 'PLAYING';

function GameView() {
    const [currentScreen, setCurrentScreen] = useState<MenuState>('MAIN_MENU');
    
    // 1. Tracks the Phaser engine instance
    const gameRef = useRef<Phaser.Game | null>(null);
    // 2. Tracks the exact HTML Div element we want to mount into
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If we switch to PLAYING and our target div actually exists on screen
        if (currentScreen === 'PLAYING' && containerRef.current) {
            console.log("🎮 Attempting to boot Phaser Engine...");
            try {
                // Pass the exact div reference directly into Phaser
                gameRef.current = launchPhaserGame(containerRef.current);
                console.log("✅ Phaser Engine booted successfully!");
            } catch (error) {
                console.error("❌ PHASER CRASHED DURING BOOT:", error);
            }
        } else {
            // Clean up if we quit back to menu
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [currentScreen]);

    const buttonStyle: React.CSSProperties = {
        background: '#222226', color: '#ffffff', border: '1px solid #33333c',
        borderRadius: '6px', padding: '14px 40px', fontSize: '16px', fontWeight: 'bold',
        cursor: 'pointer', outline: 'none', width: '260px', textAlign: 'center',
        letterSpacing: '1px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        transition: 'transform 0.1s ease, background 0.1s ease'
    };

    return (
        <div style={{ width: '100vw', height: '100vh', fontFamily: 'monospace', color: '#ffffff', backgroundColor: '#0a0a0c', overflow: 'hidden', position: 'relative' }}>
            
            {/* MAIN MENU */}
            {currentScreen === 'MAIN_MENU' && (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <div style={{ marginBottom: '50px', padding: '15px 30px', border: '2px dashed #33333a', color: '#555562', fontSize: '24px', fontWeight: 'bold' }}>
                        [ IMAGE PLACEHOLDER: frag arena ]
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                        <button onClick={() => setCurrentScreen('PLAYING')} style={{ ...buttonStyle, background: '#ff4500', borderColor: '#ff4500' }}>DAILY MAYHEM</button>
                        <button onClick={() => alert('Story Mode coming soon!')} style={buttonStyle}>STORY MODE</button>
                        <button onClick={() => setCurrentScreen('LEADERBOARD')} style={buttonStyle}>LEADERBOARD</button>
                        <button onClick={() => setCurrentScreen('SETTINGS')} style={buttonStyle}>SETTINGS</button>
                    </div>
                </div>
            )}

            {/* THE ARENA WRAPPER */}
            {currentScreen === 'PLAYING' && (
                <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, backgroundColor: '#000000' }}>
                    
                    <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                        <button 
                            onClick={() => setCurrentScreen('MAIN_MENU')} 
                            style={{ padding: '10px 20px', cursor: 'pointer', background: '#ff3333', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                        >
                            QUIT TO MENU
                        </button>
                    </div>

                    {/* We attach the React 'ref' here so Phaser knows EXACTLY where to inject */}
                    <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
                </div>
            )}
        </div>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<GameView />);
}