'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useMind } from '@/hooks/use-mind';
import { EngineNode } from './engine-node';
import { SignalLine } from './signal-line';
import {
  ENGINE_POSITIONS,
  ENGINE_ZONES,
  SIGNAL_PATHS,
  ZONE_COLORS,
  type EngineId,
} from '@/core/constants';

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 600;
const PADDING = 40;

function toSvgCoord(pos: { x: number; y: number }) {
  return {
    x: PADDING + pos.x * (SVG_WIDTH - 2 * PADDING),
    y: PADDING + pos.y * (SVG_HEIGHT - 2 * PADDING),
  };
}

interface BrainMapProps {
  onSelectEngine?: (id: EngineId | null) => void;
}

export function BrainMap({ onSelectEngine }: BrainMapProps) {
  const mind = useMind();
  const [selectedEngine, setSelectedEngine] = useState<EngineId | null>(null);
  const tickRef = useRef<HTMLSpanElement>(null);

  // Update tick counter directly to avoid re-rendering the whole SVG
  useEffect(() => {
    if (tickRef.current) {
      tickRef.current.textContent = `tick ${mind.tick}`;
    }
  });

  const handleClick = useCallback(
    (id: EngineId) => {
      const next = selectedEngine === id ? null : id;
      setSelectedEngine(next);
      onSelectEngine?.(next);
    },
    [selectedEngine, onSelectEngine]
  );

  // Determine which signal paths are currently active
  const activePaths = useMemo(() => {
    const activeEngines = new Set<EngineId>();
    for (const [id, snap] of mind.engines) {
      if (snap.status === 'processing') activeEngines.add(id);
    }
    // A path is active if its source engine recently fired
    // Also check recent signals
    const recentSources = new Set(mind.activeSignals.map((s) => s.source));
    const recentTargets = new Set<EngineId>();
    for (const s of mind.activeSignals) {
      if (s.target) {
        const targets = Array.isArray(s.target) ? s.target : [s.target];
        targets.forEach((t) => recentTargets.add(t));
      }
    }

    return new Set(
      SIGNAL_PATHS.filter(
        ([from, to]) =>
          recentSources.has(from) ||
          (activeEngines.has(from) && activeEngines.has(to))
      ).map(([from, to]) => `${from}->${to}`)
    );
  }, [mind.engines, mind.activeSignals]);

  // Self-state → background color shift
  const valence = mind.selfState.valence;
  const arousal = mind.selfState.arousal;
  const bgHue = Math.round(200 + valence * 30); // 170-230 range
  const bgSaturation = Math.round(20 + arousal * 30);

  return (
    <div className="relative w-full h-full">
      {/* Background with self-state color */}
      <div
        className="absolute inset-0 rounded-xl transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, hsl(${bgHue}, ${bgSaturation}%, 8%) 0%, hsl(${bgHue}, ${bgSaturation - 10}%, 4%) 100%)`,
        }}
      />

      {/* Tick counter */}
      <div className="absolute top-3 right-4 text-white/20 font-mono text-xs z-10">
        <span ref={tickRef}>tick 0</span>
      </div>

      {/* Zone labels */}
      <div className="absolute top-3 left-4 flex gap-4 z-10">
        {(['outer', 'inner', 'thalamus', 'body'] as const).map((zone) => (
          <span
            key={zone}
            className="text-xs font-mono uppercase tracking-wider"
            style={{ color: `${ZONE_COLORS[zone]}80` }}
          >
            {zone}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="relative w-full h-full z-0"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Signal lines (edges) */}
        {SIGNAL_PATHS.map(([from, to]) => {
          const fromPos = toSvgCoord(ENGINE_POSITIONS[from]);
          const toPos = toSvgCoord(ENGINE_POSITIONS[to]);
          const key = `${from}->${to}`;
          return (
            <SignalLine
              key={key}
              from={fromPos}
              to={toPos}
              sourceEngine={from}
              targetEngine={to}
              active={activePaths.has(key)}
            />
          );
        })}

        {/* Engine nodes */}
        {Object.entries(ENGINE_POSITIONS).map(([id, pos]) => {
          const engineId = id as EngineId;
          const svgPos = toSvgCoord(pos);
          return (
            <EngineNode
              key={engineId}
              engineId={engineId}
              zone={ENGINE_ZONES[engineId]}
              x={svgPos.x}
              y={svgPos.y}
              snapshot={mind.engines.get(engineId)}
              selected={selectedEngine === engineId}
              onClick={handleClick}
            />
          );
        })}
      </svg>
    </div>
  );
}
