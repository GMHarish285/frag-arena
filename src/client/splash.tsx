import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// @ts-ignore
import { requestExpandedMode } from '@devvit/web/client';

// ============================================================================
//   SPLASH SCREEN CONFIGURATION PROFILE DASHBOARD (ADJUST AND EXPERIMENT HERE)
// ============================================================================
const ENGINE_CONFIG = {
  // 1. MOTION PARALLAX TRACKING SENSITIVITY CONFIGURATIONS
  parallax: {
    lerpFactor: 0.1,              // Interpolation smoothing step (lower = heavier/slower drift)
    
    mobile: {
      maxOffsetPx: 35,            // Hard safety boundary ceiling for screen shifts on phones
      layer1Bg: 0.25,             // Perspective grid movement speed multiplier
      layer2Chars: 0.85,          // Twin stickmen frames movement speed multiplier
      layer3Ui: 1.40,             // Game logo and play button speed multiplier
      neutralPitch: 45            // Neutral phone viewing angle baseline (degrees tilt forward)
    },
    
    pc: {
      maxOffsetPx: 14,            // ADJUSTED: Softened max pixel drift for comfortable Mac usage
      layer1Bg: 0.20,             // Background space grid travel multiplier
      layer2Chars: 0.60,          // Character standoff container travel multiplier
      layer3Ui: 1.10              // Interface logo and button canvas multiplier
    }
  },

  // 2. SYNTHWAVE HORIZON GRID DESIGN SPECIFICATIONS
  grid: {
    horizonYPercent: 0.62,        // Y-axis level of the horizontal boundary line (62% from top)
    verticalLineCount: 36,        // Quantity of radial straight guide vectors drawn
    skewPower: 1.35,              // Center line grouping weight (higher = narrower center gap)
    gridSpreadMultiplier: 3.5,     // Ground layout base spread expansion factor past edge walls
    
    horizontalLineCount: 22,      // Total counts of cross bars fading out into the distance
    horizontalPower: 2.3,         // Logarithmic clustering force heading toward the horizon line
    
    gridColor: 'rgba(0, 191, 255, 0.4)',  // Translucent neon cyan grid lines color profile
    horizonColor: '#00e5ff',              // Sharp laser beam horizon separation line
    horizonGlowBlur: 12                   // Neon bloom thickness layer on the main dividing bar
  },

  // 3. TRAVELING LINE ENERGY PULSE / FLARE PARTICLES PROPERTIES
  flashes: {
    maxConcurrent: 10,            // Total allowed concurrent flare instances rendering together
    spawnChance: 0.06,            // Frame chance tick to emit an active beam element (6% chance)
    minSpeed: 0.012,              // Lower speed bounds profile for trailing pulses
    maxSpeed: 0.034,              // Upper speed bounds profile for rapid lighting discharges
    minStreakLength: 0.06,        // Minimum trail footprint span fraction
    maxStreakLength: 0.14,        // Maximum trail footprint span fraction
    flareGlowBlur: 8,             // Energy emission bloom width scale
    flareGlowColor: '#00e5ff',     // Ambient trailing bloom color identity
    coreWidth: 2,                 // White internal plasma discharge filament lines weight
    glowWidth: 5                  // Outer colored neon plasma sheath thickness profile
  },

  // 4. UI OBJECT CONTAINERS POSITIONS AND FRAMING DEFINITIONS (1:1 FEED SAFE)
  layout: {
    logo: {
      top: '6%',                  // Pinned close to top ceiling boundary
      width: '90%',               
      maxWidth: '520px',          
      height: '12%'               
    },
    playButton: {
      bottom: '8%',               // Pinned clean right above bottom grid bounds
      width: '240px',             
      height: '76px'              
    },
    leftStickman: {
      left: '5%',                 
      bottom: '38%',              // Placed inline to stand firmly right over the horizon line
      width: '35%',               
      height: '40%'               
    },
    rightStickman: {
      right: '5%',                
      bottom: '38%',              
      width: '35%',               
      height: '40%'               
    }
  }
};

interface GridFlash {
  lineIndex: number;
  progress: number; 
  speed: number;
  streakLength: number;
}

function SplashView() {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const layer2LeftRef = useRef<HTMLDivElement | null>(null);
  const layer2RightRef = useRef<HTMLDivElement | null>(null);
  const layer3UiRef = useRef<HTMLDivElement | null>(null);

  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });
  const isMobileSensorActive = useRef(false);
  const activeFlashes = useRef<GridFlash[]>([]);

  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); 

    let animFrameId: number;
    const lineCount = ENGINE_CONFIG.grid.verticalLineCount;

    // --- HIGH PERFORMANCE SPLASH ACTION ANIMATION LOOP ---
    const renderLoop = () => {
      currentOffset.current.x += (targetOffset.current.x - currentOffset.current.x) * ENGINE_CONFIG.parallax.lerpFactor;
      currentOffset.current.y += (targetOffset.current.y - currentOffset.current.y) * ENGINE_CONFIG.parallax.lerpFactor;

      const curX = currentOffset.current.x;
      const curY = currentOffset.current.y;

      // Extract tracking profiles based on active device environments
      const currentParallaxProfile = isMobileSensorActive.current 
        ? ENGINE_CONFIG.parallax.mobile 
        : ENGINE_CONFIG.parallax.pc;

      // Draw Screen Void
      ctx.fillStyle = '#0b0b0f';
      ctx.fillRect(0, 0, width, height);

      const bgX = curX * currentParallaxProfile.layer1Bg;
      const bgY = curY * currentParallaxProfile.layer1Bg;
      
      const horizonY = (height * ENGINE_CONFIG.grid.horizonYPercent) + bgY; 
      const vanishingPointX = (width / 2) + bgX;

      // --- RENDER ORIGINAL SKEW VERTICAL FAN ---
      ctx.strokeStyle = ENGINE_CONFIG.grid.gridColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= lineCount; i++) {
        const progress = (i - lineCount / 2) / (lineCount / 2); 
        const skewedProgress = Math.sign(progress) * Math.pow(Math.abs(progress), ENGINE_CONFIG.grid.skewPower);
        const targetBaseX = vanishingPointX + skewedProgress * (width * ENGINE_CONFIG.grid.gridSpreadMultiplier); 
        
        ctx.moveTo(vanishingPointX, horizonY);
        ctx.lineTo(targetBaseX, height);
      }
      ctx.stroke();

      // --- RENDER EXPONENTIAL GRID HORIZON BARS ---
      const horizontalLineCount = ENGINE_CONFIG.grid.horizontalLineCount;
      ctx.beginPath();
      for (let i = 0; i <= horizontalLineCount; i++) {
        const depth = Math.pow(i / horizontalLineCount, ENGINE_CONFIG.grid.horizontalPower); 
        const lineY = horizonY + ((height - horizonY) * depth);
        
        ctx.moveTo(0, lineY);
        ctx.lineTo(width, lineY);
      }
      ctx.stroke();

      // --- PARTICLE GENERATION & EMISSION FLORES LAYER ---
      if (activeFlashes.current.length < ENGINE_CONFIG.flashes.maxConcurrent && Math.random() < ENGINE_CONFIG.flashes.spawnChance) {
        activeFlashes.current.push({
          lineIndex: Math.floor(Math.random() * (lineCount + 1)),
          progress: 0,
          speed: ENGINE_CONFIG.flashes.minSpeed + Math.random() * (ENGINE_CONFIG.flashes.maxSpeed - ENGINE_CONFIG.flashes.minSpeed),
          streakLength: ENGINE_CONFIG.flashes.minStreakLength + Math.random() * (ENGINE_CONFIG.flashes.maxStreakLength - ENGINE_CONFIG.flashes.minStreakLength),
        });
      }

      ctx.shadowBlur = ENGINE_CONFIG.flashes.flareGlowBlur;
      ctx.shadowColor = ENGINE_CONFIG.flashes.flareGlowColor;
      
      activeFlashes.current = activeFlashes.current.filter((flash) => {
        flash.progress += flash.speed;
        if (flash.progress >= 1.0) return false;

        const flashProgress = (flash.lineIndex - lineCount / 2) / (lineCount / 2);
        const flashSkewed = Math.sign(flashProgress) * Math.pow(Math.abs(flashProgress), ENGINE_CONFIG.grid.skewPower);
        const flashBaseX = vanishingPointX + flashSkewed * (width * ENGINE_CONFIG.grid.gridSpreadMultiplier);

        const headX = vanishingPointX + (flashBaseX - vanishingPointX) * flash.progress;
        const headY = horizonY + (height - horizonY) * flash.progress;

        const tailProgress = Math.max(0, flash.progress - flash.streakLength);
        const tailX = vanishingPointX + (flashBaseX - vanishingPointX) * tailProgress;
        const tailY = horizonY + (height - horizonY) * tailProgress;

        ctx.strokeStyle = 'rgba(0, 229, 255, 0.75)';
        ctx.lineWidth = ENGINE_CONFIG.flashes.glowWidth;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = ENGINE_CONFIG.flashes.coreWidth;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();

        return true;
      });

      ctx.shadowBlur = 0; // Flash tracing complete, reset layer styles

      // --- DRAW GLOWING LASER HORIZON DIVIDER ---
      ctx.strokeStyle = ENGINE_CONFIG.grid.horizonColor;
      ctx.lineWidth = 3;
      ctx.shadowBlur = ENGINE_CONFIG.grid.horizonGlowBlur;
      ctx.shadowColor = ENGINE_CONFIG.grid.horizonColor;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // --- MUTATE OBJECT COMPONENT WRAPPERS WITH THE RUNTIME MULTIPLIERS ---
      const l2X = curX * currentParallaxProfile.layer2Chars;
      const l2Y = curY * currentParallaxProfile.layer2Chars;
      if (layer2LeftRef.current) layer2LeftRef.current.style.transform = `translate(${l2X}px, ${l2Y}px)`;
      if (layer2RightRef.current) layer2RightRef.current.style.transform = `translate(${l2X}px, ${l2Y}px)`;

      const l3X = curX * currentParallaxProfile.layer3Ui;
      const l3Y = curY * currentParallaxProfile.layer3Ui;
      if (layer3UiRef.current) layer3UiRef.current.style.transform = `translate(${l3X}px, ${l3Y}px)`;

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    // --- INPUT PARSERS SUBSCRIPTIONS ---
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const { gamma, beta } = event; 
      if (gamma === null || beta === null) return;
      isMobileSensorActive.current = true;
      
      const mCfg = ENGINE_CONFIG.parallax.mobile;
      const computedX = (gamma / 30) * mCfg.maxOffsetPx;
      const computedY = ((beta - mCfg.neutralPitch) / 30) * mCfg.maxOffsetPx;
      
      targetOffset.current = {
        x: Math.max(-mCfg.maxOffsetPx, Math.min(mCfg.maxOffsetPx, computedX)),
        y: Math.max(-mCfg.maxOffsetPx, Math.min(mCfg.maxOffsetPx, computedY))
      };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isMobileSensorActive.current) return;
      const pCfg = ENGINE_CONFIG.parallax.pc;
      
      const normX = (event.clientX / window.innerWidth) - 0.5;
      const normY = (event.clientY / window.innerHeight) - 0.5;
      
      targetOffset.current = {
        x: normX * pCfg.maxOffsetPx,
        y: normY * pCfg.maxOffsetPx
      };
    };

    window.addEventListener('deviceorientation', handleDeviceOrientation);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  const handlePlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    try {
      requestExpandedMode(event.nativeEvent, 'game');
    } catch (error) {
      console.error("Failed to expand view mode:", error);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#0b0b0f', overflow: 'hidden' }}>
      
      {/* LAYER 1: CANVAS SYNTH DESIGN BACKGROUND */}
      <canvas ref={bgCanvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }} />

      {/* LAYER 2: STANDOFF CHARACTER FRAME WRAPPERS */}
      <div
        ref={layer2LeftRef}
        style={{
          position: 'absolute',
          left: ENGINE_CONFIG.layout.leftStickman.left,
          bottom: ENGINE_CONFIG.layout.leftStickman.bottom,      
          width: ENGINE_CONFIG.layout.leftStickman.width,      
          height: ENGINE_CONFIG.layout.leftStickman.height,     
          backgroundColor: 'rgba(0, 229, 255, 0.04)',
          border: '2px dashed rgba(0, 229, 255, 0.35)',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#00e5ff',
          fontFamily: 'monospace',
          zIndex: 2,
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* <img src="assets/left_player.png" alt="Left Brawler" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> */}
        <span style={{ fontSize: '11px', opacity: 0.65 }}>[LEFT STICKMAN SPRITE]</span>
      </div>

      <div
        ref={layer2RightRef}
        style={{
          position: 'absolute',
          right: ENGINE_CONFIG.layout.rightStickman.right,
          bottom: ENGINE_CONFIG.layout.rightStickman.bottom,     
          width: ENGINE_CONFIG.layout.rightStickman.width,
          height: ENGINE_CONFIG.layout.rightStickman.height,
          backgroundColor: 'rgba(0, 229, 255, 0.04)',
          border: '2px dashed rgba(0, 229, 255, 0.35)',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#00e5ff',
          fontFamily: 'monospace',
          zIndex: 2,
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* <img src="assets/right_player.png" alt="Right Brawler" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> */}
        <span style={{ fontSize: '11px', opacity: 0.65 }}>[RIGHT STICKMAN SPRITE]</span>
      </div>

      {/* LAYER 3: FOREGROUND CONTROL AND GAME IDENTITY HOOK RENDER BOXES */}
      <div ref={layer3UiRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3, pointerEvents: 'none' }}>
        
        {/* MONOSPACE TITLE LOGO POSITION COMPONENT */}
        <div style={{
            position: 'absolute',
            top: ENGINE_CONFIG.layout.logo.top,           
            left: '50%',
            transform: 'translateX(-50%)',
            width: ENGINE_CONFIG.layout.logo.width,        
            maxWidth: ENGINE_CONFIG.layout.logo.maxWidth,
            height: ENGINE_CONFIG.layout.logo.height,       
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '2px dashed rgba(255, 255, 255, 0.25)',
            borderRadius: '8px',
            color: '#aaaaab',
            fontFamily: 'monospace',
            textAlign: 'center',
            fontSize: '11px',
            boxSizing: 'border-box'
        }}>
            {/* <img src="assets/title_logo.png" alt="Frag Arena" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> */}
            <span>[ GAME TITLE LOGO SPRITE ]</span>
        </div>

        {/* REDDIT EXPANDED CLICK INTERACTION BUTTON RENDER BOUNDING WRAPPER */}
        <div
          onClick={handlePlayClick}
          style={{
            position: 'absolute',
            bottom: ENGINE_CONFIG.layout.playButton.bottom,       
            left: '50%',
            transform: 'translateX(-50%)',
            width: ENGINE_CONFIG.layout.playButton.width,
            height: ENGINE_CONFIG.layout.playButton.height,
            cursor: 'pointer', 
            pointerEvents: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 229, 255, 0.08)',
            border: '2px dashed #00e5ff',
            borderRadius: '8px',
            color: '#00e5ff',
            fontFamily: 'monospace',
            textAlign: 'center',
            fontSize: '12px',
            transition: 'transform 0.1s ease, background-color 0.2s ease',
            boxSizing: 'border-box'
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'translateX(-50%) scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'translateX(-50%) scale(1)')}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 229, 255, 0.18)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 229, 255, 0.08)')}
        >
            {/* <img src="assets/play_button.png" alt="Play Now" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> */}
            <span>[ PLAY NOW BUTTON SPRITE ]</span>
        </div>
      </div>

    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(<SplashView />);
}