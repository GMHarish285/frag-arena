import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

type MenuState = 'MAIN_MENU' | 'LEADERBOARD' | 'SETTINGS' | 'PLAYING';

function GameView() {
    const [currentScreen, setCurrentScreen] = useState<MenuState>('MAIN_MENU');

    const handleDailyMayhemClick = () => {
        setCurrentScreen('PLAYING');
        // Once we link our Phaser initialization engine, we will trigger it right here!
    };

    // Button hover utility style helper
    const buttonStyle: React.CSSProperties = {
        background: '#222226',
        color: '#ffffff',
        border: '1px solid #33333c',
        borderRadius: '6px',
        padding: '14px 40px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        outline: 'none',
        width: '260px',
        textAlign: 'center',
        letterSpacing: '1px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        transition: 'transform 0.1s ease, background 0.1s ease'
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            fontFamily: 'monospace',
            color: '#ffffff',
            backgroundColor: '#0a0a0c',
            overflow: 'hidden',
            position: 'relative'
        }}>
            
            {/* --- SCREEN 1: THE FULL MAIN MENU HUB VIEW --- */}
            {currentScreen === 'MAIN_MENU' && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                }}>
                    {/* Game Name/Logo branding header placeholder */}
                    <div style={{ 
                        marginBottom: '50px',
                        padding: '15px 30px',
                        border: '2px dashed #33333a',
                        color: '#555562',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        letterSpacing: '3px'
                    }}>
                        [ IMAGE PLACEHOLDER: frag arena ]
                        <img src="" alt="frag arena" style={{ display: 'none' }} />
                    </div>

                    {/* The 4 Core Hub Action Buttons */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        alignItems: 'center'
                    }}>
                        {/* 1. Daily Rotating Seed Play Trigger */}
                        <button 
                            onClick={handleDailyMayhemClick} 
                            style={{ ...buttonStyle, background: '#ff4500', borderColor: '#ff4500' }}
                        >
                            DAILY MAYHEM
                            <img src="" alt="DAILY MAYHEM" style={{ display: 'none' }} />
                        </button>

                        {/* 2. Story Campaign Selector */}
                        <button onClick={() => alert('Story Mode coming soon!')} style={buttonStyle}>
                            STORY MODE
                            <img src="" alt="STORY MODE" style={{ display: 'none' }} />
                        </button>

                        {/* 3. Global Score Leaderboard Sub-Panel Toggle */}
                        <button onClick={() => setCurrentScreen('LEADERBOARD')} style={buttonStyle}>
                            LEADERBOARD
                            <img src="" alt="LEADERBOARD" style={{ display: 'none' }} />
                        </button>

                        {/* 4. Configuration Options suite Toggle */}
                        <button onClick={() => setCurrentScreen('SETTINGS')} style={buttonStyle}>
                            SETTINGS
                            <img src="" alt="SETTINGS" style={{ display: 'none' }} />
                        </button>
                    </div>
                </div>
            )}

            {/* --- SCREEN 2: SUB-LEADERBOARD STATE VIEW --- */}
            {currentScreen === 'LEADERBOARD' && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    padding: '20px'
                }}>
                    <h2 style={{ letterSpacing: '2px', marginBottom: '20px' }}>GLOBAL TOP SCORERS</h2>
                    <div style={{ background: '#121216', border: '1px solid #22222a', borderRadius: '6px', padding: '30px', width: '80%', maxWidth: '500px', textAlign: 'center', color: '#666' }}>
                        [ Leaderboard server query entries placeholder ]
                    </div>
                    <button 
                        onClick={() => setCurrentScreen('MAIN_MENU')} 
                        style={{ ...buttonStyle, marginTop: '40px', width: '180px', padding: '10px' }}
                    >
                        BACK TO MENU
                    </button>
                </div>
            )}

            {/* --- SCREEN 3: SUB-SETTINGS STATE VIEW --- */}
            {currentScreen === 'SETTINGS' && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    padding: '20px'
                }}>
                    <h2 style={{ letterSpacing: '2px', marginBottom: '20px' }}>GAME CONFIGURATIONS</h2>
                    <div style={{ background: '#121216', border: '1px solid #22222a', borderRadius: '6px', padding: '30px', width: '80%', maxWidth: '500px', textAlign: 'center', color: '#666' }}>
                        [ Keybind Configurations, Audio Control slider wrappers placeholder ]
                    </div>
                    <button 
                        onClick={() => setCurrentScreen('MAIN_MENU')} 
                        style={{ ...buttonStyle, marginTop: '40px', width: '180px', padding: '10px' }}
                    >
                        BACK TO MENU
                    </button>
                </div>
            )}

            {/* --- SCREEN 4: PHASER ARENA LIFE VIEW CONTAINER --- */}
            {currentScreen === 'PLAYING' && (
                <div id="phaser-game-container" style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    backgroundColor: '#000000'
                }}>
                    {/* Emergency Quit overlay button that sits above Phaser's canvas layer */}
                    <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                        <button 
                            onClick={() => setCurrentScreen('MAIN_MENU')} 
                            style={{ 
                                padding: '10px 20px', 
                                cursor: 'pointer', 
                                background: '#ff3333', 
                                color: '#ffffff', 
                                border: 'none', 
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                boxShadow: '0 4px 15px rgba(255, 51, 51, 0.4)'
                            }}
                        >
                            QUIT TO MENU
                        </button>
                    </div>

                    {/* Ground floor backdrop text context indicating Phaser target state readiness */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100%', 
                        color: '#25252b',
                        fontSize: '18px',
                        letterSpacing: '2px',
                        fontWeight: 'bold'
                    }}>
                        [ PHASER ENGINE ARENA WILL MOUNT CANVAS HERE ]
                    </div>
                </div>
            )}
        </div>
    );
}

// Mount the React Application layout to the HTML root node anchor
const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<GameView />);
}