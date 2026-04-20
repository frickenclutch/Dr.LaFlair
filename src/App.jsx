import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, Zap, Droplets, Sparkles, 
  MapPin, Phone, CreditCard, ArrowLeft, Activity, 
  Heart, Moon, Sun, Users, Monitor, Crosshair, 
  Database, Shield, ArrowRight, Loader2, Lock, 
  CheckCircle, MessageCircle, Clock, Search,
  X, ChevronDown
} from 'lucide-react';

// ============================================================================
// --- GAME MODAL COMPONENT ---
// ============================================================================

const GameModal = ({ onClose }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('playing'); // playing, won, lost
  const [couponCode, setCouponCode] = useState('');
  
 // Game state vars (kept in ref to avoid react state batching in animation loop)
  const gameRef = useRef({
    timeRemaining: 30, // INCREASED TO 30 SECONDS
    toothHealth: 100,  // starts at 100%
    lastTime: Date.now(),
    playerX: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    projectiles: [],
    germs: [],
    powerups: [], // <-- NEW: Tracks Dr. LaFlair lifesavers
    keys: { ArrowLeft: false, ArrowRight: false, Space: false },
    isDragging: false,
    levelUpImg: null // <-- NEW: Holds the image
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // PRELOAD DR. LAFLAIR IMAGE
    const img = new Image();
    img.src = '/levelup.png';
    gameRef.current.levelUpImg = img;

    // Resize handler
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Keep player in bounds on resize
      gameRef.current.playerX = Math.min(gameRef.current.playerX, canvas.width - 20);
    };
    window.addEventListener('resize', resize);
    resize();

    // Input Listeners
    const handleKeyDown = (e) => { 
      if(gameRef.current.keys.hasOwnProperty(e.code)) {
         gameRef.current.keys[e.code] = true; 
      }
    };
    const handleKeyUp = (e) => { 
      if(gameRef.current.keys.hasOwnProperty(e.code)) {
         gameRef.current.keys[e.code] = false; 
      }
    };
    
    // Touch/Mouse controls for mobile/ease of use
    const handlePointerMove = (e) => {
        if(gameRef.current.isDragging || e.type.startsWith('touch')) {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            gameRef.current.playerX = clientX;
        }
    };
    const handlePointerDown = (e) => {
        gameRef.current.isDragging = true;
        handlePointerMove(e);
    }
    const handlePointerUp = () => { gameRef.current.isDragging = false; }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('touchstart', handlePointerDown, {passive: true});
    canvas.addEventListener('touchmove', handlePointerMove, {passive: true});
    window.addEventListener('touchend', handlePointerUp);

    let frames = 0;

    // The Main Game Loop
    const render = () => {
      const state = gameRef.current;
      if (gameState !== 'playing') return;

      const now = Date.now();
      const dt = now - state.lastTime;
      
      // Update Timer (every 1 second)
      if (dt > 1000) {
        state.timeRemaining -= 1;
        state.lastTime = now;
        
        if (state.timeRemaining <= 0) {
          // WIN CONDITION
          setGameState('won');
          const code = 'LAFLAIR-' + Math.random().toString(36).substring(2, 7).toUpperCase();
          setCouponCode(code);
          return;
        }
      }

      // Clear Canvas
      ctx.fillStyle = '#0f172a'; // dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid (Retro feel)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for(let i=0; i<canvas.width; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=50) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke(); }

      // Update Player Position
      const speed = 8;
      if (state.keys.ArrowLeft) state.playerX -= speed;
      if (state.keys.ArrowRight) state.playerX += speed;
      
      // Bounds check
      if (state.playerX < 20) state.playerX = 20;
      if (state.playerX > canvas.width - 20) state.playerX = canvas.width - 20;

      // Calculate relative Y positions for scaling to device
      const th = Math.min(canvas.height * 0.25, 150); // Height of the teeth row
      const ty = canvas.height - th - 40; // Top bounding box for teeth
      const tw = canvas.width * 0.94; // 94% footprint for the arch
      const tx = canvas.width * 0.03; // Centered
      const playerY = ty - 30; // Player hovers above the teeth

      // Auto Shooting (easier for casual play/mobile)
      if (frames % 10 === 0) {
         state.projectiles.push({ x: state.playerX, y: playerY - 35, active: true });
      }

      // Spawn Enemies (Adjusted math for 30 seconds)
      const spawnRate = Math.max(20, Math.floor(55 - (30 - state.timeRemaining) * 1.5));
      if (frames % spawnRate === 0) {
        const threats = ['🦠', '🍬', '🍩', '☕', '🍔', '🍭', '🥤'];
        const randomThreat = threats[Math.floor(Math.random() * threats.length)];
        
        state.germs.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -30,
          active: true,
          emoji: randomThreat,
          speed: 2.2 + Math.random() * 2.2 + (30 - state.timeRemaining)*0.1 
        });
      }

      // Spawn Lifesaver (Dr. LaFlair)
      if (frames > 0 && frames % 180 === 0) { // Drops in every few seconds
         state.powerups.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: -40,
            active: true,
            hits: 0 // Starts with 0 foam hits
         });
      }

      // Update & Draw Projectiles (Foam blobs)
      state.projectiles.forEach(p => {
        if (!p.active) return;
        p.y -= 10;
        if (p.y < 0) p.active = false;
        
        // Foam Blob (Cluster of bubbles)
        ctx.fillStyle = '#ffffff'; // pure white foam
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.arc(p.x - 5, p.y + 4, 5, 0, Math.PI * 2);
        ctx.arc(p.x + 5, p.y + 4, 5, 0, Math.PI * 2);
        ctx.arc(p.x - 3, p.y - 5, 4, 0, Math.PI * 2);
        ctx.arc(p.x + 3, p.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Minty trail foam
        ctx.fillStyle = 'rgba(52, 211, 153, 0.6)';
        ctx.beginPath();
        ctx.arc(p.x, p.y + 10, 5, 0, Math.PI * 2);
        ctx.arc(p.x - 4, p.y + 14, 4, 0, Math.PI * 2);
        ctx.arc(p.x + 4, p.y + 14, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update & Draw Germs
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      state.germs.forEach(g => {
        if (!g.active) return;
        g.y += g.speed;
        
        // Draw Threat
        ctx.fillText(g.emoji || '🦠', g.x, g.y);

        // Check Collision with projectiles
        state.projectiles.forEach(p => {
          if (!p.active) return;
          const dist = Math.hypot(p.x - g.x, p.y - g.y);
          if (dist < 20) {
            p.active = false;
            g.active = false;
            // Draw explosion effect
            ctx.fillStyle = '#bef264';
            ctx.beginPath();
            ctx.arc(g.x, g.y, 15, 0, Math.PI*2);
            ctx.fill();
          }
        });

        // Check Collision with Teeth Row (Maxillary Arch)
        if (g.x > tx && g.x < tx + tw && g.y > ty + th * 0.2) {
           g.active = false;
           state.toothHealth -= 15; // Take damage
           if (state.toothHealth <= 0) {
               state.toothHealth = 0;
               setGameState('lost');
           }
        } else if (g.y > canvas.height + 30) {
           g.active = false; // Missed the teeth completely (fell off sides)
        }
      });

     // Update & Draw Lifesavers (Dr. LaFlair)
      state.powerups.forEach(pu => {
        if (!pu.active) return;
        pu.y += 1.5; // Floats down slower than germs

        // Draw Dr. LaFlair Image
        if (state.levelUpImg && state.levelUpImg.complete) {
           ctx.drawImage(state.levelUpImg, pu.x - 20, pu.y - 20, 40, 40);
        } else {
           ctx.fillText('👨‍⚕️', pu.x, pu.y); // Fallback emoji just in case
        }

        // Check if Foam hits Dr. LaFlair
        state.projectiles.forEach(p => {
           if (!p.active) return;
           const dist = Math.hypot(p.x - pu.x, p.y - pu.y);
           if (dist < 25) {
              p.active = false;
              pu.hits += 1;
              
              // Draw a fun blue splash every time he is hit
              ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
              ctx.beginPath();
              ctx.arc(pu.x, pu.y, 15 + pu.hits * 2, 0, Math.PI*2);
              ctx.fill();

              // If he absorbs 5 hits of foam, trigger the Heal!
              if (pu.hits >= 5) {
                 pu.active = false;
                 state.toothHealth = Math.min(100, state.toothHealth + 25); // Heals 25%
                 
                 // Giant Green Healing Flash
                 ctx.fillStyle = 'rgba(74, 222, 128, 0.8)';
                 ctx.beginPath();
                 ctx.arc(pu.x, pu.y, 60, 0, Math.PI*2);
                 ctx.fill();
              }
           }
        });

        // If he falls off the bottom, just deactivate (no harm, no foul)
        if (pu.y > canvas.height + 30) pu.active = false; 
      });

      // Clean up arrays
      state.projectiles = state.projectiles.filter(p => p.active);
      state.germs = state.germs.filter(g => g.active);
      state.powerups = state.powerups.filter(pu => pu.active);

      // --- DRAWING LOGIC: Anatomical Row of Teeth ---
      const teethDef = [
        { type: 'molar',   wFactor: 1.4, hFactor: 0.7 },
        { type: 'premolar',wFactor: 1.0, hFactor: 0.8 },
        { type: 'canine',  wFactor: 0.9, hFactor: 1.0 }, 
        { type: 'lateral', wFactor: 0.8, hFactor: 0.85 },
        { type: 'central', wFactor: 1.2, hFactor: 0.95 }, 
        { type: 'central', wFactor: 1.2, hFactor: 0.95 },
        { type: 'lateral', wFactor: 0.8, hFactor: 0.85 },
        { type: 'canine',  wFactor: 0.9, hFactor: 1.0 },
        { type: 'premolar',wFactor: 1.0, hFactor: 0.8 },
        { type: 'molar',   wFactor: 1.4, hFactor: 0.7 }
      ];
      
      const totalFactor = teethDef.reduce((sum, t) => sum + t.wFactor, 0);
      const unitW = tw / totalFactor;
      let currentX = tx;
      const wear = (100 - state.toothHealth) / 100; // 0 to 1

      // 1. Draw the individual teeth
      teethDef.forEach((tooth, idx) => {
          const w = tooth.wFactor * unitW;
          const h = th * tooth.hFactor;
          const yBase = canvas.height - 20; 
          const yTop = canvas.height - h - 40; 
          
          ctx.fillStyle = state.toothHealth <= 40 ? '#f4f5f0' : '#ffffff'; 
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          // Left Edge
          ctx.moveTo(currentX, yBase);
          ctx.quadraticCurveTo(currentX + w*0.05, yTop + h*0.3, currentX + w*0.1, yTop);
          
          // Top Surface (Anatomical Cusps + Jagged Wear)
          let pts = [{x: currentX + w*0.1, y: yTop}];
          
          if (tooth.type === 'central' || tooth.type === 'lateral') {
              pts.push({x: currentX + w*0.5, y: yTop - h*0.05});
              pts.push({x: currentX + w*0.9, y: yTop});
          } else if (tooth.type === 'canine') {
              pts.push({x: currentX + w*0.5, y: yTop - h*0.15}); 
              pts.push({x: currentX + w*0.9, y: yTop});
          } else if (tooth.type === 'premolar') {
              pts.push({x: currentX + w*0.3, y: yTop - h*0.05});
              pts.push({x: currentX + w*0.5, y: yTop + h*0.05}); 
              pts.push({x: currentX + w*0.7, y: yTop - h*0.05});
              pts.push({x: currentX + w*0.9, y: yTop});
          } else if (tooth.type === 'molar') {
              pts.push({x: currentX + w*0.25, y: yTop});
              pts.push({x: currentX + w*0.5, y: yTop + h*0.1});  
              pts.push({x: currentX + w*0.75, y: yTop});
              pts.push({x: currentX + w*0.9, y: yTop});
          }

          // Draw top surface, injecting noise for decay/jagged wear
          for(let i=1; i<pts.length; i++) {
              let p1 = pts[i-1];
              let p2 = pts[i];
              let segments = Math.max(3, Math.floor(w / 8));
              for(let j=1; j<=segments; j++) {
                  let t = j / segments;
                  let cx = p1.x + (p2.x - p1.x) * t;
                  let cy = p1.y + (p2.y - p1.y) * t;
                  
                  if (wear > 0) {
                      let noise = Math.sin(cx * 0.8) * Math.cos(cx * 0.3);
                      cy += Math.abs(noise) * wear * h * 0.4; 
                      cy += wear * h * 0.15; 
                  }
                  ctx.lineTo(cx, cy);
              }
          }
          
          // Right Edge
          ctx.quadraticCurveTo(currentX + w*0.95, yTop + h*0.3, currentX + w, yBase);
          
          ctx.fill();
          ctx.stroke();

          // Draw Cavities specific to each tooth
          if (state.toothHealth < 100) {
              const cavityChance = wear * 0.6;
              const rand1 = Math.abs(Math.sin(idx * 7.42));
              const rand2 = Math.abs(Math.cos(idx * 3.14));
              
              if (rand1 < cavityChance) {
                  ctx.fillStyle = '#854d0e';
                  ctx.beginPath();
                  ctx.arc(currentX + w * (0.3 + rand2*0.4), yTop + h * (0.2 + rand1*0.4), 3 + rand2*6, 0, Math.PI*2);
                  ctx.fill();
              }
          }
          
          currentX += w;
      });

      // 2. Draw the Gums (Gingiva) overlapping the roots
      ctx.fillStyle = '#f472b6'; 
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      
      const gumY = canvas.height - 40;
      ctx.lineTo(0, gumY);
      ctx.lineTo(tx, gumY);
      
      currentX = tx;
      // Wavy gingival margins scalloping around each tooth
      teethDef.forEach((tooth) => {
          const w = tooth.wFactor * unitW;
          ctx.quadraticCurveTo(currentX + w*0.5, gumY - 18, currentX + w, gumY);
          currentX += w;
      });
      
      ctx.lineTo(canvas.width, gumY);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.fill();
      
      ctx.strokeStyle = '#be185d'; 
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3. Icky Environment Overlay if health is very low
      if (state.toothHealth <= 40) {
          ctx.fillStyle = 'rgba(132, 204, 22, 0.2)'; 
          ctx.fillRect(tx, ty - th, tw, th * 2 + 100);
      }

      // Draw Player (Toothbrush)
      // Handle
      ctx.fillStyle = '#3b82f6'; 
      ctx.fillRect(state.playerX - 6, playerY - 5, 12, 30);
      ctx.beginPath();
      ctx.arc(state.playerX, playerY + 25, 6, 0, Math.PI);
      ctx.fill();
      
      // Head base
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(state.playerX - 5, playerY - 20, 10, 15);
      
      // Bristles
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(state.playerX - 6, playerY - 35, 12, 15);
      
      // Bristle texture/lines
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(state.playerX - 3, playerY - 35);
      ctx.lineTo(state.playerX - 3, playerY - 20);
      ctx.moveTo(state.playerX + 3, playerY - 35);
      ctx.lineTo(state.playerX + 3, playerY - 20);
      ctx.stroke();

      // Extra Foam around the bristles
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(state.playerX - 7, playerY - 35, 4, 0, Math.PI * 2);
      ctx.arc(state.playerX + 7, playerY - 32, 5, 0, Math.PI * 2);
      ctx.arc(state.playerX, playerY - 38, 4, 0, Math.PI * 2);
      ctx.arc(state.playerX - 4, playerY - 30, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
      ctx.beginPath();
      ctx.arc(state.playerX + 6, playerY - 36, 3, 0, Math.PI * 2);
      ctx.arc(state.playerX - 8, playerY - 28, 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw HUD (Top Left / Right)
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0, canvas.width, 50);

      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`DR. LAFLAIR`, 20, 32);
      
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(`| DEFEND THE TEETH!`, 160, 32);

      ctx.textAlign = 'right';
      ctx.fillStyle = state.timeRemaining <= 5 ? '#ef4444' : '#fff';
      ctx.fillText(`TIME: ${state.timeRemaining}s`, canvas.width - 20, 32);
      
      // Health Bar
      const hpColor = state.toothHealth > 60 ? '#22c55e' : state.toothHealth > 30 ? '#eab308' : '#ef4444';
      ctx.fillStyle = hpColor;
      ctx.fillRect(canvas.width/2 - 100, 20, (state.toothHealth/100) * 200, 15);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(canvas.width/2 - 100, 20, 200, 15);
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(`INTEGRITY: ${state.toothHealth}%`, canvas.width/2, 32);

      frames++;
      animationFrameId = requestAnimationFrame(render);
    };

    if (gameState === 'playing') {
       animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [gameState]);

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col items-center justify-center overflow-hidden touch-none">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 block cursor-crosshair touch-none"
      />
      
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white font-bold text-sm bg-slate-800/60 hover:bg-slate-700 px-4 py-2 rounded-full backdrop-blur z-50 transition-colors flex items-center shadow-lg"
      >
        Skip to Website &rarr;
      </button>

      {gameState === 'won' && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-40 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-blue-500 animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-blue-600 mb-2">**YOU SAVED THE TEETH!**</h2>
            <p className="text-slate-600 mb-6 font-semibold">Perfect cleaning achieved. Here is your reward:</p>
            
            <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-bold text-slate-800">$10.00 DISCOUNT</h3>
              <p className="text-sm text-slate-500 uppercase tracking-widest mb-4">On your next cleaning</p>
              <div className="bg-white border border-slate-200 py-3 px-4 rounded shadow-inner text-xl font-mono font-bold tracking-widest text-slate-700 select-all">
                {couponCode}
              </div>
              <p className="text-xs text-slate-400 mt-2">Show this code at the reception desk.</p>
            </div>

            <button 
              onClick={onClose}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Return to Website
            </button>
          </div>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center backdrop-blur-sm z-40 p-4">
          <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-2 border-red-500 animate-in zoom-in duration-300">
            <div className="text-6xl mb-4">🤢</div>
            <h2 className="text-3xl font-black text-white mb-2">TEETH COMPROMISED!</h2>
            <p className="text-red-200 mb-8 font-semibold">Too many germs caused decay. Remember to floss!</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => {
                 gameRef.current = {
                    timeRemaining: 30, toothHealth: 100, lastTime: Date.now(),
                    playerX: window.innerWidth / 2, projectiles: [], germs: [], powerups: [],
                    keys: { ArrowLeft: false, ArrowRight: false, Space: false }, isDragging: false,
                    levelUpImg: gameRef.current.levelUpImg
                  };
                  setGameState('playing');
                }}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={onClose}
                className="w-full bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700 transition-colors"
              >
                Exit Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// --- MAIN APP COMPONENT ---
// ============================================================================

const PRACTICE_INFO = {
  name: "Christopher LaFlair DDS PC",
  doctor: "Clinical Director: Dr. Chris LaFlair",
  address: "1107 Linden St., Ogdensburg, NY 13669",
  phone: "315-393-2240",
  email: "office@drchrislaflair.com",
  hours: "Mon - Thu: 7:30 AM - 3:30 PM",
  closed: "Fri - Sun: Closed"
};

const THEMES = {
  APPLE: {
    bg: "bg-[#fafaf9]", card: "bg-white", textPrimary: "text-stone-900", textSecondary: "text-stone-500", 
    border: "border-stone-200", glass: "bg-white/90 backdrop-blur-xl border-b border-stone-200",
    accentText: "text-indigo-600", accentBg: "bg-indigo-600", accentBgSoft: "bg-indigo-600/10", 
    accentBorder: "border-indigo-600", healthBar: "from-indigo-500 to-indigo-600",
    xrayGlow: "drop-shadow-[0_0_15px_rgba(0,0,0,0.25)]", xrayLine: "#171717" 
  },
  LAB: {
    bg: "bg-[#050505]", card: "bg-[#0a0a0b]", textPrimary: "text-cyan-50", textSecondary: "text-stone-400", 
    border: "border-white/10", glass: "bg-black/60 backdrop-blur-xl border-b border-white/10",
    accentText: "text-cyan-400", accentBg: "bg-cyan-400", accentBgSoft: "bg-cyan-400/10", 
    accentBorder: "border-cyan-400", healthBar: "from-indigo-500 to-cyan-400",
    xrayGlow: "drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]", xrayLine: "#22d3ee"
  }
};

const TOOTH_SECTIONS = {
  ENAMEL: { id: 'enamel', title: 'Enamel Layer', color: '#99f6e4', condition: 'Structural Integrity Check', description: 'The hardest substance in the human body, serving as the first line of defense.', symptoms: ['Localized Translucency', 'Acid Erosion Pitting'], icon: <ShieldCheck className="w-6 h-6"/> },
  CAVITY: { id: 'cavity', title: 'Clinical Demineralization', color: '#fbbf24', condition: 'Clinical Repair Required', description: 'Active decay that accelerates once the surface is breached.', symptoms: ['Interproximal Shadowing', 'Sugar Sensitivity'], icon: <AlertTriangle className="w-6 h-6"/> },
  NERVE: { id: 'nerve', title: 'Pulpal Vitality', color: '#f87171', condition: 'Endodontic Evaluation', description: 'The internal center of the tooth containing sensitive nerves and blood supply.', symptoms: ['Thermal Response', 'Nocturnal Throbbing'], icon: <Zap className="w-6 h-6"/> },
  GUMS: { id: 'gums', title: 'Gingival Foundation', color: '#fda4af', condition: 'Periodontal Assessment', description: 'Healthy gingiva protects the underlying bone structure from bacterial ingress.', symptoms: ['Tissue Recession', 'Bleeding on Probing'], icon: <Droplets className="w-6 h-6"/> }
};

const TESTIMONIALS = [
  { name: "Sarah M.", type: "Clear Aligners", text: "Dr. LaFlair's clear aligner treatment was completely painless and the results changed my life and confidence." },
  { name: "David R.", type: "Restorative Care", text: "My crown was done so precisely, and the entire team made my severe dental anxiety completely disappear." },
  { name: "Elena T.", type: "Preventative", text: "Best cleaning I've ever had. The intraoral cameras really helped me understand my oral health." },
  { name: "Michael B.", type: "Implant Restoration", text: "After years of struggling with my bite, Dr. LaFlair restored my smile. The precision and care are truly unmatched." }
];

const GEAR_LOADOUT = [
  { id: 'xray', name: "Digital Radiography", icon: <Monitor className="w-6 h-6"/>, spec: "Low-Dose Imaging", detail: "Reduces radiation exposure by up to 90% while providing instant diagnostic data." },
  { id: 'camera', name: "Intraoral Cameras", icon: <Crosshair className="w-6 h-6"/>, spec: "Transparency", detail: "See exactly what the doctor sees in high detail on our clinical monitors." },
  { id: 'cloud', name: "Secure E-Records", icon: <Database className="w-6 h-6"/>, spec: "HIPAA Compliant", detail: "Fully encrypted data management for seamless, secure updates." },
  { id: 'shield', name: "Advanced Sterilization", icon: <Shield className="w-6 h-6"/>, spec: "Infection Control", detail: "Hospital-grade protocols exceeding industry standards for absolute safety." }
];

const STAFF_CARDS = [
  { 
    name: "Dr. Chris LaFlair", 
    role: "Lead Dentist", 
    bio: "A North Country native who graduated with honors from Stony Brook. He specializes in providing exceptional general and cosmetic care in a relaxed atmosphere.", 
    image: "/drlaflairspecialist.jpg" 
  },
  { 
    name: "Suellen & Renee", 
    role: "Front Desk & Assistants", 
    bio: "Bringing over 20 years of combined experience. Suellen is a Licensed Certified Dental Assistant, while Renee ensures stress-free scheduling.", 
    image: "/SueellenRenee.jpg" 
  },
  { 
    name: "Maria & Stephanie", 
    role: "Dental Hygienists", 
    bio: "Board-certified hygienists dedicated to advanced hygiene care and expanded orthodontic services, ensuring patients receive the best care possible.", 
    image: "/oloivastephanie.jpg" 
  }
];

const SmileSVG = ({ type }) => {
  const isBefore = type === 'before';
  
  return (
    <svg viewBox="0 0 800 400" className="w-full h-full bg-stone-900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`tooth-grad-${type}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isBefore ? '#fef08a' : '#ffffff'} />
          <stop offset="100%" stopColor={isBefore ? '#d97706' : '#e7e5e4'} />
        </linearGradient>
        <linearGradient id="lip-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
        <clipPath id={`mouth-clip-${type}`}>
          <path d="M 100 200 C 250 140, 550 140, 700 200 C 550 280, 250 280, 100 200 Z" />
        </clipPath>
      </defs>

      <rect width="800" height="400" fill={isBefore ? "#e7e5e4" : "#f5f5f4"} />
      <path d="M 100 200 C 250 140, 550 140, 700 200 C 550 280, 250 280, 100 200 Z" fill="#1c1917" />

      <g clipPath={`url(#mouth-clip-${type})`}>
        <path d="M 0 0 L 800 0 L 800 170 C 550 155, 250 155, 0 170 Z" fill={isBefore ? '#f87171' : '#fda4af'} />
        <path d="M 0 400 L 800 400 L 800 245 C 550 260, 250 260, 0 245 Z" fill={isBefore ? '#f87171' : '#fda4af'} />

        <g stroke="#292524" strokeWidth="1.5" fill={`url(#tooth-grad-${type})`}>
          <rect x="360" y="160" width="38" height="55" rx="6" />
          <rect x="402" y="160" width="38" height="55" rx="6" />
          <rect x="325" y="158" width="32" height="48" rx="5" />
          <rect x="443" y="158" width="32" height="48" rx="5" />
          <rect x="295" y="155" width="28" height="45" rx="4" />
          <rect x="477" y="155" width="28" height="45" rx="4" />
          <rect x="270" y="155" width="22" height="40" rx="3" />
          <rect x="508" y="155" width="22" height="40" rx="3" />
        </g>

        <g stroke="#292524" strokeWidth="1.5" fill={`url(#tooth-grad-${type})`}>
          <rect x="365" y="217" width="33" height="40" rx="5" />
          <rect x="402" y="217" width="33" height="40" rx="5" />
          <rect x="335" y="219" width="28" height="38" rx="4" />
          <rect x="437" y="219" width="28" height="38" rx="4" />
          <rect x="308" y="222" width="25" height="35" rx="4" />
          <rect x="467" y="222" width="25" height="35" rx="4" />
        </g>
        
        {isBefore && (
          <g fill="#ca8a04" opacity="0.4" filter="blur(3px)">
             <ellipse cx="380" cy="165" rx="20" ry="10" />
             <ellipse cx="420" cy="165" rx="20" ry="10" />
             <ellipse cx="340" cy="165" rx="15" ry="8" />
             <ellipse cx="460" cy="165" rx="15" ry="8" />
             <ellipse cx="380" cy="245" rx="15" ry="10" />
             <ellipse cx="420" cy="245" rx="15" ry="10" />
          </g>
        )}
      </g>

      <path d="M 100 200 C 250 100, 550 100, 700 200 C 550 140, 250 140, 100 200 Z" fill="url(#lip-grad)" />
      <path d="M 100 200 C 250 300, 550 300, 700 200 C 550 280, 250 280, 100 200 Z" fill="url(#lip-grad)" />
      
      <path d="M 300 128 Q 400 120 500 128" stroke="#fecdd3" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M 320 285 Q 400 295 480 285" stroke="#fecdd3" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
};

const App = () => {
  const [hasEntered, setHasEntered] = useState(false); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [hoveredStaff, setHoveredStaff] = useState(null); 

  const [isGameOpen, setIsGameOpen] = useState(false);

  const [view, setView] = useState('anatomy'); 
  const [selectedSection, setSelectedSection] = useState(null);
  const [healthScore, setHealthScore] = useState(85);
  
  const [isSparkling, setIsSparkling] = useState(false);
  const [chipStatus, setChipStatus] = useState('intact'); 
  const [chipPos, setChipPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isXrayMode, setIsXrayMode] = useState(false);
  const [plaqueLevel, setPlaqueLevel] = useState(100);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderRef = useRef(null);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');
  
  const [hintIndex, setHintIndex] = useState(0);
  const [isArkMode, setIsArkMode] = useState(false); 
  
  const interactiveHints = [
    "Scrub the icky yellow plaque off the enamel to achieve optimal health!",
    "Click and drag the fragment to fix the chipped tooth and restore full integrity.",
    "Tap the cavity on the root structure to understand how decay works!",
    "Toggle the Advanced Sub-surface Imaging (X-Ray) switch to reveal hidden structures."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % interactiveHints.length);
    }, 4500); 
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    setIsTouchDevice(hasTouch);

    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const ual = ua.toLowerCase();
    
    if (ual.includes('android')) {
        setDeviceType('android');
    } else if ((ua.includes('ipad') || ua.includes('iphone') || ua.includes('ipod')) && !window.MSStream) {
        setDeviceType('ios');
    } else if (ual.includes('mac') && hasTouch) {
        setDeviceType('ios');
    } else {
        setDeviceType('desktop');
    }
  }, []);

  const currentTheme = isDarkMode ? THEMES.LAB : THEMES.APPLE;
  const dragRef = useRef(false);
  const dragOffset = useRef({ startX: 0, startY: 0, chipX: 0, chipY: 0, currentX: 0, currentY: 0 });

  const handleBook = () => window.location.href = `mailto:${PRACTICE_INFO.email}?subject=Appointment Request`;
  const handleCall = () => window.location.href = `tel:${PRACTICE_INFO.phone.split('-').join('')}`;

  const handleInteraction = (section) => {
    setSelectedSection(section);
    if (healthScore < 100) setHealthScore(prev => Math.min(prev + 5, 100));
  };

  const handleEnamelClick = (e) => {
    e.stopPropagation();
    setSelectedSection(TOOTH_SECTIONS.ENAMEL);
  };

  const executeCleaning = () => {
    setIsSparkling(true);
    setHealthScore(100);
    setPlaqueLevel(0);
    setSelectedSection({ 
      id: 'cleaning', title: "Clinical Cleaning", condition: "Prophylaxis Complete", 
      description: "Enamel polished to a high-gloss finish. Zero plaque detected.", 
      symptoms: ["Smooth Surface", "Healthy Tissue"], icon: <Sparkles className="w-6 h-6"/> 
    });
    setTimeout(() => setIsSparkling(false), 2000);
  };

  const handleEnamelScrub = (e) => {
    if (e.buttons === 1 && plaqueLevel > 0 && chipStatus !== 'broken' && !isXrayMode) {
      setPlaqueLevel(prev => {
        const newLevel = prev - 3; 
        if (newLevel <= 0 && prev > 0) executeCleaning(); 
        return Math.max(0, newLevel);
      });
    }
  };

  const breakTooth = (e) => {
    e.stopPropagation();
    if (chipStatus !== 'broken' && !isXrayMode) { 
      setChipStatus('broken');
      setChipPos({ x: 40, y: 120 }); 
      setHealthScore(25);
      setSelectedSection({
        title: "Structural Compromise", condition: "Fractured Fragment",
        description: "Molar has sheared off. Immediate clinical restoration required. Drag or tap the fragment to simulate repair.",
        symptoms: ["Sharp edges", "Sensitivity", "Pain when chewing"], icon: <AlertTriangle className="w-6 h-6"/>
      });
    }
  };

  const handlePointerDown = (e) => {
    if (chipStatus !== 'broken' || isXrayMode) return;
    
    if (!isTouchDevice) e.preventDefault();
    e.stopPropagation();
    
    if (!isTouchDevice && e.target && e.target.setPointerCapture) {
        e.target.setPointerCapture(e.pointerId);
    }
    
    dragRef.current = true;
    setIsDragging(true);
    dragOffset.current = { 
      startX: e.clientX, startY: e.clientY, 
      chipX: chipPos.x, chipY: chipPos.y,
      currentX: chipPos.x, currentY: chipPos.y
    };
  };

  const handlePointerMove = (e) => {
    if (dragRef.current) {
      if (!isTouchDevice) e.preventDefault();
      const dx = e.clientX - dragOffset.current.startX;
      const dy = e.clientY - dragOffset.current.startY;
      const newX = dragOffset.current.chipX + dx;
      const newY = dragOffset.current.chipY + dy;
      
      dragOffset.current.currentX = newX;
      dragOffset.current.currentY = newY;
      
      setChipPos({ x: newX, y: newY });
    }
    
    if (isDraggingSlider && sliderRef.current) {
      if (!isTouchDevice) e.preventDefault();
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSliderPos((x / rect.width) * 100);
    }
  };

  const handlePointerUp = (e) => {
    if (isDraggingSlider) setIsDraggingSlider(false);

    if (!dragRef.current) return; 
    
    if (!isTouchDevice && e && e.target && e.target.releasePointerCapture) {
        try { e.target.releasePointerCapture(e.pointerId); } catch(err) {}
    }
    
    dragRef.current = false;
    setIsDragging(false);

    const finalX = dragOffset.current.currentX;
    const finalY = dragOffset.current.currentY;
    
    const distToTarget = Math.sqrt(finalX * finalX + finalY * finalY);
    const dragDistance = Math.sqrt(
      Math.pow(finalX - dragOffset.current.chipX, 2) + Math.pow(finalY - dragOffset.current.chipY, 2)
    );

    if (distToTarget < 150 || dragDistance < 5) {
        executeRepair();
    } else {
        setChipPos({ x: 40, y: 120 });
    }
  };

  const executeRepair = () => {
    setChipStatus('repaired');
    setChipPos({ x: 0, y: 0 });
    setHealthScore(100);
    setSelectedSection({ 
        title: "Simulated Repair", condition: "Integrity Restored", 
        description: "Fragment repositioned. Physical assessment required for permanent bonding.", 
        symptoms: ["Restored Surface", "Bite Integrity"], icon: <ShieldCheck className="w-6 h-6"/> 
    });
  };

 const changeView = (newView) => {
    setView(newView);
    if(newView !== 'anatomy') setSelectedSection(null);
    setHoveredStaff(null); // 
  };

  const renderTechBackground = (id) => {
    if (id === 'xray') return (
      <div className="absolute inset-0 bg-slate-900 opacity-0 group-hover:opacity-100 transition-all duration-500 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(34,211,238,0.2) 10px, rgba(34,211,238,0.2) 20px)' }}/>
        <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_4px_#22d3ee] opacity-80" style={{ animation: 'scanline 2s linear infinite' }}/>
      </div>
    );
    if (id === 'camera') return (
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-400/90 via-pink-300/80 to-white/90 blur-md"/>
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/60 rounded-full blur-xl"/>
        <div className="absolute top-4 -left-8 w-24 h-24 bg-red-500/40 rounded-full blur-xl"/>
      </div>
    );
    if (id === 'cloud') return (
      <div className="absolute inset-0 bg-slate-900 opacity-0 group-hover:opacity-100 transition-all duration-500 z-0 p-4 flex flex-wrap gap-3 justify-center content-start pointer-events-none">
        {Array.from({length: 15}).map((_, i) => (
          <div key={i} className="w-[18%] aspect-square rounded bg-cyan-900/40 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]" style={{ animation: `pulse-grid 2s infinite ${(i%5)*0.2}s` }}/>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none"/>
      </div>
    );
    if (id === 'shield') return (
      <div className="absolute inset-0 bg-gradient-to-t from-orange-600/95 via-red-500/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 z-0 overflow-hidden pointer-events-none">
        {Array.from({length: 12}).map((_, i) => (
          <div key={i} className="absolute w-3 h-3 bg-lime-400 rounded-full blur-[1px]" style={{ left: `${(i*8.5)+5}%`, bottom: '-10%', animation: `float-melt ${1.5+(i%2)}s ease-in infinite ${(i%3)*0.5}s` }}/>
        ))}
      </div>
    );
    return null;
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.textPrimary} transition-colors duration-700 flex flex-col md:flex-row overflow-hidden font-sans select-none`}
         onPointerUp={handlePointerUp} onPointerMove={handlePointerMove} onPointerLeave={handlePointerUp}
         style={{ zoom: `${zoomLevel}%` }}>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes scanline { 0% { transform: translateY(-50px); } 100% { transform: translateY(400px); } }
        @keyframes float-melt { 0% { transform: translateY(0) scale(1); opacity: 0.9; background-color: #a3e635; } 50% { background-color: #f97316; } 100% { transform: translateY(-150px) scale(0); opacity: 0; background-color: #ef4444; } }
        @keyframes pulse-grid { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.7; background-color: rgba(34,211,238,0.3); } }
        @keyframes xray-scan { 0% { background-position: 0% 0%; } 100% { background-position: 0% 100%; } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        
        /* CUSTOM TOOTH CURSORS */
        body, html, * { cursor: url('/cursor1.png') 16 16, auto !important; }
        button, a, .cursor-pointer, .cursor-grab, .cursor-ew-resize, input[type="checkbox"] { cursor: url('/cursor2.png') 16 16, pointer !important; }
        .active\\:cursor-grabbing:active { cursor: url('/cursor2.png') 16 16, grabbing !important; }

        /* SPLASH SCREEN 3D ANIMATIONS */
        @keyframes float-cloud {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes spin-flip {
          0% { transform: rotateY(0deg); }
          30% { transform: rotateY(0deg); } 
          50% { transform: rotateY(180deg); } 
          80% { transform: rotateY(180deg); } 
          100% { transform: rotateY(360deg); } 
        }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>

      {/* --- SPLASH SCREEN OVERLAY --- */}
      <div className={`fixed inset-0 z-[200] bg-stone-950 flex flex-col items-center justify-center transition-all duration-1000 ${hasEntered ? 'opacity-0 pointer-events-none scale-105 blur-md' : 'opacity-100 scale-100 blur-0'}`}>
         
         <div className="absolute inset-0 pointer-events-none">
            <img src="/laflairfrontapproach.jpg" alt="Dr. LaFlair Practice" className="w-full h-full object-cover opacity-40 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-indigo-950/20 to-stone-950/80" />
         </div>
         
         <div 
           className="relative w-64 h-64 md:w-80 md:h-80 cursor-pointer group" 
           style={{ animation: 'float-cloud 6s ease-in-out infinite', perspective: '1000px' }} 
           onClick={() => setHasEntered(true)}
         >
            <div className="w-full h-full relative preserve-3d transition-transform group-hover:scale-105" style={{ animation: 'spin-flip 8s cubic-bezier(0.4, 0.0, 0.2, 1) infinite' }}>
               
               {/* Front Side */}
               <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.1)] p-8">
                  <img src="/emblem.jpg" alt="Dr. LaFlair Logo" className="w-full h-full object-contain drop-shadow-2xl" />
               </div>

               {/* Back Side (Tooth Shape) */}
               <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center">
                  <svg viewBox="90 100 220 340" className="absolute inset-0 w-[110%] h-[110%] -ml-[5%] -mt-[5%] drop-shadow-[0_0_40px_rgba(99,102,241,0.6)]">
                     <defs>
                        <linearGradient id="splash-tooth-grad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#312e81" />
                           <stop offset="100%" stopColor="#000000" />
                        </linearGradient>
                     </defs>
                     <path 
                        d="M 120 180 C 120 120, 160 120, 180 160 C 190 180, 210 180, 220 160 L 250 230 L 280 240 C 290 260, 280 300, 280 300 C 280 380, 260 420, 240 420 C 220 420, 220 380, 210 320 C 200 300, 190 300, 180 320 C 170 380, 170 420, 150 420 C 130 420, 120 380, 120 300 C 110 260, 110 220, 120 180 Z" 
                        fill="url(#splash-tooth-grad)" 
                        stroke="rgba(99,102,241,0.4)" 
                        strokeWidth="2" 
                     />
                  </svg>
                  <div className="relative z-10 text-center mt-6">
                     <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
                     <p className="text-indigo-50 font-black uppercase tracking-[0.2em] text-sm drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]">Click To<br/>Enter</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="absolute bottom-12 left-0 right-0 text-center z-50">
            <a 
              href="https://c4technologies.pages.dev" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-stone-400 hover:text-cyan-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] transition-colors duration-300 opacity-60 hover:opacity-100 inline-block hover:scale-105"
            >
                PORTAL SECURED BY C4:TECHNOLOGIES
            </a>
         </div>
      </div>

      {/* --- ARK IT GLOBAL SERVER OVERLAY --- */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 flex flex-col items-center justify-center overflow-hidden ${isArkMode ? 'opacity-100 backdrop-blur-md bg-slate-900/95 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.4) 2px, transparent 2px), linear-gradient(90deg, rgba(34, 211, 238, 0.4) 2px, transparent 2px)', backgroundSize: '50px 50px', transform: 'perspective(600px) rotateX(60deg) translateY(-100px) translateZ(-200px)', transformOrigin: 'top center' }} />
        
        <div className="absolute inset-0 flex justify-between px-10 opacity-30 pointer-events-none">
            <div className="w-8 h-full flex flex-col gap-4 py-20">{Array.from({length: 15}).map((_, i) => <div key={`l-${i}`} className="w-full h-4 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
            <div className="w-8 h-full flex flex-col gap-4 py-20">{Array.from({length: 15}).map((_, i) => <div key={`r-${i}`} className="w-full h-4 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse" style={{ animationDelay: `${(15-i) * 0.15}s` }} />)}</div>
        </div>

        <Database className="absolute text-cyan-500 opacity-5 w-[80vw] h-[80vw] animate-pulse pointer-events-none" style={{ animationDuration: '3s' }} />
        
        <div className={`relative z-50 text-cyan-400 font-mono text-center transition-all duration-700 delay-100 flex flex-col items-center ${isArkMode ? 'translate-y-0 scale-100' : 'translate-y-10 scale-90'}`}>
           <p className="text-xl md:text-3xl font-black tracking-[0.5em] mb-2 drop-shadow-[0_0_10px_#22d3ee]">C4 TECHNOLOGIES:IT DATABASE</p>
           <p className="text-xs md:text-sm uppercase tracking-widest opacity-70 mb-12">Mainframe Override... Systems Optimal</p>
           
           <a 
              href="https://patrick-lake.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => setIsArkMode(false)}
              className="group relative px-6 md:px-10 py-4 bg-cyan-950/40 border border-cyan-400/50 hover:bg-cyan-400/20 hover:border-cyan-300 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] flex items-center gap-4 mb-6 hover:-translate-y-1"
           >
              <Activity size={24} className="text-cyan-400 group-hover:animate-pulse" />
              <span className="text-sm md:text-base font-black tracking-widest uppercase text-cyan-50">Establish Secure Connection</span>
           </a>

           <button 
              onClick={() => setIsArkMode(false)}
              className="px-6 py-2 text-[10px] md:text-xs font-bold text-cyan-400/40 hover:text-cyan-400 tracking-[0.3em] uppercase transition-colors"
           >
              &gt; Abort_Override
           </button>
        </div>
      </div>

      <button onClick={handleCall} className={`md:hidden fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full ${currentTheme.accentBg} text-white flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 transition-all`}>
        <Phone size={24} className={isDarkMode ? "text-white" : "text-white"} />
      </button>

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        {isDarkMode ? (
          <div className="w-full h-full bg-stone-950 flex items-center justify-center">
             <img src="/emblem.jpg" alt="" className="w-[120%] h-[120%] object-cover opacity-20 blur-[80px] saturate-200" />
          </div>
        ) : <div className="absolute inset-0 bg-gradient-to-br from-stone-50 to-stone-200" />}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-${isDarkMode ? 'black/40' : 'white/40'} to-${isDarkMode ? 'black' : 'white'} pointer-events-none`} />
      </div>

      <div className={`fixed top-0 left-0 right-0 z-50 py-3 px-4 md:px-8 ${currentTheme.glass}`}>
        <div className="w-full mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-8">
          
          <div className="flex items-center justify-between w-full xl:w-auto xl:justify-start gap-4 xl:gap-8">
            
            <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => changeView('anatomy')}>
              <div className={`w-14 h-14 rounded-xl ${currentTheme.accentBg} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform overflow-hidden bg-white`}>
                <img src="/emblem.jpg" alt="Dr. LaFlair Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase tracking-tighter leading-none">Dr. LaFlair <span className="opacity-50 hidden sm:inline">DDS</span></span>
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-1 ${currentTheme.accentText}`}>Family Dentistry</span>
              </div>
            </div>

            <div className="flex items-center gap-4 relative">
              
              <div className="hidden md:flex items-center gap-3 w-32 border-l border-stone-500/20 pl-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1"><span className="text-[8px] font-black uppercase tracking-widest opacity-50">Vitality</span><span className="text-[8px] font-bold">{healthScore}%</span></div>
                  <div className="h-1 w-full bg-stone-500/20 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 bg-gradient-to-r ${healthScore > 50 ? currentTheme.healthBar : 'from-red-600 to-red-400'}`} style={{ width: `${healthScore}%` }} />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsAccessibilityOpen(!isAccessibilityOpen)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 ${
                  isAccessibilityOpen ? 'border-indigo-500 bg-indigo-500 text-white' : (isDarkMode ? 'border-cyan-500/50 bg-slate-800 text-cyan-400' : 'border-stone-300 bg-white text-stone-600')
                }`}
              >
                <AlertTriangle size={16} />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Accessibility</span>
              </button>

              {isAccessibilityOpen && (
                <div className={`absolute top-full mt-2 right-0 w-64 rounded-2xl p-4 shadow-2xl border ${currentTheme.border} ${currentTheme.card} z-[100] animate-in slide-in-from-top-2`}>
                   <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 border-b border-stone-500/20 pb-2">Visual Adjustments</h4>
                   
                   <div className="flex items-center justify-between mb-4">
                     <span className="text-sm font-bold">Theme</span>
                     <button onClick={() => setIsDarkMode(!isDarkMode)} className={`px-3 py-1 rounded-md text-xs font-bold ${currentTheme.accentBgSoft} ${currentTheme.accentText}`}>
                        {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
                     </button>
                   </div>

                   <div className="flex items-center justify-between">
                     <span className="text-sm font-bold">Text Size</span>
                     <div className="flex gap-2">
                       <button onClick={() => setZoomLevel(Math.max(100, zoomLevel - 10))} className={`w-8 h-8 rounded-md flex items-center justify-center font-bold ${currentTheme.accentBgSoft} ${currentTheme.accentText}`}>-</button>
                       <div className="w-12 text-center text-xs font-mono py-2">{zoomLevel}%</div>
                       <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className={`w-8 h-8 rounded-md flex items-center justify-center font-bold ${currentTheme.accentBgSoft} ${currentTheme.accentText}`}>+</button>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 md:gap-8 overflow-x-auto pb-2 xl:pb-0 no-scrollbar w-full xl:w-auto xl:justify-center">
            {['anatomy', 'archive', 'tech', 'connect', 'game'].map(v => (
              <button key={v} onClick={() => changeView(v)} className={`text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${view === v ? `${currentTheme.accentText} border-b-2 ${currentTheme.accentBorder} pb-1` : 'opacity-40 hover:opacity-100 transition-opacity'}`}>
                {v === 'archive' ? 'Outcomes' : v === 'tech' ? 'Advanced' : v === 'game' ? 'Play' : v}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <button onClick={handleBook} className={`px-6 py-2 rounded-full ${currentTheme.accentBg} text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform`}>Request Consultation</button>
          </div>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center z-10 p-4 md:p-12 mt-28 md:mt-24 xl:mt-0 overflow-hidden">
        
        {/* --- STAFF HOVER OVERLAYS --- */}
        {STAFF_CARDS.map((s, i) => (
          <div key={`overlay-${i}`} className={`absolute inset-0 z-[60] transition-all duration-700 bg-stone-950 flex flex-col items-center justify-end p-8 md:p-16 text-center overflow-hidden ${hoveredStaff?.name === s.name ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
             
             <button 
                onClick={(e) => { e.stopPropagation(); setHoveredStaff(null); }}
                className={`absolute top-6 right-6 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all ${hoveredStaff?.name === s.name ? 'opacity-100 scale-100' : 'opacity-0 scale-50 delay-0'} md:hidden`}
             >
                <X size={24} />
             </button>

             <img src={s.image} alt={s.name} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${hoveredStaff?.name === s.name ? 'scale-110' : 'scale-100'}`} />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
             <div className={`relative z-10 transition-all duration-700 delay-100 w-full ${hoveredStaff?.name === s.name ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <p className={`text-xs md:text-sm font-black ${currentTheme.accentText} uppercase tracking-[0.4em] mb-4 drop-shadow-md`}>{s.role}</p>
                <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 drop-shadow-lg leading-tight">{s.name}</h2>
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-stone-200 leading-relaxed font-medium drop-shadow-md pb-8 md:pb-0">&quot;{s.bio}&quot;</p>
             </div>
          </div>
        ))}

      {view === 'game' && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center animate-in zoom-in duration-700 pb-12 pt-8 text-center h-full">
            <h2 className="text-5xl font-black uppercase tracking-widest mb-6 leading-none">Tooth Defender</h2>
            <p className={`text-lg md:text-xl mb-12 max-w-2xl leading-relaxed ${currentTheme.textSecondary}`}>
              Protect the teeth from plaque and decay! Use your arrow keys or touch screen to move the toothbrush and shoot foam at the falling germs. Survive for 15 seconds to win a special clinical discount!
            </p>
            <button 
              onClick={() => setIsGameOpen(true)}
              className={`px-10 py-5 rounded-full ${currentTheme.accentBg} text-white font-black text-xl uppercase tracking-widest shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:scale-110 active:scale-95 transition-all`}
            >
              Launch Mini-Game
            </button>
          </div>
      )}

      {view === 'anatomy' && (
          <div className="w-full max-w-xs md:max-w-lg aspect-square relative animate-in zoom-in duration-1000 flex flex-col items-center mt-8 md:mt-0">
            
            <div className={`absolute -top-8 md:top-0 right-0 z-20 flex items-center gap-3 p-2 pr-4 rounded-full ${currentTheme.glass} border ${currentTheme.border} cursor-pointer hover:scale-105 transition-all shadow-md`} onClick={() => { setIsXrayMode(!isXrayMode); if(chipStatus==='broken') executeRepair(); }}>
               <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isXrayMode ? currentTheme.accentBg : 'bg-stone-500/20'} ${isXrayMode ? 'text-white' : ''}`}>
                 <Search size={14} />
               </div>
               <span className={`text-[10px] font-black uppercase tracking-widest ${isXrayMode ? currentTheme.accentText : 'opacity-50'}`}>X-Ray</span>
            </div>
            
            <div className={`absolute top-8 left-0 md:top-8 md:left-8 z-20 max-w-[200px] md:max-w-[220px] p-3 rounded-2xl ${currentTheme.glass} border ${currentTheme.border} shadow-lg transition-all duration-500 pointer-events-none`}>
               <div className="flex items-start gap-2">
                  <div className={`mt-0.5 w-2 h-2 rounded-full animate-pulse shrink-0 ${isDarkMode ? 'bg-cyan-400' : 'bg-blue-500'}`} />
                  <p className={`text-[10px] md:text-xs font-bold leading-relaxed ${currentTheme.textSecondary}`} key={hintIndex} style={{ animation: 'fade-in 0.5s ease-in-out' }}>
                     {interactiveHints[hintIndex]}
                  </p>
               </div>
            </div>

             <svg viewBox="0 0 400 500" className={`w-full h-full transition-all duration-700 ${isSparkling ? `scale-105 drop-shadow-[0_0_40px_${isDarkMode ? '#22d3ee' : '#6366f1'}]` : (isXrayMode ? currentTheme.xrayGlow : `drop-shadow-[0_0_60px_${isDarkMode ? 'rgba(34,211,238,0.2)' : 'rgba(0,0,0,0.05)'}]`)}`} style={{ touchAction: 'none' }}>
                {isXrayMode && (
                  <rect x="50" y="100" width="300" height="400" fill={`url(#xray-grid-${isDarkMode ? 'dark' : 'light'})`} opacity="0.3" className="pointer-events-none" />
                )}
                
                <defs>
                  <pattern id="xray-grid-dark" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.5"/>
                  </pattern>
                  <pattern id="xray-grid-light" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#171717" strokeWidth="0.5" opacity="0.15"/>
                  </pattern>
                </defs>

                <path d="M 50 360 Q 150 310, 200 330 Q 250 310, 350 360 L 350 500 L 50 500 Z" fill={selectedSection?.id === 'gums' ? TOOTH_SECTIONS.GUMS.color : (isDarkMode ? "#2d1a1c" : "#fecdd3")} className={`transition-all duration-700 ${isXrayMode ? 'opacity-10' : 'cursor-pointer hover:opacity-80'}`} onClick={(e) => { if(!isXrayMode) { e.stopPropagation(); handleInteraction(TOOTH_SECTIONS.GUMS); } }} />
                
                <g>
                   <path d="M 120 180 C 120 120, 160 120, 180 160 C 190 180, 210 180, 220 160 L 250 230 L 280 240 C 290 260, 280 300, 280 300 C 280 380, 260 420, 240 420 C 220 420, 220 380, 210 320 C 200 300, 190 300, 180 320 C 170 380, 170 420, 150 420 C 130 420, 120 380, 120 300 C 110 260, 110 220, 120 180 Z" 
                      fill={isXrayMode ? "transparent" : (selectedSection?.id === 'enamel' ? (isDarkMode ? "#2a3d46" : "#ffffff") : (isDarkMode ? "#1c1c1e" : "#f5f5f4"))} 
                      stroke={isXrayMode ? currentTheme.xrayLine : (isDarkMode ? "rgba(34,211,238,0.3)" : "#e5e5e0")} 
                      strokeWidth={isXrayMode ? "3" : "2"} 
                      className={`transition-all duration-700 ${isXrayMode ? '' : 'cursor-pointer hover:brightness-110'}`} 
                      onClick={!isXrayMode ? handleEnamelClick : undefined}
                      onPointerMove={handleEnamelScrub} />

                    {(!isXrayMode && plaqueLevel > 0 && chipStatus !== 'broken') && (
                      <path d="M 140 290 C 150 260, 200 260, 210 290 C 220 330, 200 360, 170 360 C 140 360, 130 320, 140 290 Z" 
                        fill="rgba(250, 204, 21, 0.4)" 
                        style={{ opacity: plaqueLevel / 100 }}
                        className="pointer-events-none blur-[6px] transition-opacity duration-75" />
                    )}
                    
                    <path d="M 160 240 C 180 220, 220 220, 240 240 C 250 270, 250 300, 240 320 C 230 370, 230 400, 220 400 C 210 400, 210 370, 200 330 C 190 370, 190 400, 180 400 C 170 400, 170 370, 160 320 C 150 300, 150 270, 160 240 Z" 
                      fill={isXrayMode ? currentTheme.xrayLine : (selectedSection?.id === 'nerve' ? TOOTH_SECTIONS.NERVE.color : (isDarkMode ? "rgba(248, 113, 113, 0.15)" : "#fecaca"))} 
                      className={`transition-all duration-700 ${isXrayMode ? 'opacity-80 animate-pulse' : 'cursor-pointer hover:opacity-100'}`} 
                      onClick={(e) => { if(!isXrayMode) { e.stopPropagation(); handleInteraction(TOOTH_SECTIONS.NERVE); } }} />
                    
                    {!isXrayMode && <circle cx="140" cy="220" r="14" fill={TOOTH_SECTIONS.CAVITY.color} className={`transition-all cursor-pointer ${selectedSection?.id === 'cavity' ? 'scale-150' : 'animate-pulse opacity-70 hover:opacity-100'}`} onClick={(e) => { e.stopPropagation(); handleInteraction(TOOTH_SECTIONS.CAVITY); }} />}
                    {(!isXrayMode && chipStatus === 'broken') && <path d="M 220 160 L 250 230 L 280 240 L 250 200 Z" fill="#ef4444" className="animate-pulse opacity-60 pointer-events-none" />}
                </g>
                
                <path d="M 220 160 C 240 120, 280 120, 280 180 C 285 200, 285 220, 280 240 L 250 230 L 220 160 Z" 
                  fill={isXrayMode ? "transparent" : (isDarkMode ? "#1c1c1e" : "#f5f5f4")} 
                  stroke={isXrayMode ? currentTheme.xrayLine : (isDarkMode ? "rgba(34,211,238,0.3)" : "#e5e5e0")} 
                  strokeWidth={isXrayMode ? "3" : "2"}
                  style={{ transform: `translate(${chipPos.x}px, ${chipPos.y}px) scale(${isDragging ? 1.05 : 1})`, transformOrigin: '250px 180px' }}
                  className={`transition-all ${isDragging ? 'duration-0' : 'duration-700'} ${isXrayMode ? 'pointer-events-none' : (chipStatus !== 'broken' ? 'cursor-pointer hover:brightness-125' : 'cursor-grab active:cursor-grabbing')}`}
                  onClick={(!isXrayMode && chipStatus !== 'broken') ? breakTooth : undefined}
                  onPointerDown={handlePointerDown} />
                
                {isSparkling && <g className="pointer-events-none">{[130, 280, 200].map((cx, i) => <circle key={i} cx={cx} cy={150+(i*50)} r={10+(i*5)} fill={isDarkMode ? "rgba(34,211,238, 0.2)" : "rgba(79,70,229, 0.2)"} stroke={isDarkMode ? "#22d3ee" : "#4f46e5"} strokeWidth="2" className="animate-ping" style={{ animationDelay: `${i*0.2}s`, animationDuration: '1.5s' }} />)}</g>}
             </svg>
             <div className="absolute -bottom-10 left-0 right-0 text-center pointer-events-none font-bold text-[10px] uppercase tracking-widest opacity-60">
                {isXrayMode ? 'Advanced Sub-surface Imaging Active' : (chipStatus !== 'broken' ? (plaqueLevel > 0 ? 'Drag Enamel to Scrub Plaque' : 'Enamel Clean. Tap Fragment to Break') : 'Drag fragment to restore structural integrity')}
             </div>

             <div className="md:hidden absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-40 animate-bounce pointer-events-none">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] mb-1">Scroll For Details</span>
                <ChevronDown size={14} />
             </div>

          </div>
        )}

      {view === 'archive' && (
          <div className="w-full max-w-4xl animate-in slide-in-from-bottom duration-700 pb-12 pt-8">
             <div className="mb-10 text-center md:text-left pl-2">
                <h2 className="text-3xl font-black uppercase tracking-widest mb-2">Patient Outcomes</h2>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Real stories and clinical results from our Ogdensburg community.</p>
             </div>

            <div 
                ref={sliderRef}
                className={`relative w-full h-64 md:h-96 rounded-3xl overflow-hidden mb-12 shadow-2xl cursor-ew-resize group select-none border ${currentTheme.border} touch-none`}
                onPointerDown={(e) => { 
                   if (!isTouchDevice) e.preventDefault(); 
                   setIsDraggingSlider(true); 
                }}
             >
                {/* Background Image (Right Side - Clean / After) */}
                <div className="absolute inset-0 bg-stone-900 pointer-events-none">
                   <img src="/clean.png" alt="Healthy Teeth" className="w-full h-full object-cover" />
                   <div className="absolute bottom-4 right-4 px-4 py-1.5 rounded-full bg-cyan-500/80 backdrop-blur-md text-white text-[10px] font-black tracking-widest uppercase shadow-lg">With Care</div>
                </div>

                {/* Foreground Image with Clip Path (Left Side - Dirty / Before) */}
                <div 
                  className="absolute inset-0 bg-stone-900 pointer-events-none" 
                  style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
                >
                   <img src="/dirty.png" alt="Decayed Teeth" className="w-full h-full object-cover" />
                   <div className="absolute bottom-4 left-4 px-4 py-1.5 rounded-full bg-red-500/80 backdrop-blur-md text-white text-[10px] font-black tracking-widest uppercase shadow-lg">Without Care</div>
                </div>

                {/* Slider Handle */}
                <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
                   <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl transition-transform duration-300 ${isDraggingSlider ? 'scale-125' : 'group-hover:scale-110'}`}>
                      <div className="flex gap-1.5">
                         <div className="w-0.5 h-4 bg-stone-400 rounded-full" />
                         <div className="w-0.5 h-4 bg-stone-400 rounded-full" />
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TESTIMONIALS.map((t, i) => (
                   <div key={i} className={`p-6 rounded-3xl ${currentTheme.glass} border ${currentTheme.border} hover:-translate-y-1 transition-transform duration-300`}>
                      <MessageCircle className={`w-8 h-8 opacity-10 mb-4 ${currentTheme.accentText}`} />
                      <p className={`text-sm italic mb-6 ${currentTheme.textSecondary} leading-relaxed`}>&quot;{t.text}&quot;</p>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${currentTheme.accentBgSoft} ${currentTheme.accentText} flex items-center justify-center font-bold text-xs`}>{t.name[0]}</div>
                        <div className="text-xs font-bold">{t.name} <span className="block opacity-40 font-normal mt-0.5">{t.type}</span></div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {view === 'tech' && (
           <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in duration-700">
              {GEAR_LOADOUT.map(g => (
                 <div key={g.id} className={`group relative p-8 rounded-3xl ${currentTheme.glass} ${currentTheme.border} border hover:border-transparent transition-all overflow-hidden`}>
                    {renderTechBackground(g.id)}
                    <div className="relative z-10 transition-colors duration-500 group-hover:text-white">
                        <div className={`w-14 h-14 rounded-2xl ${currentTheme.accentBgSoft} ${currentTheme.accentText} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/20 group-hover:text-white transition-all shadow-sm`}>{g.icon}</div>
                        <p className={`text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 group-hover:text-white/80`}>SPEC: {g.spec}</p>
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-white">{g.name}</h3>
                        <p className={`text-sm mt-3 ${currentTheme.textSecondary} group-hover:text-white/90 leading-relaxed`}>{g.detail}</p>
                    </div>
                 </div>
              ))}
           </div>
        )}

        {view === 'connect' && (
           <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in duration-700 pb-12 pt-8">
              <div className={`p-8 rounded-3xl ${currentTheme.glass} ${currentTheme.border} border flex flex-col justify-between h-full shadow-lg`}>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-widest mb-8">Patient Services</h3>
                  <div className="space-y-6">
                    <a href={`http://googleusercontent.com/maps.google.com/${encodeURIComponent(PRACTICE_INFO.address)}`} target="_blank" rel="noopener noreferrer" className={`group flex items-start gap-4 cursor-pointer hover:bg-${isDarkMode ? 'white/5' : 'black/5'} p-4 -ml-4 rounded-2xl transition-all`}>
                      <div className={`w-12 h-12 rounded-2xl ${currentTheme.accentBgSoft} ${currentTheme.accentText} flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:${currentTheme.accentBg} group-hover:text-white transition-all shadow-sm`}><MapPin size={20}/></div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 group-hover:${currentTheme.accentText} transition-colors`}>Clinical Location</p>
                        <p className="font-bold text-sm">1107 Linden St.</p>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>Ogdensburg, NY 13669</p>
                      </div>
                    </a>
                    <a href={`tel:${PRACTICE_INFO.phone.split('-').join('')}`} className={`group flex items-start gap-4 cursor-pointer hover:bg-${isDarkMode ? 'white/5' : 'black/5'} p-4 -ml-4 rounded-2xl transition-all`}>
                      <div className={`w-12 h-12 rounded-2xl ${currentTheme.accentBgSoft} ${currentTheme.accentText} flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:${currentTheme.accentBg} group-hover:text-white transition-all shadow-sm`}><Phone size={20}/></div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 group-hover:${currentTheme.accentText} transition-colors`}>Direct Line</p>
                        <p className="font-bold text-lg">{PRACTICE_INFO.phone}</p>
                      </div>
                    </a>
                    <div className="flex items-start gap-4 p-4 -ml-4">
                      <div className={`w-12 h-12 rounded-2xl ${currentTheme.accentBgSoft} ${currentTheme.accentText} flex items-center justify-center shrink-0 shadow-sm`}><Clock size={20}/></div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest opacity-50 mb-1`}>Operating Hours</p>
                        <p className="font-bold text-sm">{PRACTICE_INFO.hours.split(':')[0]}: <span className="font-normal">{PRACTICE_INFO.hours.split(':').slice(1).join(':')}</span></p>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>{PRACTICE_INFO.closed}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative h-full min-h-[400px] w-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-900 to-black p-10 text-white flex flex-col justify-between cursor-pointer group hover:scale-[1.02] transition-transform" onClick={handleBook}>
                  <div className="flex justify-between items-start"><CreditCard className="w-10 h-10 text-cyan-400" /><div className="text-right font-mono text-[10px] opacity-60">CARECREDIT_PORTAL</div></div>
                  <div>
                    <p className="text-3xl font-black uppercase tracking-widest mb-4 leading-tight">Zero Interest<br/>Pathways</p>
                    <p className="text-sm opacity-80 mb-8 max-w-[85%] leading-relaxed">Explore flexible financing options to ensure your preventative and restorative care is always stress-free.</p>
                    <div className="flex gap-2">{[1,2,3,4].map(i => <div key={i} className="w-10 h-1 bg-white/20 rounded-full" />)}</div>
                  </div>
              </div>
           </div>
        )}
      </div>

      <div className={`w-full md:w-[450px] lg:w-[500px] ${currentTheme.card} border-l ${currentTheme.border} p-10 pt-32 overflow-y-auto z-20 shadow-2xl relative shrink-0`}>
        {selectedSection ? (
          <div className="animate-in slide-in-from-right duration-500 space-y-8">
             <button onClick={() => setSelectedSection(null)} className="flex items-center gap-2 text-xs font-bold opacity-40 uppercase tracking-widest"><ArrowLeft size={14}/> Back</button>
             <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">{selectedSection.title}</h3>
             <p className={`text-lg leading-relaxed ${currentTheme.textSecondary}`}>{selectedSection.description}</p>
             <div className={`p-6 rounded-3xl border ${currentTheme.border} bg-stone-500/5`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Clinical Indicators</h4>
                <ul className="space-y-4">{selectedSection.symptoms.map(s => <li key={s} className="flex gap-3 text-sm font-medium items-center"><Heart size={14} className={`${currentTheme.accentText}`}/> {s}</li>)}</ul>
             </div>
             <button onClick={handleBook} className={`w-full py-5 rounded-2xl ${currentTheme.accentBg} text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30 hover:scale-[1.02] transition-transform`}>Request Consultation</button>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-500">
             <section>
                 <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-4">Clinical Portal</h2>
                 <p className={`text-lg leading-relaxed ${currentTheme.textSecondary}`}>Led by Dr. Chris LaFlair, our practice delivers restorative precision and pain-free preventative care to the Ogdensburg community.</p>
             </section>
             <section>
                <div className="flex items-center gap-2 mb-6 opacity-30 font-black text-[10px] uppercase tracking-widest"><Users size={14}/> Clinical Team</div>
                <div className="flex flex-col gap-4 pb-20 md:pb-0">
                  {STAFF_CARDS.map((s, i) => (
                    <div 
                      key={i} 
                      onClick={() => setHoveredStaff(s)}
                      onMouseEnter={() => !isTouchDevice && setHoveredStaff(s)}
                      onMouseLeave={() => !isTouchDevice && setHoveredStaff(null)}
                      className={`p-5 rounded-3xl border ${currentTheme.border} ${currentTheme.card} flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm transition-all duration-300 cursor-pointer ${hoveredStaff?.name === s.name ? 'scale-[1.02] shadow-xl border-cyan-500/30' : 'hover:shadow-md'}`}
                    >
                       {s.image ? (
                           <img src={s.image} alt={s.name} className={`w-14 h-14 shrink-0 rounded-full object-cover border-2 transition-all duration-300 ${hoveredStaff?.name === s.name ? 'border-cyan-400' : currentTheme.accentBorder}`} onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + s.name.split(' ').join('+') + '&background=random'; }} />
                       ) : (
                           <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center ${currentTheme.accentBgSoft} ${currentTheme.accentText} font-bold text-xl border-2 ${currentTheme.accentBorder}`}>
                               {s.name[0]}
                           </div>
                       )}
                       <div>
                          <p className={`text-[10px] font-black ${currentTheme.accentText} uppercase mb-1 transition-colors ${hoveredStaff?.name === s.name ? 'text-cyan-500' : ''}`}>{s.role}</p>
                          <h4 className="text-lg font-bold leading-tight mb-1">{s.name}</h4>
                          <p className={`text-xs ${currentTheme.textSecondary} leading-relaxed line-clamp-3`}>{s.bio}</p>
                       </div>
                    </div>
                  ))}
                </div>
             </section>
          </div>
        )}
      </div>

      {/* --- NEW: GAME MODAL RENDER --- */}
      {isGameOpen && <GameModal onClose={() => setIsGameOpen(false)} />}
      
    </div>
  );
};

export default App;