'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { MindContext } from '@/components/mind-provider';
import { ENGINE_IDS } from '@/core/constants';
import { VoiceEngine } from '@/core/engines/body/voice-engine';

interface Message {
  role: 'user' | 'wybe';
  text: string;
  timestamp: number;
}

export function ConversationPanel() {
  const loop = useContext(MindContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loop) return;

    // Listen to text-input signals for user messages
    const userSub = loop.bus.subscribe(
      ENGINE_IDS.TEXT_INPUT,
      ['text-input'],
      (signal) => {
        const payload = signal.payload as { text: string };
        setMessages(prev => [...prev, {
          role: 'user',
          text: payload.text,
          timestamp: Date.now(),
        }]);
      }
    );

    // Listen to voice output for Wybe's responses
    const voiceEngine = loop.getEngine<VoiceEngine>(ENGINE_IDS.VOICE);
    const voiceUnsub = voiceEngine?.onOutput((text) => {
      setMessages(prev => [...prev, {
        role: 'wybe',
        text,
        timestamp: Date.now(),
      }]);
    });

    return () => {
      loop.bus.unsubscribe(userSub);
      voiceUnsub?.();
    };
  }, [loop]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10 flex flex-col h-full">
      <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3 shrink-0">
        Conversation
      </h3>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto scrollbar-thin min-h-0">
        {messages.length === 0 && (
          <p className="text-white/15 text-xs font-mono text-center py-8">
            Speak to the mind...
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm font-mono ${
                msg.role === 'user'
                  ? 'bg-blue-500/15 text-blue-200/80 border border-blue-500/20'
                  : 'bg-purple-500/15 text-purple-200/80 border border-purple-500/20'
              }`}
            >
              <span className="text-[10px] opacity-40 block mb-1">
                {msg.role === 'user' ? 'You' : 'Wybe'}
              </span>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
