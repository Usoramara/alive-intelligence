'use client';

import { useCallback, useContext, useSyncExternalStore } from 'react';
import { MindContext } from '@/components/mind-provider';
import type { SelfState } from '@/core/types';

export function useSelfState(): SelfState {
  const loop = useContext(MindContext);
  if (!loop) throw new Error('useSelfState must be used within MindProvider');

  const subscribe = useCallback(
    (onStoreChange: () => void) => loop.selfState.subscribe(onStoreChange),
    [loop]
  );

  const getSnapshot = useCallback(() => loop.selfState.get(), [loop]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
