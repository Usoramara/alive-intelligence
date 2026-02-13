'use client';

import { useSelfState } from '@/hooks/use-self-state';
import type { SelfStateDimension } from '@/core/types';

const DIMENSIONS: Array<{
  key: SelfStateDimension;
  label: string;
  color: string;
  min: number;
}> = [
  { key: 'valence', label: 'Valence', color: '#f59e0b', min: -1 },
  { key: 'arousal', label: 'Arousal', color: '#ef4444', min: 0 },
  { key: 'confidence', label: 'Confidence', color: '#3b82f6', min: 0 },
  { key: 'energy', label: 'Energy', color: '#10b981', min: 0 },
  { key: 'social', label: 'Social', color: '#ec4899', min: 0 },
  { key: 'curiosity', label: 'Curiosity', color: '#8b5cf6', min: 0 },
];

export function SelfStatePanel() {
  const state = useSelfState();

  return (
    <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
      <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3">
        Self State
      </h3>
      <div className="space-y-2">
        {DIMENSIONS.map(({ key, label, color, min }) => {
          const value = state[key];
          const range = 1 - min;
          const pct = ((value - min) / range) * 100;

          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-white/40 text-xs font-mono w-20 shrink-0">
                {label}
              </span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden relative">
                {/* Zero line for valence */}
                {min < 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-white/20"
                    style={{ left: '50%' }}
                  />
                )}
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(1, pct)}%`,
                    backgroundColor: color,
                    opacity: 0.6 + Math.abs(value) * 0.4,
                  }}
                />
              </div>
              <span className="text-white/30 text-xs font-mono w-10 text-right">
                {value.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
