'use client';

import { useCallback, useContext, useSyncExternalStore } from 'react';
import { MindContext } from '@/components/mind-provider';
import type { StreamEntry } from '@/core/types';

export function useStream(): readonly StreamEntry[] {
  const loop = useContext(MindContext);
  if (!loop) throw new Error('useStream must be used within MindProvider');

  const subscribe = useCallback(
    (onStoreChange: () => void) => loop.selfState.subscribeStream(onStoreChange),
    [loop]
  );

  const getSnapshot = useCallback(() => loop.selfState.getStream(), [loop]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
