import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SKY_STARS, Star } from '../constants/stars';
import { Coordinates } from '../lib/astronomy';
import { getStarHorizontalEngine } from '../lib/starHorizon';
import { computeSolarPositions, SolarBodyPosition } from '../lib/ephemeris';
import type { SkySelection } from '../types/sky';
import {
  CONSTELLATION_EDGES,
  CONSTELLATION_DISPLAY_NAMES,
  NAMED_ASTERISMS,
} from '../constants/constellationFigures';
import { resolveFocusPosition } from '../lib/skySearch';
import { MapPin, Compass as CompassIcon, Clock, ZoomIn, ZoomOut, Move } from 'lucide-react';

const W = 800;
const H = 800;
const MAP_R = Math.min(W, H) / 2 - 40;

export type StarNameMode = 'off' | 'bright' | 'all';

interface SkyMapProps {
  location: Coordinates;
  orientation: { alpha: number; beta: number; gamma: number } | null;
  onSelect: (sel: SkySelection) => void;
  mapTime: Date;
  showConstellations: boolean;
  showGrid: boolean;
  starNameMode: StarNameMode;
  focusTargetId: string | null;
}

type StarDraw = Star & { alt: number; az: number; x: number; y: number; r: number };
type BodyDraw = SolarBodyPosition & { x: number; y: number; r: number };

function project(alt: number, az: number): { x: number; y: number } | null {
  if (alt < 0) return null;
  const r = MAP_R * (1 - alt / 90);
  const theta = (az * Math.PI) / 180;
  return { x: r * Math.sin(theta), y: -r * Math.cos(theta) };
}

function starRadius(mag: number): number {
  return Math.max(0.7, Math.min(6, 4.2 - mag * 0.45));
}

function bodyRadius(mag: number): number {
  return Math.max(4, Math.min(14, 8 + mag * -0.6));
}

function showStarLabel(mode: StarNameMode, mag: number): boolean {
  if (mode === 'off') return false;
  if (mode === 'all') return true;
  return mag < 2;
}

export const SkyMap: React.FC<SkyMapProps> = ({
  location,
  orientation,
  onSelect,
  mapTime,
  showConstellations,
  showGrid,
  starNameMode,
  focusTargetId,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [clockNow, setClockNow] = useState(() => new Date());
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoomZ, setZoomZ] = useState(1);
  const dragRef = useRef<{ active: boolean; lx: number; ly: number }>({ active: false, lx: 0, ly: 0 });
  const prevFocusRef = useRef<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const starDraw = useMemo((): StarDraw[] => {
    const out: StarDraw[] = [];
    for (const star of SKY_STARS) {
      const { alt, az } = getStarHorizontalEngine(star.ra, star.dec, location, mapTime);
      const p = project(alt, az);
      if (!p) continue;
      out.push({
        ...star,
        alt,
        az,
        x: p.x,
        y: p.y,
        r: starRadius(star.mag),
      });
    }
    return out;
  }, [location, mapTime]);

  const bodyDraw = useMemo((): BodyDraw[] => {
    const bodies = computeSolarPositions(location, mapTime);
    const out: BodyDraw[] = [];
    for (const b of bodies) {
      const p = project(b.alt, b.az);
      if (!p) continue;
      out.push({ ...b, x: p.x, y: p.y, r: bodyRadius(b.mag) });
    }
    return out;
  }, [location, mapTime]);

  const starById = useMemo(() => new Map(starDraw.map((s) => [s.id, s])), [starDraw]);

  const lineSegments = useMemo(() => {
    const segs: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
    for (const e of CONSTELLATION_EDGES) {
      const a = starById.get(e.from);
      const b = starById.get(e.to);
      if (!a || !b) continue;
      segs.push({
        key: `${e.from}-${e.to}`,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
      });
    }
    return segs;
  }, [starById]);

  const constellationCentroids = useMemo(() => {
    const m = new Map<string, { x: number; y: number; n: number }>();
    for (const s of starDraw) {
      if (!s.constellation) continue;
      const c = m.get(s.constellation) ?? { x: 0, y: 0, n: 0 };
      c.x += s.x;
      c.y += s.y;
      c.n += 1;
      m.set(s.constellation, c);
    }
    const labels: { key: string; x: number; y: number; text: string }[] = [];
    for (const [cons, v] of m) {
      if (v.n < 2) continue;
      labels.push({
        key: cons,
        x: v.x / v.n,
        y: v.y / v.n,
        text: CONSTELLATION_DISPLAY_NAMES[cons] ?? cons,
      });
    }
    return labels;
  }, [starDraw]);

  const asterismLabels = useMemo(() => {
    const out: { key: string; x: number; y: number; text: string }[] = [];
    for (const ast of NAMED_ASTERISMS) {
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (const sid of ast.starIds) {
        const p = starById.get(sid);
        if (p) {
          sx += p.x;
          sy += p.y;
          n++;
        }
      }
      if (n > 0) {
        out.push({ key: ast.id, x: sx / n, y: sy / n, text: ast.label });
      }
    }
    return out;
  }, [starById]);

  useEffect(() => {
    if (focusTargetId === prevFocusRef.current) return;
    prevFocusRef.current = focusTargetId;
    if (!focusTargetId) return;
    const p = resolveFocusPosition(focusTargetId, starDraw, bodyDraw);
    if (p) {
      setPanX(-p.x * zoomZ);
      setPanY(-p.y * zoomZ);
    }
  }, [focusTargetId, starDraw, bodyDraw, zoomZ]);

  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const svg = d3.select(el);
    if (!svg.select('g.sky-root').empty()) return;

    const defs = svg.append('defs');
    const nebulaGlow = defs
      .append('radialGradient')
      .attr('id', 'nebula-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    nebulaGlow.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(88, 28, 135, 0.15)');
    nebulaGlow.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(0, 0, 0, 0)');

    const root = svg.append('g').attr('class', 'sky-root').attr('transform', `translate(${W / 2},${H / 2})`);
    const rot = root.append('g').attr('class', 'sky-rotate');
    const panzoom = rot.append('g').attr('class', 'sky-panzoom');

    panzoom
      .append('circle')
      .attr('r', MAP_R)
      .attr('fill', '#050505')
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 2);
    panzoom.append('circle').attr('r', MAP_R).attr('fill', 'url(#nebula-gradient)');

    const directions = [
      { label: 'N', angle: 0 },
      { label: 'L', angle: 90 },
      { label: 'S', angle: 180 },
      { label: 'O', angle: 270 },
    ];
    for (const d of directions) {
      const rad = (d.angle * Math.PI) / 180;
      const x = (MAP_R + 20) * Math.sin(rad);
      const y = -(MAP_R + 20) * Math.cos(rad);
      panzoom
        .append('text')
        .attr('class', 'sky-cardinal')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#444')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(d.label);
    }

    panzoom.append('g').attr('class', 'grid-layer');
    panzoom.append('g').attr('class', 'const-lines-layer');
    panzoom.append('g').attr('class', 'const-labels-layer');
    panzoom.append('g').attr('class', 'asterism-layer');
    panzoom.append('g').attr('class', 'stars-layer');
    panzoom.append('g').attr('class', 'bodies-layer');
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const f = e.deltaY > 0 ? 0.92 : 1.08;
      setZoomZ((z) => Math.min(4, Math.max(0.45, z * f)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragRef.current = { active: true, lx: e.clientX, ly: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.lx;
      const dy = e.clientY - dragRef.current.ly;
      dragRef.current.lx = e.clientX;
      dragRef.current.ly = e.clientY;
      setPanX((x) => x + dx);
      setPanY((y) => y + dy);
    };
    const onUp = (e: PointerEvent) => {
      dragRef.current.active = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const rotation = orientation ? -orientation.alpha : 0;
    const svg = d3.select(el);
    const rot = svg.select('g.sky-rotate');
    if (rot.empty()) return;

    const panzoom = rot.select('g.sky-panzoom');
    panzoom.attr('transform', `translate(${panX},${panY}) scale(${zoomZ})`);

    const gridLayer = panzoom.select('g.grid-layer');
    gridLayer.selectAll('*').remove();
    if (showGrid) {
      for (const altDeg of [30, 60]) {
        const rr = MAP_R * (1 - altDeg / 90);
        gridLayer
          .append('circle')
          .attr('r', rr)
          .attr('fill', 'none')
          .attr('stroke', 'rgba(255,255,255,0.07)')
          .attr('stroke-width', 1);
      }
      for (let deg = 0; deg < 360; deg += 30) {
        const rad = (deg * Math.PI) / 180;
        gridLayer
          .append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', MAP_R * Math.sin(rad))
          .attr('y2', -MAP_R * Math.cos(rad))
          .attr('stroke', 'rgba(255,255,255,0.06)')
          .attr('stroke-width', 1);
      }
    }

    const linesLayer = panzoom.select('g.const-lines-layer');
    linesLayer.selectAll('*').remove();
    if (showConstellations) {
      for (const seg of lineSegments) {
        linesLayer
          .append('line')
          .attr('x1', seg.x1)
          .attr('y1', seg.y1)
          .attr('x2', seg.x2)
          .attr('y2', seg.y2)
          .attr('stroke', 'rgba(168, 85, 247, 0.5)')
          .attr('stroke-width', 1.5);
      }
    }

    const clab = panzoom.select('g.const-labels-layer');
    clab.selectAll('*').remove();
    if (showConstellations) {
      for (const lab of constellationCentroids) {
        clab
          .append('text')
          .attr('x', lab.x)
          .attr('y', lab.y)
          .attr('text-anchor', 'middle')
          .attr('fill', 'rgba(196, 181, 253, 0.35)')
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .text(lab.text);
      }
    }

    const alab = panzoom.select('g.asterism-layer');
    alab.selectAll('*').remove();
    if (showConstellations) {
      for (const lab of asterismLabels) {
        alab
          .append('text')
          .attr('x', lab.x)
          .attr('y', lab.y - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', 'rgba(251, 191, 36, 0.85)')
          .attr('font-size', '11px')
          .attr('font-weight', '700')
          .text(lab.text);
      }
    }

    const starLayer = panzoom.select('g.stars-layer');
    const starJoin = starLayer.selectAll<SVGGElement, StarDraw>('g.sky-star').data(starDraw, (d) => d.id);
    starJoin.exit().remove();

    const starEnter = starJoin
      .enter()
      .append('g')
      .attr('class', 'sky-star cursor-pointer')
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    starEnter
      .append('circle')
      .attr('class', 'star-glow')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(34,211,238,0.9)')
      .attr('stroke-width', 2)
      .attr('opacity', 0);
    starEnter
      .append('circle')
      .attr('class', 'star-dot')
      .attr('fill', '#fff')
      .attr('filter', 'drop-shadow(0 0 2px rgba(255,255,255,0.8))');
    starEnter.append('text').attr('class', 'star-label').attr('x', 8).attr('y', 4).attr('font-size', '10px');

    const starMerged = starEnter.merge(starJoin);
    starMerged.attr('transform', (d) => `translate(${d.x},${d.y})`);
    const focused = focusTargetId;
    starMerged.select('.star-glow').each(function (d) {
      const on = focused === d.id;
      d3.select(this).attr('r', d.r + 5).attr('opacity', on ? 1 : 0);
    });
    starMerged.select('.star-dot').attr('r', (d) => d.r);
    starMerged.each(function (d) {
      const g = d3.select(this);
      const vis = showStarLabel(starNameMode, d.mag);
      g.select('.star-label')
        .attr('fill', 'rgba(255,255,255,0.5)')
        .style('display', vis ? 'block' : 'none')
        .text(d.name);
    });
    starMerged.on('click', (_evt, d) => {
      onSelectRef.current({
        kind: 'star',
        star: {
          id: d.id,
          name: d.name,
          ra: d.ra,
          dec: d.dec,
          mag: d.mag,
          dist: d.dist,
          constellation: d.constellation,
        },
      });
    });

    const bodyLayer = panzoom.select('g.bodies-layer');
    const bodyJoin = bodyLayer.selectAll<SVGGElement, BodyDraw>('g.sky-body').data(bodyDraw, (d) => d.id);
    bodyJoin.exit().remove();

    const bodyEnter = bodyJoin
      .enter()
      .append('g')
      .attr('class', 'sky-body cursor-pointer')
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    bodyEnter
      .append('circle')
      .attr('class', 'body-ring')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(34,211,238,0.9)')
      .attr('stroke-width', 2)
      .attr('opacity', 0);
    bodyEnter
      .append('circle')
      .attr('class', 'body-disc')
      .attr('stroke', 'rgba(255,255,255,0.35)')
      .attr('stroke-width', 1.2);
    bodyEnter
      .append('text')
      .attr('class', 'body-label')
      .attr('x', 12)
      .attr('y', 4)
      .attr('fill', 'rgba(255,255,255,0.7)')
      .attr('font-size', '11px')
      .attr('font-weight', '600');

    const bodyMerged = bodyEnter.merge(bodyJoin);
    bodyMerged.attr('transform', (d) => `translate(${d.x},${d.y})`);
    bodyMerged.select('.body-ring').each(function (d) {
      const on = focused === d.id;
      d3.select(this).attr('r', d.r + 6).attr('opacity', on ? 1 : 0);
    });
    bodyMerged.select('.body-disc').attr('r', (d) => d.r).attr('fill', (d) => d.color);
    bodyMerged.select('.body-label').text((d) => d.name);
    bodyMerged.on('click', (_evt, d) => {
      const { x, y, r, ...solar } = d;
      onSelectRef.current({ kind: 'solar', solar });
    });

    rot.attr('transform', `rotate(${rotation})`);
  }, [
    starDraw,
    bodyDraw,
    orientation,
    showConstellations,
    showGrid,
    starNameMode,
    lineSegments,
    constellationCentroids,
    asterismLabels,
    panX,
    panY,
    zoomZ,
    focusTargetId,
  ]);

  const latLabel = `${Math.abs(location.lat).toFixed(2)}°${location.lat >= 0 ? 'N' : 'S'}`;
  const lonLabel = `${Math.abs(location.lon).toFixed(2)}°${location.lon >= 0 ? 'L' : 'O'}`;

  const mapTimeStr = mapTime.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="relative w-full max-w-[800px] mx-auto">
      <div className="relative w-full aspect-square bg-black rounded-full overflow-hidden border border-zinc-800 shadow-2xl touch-none">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-full cursor-grab active:cursor-grabbing" />

        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-zinc-400">
            <MapPin size={14} className="text-orange-500 shrink-0" />
            <span>
              {latLabel}, {lonLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-zinc-400">
            <Clock size={14} className="text-blue-500 shrink-0" />
            <span className="tabular-nums">{clockNow.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2 bg-violet-950/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-violet-500/20 text-[10px] text-violet-200/90 max-w-[220px]">
            <span className="leading-tight">Mapa: {mapTimeStr}</span>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end pointer-events-none">
          <div className="flex gap-1 pointer-events-auto">
            <button
              type="button"
              onClick={() => setZoomZ((z) => Math.min(4, z * 1.15))}
              className="bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 text-zinc-300 hover:bg-white/10"
              aria-label="Aproximar"
            >
              <ZoomIn size={18} />
            </button>
            <button
              type="button"
              onClick={() => setZoomZ((z) => Math.max(0.45, z / 1.15))}
              className="bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 text-zinc-300 hover:bg-white/10"
              aria-label="Afastar"
            >
              <ZoomOut size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                setPanX(0);
                setPanY(0);
                setZoomZ(1);
              }}
              className="bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 text-zinc-300 hover:bg-white/10"
              aria-label="Recentrar"
            >
              <Move size={18} />
            </button>
          </div>
          <div className="bg-black/60 backdrop-blur-md p-2.5 rounded-full border border-white/10 text-zinc-400">
            <CompassIcon
              size={20}
              className={cn('transition-transform duration-500', orientation ? 'text-green-500' : 'text-zinc-600')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
