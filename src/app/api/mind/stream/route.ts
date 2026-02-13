import { createSSEStream } from '@/lib/sse';

// SSE endpoint — keeps a connection open for server → client push
export async function GET() {
  const { stream, send, close } = createSSEStream();

  // Send keepalive every 30s
  const keepaliveInterval = setInterval(() => {
    send('keepalive', { timestamp: Date.now() });
  }, 30000);

  // Send initial connection event
  send('connected', { timestamp: Date.now() });

  // Create a TransformStream to handle cleanup on cancel
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const reader = stream.getReader();
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }
      await writer.close();
    } catch {
      // Client disconnected
    } finally {
      clearInterval(keepaliveInterval);
      close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
