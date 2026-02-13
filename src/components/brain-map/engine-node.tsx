'use client';

import { memo } from 'react';
import type { EngineSnapshot } from '@/core/types';
import type { EngineId, Zone } from '@/core/constants';
import { ENGINE_NAMES, ZONE_COLORS } from '@/core/constants';

interface EngineNodeProps {
  engineId: EngineId;
  zone: Zone;
  x: number;
  y: number;
  snapshot?: EngineSnapshot;
  selected: boolean;
  onClick: (id: EngineId) => void;
}

const STATUS_GLOW: Record<string, number> = {
  idle: 0.3,
  processing: 1.0,
  waiting: 0.6,
  error: 0.8,
};

function EngineNodeInner({ engineId, zone, x, y, snapshot, selected, onClick }: EngineNodeProps) {
  const status = snapshot?.status ?? 'idle';
  const color = ZONE_COLORS[zone];
  const glow = STATUS_GLOW[status] ?? 0.3;
  const name = ENGINE_NAMES[engineId];
  const isActive = status === 'processing';
  const isError = status === 'error';

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={() => onClick(engineId)}
      style={{ cursor: 'pointer' }}
    >
      {/* Glow ring */}
      <circle
        r={isActive ? 22 : 18}
        fill="none"
        stroke={isError ? '#ef4444' : color}
        strokeWidth={selected ? 3 : 1.5}
        opacity={glow}
        className={isActive ? 'animate-pulse' : ''}
      />

      {/* Core circle */}
      <circle
        r={14}
        fill={`${color}20`}
        stroke={isError ? '#ef4444' : color}
        strokeWidth={selected ? 2.5 : 1}
      />

      {/* Active center dot */}
      {isActive && (
        <circle
          r={5}
          fill={color}
          opacity={0.9}
        >
          <animate
            attributeName="r"
            values="4;7;4"
            dur="0.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.9;0.4;0.9"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Idle pulse */}
      {status === 'idle' && (
        <circle r={3} fill={color} opacity={0.4}>
          <animate
            attributeName="opacity"
            values="0.2;0.5;0.2"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Error indicator */}
      {isError && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="#ef4444"
          fontSize="14"
          fontWeight="bold"
        >
          !
        </text>
      )}

      {/* Label */}
      <text
        y={24}
        textAnchor="middle"
        fill="rgba(255,255,255,0.7)"
        fontSize="8"
        fontFamily="monospace"
      >
        {name}
      </text>

      {/* Tick count (small) */}
      {snapshot && snapshot.tickCount > 0 && (
        <text
          y={-20}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize="6"
          fontFamily="monospace"
        >
          {snapshot.signalsProcessed > 0 ? `${snapshot.signalsProcessed}sig` : ''}
        </text>
      )}
    </g>
  );
}

export const EngineNode = memo(EngineNodeInner);
