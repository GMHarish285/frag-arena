import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { launchPhaserGame } from './phaser-init'; 

// Apply global overrides ONCE to fix Phaser's CSS rotation handling
const setupOrientationHacks = () => {
    if ((window as any).__orientationHacksSetup) return;
    (window as any).__orientationHacksSetup = true;

    // 1. Unrotate Pointer Events (intercept clientX, clientY, and TouchLists)
    const originalAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(this: EventTarget, type: string, listener: any, options: any) {
        if (typeof listener === 'function' && (type.startsWith('pointer') || type.startsWith('mouse') || type.startsWith('touch'))) {
            const wrapped = function(this: EventTarget, e: any) {
                if (window.innerHeight > window.innerWidth) {
                    const proxy = new Proxy(e, {
                        get(target, prop) {
                            if (prop === 'clientX' && target.clientX !== undefined) return target.clientY;
                            if (prop === 'clientY' && target.clientY !== undefined) return window.innerWidth - target.clientX;
                            if (prop === 'pageX' && target.pageX !== undefined) return target.pageY;
                            if (prop === 'pageY' && target.pageY !== undefined) return window.innerWidth - target.pageX;
                            
                            if (prop === 'touches' || prop === 'changedTouches' || prop === 'targetTouches') {
                                if (!target[prop]) return target[prop];
                                return Array.from(target[prop]).map((t: any) => new Proxy(t, {
                                    get(tTarget, tProp) {
                                        if (tProp === 'clientX') return tTarget.clientY;
                                        if (tProp === 'clientY') return window.innerWidth - tTarget.clientX;
                                        if (tProp === 'pageX') return tTarget.pageY;
                                        if (tProp === 'pageY') return window.innerWidth - tTarget.pageX;
                                        if (typeof tTarget[tProp] === 'function') return tTarget[tProp].bind(tTarget);
                                        return tTarget[tProp];
                                    }
                                }));
                            }
                            if (typeof target[prop] === 'function') return target[prop].bind(target);
                            return target[prop];
                        }
                    });
                    return listener.call(this, proxy);
                }
                return listener.call(this, e);
            };
            listener.__wrapped = wrapped;
            return originalAdd.call(this, type, wrapped, options);
        }
        return originalAdd.call(this, type, listener, options);
    };

    const originalRemove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.removeEventListener = function(this: EventTarget, type: string, listener: any, options: any) {
        if (listener && listener.__wrapped) {
            return originalRemove.call(this, type, listener.__wrapped, options);
        }
        return originalRemove.call(this, type, listener, options);
    };

    // 2. Unrotate Canvas Bounding Box (so Phaser calculates pointer offsets correctly)
    const origCanvasGetBoundingClientRect = HTMLCanvasElement.prototype.getBoundingClientRect;
    HTMLCanvasElement.prototype.getBoundingClientRect = function(this: HTMLCanvasElement) {
        const rect = origCanvasGetBoundingClientRect.call(this);
        if (window.innerHeight > window.innerWidth) {
            const unrotatedLeft = rect.top;
            const unrotatedTop = window.innerWidth - rect.right;
            const unrotatedWidth = rect.height;
            const unrotatedHeight = rect.width;
            return {
                x: unrotatedLeft, y: unrotatedTop,
                left: unrotatedLeft, top: unrotatedTop,
                width: unrotatedWidth, height: unrotatedHeight,
                right: unrotatedLeft + unrotatedWidth, bottom: unrotatedTop + unrotatedHeight,
                toJSON: rect.toJSON
            } as DOMRect;
        }
        return rect;
    };
};
setupOrientationHacks();

function GameView() {
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [winSize, setWinSize] = useState({ w: window.innerWidth, h: window.innerHeight });
    const isPortrait = winSize.h > winSize.w;

    useEffect(() => {
        const handleResize = () => setWinSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', handleResize);

        if (containerRef.current && !gameRef.current) {
            console.log("🎮 Handing control to Phaser Scene Manager...");
            
            // 3. Unrotate Container Bounding Box (so Phaser's ScaleManager sizes the canvas correctly)
            const container = containerRef.current;
            const origGetBoundingClientRect = container.getBoundingClientRect.bind(container);
            container.getBoundingClientRect = () => {
                const rect = origGetBoundingClientRect();
                if (window.innerHeight > window.innerWidth) {
                    return {
                        x: rect.x, y: rect.y,
                        left: rect.left, top: rect.top,
                        width: window.innerHeight, height: window.innerWidth,
                        right: rect.left + window.innerHeight, bottom: rect.top + window.innerWidth,
                        toJSON: rect.toJSON
                    } as DOMRect;
                }
                return rect;
            };

            gameRef.current = launchPhaserGame(container);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    const portraitStyle: React.CSSProperties = {
        width: `${winSize.h}px`,
        height: `${winSize.w}px`,
        transform: 'rotate(90deg)',
        transformOrigin: 'top left',
        position: 'absolute',
        top: 0,
        left: `${winSize.w}px`,
    };

    const landscapeStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
    };

    return (
        <div style={{ width: `${winSize.w}px`, height: `${winSize.h}px`, backgroundColor: '#0a0a0c', overflow: 'hidden', position: 'relative' }}>
            <div ref={containerRef} style={isPortrait ? portraitStyle : landscapeStyle}></div>
        </div>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<GameView />);
}