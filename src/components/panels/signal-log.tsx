'use client';

import { useMind } from '@/hooks/use-mind';
import { ENGINE_NAMES, ZONE_COLORS, ENGINE_ZONES } from '@/core/constants';

export function SignalLog() {
  const mind = useMind();

  // Show last 20 signals from history
  const recentSignals = mind.signalHistory.slice(-20).reverse();

  return (
    <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
      <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3">
        Signal Log
        <span className="ml-2 text-white/20">
          ({mind.signalHistory.length})
        </span>
      </h3>
      <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
        {recentSignals.length === 0 && (
          <p className="text-white/20 text-xs font-mono">No signals yet...</p>
        )}
        {recentSignals.map((signal) => {
          const sourceColor = ZONE_COLORS[ENGINE_ZONES[signal.source]];
          const age = Date.now() - signal.timestamp;
          const opacity = Math.max(0.2, 1 - age / 5000);

          return (
            <div
              key={signal.id}
              className="flex items-center gap-1 text-[10px] font-mono"
              style={{ opacity }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: sourceColor }}
              />
              <span style={{ color: sourceColor }}>
                {ENGINE_NAMES[signal.source]}
              </span>
              <span className="text-white/20">→</span>
              <span className="text-white/50 truncate flex-1">
                {signal.type}
              </span>
              <span className="text-white/15 shrink-0">
                {age < 1000 ? `${age}ms` : `${(age / 1000).toFixed(1)}s`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
