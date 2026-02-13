'use client';

import { memo, useId } from 'react';
import type { EngineId } from '@/core/constants';
import { ZONE_COLORS, ENGINE_ZONES } from '@/core/constants';

interface SignalLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  sourceEngine: EngineId;
  targetEngine: EngineId;
  active: boolean;
}

function SignalLineInner({ from, to, sourceEngine, active }: SignalLineProps) {
  const id = useId();
  const zone = ENGINE_ZONES[sourceEngine];
  const color = ZONE_COLORS[zone];

  return (
    <g opacity={active ? 0.8 : 0.08}>
      {/* Base line */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={active ? 1.5 : 0.5}
        strokeDasharray={active ? undefined : '2,4'}
      />

      {/* Animated particle traveling along the path when active */}
      {active && (
        <>
          <circle r={2.5} fill={color}>
            <animateMotion
              dur="0.6s"
              repeatCount="indefinite"
              path={`M${from.x},${from.y} L${to.x},${to.y}`}
            />
            <animate
              attributeName="opacity"
              values="1;0.3;1"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Glow filter on the line */}
          <line
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={color}
            strokeWidth={3}
            opacity={0.3}
            filter={`url(#glow-${id})`}
          />
          <defs>
            <filter id={`glow-${id}`}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </>
      )}
    </g>
  );
}

export const SignalLine = memo(SignalLineInner);
