'use client';

import { useMind } from './use-mind';
import type { EngineSnapshot } from '@/core/types';
import type { EngineId } from '@/core/constants';

export function useEngineStatus(engineId: EngineId): EngineSnapshot | undefined {
  const snapshot = useMind();
  return snapshot.engines.get(engineId);
}
