import { useEffect, useRef, useState } from 'react';
import { SkyMap } from './components/SkyMap';
import { Star } from './constants/stars';
import { Coordinates } from './lib/astronomy';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star as StarIcon, Navigation, Info, Compass } from 'lucide-react';

export default function App() {
  const [location, setLocation] = useState<Coordinates>({ lat: 40.7128, lon: -74.006 }); // Default NYC
  const [orientation, setOrientation] = useState<{ alpha: number; beta: number; gamma: number } | null>(null);
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const lastOrientationMs = useRef(0);

  useEffect(() => {
    // Get geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setIsLocating(false);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }

    // Get device orientation
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha === null || e.beta === null || e.gamma === null) return;
      const now = Date.now();
      if (now - lastOrientationMs.current < 200) return;
      lastOrientationMs.current = now;
      setOrientation({ alpha: e.alpha, beta: e.beta, gamma: e.gamma });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-orange-500/30">
      {/* Background Atmosphere - Nebula Style */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] bg-purple-900/20 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -right-1/4 w-[80%] h-[80%] bg-blue-900/20 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-pink-900/10 blur-[150px] rounded-full" 
        />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex flex-col items-center">
        <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <StarIcon className="text-purple-400" size={24} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white via-purple-200 to-zinc-500 bg-clip-text text-transparent">
              Nebulosa
            </h1>
          </motion.div>
          <p className="text-zinc-400 max-w-md mx-auto text-sm leading-relaxed">
            Explore o céu noturno em tempo real. Alinhe seu dispositivo com as estrelas para identificar constelações e corpos celestes.
          </p>
        </header>

        <div className="w-full flex flex-col lg:flex-row gap-12 items-start justify-center">
          {/* Left Side: Sky Map */}
          <section className="flex-1 w-full flex justify-center">
            <SkyMap 
              location={location} 
              orientation={orientation} 
              onStarClick={setSelectedStar} 
            />
          </section>

          {/* Right Side: Info & Details */}
          <aside className="w-full lg:w-80 flex flex-col gap-6">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                <Compass size={14} />
                Orientação
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-zinc-400">Azimute (Yaw)</span>
                  <span className="text-lg font-mono text-white">
                    {orientation ? Math.round(orientation.alpha) : '--'}°
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm text-zinc-400">Inclinação (Pitch)</span>
                  <span className="text-lg font-mono text-white">
                    {orientation ? Math.round(orientation.beta) : '--'}°
                  </span>
                </div>
                <p className="text-[10px] text-zinc-600 leading-tight">
                  {orientation 
                    ? "Bússola ativa. Gire seu dispositivo para alinhar com o mapa do céu." 
                    : "Orientação do dispositivo não disponível. Use o toque para explorar."}
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {selectedStar ? (
                <motion.div
                  key={selectedStar.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-zinc-900/40 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                  
                  <button 
                    onClick={() => setSelectedStar(null)}
                    className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={16} className="text-zinc-500" />
                  </button>

                  <h3 className="text-2xl font-bold text-white mb-1">{selectedStar.name}</h3>
                  <p className="text-orange-500 text-xs font-medium uppercase tracking-wider mb-6">
                    {selectedStar.constellation}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold">Magnitude</span>
                      <p className="text-sm text-zinc-200">{selectedStar.mag}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold">Distância</span>
                      <p className="text-sm text-zinc-200">{selectedStar.dist} ly</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold">AR</span>
                      <p className="text-sm text-zinc-200 font-mono">{selectedStar.ra}h</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold">Decl.</span>
                      <p className="text-sm text-zinc-200 font-mono">{selectedStar.dec}°</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="flex items-start gap-3">
                      <Info size={16} className="text-zinc-500 mt-0.5" />
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {selectedStar.name} é uma das estrelas mais proeminentes na constelação de {selectedStar.constellation}. 
                        É visível a olho nu na maioria dos locais da Terra.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center"
                >
                  <Navigation size={32} className="text-zinc-700 mb-4 animate-pulse" />
                  <p className="text-sm text-zinc-500">
                    Selecione uma estrela no mapa para ver dados astronômicos detalhados.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto py-8 text-center border-t border-white/5">
        <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
          Dados originados do Catálogo de Estrelas Brilhantes de Yale • Cálculos em tempo real
        </p>
      </footer>
    </div>
  );
}

