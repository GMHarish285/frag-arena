import React from 'react';
import { createRoot } from 'react-dom/client';

// ◄--- FIX: Tell the TypeScript compiler to ignore missing library typings.
// This preserves runtime execution while silencing the red line error in VS Code!
// @ts-ignore
import { requestExpandedMode, context } from '@devvit/web/client';

function SplashView() {
    // Replicate the template's username initialization feature dynamically!
    const username = context?.username ?? 'Brawler';

    const handlePlayClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        try {
            // React buttons yield a SyntheticEvent wrapper. 
            // We pass 'event.nativeEvent' to extract the raw browser DOM click event 
            // that the Devvit engine expects!
            requestExpandedMode(event.nativeEvent, 'game');
        } catch (error) {
            console.error("Failed to expand view mode:", error);
        }
    };

    return (
        <div style={{
            width: '100vw', 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            fontFamily: 'monospace',
            backgroundColor: '#0a0a0c',
            color: '#ffffff'
        }}>
            {/* Dynamic Welcome Greeting (Replicating the template's init loop) */}
            <h2 style={{ marginBottom: '10px', fontWeight: 'normal', letterSpacing: '1px' }}>
                Hey {username} 👋
            </h2>

            {/* Game Branding Title Placeholder */}
            <div style={{ 
                marginBottom: '50px',
                padding: '20px',
                border: '2px dashed #33333a',
                color: '#555562',
                textAlign: 'center',
                width: '260px'
            }}>
                [ IMAGE PLACEHOLDER: frag arena ]
            </div>

            {/* Play Button */}
            <button 
                onClick={handlePlayClick}
                style={{ 
                    background: '#ff4500', // Reddit orange-red color profile
                    color: '#ffffff',
                    border: 'none', 
                    borderRadius: '8px',
                    padding: '16px 48px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer', 
                    outline: 'none',
                    letterSpacing: '2px',
                    boxShadow: '0 4px 20px rgba(255, 69, 0, 0.35)',
                    transition: 'transform 0.1s ease'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
                PLAY NOW
                <img src="" alt="PLAY" style={{ display: 'none' }} />
            </button>
        </div>
    );
}

// Mount the React application framework onto our document node anchor
const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<SplashView />);
}