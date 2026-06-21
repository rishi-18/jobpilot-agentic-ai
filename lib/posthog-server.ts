import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

// Lazy singleton — Next.js server components share a Node process so we keep one
// instance instead of paying the connect cost on every route.
export function getPostHogServer(): PostHog {
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return _client;
}

// Server functions are short-lived — every capture must `await shutdownPostHog()`
// inside the same request or the event is dropped when the function returns.
export async function shutdownPostHog(): Promise<void> {
  if (!_client) return;
  await _client.shutdown();
}
