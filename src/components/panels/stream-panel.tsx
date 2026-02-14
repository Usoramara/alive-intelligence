'use client';

import { useEffect, useRef } from 'react';
import { useStream } from '@/hooks/use-stream';
import type { StreamEntry } from '@/core/types';

const FLAVOR_STYLES: Record<StreamEntry['flavor'], { color: string; label: string }> = {
  wandering:  { color: 'rgba(255,255,255,0.5)', label: 'wandering' },
  emotional:  { color: '#f59e0b', label: 'feeling' },
  memory:     { color: '#60a5fa', label: 'memory' },
  curiosity:  { color: '#a78bfa', label: 'curiosity' },
  reflection: { color: '#34d399', label: 'reflection' },
  urge:       { color: '#fb923c', label: 'urge' },
};

export function StreamPanel() {
  const stream = useStream();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stream]);

  return (
    <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
      <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3">
        Inner Life
        <span className="ml-2 text-white/20">
          ({stream.length})
        </span>
      </h3>
      <div
        ref={scrollRef}
        className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin"
      >
        {stream.length === 0 && (
          <p className="text-white/20 text-xs font-mono italic">
            Consciousness stirring...
          </p>
        )}
        {stream.map((entry, i) => {
          const style = FLAVOR_STYLES[entry.flavor];
          const age = Date.now() - entry.timestamp;
          const opacity = Math.max(0.3, 1 - age / 30000);
          const isLatest = i === stream.length - 1;

          return (
            <div
              key={`${entry.timestamp}-${i}`}
              className="text-[11px] font-mono leading-relaxed"
              style={{ opacity }}
            >
              <span
                className="text-[9px] uppercase tracking-wider mr-1.5"
                style={{ color: style.color, opacity: 0.6 }}
              >
                {style.label}
              </span>
              <span
                className={entry.flavor === 'wandering' ? 'italic' : ''}
                style={{
                  color: entry.flavor === 'emotional'
                    ? (entry.text.includes('warm') || entry.text.includes('grateful') || entry.text.includes('beauty')
                      ? '#f9a8d4' // pink for positive emotional
                      : '#f59e0b') // amber for negative emotional
                    : style.color,
                  fontWeight: isLatest ? 500 : 400,
                }}
              >
                {entry.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
