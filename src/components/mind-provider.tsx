'use client';

import { createContext, useEffect, useRef, type ReactNode } from 'react';
import { CognitiveLoop } from '@/core/cognitive-loop';
import { ThoughtBridge } from '@/core/thought-bridge';
import { ENGINE_IDS } from '@/core/constants';

// Phase 2 — Outer
import { TextInputEngine } from '@/core/engines/outer/text-input-engine';
import { PerceptionEngine } from '@/core/engines/outer/perception-engine';
// Phase 2 — Thalamus
import { AttentionEngine } from '@/core/engines/thalamus/attention-engine';
import { BinderEngine } from '@/core/engines/thalamus/binder-engine';
import { ArbiterEngine } from '@/core/engines/thalamus/arbiter-engine';
// Phase 2 — Body
import { VoiceEngine } from '@/core/engines/body/voice-engine';
// Phase 3 — Inner
import { EmotionInferenceEngine } from '@/core/engines/inner/emotion-inference-engine';
import { PersonStateEngine } from '@/core/engines/inner/person-state-engine';
import { EmpathicCouplingEngine } from '@/core/engines/inner/empathic-coupling-engine';
import { ValuesEngine } from '@/core/engines/inner/values-engine';
// Phase 4 — Vision
import { CameraEngine } from '@/core/engines/outer/camera-engine';
import { TomEngine } from '@/core/engines/inner/tom-engine';
import { PerspectiveEngine } from '@/core/engines/inner/perspective-engine';
// Phase 5 — Memory
import { MemoryEngine } from '@/core/engines/outer/memory-engine';
import { MemoryWriteEngine } from '@/core/engines/thalamus/memory-write-engine';
import { PersistenceEngine } from '@/core/engines/body/persistence-engine';
// Phase 6 — Inner World
import { DefaultModeEngine } from '@/core/engines/inner/default-mode-engine';
import { ImaginationEngine } from '@/core/engines/inner/imagination-engine';
import { IntuitionEngine } from '@/core/engines/inner/intuition-engine';
import { HopeWorryEngine } from '@/core/engines/inner/hope-worry-engine';
import { StrategyEngine } from '@/core/engines/inner/strategy-engine';
import { ReplayEngine } from '@/core/engines/inner/replay-engine';
import { LoveFieldEngine } from '@/core/engines/inner/love-field-engine';
import { GrowthEngine } from '@/core/engines/thalamus/growth-engine';
// Phase 7 — Body & Safety
import { MicrophoneEngine } from '@/core/engines/outer/microphone-engine';
import { SafetyEngine } from '@/core/engines/outer/safety-engine';
import { MotorEngine } from '@/core/engines/outer/motor-engine';
import { ExpressionEngine } from '@/core/engines/body/expression-engine';
import { LocomotionEngine } from '@/core/engines/body/locomotion-engine';
import { SyncEngine } from '@/core/engines/thalamus/sync-engine';

export const MindContext = createContext<CognitiveLoop | null>(null);

export function MindProvider({ children }: { children: ReactNode }) {
  const loopRef = useRef<CognitiveLoop | null>(null);
  const bridgeRef = useRef<ThoughtBridge | null>(null);

  if (!loopRef.current) {
    const loop = new CognitiveLoop();

    // Phase 2 engines
    loop.registerEngine(new TextInputEngine());
    loop.registerEngine(new PerceptionEngine());
    loop.registerEngine(new AttentionEngine());
    loop.registerEngine(new BinderEngine());
    loop.registerEngine(new ArbiterEngine());
    loop.registerEngine(new VoiceEngine());

    // Phase 3 engines
    loop.registerEngine(new EmotionInferenceEngine());
    loop.registerEngine(new PersonStateEngine());
    loop.registerEngine(new EmpathicCouplingEngine());
    loop.registerEngine(new ValuesEngine());

    // Phase 4 engines
    loop.registerEngine(new CameraEngine());
    loop.registerEngine(new TomEngine());
    loop.registerEngine(new PerspectiveEngine());

    // Phase 5 engines
    loop.registerEngine(new MemoryEngine());
    loop.registerEngine(new MemoryWriteEngine());
    const persistenceEngine = new PersistenceEngine();
    loop.registerEngine(persistenceEngine);

    // Phase 6 engines
    loop.registerEngine(new DefaultModeEngine());
    loop.registerEngine(new ImaginationEngine());
    loop.registerEngine(new IntuitionEngine());
    loop.registerEngine(new HopeWorryEngine());
    loop.registerEngine(new StrategyEngine());
    loop.registerEngine(new ReplayEngine());
    loop.registerEngine(new LoveFieldEngine());
    loop.registerEngine(new GrowthEngine());

    // Phase 7 engines
    loop.registerEngine(new MicrophoneEngine());
    loop.registerEngine(new SafetyEngine());
    loop.registerEngine(new MotorEngine());
    loop.registerEngine(new ExpressionEngine());
    loop.registerEngine(new LocomotionEngine());
    loop.registerEngine(new SyncEngine());

    loopRef.current = loop;
  }

  useEffect(() => {
    const loop = loopRef.current!;
    bridgeRef.current = new ThoughtBridge(loop.bus);

    // Restore persisted state
    const persistence = loop.getEngine<PersistenceEngine>(ENGINE_IDS.PERSISTENCE);
    persistence?.restore();

    loop.start();

    return () => {
      bridgeRef.current?.destroy();
      loop.destroy();
    };
  }, []);

  return (
    <MindContext.Provider value={loopRef.current}>
      {children}
    </MindContext.Provider>
  );
}
