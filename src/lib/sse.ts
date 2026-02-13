// Server-side SSE helpers

export function createSSEStream(): {
  stream: ReadableStream;
  send: (event: string, data: unknown) => void;
  close: () => void;
} {
  let controller: ReadableStreamDefaultController | null = null;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    cancel() {
      controller = null;
    },
  });

  return {
    stream,
    send(event: string, data: unknown) {
      if (!controller) return;
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(payload));
    },
    close() {
      if (controller) {
        controller.close();
        controller = null;
      }
    },
  };
}

// Client-side SSE consumer
export function connectSSE(
  url: string,
  handlers: Record<string, (data: unknown) => void>,
  onError?: (error: Event) => void
): () => void {
  const source = new EventSource(url);

  for (const [event, handler] of Object.entries(handlers)) {
    source.addEventListener(event, (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handler(data);
      } catch (err) {
        console.error(`SSE parse error for ${event}:`, err);
      }
    });
  }

  source.onerror = (e) => {
    onError?.(e);
  };

  return () => source.close();
}
