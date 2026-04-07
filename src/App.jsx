import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, Zap, Droplets, Sparkles, 
  MapPin, Phone, CreditCard, ArrowLeft, Activity, 
  Heart, Moon, Sun, Users, Monitor, Crosshair, 
  Database, Shield, ArrowRight, Loader2, Lock, 
  CheckCircle, MessageCircle, Clock, Search,
  Accessibility, X, Type, Eye, ZapOff, ScanFace // NEW A11Y ICONS
} from 'lucide-react';

const PRACTICE_INFO = {
  name: "Christopher LaFlair DDS P.C.",
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
  { name: "Dr. Chris LaFlair", role: "Lead Dentist", image: "/drlaflairspecialist.jpg", bio: "A North Country native who graduated with honors from Stony Brook. He specializes in providing exceptional general and cosmetic care in a relaxed atmosphere." },
  { name: "Renee & Suellen", role: "Front Desk & Assistants", image: "/SueellenRenee.jpg", bio: "Bringing over 20 years of combined experience. Suellen is a Licensed Certified Dental Assistant, while Renee ensures stress-free scheduling." },
  { name: "Stephanie & Olivia", role: "Dental Hygienists", image: "/oloivastephanie.jpg", bio: "Board-certified hygienists dedicated to advanced hygiene care and expanded orthodontic services, ensuring patients receive the best care possible." }
];

const NAV_ITEMS = [
  { id: 'anatomy', label: 'Anatomy' },
  { id: 'outcomes', label: 'Outcomes' },
  { id: 'team', label: 'Team' },
  { id: 'tech', label: 'Advanced' },
  { id: 'connect', label: 'Connect' }
];

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [view, setView] = useState('anatomy'); 
  const [selectedSection, setSelectedSection] = useState(null);
  const [healthScore, setHealthScore] = useState(85);
  
  const [isSparkling, setIsSparkling] = useState(false);
  const [chipStatus, setChipStatus] = useState('intact'); 
  const [chipPos, setChipPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isXrayMode, setIsXrayMode] = useState(false);
  const [plaqueLevel, setPlaqueLevel] = useState(100);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');
  
  const [hintIndex, setHintIndex] = useState(0);
  const [isArkMode, setIsArkMode] = useState(false); 
  
  // --- NEW: ACCESSIBILITY STATE ---
  const [isA11yOpen, setIsA11yOpen] = useState(false);
  const [a11y, setA11y] = useState({
    largeText: false,
    highContrast: false,
    reduceMotion: false,
    dyslexic: false
  });

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

    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) {
        setDeviceType('android');
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        setDeviceType('ios');
    } else if (/Mac/i.test(userAgent) && hasTouch) {
        setDeviceType('ios');
    } else {
        setDeviceType('desktop');
    }
  }, []);

  const currentTheme = isDarkMode ? THEMES.LAB : THEMES.APPLE;
  const dragRef = useRef(false);
  const dragOffset = useRef({ startX: 0, startY: 0, chipX: 0, chipY: 0, currentX: 0, currentY: 0 });

  const handleBook = () => window.location.href = `mailto:${PRACTICE_INFO.email}?subject=Appointment Request`;
  const handleCall = () => window.location.href = `tel:${PRACTICE_INFO.phone.replace(/-/g, '')}`;

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
    e.preventDefault();
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
      e.preventDefault();
      const dx = e.clientX - dragOffset.current.startX;
      const dy = e.clientY - dragOffset.current.startY;
      const newX = dragOffset.current.chipX + dx;
      const newY = dragOffset.current.chipY + dy;
      
      dragOffset.current.currentX = newX;
      dragOffset.current.currentY = newY;
      
      setChipPos({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e) => {
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
    // --- ACCESSIBILITY WRAPPER CLASSES APPLIED HERE ---
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.textPrimary} transition-colors duration-700 flex flex-col md:flex-row overflow-hidden select-none 
      ${a11y.largeText ? 'a11y-large-text' : ''} 
      ${a11y.highContrast ? 'a11y-high-contrast' : ''} 
      ${a11y.reduceMotion ? 'a11y-reduce-motion' : ''} 
      ${a11y.dyslexic ? 'a11y-dyslexic' : 'font-sans'}`}
      onPointerUp={handlePointerUp} onPointerMove={handlePointerMove} onPointerLeave={handlePointerUp}>
      
      {/* --- ACCESSIBILITY CSS OVERRIDES --- */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Standard Animations */
        @keyframes scanline { 0% { transform: translateY(-50px); } 100% { transform: translateY(400px); } }
        @keyframes float-melt { 0% { transform: translateY(0) scale(1); opacity: 0.9; background-color: #a3e635; } 50% { background-color: #f97316; } 100% { transform: translateY(-150px) scale(0); opacity: 0; background-color: #ef4444; } }
        @keyframes pulse-grid { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.7; background-color: rgba(34,211,238,0.3); } }
        @keyframes xray-scan { 0% { background-position: 0% 0%; } 100% { background-position: 0% 100%; } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        /* A11Y OVERRIDES */
        .a11y-large-text { font-size: 110% !important; line-height: 1.7 !important; }
        .a11y-large-text h2, .a11y-large-text h3, .a11y-large-text h4 { font-size: 130% !important; }
        .a11y-large-text p, .a11y-large-text span { font-size: 105% !important; }
        
        .a11y-high-contrast { filter: contrast(135%) saturate(125%) !important; }
        
        .a11y-reduce-motion * { 
           animation: none !important; 
           transition: none !important; 
           transform: none !important; 
        }
        
        .a11y-dyslexic * { 
           font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important; 
           letter-spacing: 0.05em !important; 
           word-spacing: 0.1em !important; 
        }
      `}</style>

      {/* --- A11Y MODAL OVERLAY --- */}
      {isA11yOpen && (
         <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className={`w-full max-w-md p-8 rounded-3xl ${currentTheme.card} ${currentTheme.border} border shadow-2xl relative`}>
               <button onClick={() => setIsA11yOpen(false)} className={`absolute top-6 right-6 ${currentTheme.textSecondary} hover:${currentTheme.textPrimary} transition-colors`}>
                  <X size={24} />
               </button>
               
               <div className="flex items-center gap-3 mb-2">
                  <Accessibility className={currentTheme.accentText} size={28} />
                  <h2 className="text-2xl font-black uppercase tracking-widest">Accessibility</h2>
               </div>
               <p className={`text-sm mb-8 ${currentTheme.textSecondary}`}>Customize your visual experience.</p>
               
               <div className="space-y-4">
                  {/* Toggle 1: Large Text */}
                  <button onClick={() => setA11y({...a11y, largeText: !a11y.largeText})} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${a11y.largeText ? `${currentTheme.accentBorder} ${currentTheme.accentBgSoft}` : `${currentTheme.border} hover:bg-black/5 dark:hover:bg-white/5`}`}>
                     <div className="flex items-center gap-4">
                        <Type size={20} className={a11y.largeText ? currentTheme.accentText : currentTheme.textSecondary} />
                        <div className="text-left">
                           <p className="font-bold text-sm uppercase tracking-widest">Visually Impaired</p>
                           <p className={`text-xs ${currentTheme.textSecondary}`}>Increase text scaling and spacing</p>
                        </div>
                     </div>
                     <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${a11y.largeText ? currentTheme.accentBg : 'bg-stone-300 dark:bg-stone-700'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${a11y.largeText ? 'translate-x-6' : 'translate-x-0'}`} />
                     </div>
                  </button>

                  {/* Toggle 2: High Contrast */}
                  <button onClick={() => setA11y({...a11y, highContrast: !a11y.highContrast})} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${a11y.highContrast ? `${currentTheme.accentBorder} ${currentTheme.accentBgSoft}` : `${currentTheme.border} hover:bg-black/5 dark:hover:bg-white/5`}`}>
                     <div className="flex items-center gap-4">
                        <Eye size={20} className={a11y.highContrast ? currentTheme.accentText : currentTheme.textSecondary} />
                        <div className="text-left">
                           <p className="font-bold text-sm uppercase tracking-widest">Color Blindness</p>
                           <p className={`text-xs ${currentTheme.textSecondary}`}>Enhance visual contrast globally</p>
                        </div>
                     </div>
                     <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${a11y.highContrast ? currentTheme.accentBg : 'bg-stone-300 dark:bg-stone-700'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${a11y.highContrast ? 'translate-x-6' : 'translate-x-0'}`} />
                     </div>
                  </button>

                  {/* Toggle 3: Reduce Motion */}
                  <button onClick={() => setA11y({...a11y, reduceMotion: !a11y.reduceMotion})} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${a11y.reduceMotion ? `${currentTheme.accentBorder} ${currentTheme.accentBgSoft}` : `${currentTheme.border} hover:bg-black/5 dark:hover:bg-white/5`}`}>
                     <div className="flex items-center gap-4">
                        <ZapOff size={20} className={a11y.reduceMotion ? currentTheme.accentText : currentTheme.textSecondary} />
                        <div className="text-left">
                           <p className="font-bold text-sm uppercase tracking-widest">Seizure Safe</p>
                           <p className={`text-xs ${currentTheme.textSecondary}`}>Disable UI animations and flashes</p>
                        </div>
                     </div>
                     <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${a11y.reduceMotion ? currentTheme.accentBg : 'bg-stone-300 dark:bg-stone-700'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${a11y.reduceMotion ? 'translate-x-6' : 'translate-x-0'}`} />
                     </div>
                  </button>

                  {/* Toggle 4: Dyslexia Friendly */}
                  <button onClick={() => setA11y({...a11y, dyslexic: !a11y.dyslexic})} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${a11y.dyslexic ? `${currentTheme.accentBorder} ${currentTheme.accentBgSoft}` : `${currentTheme.border} hover:bg-black/5 dark:hover:bg-white/5`}`}>
                     <div className="flex items-center gap-4">
                        <ScanFace size={20} className={a11y.dyslexic ? currentTheme.accentText : currentTheme.textSecondary} />
                        <div className="text-left">
                           <p className="font-bold text-sm uppercase tracking-widest">Cognitive / Dyslexia</p>
                           <p className={`text-xs ${currentTheme.textSecondary}`}>Enhance legibility and spacing</p>
                        </div>
                     </div>
                     <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${a11y.dyslexic ? currentTheme.accentBg : 'bg-stone-300 dark:bg-stone-700'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${a11y.dyslexic ? 'translate-x-6' : 'translate-x-0'}`} />
                     </div>
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* --- ARK IT GLOBAL SERVER OVERLAY (TERMINAL VERSION) --- */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 flex flex-col items-center justify-center overflow-hidden ${isArkMode ? 'opacity-100 backdrop-blur-md bg-slate-900/95 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.4) 2px, transparent 2px), linear-gradient(90deg, rgba(34, 211, 238, 0.4) 2px, transparent 2px)', backgroundSize: '50px 50px', transform: 'perspective(600px) rotateX(60deg) translateY(-100px) translateZ(-200px)', transformOrigin: 'top center' }} />
        
        <div className="absolute inset-0 flex justify-between px-10 opacity-30 pointer-events-none">
            <div className="w-8 h-full flex flex-col gap-4 py-20">{Array.from({length: 15}).map((_, i) => <div key={`l-${i}`} className="w-full h-4 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
            <div className="w-8 h-full flex flex-col gap-4 py-20">{Array.from({length: 15}).map((_, i) => <div key={`r-${i}`} className="w-full h-4 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse" style={{ animationDelay: `${(15-i) * 0.15}s` }} />)}</div>
        </div>

        <Database className="absolute text-cyan-500 opacity-5 w-[80vw] h-[80vw] animate-pulse pointer-events-none" style={{ animationDuration: '3s' }} />
        
        <div className={`relative z-50 text-cyan-400 font-mono text-center transition-all duration-700 delay-100 flex flex-col items-center ${isArkMode ? 'translate-y-0 scale-100' : 'translate-y-10 scale-90'}`}>
           <p className="text-xl md:text-3xl font-black tracking-[0.5em] mb-2 drop-shadow-[0_0_10px_#22d3ee]">ARK:IT INFRASTRUCTURE</p>
           <p className="text-xs md:text-sm uppercase tracking-widest opacity-70 mb-12">Mainframe Override... Systems Optimal</p>
           
           <a 
              href="https://www.c4computerconsulting.com" 
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
              > Abort_Override
           </button>
        </div>
      </div>

      <button onClick={handleCall} className={`md:hidden fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full ${currentTheme.accentBg} text-white flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 transition-all`}>
        <Phone size={24} className={isDarkMode ? "text-white" : "text-white"} />
      </button>

      {/* --- NEW CLINIC EXTERIOR BACKGROUND --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <img 
            src="/laflairfrontapproach.jpg" 
            alt="Clinic Exterior" 
            className={`w-full h-full object-cover transition-opacity duration-1000 ${isDarkMode ? 'opacity-20' : 'opacity-10'}`} 
            onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-${isDarkMode ? 'black/60' : 'white/80'} to-${isDarkMode ? 'black' : 'white'} pointer-events-none`} />
      </div>

      <div className={`fixed top-0 left-0 right-0 z-50 py-3 px-4 md:px-8 ${currentTheme.glass}`}>
        <div className="w-full mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-8">
          
          <div className="flex items-center justify-between w-full xl:w-auto xl:justify-start gap-4 xl:gap-8">
            <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => changeView('anatomy')}>
              
              <div className={`w-10 h-10 rounded-xl ${currentTheme.accentBg} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform p-1`}>
                <img src="/emblem.jpg" alt="Clinic Logo" className="w-full h-full object-contain rounded-lg" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase tracking-tighter leading-none">Dr. Chris LaFlair <span className="opacity-50 hidden sm:inline">DDS P.C.</span></span>
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-1 ${currentTheme.accentText}`}>Preventative & Restorative</span>
              </div>

            </div>

            {/* --- HEADER CONTROLS (VITALITY, THEME, AND NEW A11Y TOGGLE) --- */}
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex items-center gap-3 w-32 border-l border-stone-500/20 pl-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1"><span className="text-[8px] font-black uppercase tracking-widest opacity-50">Vitality</span><span className="text-[8px] font-bold">{healthScore}%</span></div>
                  <div className="h-1 w-full bg-stone-500/20 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 bg-gradient-to-r ${healthScore > 50 ? currentTheme.healthBar : 'from-red-600 to-red-400'}`} style={{ width: `${healthScore}%` }} />
                  </div>
                </div>
              </div>

             <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 ${
                  isDarkMode 
                    ? 'border-cyan-500/50 bg-slate-800 text-cyan-400 hover:bg-slate-700 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                    : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50 hover:shadow-[0_0_15px_rgba(0,0,0,0.1)]'
                }`}
              >
                {isDarkMode ? <Sun size={14} className="animate-spin-slow" /> : <Moon size={14} />}
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                  {isDarkMode ? 'DARK [LAB]' : 'LIGHT [APPLE]'}
                </span>
             </button>

             {/* --- NEW ACCESSIBILITY BUTTON --- */}
             <button 
                onClick={() => setIsA11yOpen(true)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 ${
                  isDarkMode 
                    ? 'border-cyan-500/50 bg-slate-900 text-cyan-400 hover:bg-cyan-900/40 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                    : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:shadow-[0_0_15px_rgba(79,70,229,0.2)]'
                }`}
              >
                <Accessibility size={14} className={a11y.highContrast || a11y.largeText || a11y.reduceMotion || a11y.dyslexic ? 'animate-pulse' : ''} />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                  Accessibility
                </span>
             </button>
            </div>
          </div>

          <div className="flex gap-4 md:gap-8 overflow-x-auto pb-2 xl:pb-0 no-scrollbar w-full xl:w-auto xl:justify-center">
            {NAV_ITEMS.map(nav => (
              <button key={nav.id} onClick={() => changeView(nav.id)} className={`text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${view === nav.id ? `${currentTheme.accentText} border-b-2 ${currentTheme.accentBorder} pb-1` : 'opacity-40 hover:opacity-100 transition-opacity'}`}>{nav.label}</button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <button onClick={handleBook} className={`px-6 py-2 rounded-full ${currentTheme.accentBg} text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform`}>Request Consultation</button>
          </div>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center z-10 p-6 md:p-12 mt-28 md:mt-24 xl:mt-0">
        
      {view === 'anatomy' && (
          <div className="w-full max-w-lg aspect-square relative animate-in zoom-in duration-1000 flex flex-col items-center">
            
            <div className={`absolute top-0 right-0 z-20 flex items-center gap-3 p-2 pr-4 rounded-full ${currentTheme.glass} border ${currentTheme.border} cursor-pointer hover:scale-105 transition-all`} onClick={() => { setIsXrayMode(!isXrayMode); if(chipStatus==='broken') executeRepair(); }}>
               <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isXrayMode ? currentTheme.accentBg : 'bg-stone-500/20'} ${isXrayMode ? 'text-white' : ''}`}>
                 <Search size={14} />
               </div>
               <span className={`text-[10px] font-black uppercase tracking-widest ${isXrayMode ? currentTheme.accentText : 'opacity-50'}`}>X-Ray Mode</span>
            </div>
            
            <div className={`absolute top-4 left-4 md:top-8 md:left-8 z-20 max-w-[220px] p-3 rounded-2xl ${currentTheme.glass} border ${currentTheme.border} shadow-lg transition-all duration-500 pointer-events-none`}>
               <div className="flex items-start gap-2">
                  <div className={`mt-0.5 w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-cyan-400' : 'bg-blue-500'}`} />
                  <p className={`text-xs font-bold leading-relaxed ${currentTheme.textSecondary}`} key={hintIndex} style={{ animation: 'fade-in 0.5s ease-in-out' }}>
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
                {isXrayMode ? 'Advanced Sub-surface Imaging Active' : (chipStatus !== 'broken' ? (plaqueLevel > 0 ? 'Click and Drag Enamel to Scrub Plaque' : 'Enamel Clean. Tap Fragment to Break') : 'Drag fragment to restore structural integrity')}
             </div>
          </div>
        )}

      {/* --- NEW DEDICATED TEAM PAGE --- */}
      {view === 'team' && (
         <div className="w-full max-w-5xl animate-in slide-in-from-bottom duration-700 pb-12 pt-8 z-10">
            <div className="mb-10 text-center md:text-left pl-2">
               <h2 className="text-3xl font-black uppercase tracking-widest mb-2">Clinical Team</h2>
               <p className={`text-sm ${currentTheme.textSecondary}`}>Meet the dedicated professionals of our Ogdensburg practice.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {STAFF_CARDS.map((s, i) => (
                  <div key={i} className={`flex flex-col overflow-hidden rounded-3xl border ${currentTheme.border} ${currentTheme.glass} shadow-xl group hover:-translate-y-2 transition-transform duration-500`}>
                     <div className="h-64 w-full overflow-hidden bg-stone-800">
                         <img 
                           src={s.image} 
                           alt={s.name} 
                           className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" 
                           onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + s.name.replace(/ /g, '+') + '&background=random'; }} 
                         />
                     </div>
                     <div className="p-6">
                        <p className={`text-[10px] font-black ${currentTheme.accentText} uppercase mb-1 tracking-widest`}>{s.role}</p>
                        <h4 className="text-xl font-bold leading-tight mb-3">{s.name}</h4>
                        <p className={`text-sm ${currentTheme.textSecondary} leading-relaxed`}>{s.bio}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* --- UPDATED OUTCOMES PAGE (STATIC IMAGE) --- */}
      {view === 'outcomes' && (
          <div className="w-full max-w-4xl animate-in slide-in-from-bottom duration-700 pb-12 pt-8 z-10">
             <div className="mb-10 text-center md:text-left pl-2">
                <h2 className="text-3xl font-black uppercase tracking-widest mb-2">Patient Outcomes</h2>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Real stories and clinical results from our Ogdensburg community.</p>
             </div>

             {/* Replaced SVG Slider with custom uploaded image */}
             <div className={`relative w-full rounded-3xl overflow-hidden mb-12 shadow-2xl border ${currentTheme.border} ${currentTheme.glass}`}>
                <img 
                   src="/avoidthishavethat.jpg" 
                   alt="Clinical Outcomes" 
                   className="w-full h-auto object-cover" 
                   onError={(e) => { e.target.style.display = 'none'; }}
                />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TESTIMONIALS.map((t, i) => (
                   <div key={i} className={`p-6 rounded-3xl ${currentTheme.glass} border ${currentTheme.border} hover:-translate-y-1 transition-transform duration-300`}>
                      <MessageCircle className={`w-8 h-8 opacity-10 mb-4 ${currentTheme.accentText}`} />
                      <p className={`text-sm italic mb-6 ${currentTheme.textSecondary} leading-relaxed`}>"{t.text}"</p>
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
           <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in duration-700 z-10">
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
           <div className="w-full max-w-4xl flex flex-col animate-in zoom-in duration-700 pb-12 pt-8 z-10">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <div className={`p-8 rounded-3xl ${currentTheme.glass} ${currentTheme.border} border flex flex-col justify-between h-full shadow-lg`}>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-widest mb-8">Patient Services</h3>
                    <div className="space-y-6">
                      <a href={`http://maps.google.com/?q=${encodeURIComponent(PRACTICE_INFO.address)}`} target="_blank" rel="noopener noreferrer" className={`group flex items-start gap-4 cursor-pointer hover:bg-${isDarkMode ? 'white/5' : 'black/5'} p-4 -ml-4 rounded-2xl transition-all`}>
                        <div className={`w-12 h-12 rounded-2xl ${currentTheme.accentBgSoft} ${currentTheme.accentText} flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:${currentTheme.accentBg} group-hover:text-white transition-all shadow-sm`}><MapPin size={20}/></div>
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 group-hover:${currentTheme.accentText} transition-colors`}>Clinical Location</p>
                          <p className="font-bold text-sm">1107 Linden St.</p>
                          <p className={`text-sm ${currentTheme.textSecondary}`}>Ogdensburg, NY 13669</p>
                        </div>
                      </a>
                      <a href={`tel:${PRACTICE_INFO.phone.replace(/-/g, '')}`} className={`group flex items-start gap-4 cursor-pointer hover:bg-${isDarkMode ? 'white/5' : 'black/5'} p-4 -ml-4 rounded-2xl transition-all`}>
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

              {/* --- ARK IT DEVELOPER CREDIT WITH SERVER OVERLAY TRIGGER --- */}
              <div className="mt-12 flex justify-center w-full animate-in fade-in duration-1000 delay-500">
                 <button 
                    onClick={(e) => { e.preventDefault(); setIsArkMode(true); }}
                    className={`group relative overflow-hidden px-8 py-3 rounded-full border ${currentTheme.border} ${currentTheme.glass} opacity-40 hover:opacity-100 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:border-cyan-400 hover:-translate-y-1 cursor-pointer z-50`}
                 >
                    <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                    <div className="relative flex items-center gap-3">
                       <Activity size={16} className={`${currentTheme.textSecondary} group-hover:text-cyan-400 transition-colors duration-300`} />
                       <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${currentTheme.textSecondary} group-hover:text-cyan-50 transition-colors duration-300`}>
                         Developed & Maintained by <span className="text-cyan-400">ArkIT Technologies</span>
                       </span>
                    </div>
                 </button>
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
                 <div className="flex items-center gap-2 mb-6 opacity-30 font-black text-[10px] uppercase tracking-widest"><Users size={14}/> Clinical Experts</div>
                 <div className={`p-8 rounded-3xl border ${currentTheme.border} ${currentTheme.glass} text-center shadow-lg`}>
                    <Users size={32} className={`mx-auto mb-4 ${currentTheme.accentText} opacity-50`} />
                    <h4 className="text-xl font-bold mb-2">Meet Our Team</h4>
                    <p className={`text-sm ${currentTheme.textSecondary} mb-8`}>Get to know the dedicated professionals behind your preventative and restorative care.</p>
                    <button 
                       onClick={() => changeView('team')} 
                       className={`px-8 py-3 rounded-full ${currentTheme.accentBgSoft} ${currentTheme.accentText} font-black text-xs uppercase tracking-widest hover:${currentTheme.accentBg} hover:text-white transition-all shadow-md`}
                    >
                       View Profiles
                    </button>
                 </div>
             </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;