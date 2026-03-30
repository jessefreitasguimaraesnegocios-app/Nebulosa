import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BRIGHT_STARS, Star } from '../constants/stars';
import { getHorizontalCoords, Coordinates } from '../lib/astronomy';
import { motion, AnimatePresence } from 'motion/react';
import { Info, MapPin, Compass as CompassIcon, Clock } from 'lucide-react';

interface SkyMapProps {
  location: Coordinates;
  orientation: { alpha: number; beta: number; gamma: number } | null;
  onStarClick: (star: Star) => void;
}

export const SkyMap: React.FC<SkyMapProps> = ({ location, orientation, onStarClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [stars, setStars] = useState<(Star & { alt: number; az: number })[]>([]);
  /** Used only for the clock label — does not trigger map redraw */
  const [clockNow, setClockNow] = useState(() => new Date());
  /** Star positions change slowly; updating this every second was redrawing the whole SVG */
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

  useEffect(() => {
    const updatedStars = BRIGHT_STARS.map((star) => {
      const coords = getHorizontalCoords(star, location, astroTime);
      return { ...star, ...coords };
    });
    setStars(updatedStars);
  }, [location, astroTime]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 800;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Draw horizon circle
    g.append('circle')
      .attr('r', radius)
      .attr('fill', '#050505')
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 2);

    // Add nebula-like glow inside the map
    const nebulaGlow = g.append('defs')
      .append('radialGradient')
      .attr('id', 'nebula-gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');

    nebulaGlow.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(88, 28, 135, 0.15)'); // Purple
    nebulaGlow.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(0, 0, 0, 0)');

    g.append('circle')
      .attr('r', radius)
      .attr('fill', 'url(#nebula-gradient)');

    // Draw cardinal directions
    const directions = [
      { label: 'N', angle: 0 },
      { label: 'L', angle: 90 },
      { label: 'S', angle: 180 },
      { label: 'O', angle: 270 },
    ];

    // Apply device rotation if available
    const rotation = orientation ? -orientation.alpha : 0;
    g.attr('transform', `translate(${width / 2}, ${height / 2}) rotate(${rotation})`);

    directions.forEach((d) => {
      const rad = (d.angle * Math.PI) / 180;
      const x = (radius + 20) * Math.sin(rad);
      const y = -(radius + 20) * Math.cos(rad);

      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#444')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(d.label);
    });

    // Draw stars
    stars.forEach((star) => {
      if (star.alt < 0) return; // Below horizon

      // Map Alt/Az to polar coordinates
      // Alt 90 = center, Alt 0 = radius
      const r = radius * (1 - star.alt / 90);
      const theta = (star.az * Math.PI) / 180;
      const x = r * Math.sin(theta);
      const y = -r * Math.cos(theta);

      const starSize = Math.max(1, 4 - star.mag);

      const starGroup = g.append('g')
        .attr('class', 'star-group cursor-pointer')
        .on('click', () => onStarClick(star));

      starGroup.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', starSize)
        .attr('fill', '#fff')
        .attr('filter', 'drop-shadow(0 0 2px rgba(255,255,255,0.8))');

      if (star.mag < 1.5) {
        starGroup.append('text')
          .attr('x', x + 5)
          .attr('y', y + 5)
          .attr('fill', 'rgba(255,255,255,0.4)')
          .attr('font-size', '10px')
          .text(star.name);
      }
    });

  }, [stars, orientation, onStarClick]);

  return (
    <div className="relative w-full aspect-square max-w-[800px] mx-auto bg-black rounded-full overflow-hidden border border-zinc-800 shadow-2xl">
      <svg
        ref={svgRef}
        viewBox="0 0 800 800"
        className="w-full h-full"
      />
      
      {/* Overlay UI */}
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-zinc-400">
          <MapPin size={14} className="text-orange-500" />
          <span>{location.lat.toFixed(2)}°N, {location.lon.toFixed(2)}°E</span>
        </div>
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-zinc-400">
          <Clock size={14} className="text-blue-500" />
          <span>{clockNow.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="absolute bottom-6 right-6">
        <div className="bg-black/60 backdrop-blur-md p-3 rounded-full border border-white/10 text-zinc-400">
          <CompassIcon size={20} className={cn("transition-transform duration-500", orientation ? "text-green-500" : "text-zinc-600")} />
        </div>
      </div>
    </div>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
