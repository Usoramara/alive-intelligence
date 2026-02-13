const DB_NAME = 'alive-intelligence';
const DB_VERSION = 1;

export interface MemoryRecord {
  id: string;
  type: 'episodic' | 'semantic' | 'state' | 'person';
  content: string;
  timestamp: number;
  significance: number;
  tags: string[];
  metadata?: Record<string, unknown>;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('memories')) {
        const store = db.createObjectStore('memories', { keyPath: 'id' });
        store.createIndex('type', 'type');
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('significance', 'significance');
      }

      if (!db.objectStoreNames.contains('state')) {
        db.createObjectStore('state', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMemory(record: MemoryRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memories', 'readwrite');
    tx.objectStore('memories').put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMemories(options?: {
  type?: MemoryRecord['type'];
  limit?: number;
  minSignificance?: number;
}): Promise<MemoryRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memories', 'readonly');
    const store = tx.objectStore('memories');

    let request: IDBRequest;
    if (options?.type) {
      const index = store.index('type');
      request = index.getAll(options.type);
    } else {
      request = store.getAll();
    }

    request.onsuccess = () => {
      let results = request.result as MemoryRecord[];

      if (options?.minSignificance) {
        results = results.filter(r => r.significance >= options.minSignificance!);
      }

      // Sort by timestamp descending
      results.sort((a, b) => b.timestamp - a.timestamp);

      if (options?.limit) {
        results = results.slice(0, options.limit);
      }

      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function searchMemories(query: string, limit = 10): Promise<MemoryRecord[]> {
  const all = await getMemories();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  // Simple relevance scoring
  const scored = all.map(record => {
    const contentLower = record.content.toLowerCase();
    let score = 0;

    for (const word of queryWords) {
      if (contentLower.includes(word)) score += 1;
    }

    // Boost by significance and recency
    score *= record.significance;
    const ageHours = (Date.now() - record.timestamp) / (1000 * 60 * 60);
    score *= Math.max(0.1, 1 - ageHours / 168); // Decay over a week

    return { record, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.record);
}

export async function saveState(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', 'readwrite');
    tx.objectStore('state').put({ key, value, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadState<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', 'readonly');
    const request = tx.objectStore('state').get(key);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.value : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearAll(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['memories', 'state'], 'readwrite');
    tx.objectStore('memories').clear();
    tx.objectStore('state').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
