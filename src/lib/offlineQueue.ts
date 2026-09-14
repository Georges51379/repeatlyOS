import { submitCheckout, type CheckoutInput } from './checkout';

// New feature: offline-tolerant checkout. A guest order/booking started on
// a weak or dropped connection (common outside well-connected areas) used
// to just fail outright. This queues the checkout in localStorage — the
// same persistence mechanism the cart itself already uses — and replays it
// through the exact same `submitCheckout` path the live checkout uses as
// soon as the browser reports it's back online.
//
// localStorage rather than IndexedDB: the payload is small (a handful of
// cart lines + contact info), and this project already leans on
// localStorage for the cart itself (MarketplaceCartContext.tsx) rather than
// taking on IndexedDB for something this size.
const STORAGE_KEY = 'repeatlyos_offline_checkout_queue';

interface QueuedCheckout {
  id: string;
  input: CheckoutInput;
  queuedAt: string;
}

function readQueue(): QueuedCheckout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedCheckout[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedCheckout[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore — nothing to persist to in this browsing mode.
  }
}

export function queueCheckout(input: CheckoutInput): string {
  const id = crypto.randomUUID();
  const queue = readQueue();
  queue.push({ id, input, queuedAt: new Date().toISOString() });
  writeQueue(queue);
  return id;
}

export function getQueuedCheckoutCount(): number {
  return readQueue().length;
}

/** Attempts every queued checkout in order, removing each on success and
 * leaving failures (a real validation/rate-limit error, not a connectivity
 * one) in the queue for the next flush rather than dropping them silently. */
export async function flushOfflineQueue(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const queue = readQueue();
  if (queue.length === 0) return;

  const remaining: QueuedCheckout[] = [];
  for (const item of queue) {
    try {
      const result = await submitCheckout(item.input);
      if (!result.ok) remaining.push(item);
    } catch {
      remaining.push(item); // still offline or the request itself failed — retry next time
    }
  }
  writeQueue(remaining);
}

let listenerRegistered = false;

/** Registers the 'online' listener exactly once per page load — safe to
 * call from multiple components (e.g. both MarketplaceCartProvider and
 * Cart.tsx) without double-registering. */
export function registerOfflineQueueFlush(): void {
  if (listenerRegistered || typeof window === 'undefined') return;
  listenerRegistered = true;
  window.addEventListener('online', () => {
    flushOfflineQueue();
  });
  flushOfflineQueue(); // also try once on load, in case connectivity returned while the tab was closed
}
