import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SKY_STARS, Star } from '../constants/stars';
import { getHorizontalCoords, Coordinates } from '../lib/astronomy';
import { computeSolarPositions, SolarBodyPosition } from '../lib/ephemeris';
import type { SkySelection } from '../types/sky';
import { MapPin, Compass as CompassIcon, Clock } from 'lucide-react';

const W = 800;
const H = 800;
const MAP_R = Math.min(W, H) / 2 - 40;

interface SkyMapProps {
  location: Coordinates;
  orientation: { alpha: number; beta: number; gamma: number } | null;
  onSelect: (sel: SkySelection) => void;
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

export const SkyMap: React.FC<SkyMapProps> = ({ location, orientation, onSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [clockNow, setClockNow] = useState(() => new Date());
  const [astroTime, setAstroTime] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    setAstroTime(new Date());
    const tick = setInterval(() => setAstroTime(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const starDraw = useMemo((): StarDraw[] => {
    const out: StarDraw[] = [];
    for (const star of SKY_STARS) {
      const { alt, az } = getHorizontalCoords(star, location, astroTime);
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
  }, [location, astroTime]);

  const bodyDraw = useMemo((): BodyDraw[] => {
    const bodies = computeSolarPositions(location, astroTime);
    const out: BodyDraw[] = [];
    for (const b of bodies) {
      const p = project(b.alt, b.az);
      if (!p) continue;
      out.push({
        ...b,
        x: p.x,
        y: p.y,
        r: bodyRadius(b.mag),
      });
    }
    return out;
  }, [location, astroTime]);

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

    rot.append('circle')
      .attr('r', MAP_R)
      .attr('fill', '#050505')
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 2);
    rot.append('circle').attr('r', MAP_R).attr('fill', 'url(#nebula-gradient)');

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
      rot.append('text')
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

    rot.append('g').attr('class', 'stars-layer');
    rot.append('g').attr('class', 'bodies-layer');
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const rotation = orientation ? -orientation.alpha : 0;
    const svg = d3.select(el);
    const rot = svg.select('g.sky-rotate');
    if (rot.empty()) return;
    rot.attr('transform', `rotate(${rotation})`);

    const starLayer = rot.select('g.stars-layer');
    const starJoin = starLayer.selectAll<SVGGElement, StarDraw>('g.sky-star').data(starDraw, (d) => d.id);
    starJoin.exit().remove();

    const starEnter = starJoin
      .enter()
      .append('g')
      .attr('class', 'sky-star cursor-pointer')
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    starEnter
      .append('circle')
      .attr('fill', '#fff')
      .attr('filter', 'drop-shadow(0 0 2px rgba(255,255,255,0.8))');
    starEnter
      .filter((d) => d.mag < 1.6)
      .append('text')
      .attr('class', 'star-label')
      .attr('x', 6)
      .attr('y', 4)
      .attr('fill', 'rgba(255,255,255,0.45)')
      .attr('font-size', '10px')
      .text((d) => d.name);

    const starMerged = starEnter.merge(starJoin);
    starMerged.attr('transform', (d) => `translate(${d.x},${d.y})`);
    starMerged.select('circle').attr('r', (d) => d.r);
    starMerged.each(function (d) {
      d3.select(this).select('.star-label').text(d.name);
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

    const bodyLayer = rot.select('g.bodies-layer');
    const bodyJoin = bodyLayer.selectAll<SVGGElement, BodyDraw>('g.sky-body').data(bodyDraw, (d) => d.id);
    bodyJoin.exit().remove();

    const bodyEnter = bodyJoin
      .enter()
      .append('g')
      .attr('class', 'sky-body cursor-pointer')
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    bodyEnter
      .append('circle')
      .attr('class', 'body-disc')
      .attr('stroke', 'rgba(255,255,255,0.35)')
      .attr('stroke-width', 1.2);
    bodyEnter
      .append('text')
      .attr('class', 'body-label')
      .attr('x', 10)
      .attr('y', 4)
      .attr('fill', 'rgba(255,255,255,0.65)')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text((d) => d.name);

    const bodyMerged = bodyEnter.merge(bodyJoin);
    bodyMerged.attr('transform', (d) => `translate(${d.x},${d.y})`);
    bodyMerged.select('.body-disc').attr('r', (d) => d.r).attr('fill', (d) => d.color);
    bodyMerged.select('.body-label').text((d) => d.name);
    bodyMerged.on('click', (_evt, d) => {
      const { x, y, r, ...solar } = d;
      onSelectRef.current({ kind: 'solar', solar });
    });
  }, [starDraw, bodyDraw, orientation]);

  const latLabel = `${Math.abs(location.lat).toFixed(2)}°${location.lat >= 0 ? 'N' : 'S'}`;
  const lonLabel = `${Math.abs(location.lon).toFixed(2)}°${location.lon >= 0 ? 'L' : 'O'}`;

  return (
    <div className="relative w-full aspect-square max-w-[800px] mx-auto bg-black rounded-full overflow-hidden border border-zinc-800 shadow-2xl">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-full" />

      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-zinc-400">
          <MapPin size={14} className="text-orange-500" />
          <span>
            {latLabel}, {lonLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-zinc-400">
          <Clock size={14} className="text-blue-500" />
          <span>{clockNow.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="absolute bottom-6 right-6">
        <div className="bg-black/60 backdrop-blur-md p-3 rounded-full border border-white/10 text-zinc-400">
          <CompassIcon
            size={20}
            className={cn('transition-transform duration-500', orientation ? 'text-green-500' : 'text-zinc-600')}
          />
        </div>
      </div>
    </div>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
