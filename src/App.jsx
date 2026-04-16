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
    timeRemaining: 15, // 15 seconds to win
    toothHealth: 100,  // starts at 100%
    lastTime: Date.now(),
    playerX: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    projectiles: [],
    germs: [],
    keys: { ArrowLeft: false, ArrowRight: false, Space: false },
    isDragging: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

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

      // Spawn Germs
      const spawnRate = Math.max(30, Math.floor(60 - (15 - state.timeRemaining) * 2));
      if (frames % spawnRate === 0) {
        state.germs.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -30,
          active: true,
          speed: 2 + Math.random() * 2 + (15 - state.timeRemaining)*0.1 // faster as time goes
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
        
        // Draw Germ (🦠)
        ctx.fillText('🦠', g.x, g.y);

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

      // Clean up arrays
      state.projectiles = state.projectiles.filter(p => p.active);
      state.germs = state.germs.filter(g => g.active);

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
                    timeRemaining: 15, toothHealth: 100, lastTime: Date.now(),
                    playerX: window.innerWidth / 2, projectiles: [], germs: [],
                    keys: { ArrowLeft: false, ArrowRight: false, Space: false }, isDragging: false
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

  // --- NEW: Game Launch State ---
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
        @keyframes pulse-grid { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.7; background-color: rgba(34,211,238,0