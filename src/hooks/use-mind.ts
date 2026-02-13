'use client';

import { useCallback, useContext, useSyncExternalStore } from 'react';
import { MindContext } from '@/components/mind-provider';
import type { MindSnapshot } from '@/core/types';

export function useMind(): MindSnapshot {
  const loop = useContext(MindContext);
  if (!loop) throw new Error('useMind must be used within MindProvider');

  const subscribe = useCallback(
    (onStoreChange: () => void) => loop.subscribe(onStoreChange),
    [loop]
  );

  const getSnapshot = useCallback(() => loop.getSnapshot(), [loop]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
