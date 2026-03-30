import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SkyMap, type StarNameMode } from './components/SkyMap';
import { Coordinates } from './lib/astronomy';
import { Body } from 'astronomy-engine';
import type { SkySelection } from './types/sky';
import { computeRiseSetTimes } from './lib/ephemeris';
import { buildSearchIndex } from './lib/skySearch';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star as StarIcon, Navigation, Info, Compass, Search } from 'lucide-react';

function toDatetimeLocalValue(d: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function App() {
  const [location, setLocation] = useState<Coordinates>({ lat: 40.7128, lon: -74.006 }); // Default NYC
  const [orientation, setOrientation] = useState<{ alpha: number; beta: number; gamma: number } | null>(null);
  const [selection, setSelection] = useState<SkySelection | null>(null);
  const [mapTime, setMapTime] = useState(() => new Date());
  const [showConstellations, setShowConstellations] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [starNameMode, setStarNameMode] = useState<StarNameMode>('bright');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
  const lastOrientationMs = useRef(0);

  const searchIndex = useMemo(() => buildSearchIndex(), []);
  const searchHits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) return [];
    return searchIndex.filter((e) => e.label.toLowerCase().includes(q)).slice(0, 14);
  }, [searchQuery, searchIndex]);

  const riseSetSolar = useMemo(() => {
    if (selection?.kind !== 'solar') return null;
    return computeRiseSetTimes(selection.solar.body, location, mapTime);
  }, [selection, location, mapTime]);

  const handleSkySelect = useCallback((sel: SkySelection) => {
    setSelection(sel);
    if (sel.kind === 'star') setFocusTargetId(sel.star.id);
    else setFocusTargetId(sel.solar.id);
  }, []);

  useEffect(() => {
    // Get geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => {
          console.error('Geolocation error:', err);
        }
      );
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
          <p className="text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed">
            Mapa alt-az com constelações, asterismos (Três Marias, Cruzeiro do Sul), Lua e planetas. Ajuste data/hora,
            busque um alvo e use pinça ou botões para zoom; arraste para mover o disco.
          </p>
        </header>

        <div className="w-full max-w-3xl mb-8 space-y-4">
          <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                Data e hora do mapa
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="datetime-local"
                  value={toDatetimeLocalValue(mapTime)}
                  onChange={(e) => setMapTime(new Date(e.target.value))}
                  className="flex-1 min-w-[180px] bg-black/40 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-200"
                />
                <button
                  type="button"
                  onClick={() => setMapTime(new Date())}
                  className="text-xs px-3 py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white font-medium"
                >
                  Agora
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1">
                <Search size={12} /> Buscar no céu
              </label>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex.: Júpiter, Órion, Três Marias…"
                className="w-full bg-black/40 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600"
                list="sky-search-datalist"
              />
              <datalist id="sky-search-datalist">
                {searchIndex.slice(0, 80).map((e) => (
                  <option key={e.id} value={e.label} />
                ))}
              </datalist>
              {searchHits.length > 0 ? (
                <ul className="max-h-36 overflow-auto rounded-lg border border-zinc-800 bg-black/50 text-xs">
                  {searchHits.map((e) => (
                    <li key={`${e.kind}-${e.id}`}>
                      <button
                        type="button"
                        className="w-full text-left px-2 py-1.5 hover:bg-white/10 text-zinc-300"
                        onClick={() => {
                          setFocusTargetId(e.id);
                          setSearchQuery('');
                        }}
                      >
                        {e.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-center text-xs text-zinc-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showConstellations}
                onChange={(e) => setShowConstellations(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Constelações e asterismos
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Grade alt/az
            </label>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-500">Nomes:</span>
            {(['off', 'bright', 'all'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setStarNameMode(m)}
                className={`px-2 py-0.5 rounded-md capitalize ${
                  starNameMode === m ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {m === 'off' ? 'off' : m === 'bright' ? 'brilhantes' : 'todas'}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-12 items-start justify-center">
          {/* Left Side: Sky Map */}
          <section className="flex-1 w-full flex justify-center">
            <SkyMap
              location={location}
              orientation={orientation}
              onSelect={handleSkySelect}
              mapTime={mapTime}
              showConstellations={showConstellations}
              showGrid={showGrid}
              starNameMode={starNameMode}
              focusTargetId={focusTargetId}
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
              {selection?.kind === 'star' ? (
                <motion.div
                  key={`star-${selection.star.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-zinc-900/40 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16" />

                  <button
                    type="button"
                    onClick={() => setSelection(null)}
                    className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={16} className="text-zinc-500" />
                  </button>

                  <h3 className="text-2xl font-bold text-white mb-1">{selection.star.name}</h3>
                  <p className="text-orange-500 text-xs font-medium uppercase tracking-wider mb-6">
                    {selection.star.constellation ?? 'Estrela'}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold">Magnitude</span>
                      <p className="text-sm text-zinc-200">{selection.star.mag}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold">Distância</span>
                      <p className="text-sm text-zinc-200">
                        {selection.star.dist != null ? `${selection.star.dist} al` : '—'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold">AR</span>
                      <p className="text-sm text-zinc-200 font-mono">{selection.star.ra}h</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold">Decl.</span>
                      <p className="text-sm text-zinc-200 font-mono">{selection.star.dec}°</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="flex items-start gap-3">
                      <Info size={16} className="text-zinc-500 mt-0.5" />
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {selection.star.name} na constelação de {selection.star.constellation ?? '—'}. Coordenadas
                        aproximadas J2000; visibilidade depende do horário e da latitude.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : selection?.kind === 'solar' ? (
                <motion.div
                  key={`solar-${selection.solar.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-zinc-900/40 backdrop-blur-xl border border-cyan-500/25 rounded-3xl p-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full -mr-16 -mt-16" />

                  <button
                    type="button"
                    onClick={() => setSelection(null)}
                    className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={16} className="text-zinc-500" />
                  </button>

                  <h3 className="text-2xl font-bold text-white mb-1">{selection.solar.name}</h3>
                  <p className="text-cyan-400 text-xs font-medium uppercase tracking-wider mb-6">
                    Sistema solar
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold">Magnitude</span>
                      <p className="text-sm text-zinc-200">{selection.solar.mag.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold">Distância</span>
                      <p className="text-sm text-zinc-200">{selection.solar.geoDistAu.toFixed(3)} UA</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold">Altura</span>
                      <p className="text-sm text-zinc-200 font-mono">{selection.solar.alt.toFixed(1)}°</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-zinc-500 font-semibold">Azimute</span>
                      <p className="text-sm text-zinc-200 font-mono">{selection.solar.az.toFixed(1)}°</p>
                    </div>
                    {selection.solar.body === Body.Moon && selection.solar.phaseFraction != null ? (
                      <div className="space-y-1 col-span-2">
                        <span className="text-[10px] uppercase text-zinc-500 font-semibold">Fase</span>
                        <p className="text-sm text-zinc-200">
                          {(selection.solar.phaseFraction * 100).toFixed(0)}% iluminada (0 = nova, 100 = cheia)
                        </p>
                      </div>
                    ) : null}
                    {selection.solar.ringTilt != null ? (
                      <div className="space-y-1 col-span-2">
                        <span className="text-[10px] uppercase text-zinc-500 font-semibold">Anéis (Saturno)</span>
                        <p className="text-sm text-zinc-200">{selection.solar.ringTilt.toFixed(1)}°</p>
                      </div>
                    ) : null}
                    {riseSetSolar ? (
                      <>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase text-zinc-500 font-semibold">Próximo nascer</span>
                          <p className="text-sm text-zinc-200">
                            {riseSetSolar.rise
                              ? riseSetSolar.rise.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                              : '—'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase text-zinc-500 font-semibold">Próximo pôr</span>
                          <p className="text-sm text-zinc-200">
                            {riseSetSolar.set
                              ? riseSetSolar.set.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                              : '—'}
                          </p>
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="flex items-start gap-3">
                      <Info size={16} className="text-zinc-500 mt-0.5" />
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Posição e nascer/pôr calculados com Astronomy Engine para o local e a data/hora do mapa.
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
                    Toque em uma estrela, planeta ou na Lua para ver detalhes astronômicos.
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
          Estrelas J2000 → alt/az via Astronomy Engine • Efemérides: Astronomy Engine
        </p>
      </footer>
    </div>
  );
}

