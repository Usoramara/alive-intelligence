'use client';

import { useMind } from '@/hooks/use-mind';
import type { EngineId } from '@/core/constants';
import { ENGINE_NAMES, ENGINE_ZONES, TICK_RATES, ZONE_COLORS } from '@/core/constants';

interface EngineInspectorProps {
  engineId: EngineId | null;
}

export function EngineInspector({ engineId }: EngineInspectorProps) {
  const mind = useMind();

  if (!engineId) {
    return (
      <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
        <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-2">
          Engine Inspector
        </h3>
        <p className="text-white/30 text-xs font-mono">Click an engine node to inspect</p>
      </div>
    );
  }

  const snapshot = mind.engines.get(engineId);
  const zone = ENGINE_ZONES[engineId];
  const color = ZONE_COLORS[zone];

  return (
    <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
      <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3">
        Engine Inspector
      </h3>
      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-white/40">Name</span>
          <span style={{ color }}>{ENGINE_NAMES[engineId]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Zone</span>
          <span style={{ color: `${color}cc` }}>{zone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Status</span>
          <span className={
            snapshot?.status === 'processing' ? 'text-green-400' :
            snapshot?.status === 'error' ? 'text-red-400' :
            snapshot?.status === 'waiting' ? 'text-yellow-400' :
            'text-white/50'
          }>
            {snapshot?.status ?? 'unregistered'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Tick Rate</span>
          <span className="text-white/60">{TICK_RATES[engineId]}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Tick Count</span>
          <span className="text-white/60">{snapshot?.tickCount ?? 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Signals</span>
          <span className="text-white/60">{snapshot?.signalsProcessed ?? 0}</span>
        </div>
        {snapshot?.debugInfo && (
          <div className="mt-2 p-2 bg-red-500/10 rounded text-red-400 text-[10px] break-all">
            {snapshot.debugInfo}
          </div>
        )}
      </div>
    </div>
  );
}
