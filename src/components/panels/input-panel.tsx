'use client';

import { useState, useCallback, useContext, type KeyboardEvent } from 'react';
import { MindContext } from '@/components/mind-provider';
import { ENGINE_IDS } from '@/core/constants';
import { SIGNAL_PRIORITIES } from '@/core/constants';

export function InputPanel() {
  const [text, setText] = useState('');
  const loop = useContext(MindContext);

  const send = useCallback(() => {
    if (!text.trim() || !loop) return;

    // Broadcast — TextInputEngine, PerceptionEngine, and ConversationPanel all receive
    loop.bus.emit({
      type: 'text-input',
      source: ENGINE_IDS.TEXT_INPUT,
      payload: { text: text.trim(), timestamp: Date.now() },
      priority: SIGNAL_PRIORITIES.HIGH,
    });

    setText('');
  }, [text, loop]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send]
  );

  return (
    <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
      <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3">
        Input
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Speak to the mind..."
          className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 font-mono"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-md text-blue-400 text-sm font-mono hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
