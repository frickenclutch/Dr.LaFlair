import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, Zap, Droplets, Sparkles, 
  MapPin, Phone, CreditCard, ArrowLeft, Activity, 
  Heart, Moon, Sun, Users, Monitor, Crosshair, 
  Database, Shield, ArrowRight, Loader2, Lock, 
  CheckCircle, MessageCircle, Clock, Search,
  X, ChevronDown, Volume2, VolumeX, Scan, Camera
} from 'lucide-react';

// ============================================================================
// --- GAME MODAL COMPONENT ---
// ============================================================================
const GameModal = ({ onClose }) => {
  const canvasRef = useRef(null);
  
  const [gameState, setGameState] = useState('playing'); 
  const [playerName, setPlayerName] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [resetClicks, setResetClicks] = useState(0); 
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch('/api/leaderboard', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeaderboard(data);
      })
      .catch(err => console.error("Failed to load global scores", err));
  }, []);
  
  const gameRef = useRef({
    timeRemaining: 30, 
    toothHealth: 100,  
    lastTime: Date.now(),
    playerX: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    projectiles: [],
    germs: [],
    powerups: [], 
    keys: { ArrowLeft: false, ArrowRight: false, Space: false },
    isDragging: false,
    levelUpImg: null 
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const img = new Image();
    img.src = '/levelup.png';
    gameRef.current.levelUpImg = img;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gameRef.current.playerX = Math.min(gameRef.current.playerX, canvas.width - 20);
    };
    window.addEventListener('resize', resize);
    resize();

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

    const render = () => {
      const state = gameRef.current;
      if (gameState !== 'playing') return;

      const now = Date.now();
      const dt = now - state.lastTime;
      
      if (dt > 1000) {
        state.timeRemaining -= 1;
        state.lastTime = now;
        
        if (state.timeRemaining <= 0) {
          setGameState('won');
          return;
        }
      }

      ctx.fillStyle = '#0f172a'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for(let i=0; i<canvas.width; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }
      for(let i=0; i<canvas.height; i+=50) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke(); }

      const speed = 8;
      if (state.keys.ArrowLeft) state.playerX -= speed;
      if (state.keys.ArrowRight) state.playerX += speed;
      
      if (state.playerX < 20) state.playerX = 20;
      if (state.playerX > canvas.width - 20) state.playerX = canvas.width - 20;

      const th = Math.min(canvas.height * 0.25, 150); 
      const ty = canvas.height - th - 40; 
      const tw = canvas.width * 0.94; 
      const tx = canvas.width * 0.03; 
      const playerY = ty - 30; 

      if (frames % 8 === 0) { 
         state.projectiles.push({ x: state.playerX, y: playerY - 35, active: true });
      }

      const spawnRate = Math.max(25, Math.floor(60 - (30 - state.timeRemaining) * 1.5)); 
      if (frames % spawnRate === 0) {
        const threats = ['🦠', '🍬', '🍩', '☕', '🍔', '🍭', '🥤'];
        const randomThreat = threats[Math.floor(Math.random() * threats.length)];
        
        state.germs.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -30,
          active: true,
          emoji: randomThreat,
          speed: 1.8 + Math.random() * 2.5 + (30 - state.timeRemaining) * 0.1 
        });
      }

      if (frames > 0 && frames % 360 === 0) { 
         state.powerups.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: -40,
            active: true,
            hits: 0 
         });
      }

      state.projectiles.forEach(p => {
        if (!p.active) return;
        p.y -= 10;
        if (p.y < 0) p.active = false;
        
        ctx.fillStyle = '#ffffff'; 
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.arc(p.x - 5, p.y + 4, 5, 0, Math.PI * 2);
        ctx.arc(p.x + 5, p.y + 4, 5, 0, Math.PI * 2);
        ctx.arc(p.x - 3, p.y - 5, 4, 0, Math.PI * 2);
        ctx.arc(p.x + 3, p.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(52, 211, 153, 0.6)';
        ctx.beginPath();
        ctx.arc(p.x, p.y + 10, 5, 0, Math.PI * 2);
        ctx.arc(p.x - 4, p.y + 14, 4, 0, Math.PI * 2);
        ctx.arc(p.x + 4, p.y + 14, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      state.germs.forEach(g => {
        if (!g.active) return;
        g.y += g.speed;
        
        ctx.fillText(g.emoji || '🦠', g.x, g.y);

        state.projectiles.forEach(p => {
          if (!p.active) return;
          const dist = Math.hypot(p.x - g.x, p.y - g.y);
          if (dist < 20) {
            p.active = false;
            g.active = false;
            ctx.fillStyle = '#bef264';
            ctx.beginPath();
            ctx.arc(g.x, g.y, 15, 0, Math.PI*2);
            ctx.fill();
          }
        });

        if (g.x > tx && g.x < tx + tw && g.y > ty + th * 0.2) {
          g.active = false;
          state.toothHealth -= 13; 
          
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(150); 
          }

          if (state.toothHealth <= 0) {
            state.toothHealth = 0;
            setGameState('lost');
            
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([300, 100, 300]); 
            }
          }
        } else if (g.y > canvas.height + 30) {
          g.active = false; 
        }
      });

      state.powerups.forEach(pu => {
        if (!pu.active) return;
        pu.y += 1.5; 

        if (state.levelUpImg && state.levelUpImg.complete) {
           ctx.drawImage(state.levelUpImg, pu.x - 20, pu.y - 20, 40, 40);
        } else {
           ctx.fillText('👨‍⚕️', pu.x, pu.y); 
        }

        state.projectiles.forEach(p => {
           if (!p.active) return;
           const dist = Math.hypot(p.x - pu.x, p.y - pu.y);
           if (dist < 25) {
              p.active = false;
              pu.hits += 1;
              
              ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
              ctx.beginPath();
              ctx.arc(pu.x, pu.y, 15 + pu.hits * 2, 0, Math.PI*2);
              ctx.fill();

              if (pu.hits >= 5) {
                 pu.active = false;
                 state.toothHealth = Math.min(100, state.toothHealth + 25); 
                 
                 ctx.fillStyle = 'rgba(74, 222, 128, 0.8)';
                 ctx.beginPath();
                 ctx.arc(pu.x, pu.y, 60, 0, Math.PI*2);
                 ctx.fill();
              }
           }
        });

        if (pu.y > canvas.height + 30) pu.active = false; 
      });

      state.projectiles = state.projectiles.filter(p => p.active);
      state.germs = state.germs.filter(g => g.active);
      state.powerups = state.powerups.filter(pu => pu.active);

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
      const wear = (100 - state.toothHealth) / 100; 

      teethDef.forEach((tooth, idx) => {
          const w = tooth.wFactor * unitW;
          const h = th * tooth.hFactor;
          const yBase = canvas.height - 20; 
          const yTop = canvas.height - h - 40; 
          
          ctx.fillStyle = state.toothHealth <= 40 ? '#f4f5f0' : '#ffffff'; 
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          ctx.moveTo(currentX, yBase);
          ctx.quadraticCurveTo(currentX + w*0.05, yTop + h*0.3, currentX + w*0.1, yTop);
          
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
          
          ctx.quadraticCurveTo(currentX + w*0.95, yTop + h*0.3, currentX + w, yBase);
          
          ctx.fill();
          ctx.stroke();

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

      ctx.fillStyle = '#f472b6'; 
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      
      const gumY = canvas.height - 40;
      ctx.lineTo(0, gumY);
      ctx.lineTo(tx, gumY);
      
      currentX = tx;
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

      if (state.toothHealth <= 40) {
          ctx.fillStyle = 'rgba(132, 204, 22, 0.2)'; 
          ctx.fillRect(tx, ty - th, tw, th * 2 + 100);
      }

      ctx.fillStyle = '#3b82f6'; 
      ctx.fillRect(state.playerX - 6, playerY - 5, 12, 30);
      ctx.beginPath();
      ctx.arc(state.playerX, playerY + 25, 6, 0, Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(state.playerX - 5, playerY - 20, 10, 15);
      
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(state.playerX - 6, playerY - 35, 12, 15);
      
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(state.playerX - 3, playerY - 35);
      ctx.lineTo(state.playerX - 3, playerY - 20);
      ctx.moveTo(state.playerX + 3, playerY - 35);
      ctx.lineTo(state.playerX + 3, playerY - 20);
      ctx.stroke();

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

 const handleSubmitScore = () => {
    if (!playerName.trim()) return;
    
    const badWords = [
      'fuck', 'shit', 'bitch', 'cunt', 'pussy', 'slut', 'whore', 
      'fag', 'faggot', 'dyke', 'tranny', 'nigger', 'nigga', 'nigg', 
      'spic', 'chink', 'gook', 'kike', 'twat', 'prick', 'cum', 'jizz',
      'bastard', 'douche', 'retard', 'nazi', 'hitler', 'rape', 'pedo', 
      'cock', 'dick', 'boob', 'tits', 'anal', 'dildo', 'asshole', 
      'dumbass', 'jackass', 'bullshit', 'motherfucker', 'wanker', 'retarded'
    ];
    
    const lowerName = playerName.toLowerCase();

    const leetMap = {
      '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', 
      '7': 't', '8': 'b', '@': 'a', '!': 'i', '$': 's'
    };
    
    let normalizedName = lowerName;
    for (const [leet, letter] of Object.entries(leetMap)) {
       normalizedName = normalizedName.split(leet).join(letter); 
    }
    
    const isProfane = badWords.some(word => 
       lowerName.includes(word) || normalizedName.includes(word)
    );
    
    const finalName = isProfane ? 'Tooth Fairy' : playerName.trim().substring(0, 12);

    const newScore = { 
      name: finalName, 
      health: gameRef.current.toothHealth, 
      date: new Date().toLocaleDateString() 
    };
    
    const optimisticBoard = [...leaderboard, newScore]
      .sort((a, b) => b.health - a.health)
      .slice(0, 5); 
    
    setLeaderboard(optimisticBoard);
    setScoreSubmitted(true);

    fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newScore) 
    })
    .then(res => res.json())
    .then(serverLeaderboard => {
       if (Array.isArray(serverLeaderboard)) {
           setLeaderboard(serverLeaderboard);
       }
    })
    .catch(err => console.error("Failed to save global score", err));
  };

  const handleSecretReset = () => {
     setResetClicks(prev => {
        const next = prev + 1;
        if (next >= 3) { 
           setLeaderboard([]);
           return 0;
        }
        return next;
     });
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col items-center justify-center overflow-hidden touch-none">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 block cursor-crosshair touch-none"
      />
      
      {gameState === 'playing' && (
        <div className="absolute top-[60px] left-2 md:top-16 md:left-4 z-30 pointer-events-none origin-top-left scale-[0.65] md:scale-100 opacity-60 md:opacity-100 transition-all">
           <div className="bg-slate-900/60 backdrop-blur-md border border-cyan-500/30 rounded-xl p-3 shadow-xl">
             <h3 className="text-cyan-400 font-black mb-2 uppercase tracking-widest text-[10px]">Global Top 5</h3>
             <div className="space-y-1">
               {leaderboard.length > 0 ? leaderboard.map((score, idx) => (
                 <div key={idx} className="flex justify-between items-center text-[10px] font-bold text-white gap-6">
                   <span>{idx + 1}. {score.name}</span>
                   <span className="text-emerald-400">{score.health}%</span>
                 </div>
               )) : <div className="text-slate-400 text-[10px] italic">Awaiting first defender...</div>}
             </div>
           </div>
        </div>
      )}

      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white font-bold text-sm bg-slate-800/60 hover:bg-slate-700 px-4 py-2 rounded-full backdrop-blur z-50 transition-colors flex items-center shadow-lg"
      >
        Skip to Website &rarr;
      </button>

      {gameState === 'won' && (
        <div className="absolute inset-0 bg-blue-900/90 flex flex-col items-center justify-center backdrop-blur-md z-40 p-4">
          <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-2 border-cyan-400 animate-in zoom-in duration-500">
            <div 
              className="text-6xl mb-4 cursor-pointer select-none"
              onClick={handleSecretReset}
              title="Staff Only: Click 3 times to reset scores"
            >✨🦷✨</div>
            <h2 className="text-3xl font-black text-white mb-2">TEETH SAVED!</h2>
            <p className="text-cyan-200 mb-6 font-semibold">You survived with {gameRef.current.toothHealth}% enamel intact!</p>
           
            <div className="bg-cyan-900/40 border border-cyan-400/50 p-4 rounded-xl mb-6 shadow-inner animate-in fade-in duration-700 delay-300">
              <p className="text-cyan-200 text-[10px] uppercase font-black tracking-widest mb-1">REMARKABLE SUCCESS!</p>
              <p className="text-white font-bold text-sm">$5 Off Cleaning!</p>
              <div className="bg-slate-900 text-cyan-400 font-mono text-xl py-2 px-4 rounded-lg mt-2 inline-block tracking-widest border border-cyan-500/50 select-all">
                SMILESAVER
              </div>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide">Screenshot and show the front desk!</p>
            </div>

            {!scoreSubmitted ? (
              <div className="space-y-4 mb-6">
                <input 
                  type="text" 
                  maxLength={12}
                  placeholder="Enter your name..." 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-slate-800 text-white font-bold px-4 py-3 rounded-xl border border-slate-600 focus:border-cyan-400 focus:outline-none text-center uppercase"
                />
                <button 
                  onClick={handleSubmitScore}
                  className="w-full bg-cyan-500 text-white font-black py-3 rounded-xl hover:bg-cyan-400 transition-colors"
                >
                  SAVE SCORE
                </button>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
                <h3 className="text-cyan-400 font-black mb-3 uppercase tracking-widest text-sm">Top Defenders</h3>
                <div className="space-y-2">
                  {leaderboard.length === 0 && <p className="text-slate-400 text-xs italic">No scores yet. Be the first!</p>}
                  {leaderboard.map((score, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm font-bold text-white bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700/50">
                      <span>{idx + 1}. {score.name}</span>
                      <span className="text-emerald-400">{score.health}% Health</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
               <button
                 onClick={() => {
                   gameRef.current = {
                     timeRemaining: 30, toothHealth: 100, lastTime: Date.now(),
                     playerX: window.innerWidth / 2, projectiles: [], germs: [], powerups: [],
                     keys: { ArrowLeft: false, ArrowRight: false, Space: false }, isDragging: false,
                     levelUpImg: gameRef.current.levelUpImg
                   };
                   setScoreSubmitted(false);
                   setPlayerName('');
                   setGameState('playing');
                 }}
                 className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors"
               >
                 Play Again
               </button>
               <button onClick={onClose} className="w-full bg-slate-800 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-700 transition-colors">
                 Exit Game
               </button>
            </div>
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

// Replaced Anatomy interactive model data with the Requested Services List
const SERVICES = [
  { name: "Cleanings / Periodontal", desc: "Advanced hygiene care to maintain strong, healthy gingival foundations.", icon: <Droplets className="w-6 h-6"/> },
  { name: "Crowns", desc: "Porcelain and metal-free options available to reduce allergic reactions and enhance esthetics.", icon: <ShieldCheck className="w-6 h-6"/> },
  { name: "Tooth Colored Fillings", desc: "Cosmetic composite materials that are completely free of mercury.", icon: <Sparkles className="w-6 h-6"/> },
  { name: "Bonding / Cosmetic", desc: "Seamless aesthetic treatments to repair chips and restore your natural smile.", icon: <Heart className="w-6 h-6"/> },
  { name: "Whitening", desc: "Professional grade brightening for a radiant and confident smile.", icon: <Sun className="w-6 h-6"/> },
  { name: "Implant Restorations", desc: "Precision restorations for lasting, functional, and natural-looking replacements.", icon: <Database className="w-6 h-6"/> },
  { name: "Orthodontics", desc: "Comprehensive alignment treatments guiding you to an optimal bite.", icon: <Activity className="w-6 h-6"/> },
  { name: "Traditional Braces", desc: "Reliable, effective alignment ideal for complex dental crowding and bite issues.", icon: <Monitor className="w-6 h-6"/> },
  { name: "Clear Aligners", desc: "Virtually invisible trays changed every two weeks for comfortable, discreet correction.", icon: <Zap className="w-6 h-6"/> },
  { name: "Root Canal Therapy", desc: "Endodontic care designed to comfortably save and preserve compromised teeth.", icon: <Crosshair className="w-6 h-6"/> },
  { name: "Dentures and Partials", desc: "Custom-fitted, high-quality prosthetics for comfortable daily wear and chewing.", icon: <Users className="w-6 h-6"/> },
  { name: "Extractions", desc: "Gentle and safe removal of problematic or severely impacted teeth.", icon: <AlertTriangle className="w-6 h-6"/> }
];

const TESTIMONIALS = [
  { name: "S. Banning", type: "Orthodontics", text: "The braces process was incredibly smooth. Dr. LaFlair and his team explained everything perfectly and the results are amazing." },
  { name: "D. Teele", type: "Emergency Care", text: "I came in with severe pain and Dr. LaFlair provided completely pain-free emergency care. I couldn't be more grateful." },
  { name: "M. Richards", type: "Restorative Care", text: "The new digital scanner made my crown fitting so easy—no more messy putty! Highly recommend this modern office." },
  { name: "L. Smith", type: "Preventative", text: "Suellen, Renee, and the hygienists make every visit welcoming and stress-free. Best dental experience in the North Country." }
];

const GEAR_LOADOUT = [
  { id: 'trios', name: "Trios Digital Scanner", icon: <Scan className="w-6 h-6"/>, spec: "3D Color Imaging", detail: "Added in 2017, this full-color 3D scanner replaces traditional putty impressions for retainers, crowns, and partials, significantly improving accuracy and patient comfort." },
  { id: 'xray', name: "Digital Radiography", icon: <Monitor className="w-6 h-6"/>, spec: "Low-Dose Imaging", detail: "Reduces radiation exposure by up to 90% while providing instant diagnostic data." },
  { id: 'camera', name: "Intraoral Cameras", icon: <Camera className="w-6 h-6"/>, spec: "Transparency", detail: "See exactly what the doctor sees in high detail on our clinical monitors." },
  { id: 'cloud', name: "Secure E-Records", icon: <Database className="w-6 h-6"/>, spec: "HIPAA Compliant", detail: "Fully encrypted data management for seamless, secure updates." },
  { id: 'shield', name: "Advanced Sterilization", icon: <Shield className="w-6 h-6"/>, spec: "Infection Control", detail: "Hospital-grade protocols exceeding industry standards for absolute safety." }
];

const STAFF_CARDS = [
  { 
    name: "Dr. Chris LaFlair", 
    role: "Lead Dentist", 
    bio: "An Ogdensburg native and 1988 OFA graduate. Dr. LaFlair earned his biology degree from St. Lawrence University and graduated with honors from Stony Brook's School of Dental Medicine in 1996. He opened his private practice in 1999 and stays active in the community as a track coach.", 
    image: "/drlaflairspecialist.jpg",
    video: "https://pub-5f0c29564d124d5182fc08bffb9d8d3d.r2.dev/landing.mp4" 
  },
  { 
    name: "Suellen & Renee", 
    role: "Front Desk & Assistants", 
    bio: "Suellen completed her Certified Dental Assistants program through Monroe Community College. Renee specifically handles scheduling, billing, and insurance accommodations, ensuring every visit is stress-free.", 
    image: "/SueellenRenee.jpg" 
  },
  { 
    name: "Olivia & Stephanie", 
    role: "Dental Hygienists", 
    bio: "Stephanie is an Onondaga Community College graduate who has worked with Dr. LaFlair since 2000. Together, Olivia and Stephanie continually engage in advanced hygiene care and orthodontic training to provide exceptional preventative treatments.", 
    image: "/oloivastephanie.jpg" 
  }
];

const App = () => {
  const [hasEntered, setHasEntered] = useState(false); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [hoveredStaff, setHoveredStaff] = useState(null); 

  const [isGameOpen, setIsGameOpen] = useState(false);

  // Changed default view to services 
  const [view, setView] = useState('video');
  const [activeAudio, setActiveAudio] = useState(null); 
  const bgAudioRef = useRef(null);

  // Smart Audio Mixer: Smoothly Crossfades between BG Music and Active Video
  useEffect(() => {
    const bgMusic = bgAudioRef.current;
    if (!bgMusic) return;

    let fadeInterval;

    if (activeAudio === null) {
      bgMusic.play().catch(e => console.log("Waiting for interaction...", e));
      fadeInterval = setInterval(() => {
        if (bgMusic.volume < 0.28) {
          bgMusic.volume += 0.02; 
        } else {
          bgMusic.volume = 0.3;   
          clearInterval(fadeInterval);
        }
      }, 40); 
    } else {
      fadeInterval = setInterval(() => {
        if (bgMusic.volume > 0.02) {
          bgMusic.volume -= 0.02; 
        } else {
          bgMusic.volume = 0;     
          clearInterval(fadeInterval);
        }
      }, 40);
    }
    return () => clearInterval(fadeInterval);
  }, [activeAudio]);

  const [healthScore, setHealthScore] = useState(85);
  
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderRef = useRef(null);
  
  const [fullSliderPos, setFullSliderPos] = useState(50);
  const [isDraggingFull, setIsDraggingFull] = useState(false);
  const fullSliderRef = useRef(null);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');
  
  const [isArkMode, setIsArkMode] = useState(false); 

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingFull || !fullSliderRef.current) return;
      const rect = fullSliderRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      setFullSliderPos((x / rect.width) * 100);
    };
    const handleUp = () => setIsDraggingFull(false);
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDraggingFull]);

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

  const handleBook = () => window.location.href = `mailto:${PRACTICE_INFO.email}?subject=Appointment Request`;
  const handleCall = () => window.location.href = `tel:${PRACTICE_INFO.phone.split('-').join('')}`;

  const handlePointerMove = (e) => {
    if (isDraggingSlider && sliderRef.current) {
      if (!isTouchDevice) e.preventDefault();
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSliderPos((x / rect.width) * 100);
    }
  };

  const handlePointerUp = (e) => {
    if (isDraggingSlider) setIsDraggingSlider(false);
  };

  const changeView = (newView) => {
    setView(newView);
    setHoveredStaff(null);
    setActiveAudio(null); 
  };

  const renderTechBackground = (id) => {
    if (id === 'trios') return (
      <div className="absolute inset-0 bg-slate-900 opacity-0 group-hover:opacity-100 transition-all duration-500 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-600/30 via-indigo-500/20 to-transparent blur-xl"/>
        <div className="absolute top-0 right-0 w-full h-full opacity-40" style={{ backgroundImage: 'radial-gradient(circle at center, transparent 0%, #050505 80%), repeating-linear-gradient(45deg, rgba(34,211,238,0.1) 0px, rgba(34,211,238,0.1) 2px, transparent 2px, transparent 10px)' }}/>
      </div>
    );
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
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        
        /* CUSTOM TOOTH CURSORS */
        body, html, * { cursor: url('/cursor1.png') 16 16, auto !important; }
        button, a, .cursor-pointer, .cursor-grab, .cursor-ew-resize, input[type="checkbox"] { cursor: url('/cursor2.png') 16 16, pointer !important; }

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

      {/* --- BACKGROUND AUDIO (Now configured to use instrumental music only) --- */}
      <audio 
        ref={bgAudioRef} 
        src="https:/pub-5f0c29564d124d5182fc08bffb9d8d3d.r2.dev/laflairclinic.mp3" 
        loop 
      />

      {/* --- SPLASH SCREEN OVERLAY --- */}
      <div className={`fixed inset-0 z-[200] bg-stone-950 flex flex-col items-center justify-center transition-all duration-1000 ${hasEntered ? 'opacity-0 pointer-events-none scale-105 blur-md' : 'opacity-100 scale-100 blur-0'}`}>
         
         <div className="absolute inset-0 pointer-events-none">
            <video src="/toothdefender.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover opacity-40 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-indigo-950/20 to-stone-950/80" />
         </div>
         
         <div 
           className="relative w-64 h-64 md:w-80 md:h-80 cursor-pointer group" 
           style={{ animation: 'float-cloud 6s ease-in-out infinite', perspective: '1000px' }} 
           onClick={() => {
            setHasEntered(true);
            if (bgAudioRef.current) {
              bgAudioRef.current.volume = 0.3; 
              bgAudioRef.current.play().catch(e => console.log("Audio blocked:", e));
            }
          }}
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
            
            <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => changeView('services')}>
              <div className={`w-14 h-14 rounded-xl ${currentTheme.accentBg} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform overflow-hidden bg-white`}>
                <img src="/emblem.jpg" alt="Dr. LaFlair Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase tracking-tighter leading-none">Dr. LaFlair <span className="opacity-50 hidden sm:inline">DDS</span></span>
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-1 ${currentTheme.accentText}`}>Family Dentistry</span>
              </div>
            </div>

            <div className="flex items-center gap-4 relative">
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
            {['services', 'archive', 'tech', 'connect', 'game'].map(v => (
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

      <div className="relative flex-1 flex flex-col items-center justify-center z-10 p-4 md:p-12 mt-28 md:mt-24 xl:mt-0 overflow-y-auto no-scrollbar">
        
        {/* --- STAFF HOVER OVERLAYS --- */}
        {STAFF_CARDS.map((s, i) => (
          <div key={`overlay-${i}`} className={`absolute inset-0 z-[60] transition-all duration-700 bg-stone-950 flex flex-col items-center justify-end p-8 md:p-16 text-center overflow-hidden ${hoveredStaff?.name === s.name ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
             
             <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setHoveredStaff(null);
                  setActiveAudio(null); 
                }}
                className={`absolute top-6 right-6 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all ${hoveredStaff?.name === s.name ? 'opacity-100 scale-100' : 'opacity-0 scale-50 delay-0'} md:hidden z-[100]`}
             >
                <X size={24} />
             </button>

             {s.video && hoveredStaff?.name === s.name ? (
                <>
                  <video 
                    src={s.video} 
                    autoPlay 
                    loop={false} 
                    muted={activeAudio !== s.name} 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-1000"
                  />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAudio(activeAudio === s.name ? null : s.name);
                    }}
                    className="absolute bottom-6 right-6 md:bottom-12 md:right-12 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/20 z-50 shadow-lg"
                  >
                    {activeAudio !== s.name ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>
                </>
             ) : (
                <img src={s.image} alt={s.name} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${hoveredStaff?.name === s.name ? 'scale-110' : 'scale-100'}`} />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
             <div className={`relative z-10 transition-all duration-700 delay-100 w-full pointer-events-none ${hoveredStaff?.name === s.name ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <p className={`text-xs md:text-sm font-black ${currentTheme.accentText} uppercase tracking-[0.4em] mb-4 drop-shadow-md`}>{s.role}</p>
                <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 drop-shadow-lg leading-tight">{s.name}</h2>
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-stone-200 leading-relaxed font-medium drop-shadow-md pb-8 md:pb-0">&quot;{s.bio}&quot;</p>
             </div>
          </div>
        ))}

      {/* --- NEW: VIDEO LANDING VIEW --- */}
      {view === 'video' && (
          <div className="w-full h-full max-w-5xl flex items-center justify-center animate-in fade-in duration-1000 z-20">
            <div className="relative w-full max-h-full">
              {/* Changed landing video file per doctor's request */}
              <video 
                src="https://pub-5f0c29564d124d5182fc08bffb9d8d3d.r2.dev/landing.mp4" 
                autoPlay 
                loop 
                muted={activeAudio !== 'landing'} 
                playsInline 
                className={`w-full max-h-full object-contain rounded-3xl shadow-2xl border ${currentTheme.border}`}
              />
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveAudio(activeAudio === 'landing' ? null : 'landing'); 
                }}
                className="absolute bottom-6 right-6 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/20 z-30 shadow-lg"
              >
                {activeAudio !== 'landing' ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
            </div>
          </div>
      )}

      {/* --- SERVICES GRID VIEW (Replaced Anatomy View) --- */}
      {view === 'services' && (
          <div className="w-full max-w-6xl animate-in fade-in zoom-in duration-700 pb-12 pt-8">
            <div className="mb-10 text-center md:text-left pl-2">
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-4">Clinical Services</h2>
                <p className={`text-lg max-w-2xl ${currentTheme.textSecondary}`}>Comprehensive restorative precision and pain-free preventative care available directly in Ogdensburg.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {SERVICES.map((s, idx) => (
                <div key={idx} className={`p-6 rounded-3xl ${currentTheme.glass} border ${currentTheme.border} flex flex-col items-start shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group`}>
                   <div className={`w-12 h-12 rounded-2xl ${currentTheme.accentBgSoft} ${currentTheme.accentText} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:${currentTheme.accentBg} group-hover:text-white transition-all shadow-sm`}>
                     {s.icon}
                   </div>
                   <h3 className="text-xl font-bold mb-2">{s.name}</h3>
                   <p className={`text-sm ${currentTheme.textSecondary} leading-relaxed`}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
      )}

      {view === 'game' && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center animate-in zoom-in duration-700 pb-12 pt-8 text-center h-full">
            <h2 className="text-5xl font-black uppercase tracking-widest mb-6 leading-none">Tooth Defender</h2>
            <p className={`text-lg md:text-xl mb-12 max-w-2xl leading-relaxed ${currentTheme.textSecondary}`}>
              Protect the teeth from plaque and decay! Use your arrow keys or touch screen to move the toothbrush and shoot foam at the falling germs. Survive for 30 seconds to etch your name onto the daily leaderboard!
            </p>
            <button 
              onClick={() => setIsGameOpen(true)}
              className={`px-10 py-5 rounded-full ${currentTheme.accentBg} text-white font-black text-xl uppercase tracking-widest shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:scale-110 active:scale-95 transition-all`}
            >
              Launch Mini-Game
            </button>
          </div>
      )}

      {view === 'archive' && (
          <div className="w-full max-w-4xl animate-in slide-in-from-bottom duration-700 pb-12 pt-8">
             <div className="mb-10 text-center md:text-left pl-2">
                <h2 className="text-3xl font-black uppercase tracking-widest mb-2">Patient Outcomes</h2>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Real stories and clinical results from our Ogdensburg community.</p>
             </div>

             {/* Single Arch Restoration */}
            <div 
                ref={sliderRef}
                className={`relative w-full h-[450px] md:h-[700px] rounded-3xl overflow-hidden mb-6 shadow-2xl cursor-ew-resize group select-none border ${currentTheme.border} touch-none`}
                onPointerDown={(e) => { 
                   if (!isTouchDevice) e.preventDefault(); 
                   setIsDraggingSlider(true); 
                }}
             >
                <div className="absolute inset-0 bg-stone-900 pointer-events-none">
                   <img src="/clean.png" alt="Healthy Teeth" className="w-full h-full object-cover" />
                   <div className="absolute bottom-4 right-4 px-4 py-1.5 rounded-full bg-cyan-500/80 backdrop-blur-md text-white text-[10px] font-black tracking-widest uppercase shadow-lg">With Care</div>
                </div>

                <div 
                  className="absolute inset-0 bg-stone-900 pointer-events-none" 
                  style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
                >
                   <img src="/dirty.png" alt="Decayed Teeth" className="w-full h-full object-cover" />
                   <div className="absolute bottom-4 left-4 px-4 py-1.5 rounded-full bg-red-500/80 backdrop-blur-md text-white text-[10px] font-black tracking-widest uppercase shadow-lg">Without Care</div>
                </div>

                <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
                   <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl transition-transform duration-300 ${isDraggingSlider ? 'scale-125' : 'group-hover:scale-110'}`}>
                      <div className="flex gap-1.5">
                         <div className="w-0.5 h-4 bg-stone-400 rounded-full" />
                         <div className="w-0.5 h-4 bg-stone-400 rounded-full" />
                      </div>
                   </div>
                </div>
             </div>

             {/* Static Before and After Thumbnails for Single Arch */}
             <div className="grid grid-cols-2 gap-4 mb-16">
               <div className={`rounded-xl overflow-hidden border ${currentTheme.border} shadow-sm relative`}>
                 <img src="/dirty.png" alt="Before Care" className="w-full h-48 object-cover" />
                 <div className="absolute top-2 left-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow">Before</div>
               </div>
               <div className={`rounded-xl overflow-hidden border ${currentTheme.border} shadow-sm relative`}>
                 <img src="/clean.png" alt="After Care" className="w-full h-48 object-cover" />
                 <div className="absolute top-2 right-2 bg-cyan-500/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow">After</div>
               </div>
             </div>

             {/* --- SECOND SLIDER: FULL ARCH COMPARISON --- */}
             <div className="mb-10 text-center md:text-left pl-2 mt-8">
                <h2 className="text-3xl font-black uppercase tracking-widest mb-2">Full Arch Restoration</h2>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Comprehensive restorative transformation and preventative care.</p>
             </div>

             <div 
                ref={fullSliderRef}
                className={`relative w-full h-[600px] md:h-[850px] rounded-3xl overflow-hidden mb-6 shadow-2xl cursor-ew-resize group select-none border ${currentTheme.border} touch-none`}
                onPointerDown={(e) => { 
                   if (!isTouchDevice) e.preventDefault(); 
                   setIsDraggingFull(true); 
                }}
             >
                <div className="absolute inset-0 bg-stone-900 pointer-events-none">
                   <img src="/cleanfull.png" alt="Healthy Full Arch" className="w-full h-full object-cover" />
                   <div className="absolute bottom-4 right-4 px-4 py-1.5 rounded-full bg-cyan-500/80 backdrop-blur-md text-white text-[10px] font-black tracking-widest uppercase shadow-lg">With Care</div>
                </div>

                <div 
                  className="absolute inset-0 bg-stone-900 pointer-events-none" 
                  style={{ clipPath: `polygon(0 0, ${fullSliderPos}% 0, ${fullSliderPos}% 100%, 0 100%)` }}
                >
                   <img src="/dirtyfull.png" alt="Decayed Full Arch" className="w-full h-full object-cover" />
                   <div className="absolute bottom-4 left-4 px-4 py-1.5 rounded-full bg-red-500/80 backdrop-blur-md text-white text-[10px] font-black tracking-widest uppercase shadow-lg">Without Care</div>
                </div>

                <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none" style={{ left: `${fullSliderPos}%`, transform: 'translateX(-50%)' }}>
                   <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl transition-transform duration-300 ${isDraggingFull ? 'scale-125' : 'group-hover:scale-110'}`}>
                      <div className="flex gap-1.5">
                         <div className="w-0.5 h-4 bg-stone-400 rounded-full" />
                         <div className="w-0.5 h-4 bg-stone-400 rounded-full" />
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
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
           <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in zoom-in duration-700 pb-12 pt-8">
              {GEAR_LOADOUT.map(g => (
                 <div key={g.id} className={`group relative p-8 rounded-3xl ${currentTheme.glass} ${currentTheme.border} border hover:border-transparent transition-all overflow-hidden flex flex-col justify-between`}>
                    {renderTechBackground(g.id)}
                    <div className="relative z-10 transition-colors duration-500 group-hover:text-white">
                        <div className={`w-14 h-14 rounded-2xl ${currentTheme.accentBgSoft} ${currentTheme.accentText} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/20 group-hover:text-white transition-all shadow-sm`}>{g.icon}</div>
                        <p className={`text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 group-hover:text-white/80`}>SPEC: {g.spec}</p>
                        <h3 className="text-2xl font-bold mb-3 group-hover:text-white leading-tight">{g.name}</h3>
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
          <div className="space-y-12 animate-in fade-in duration-500">
             <section>
                 <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-4">Clinical Portal</h2>
                 <p className={`text-lg leading-relaxed ${currentTheme.textSecondary}`}>Led by Dr. Chris LaFlair, our practice delivers restorative precision and pain-free preventative care to the Ogdensburg community.</p>
                 <button onClick={handleBook} className={`w-full py-4 mt-8 rounded-2xl ${currentTheme.accentBg} text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30 hover:scale-[1.02] transition-transform`}>Request Consultation</button>
             </section>
             <section>
                <div className="flex items-center gap-2 mb-6 opacity-30 font-black text-[10px] uppercase tracking-widest"><Users size={14}/> Clinical Team</div>
                <div className="flex flex-col gap-4 pb-20 md:pb-0">
                  {STAFF_CARDS.map((s, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        setHoveredStaff(s);
                        setActiveAudio(null); 
                      }}
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
      </div>

      {isGameOpen && <GameModal onClose={() => setIsGameOpen(false)} />}
      
    </div>
  );
};

export default App;