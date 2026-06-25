/**
 * WebRTC Signaling API via SSE (Server-Sent Events)
 *
 * POST /api/webrtc/signal  – Send a signal (SDP offer/answer or ICE candidate)
 * GET  /api/webrtc/signal  – Subscribe to signals for your peerId (SSE stream)
 */

import { NextRequest, NextResponse } from 'next/server';

// ──────────────────────────────────────────────────────────────
// In-memory signal store  (works for single-server dev/demo)
// For production: replace with Redis pub/sub
// ──────────────────────────────────────────────────────────────
interface Signal {
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: unknown;
  senderId: string;
  targetId: string;
  roomId: string;
  timestamp: number;
}

// roomId → ordered list of signals
const signalStore = new Map<string, Signal[]>();

// roomId → set of SSE controller references keyed by peerId
const sseClients = new Map<string, Map<string, ReadableStreamDefaultController>>();

function getOrCreateRoomSignals(roomId: string): Signal[] {
  if (!signalStore.has(roomId)) signalStore.set(roomId, []);
  return signalStore.get(roomId)!;
}

function getRoomClients(roomId: string): Map<string, ReadableStreamDefaultController> {
  if (!sseClients.has(roomId)) sseClients.set(roomId, new Map());
  return sseClients.get(roomId)!;
}

// ──────────────────────────────────────────────────────────────
// POST – push a signal into the store and notify SSE listeners
// ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Signal;
    const { roomId, type, payload, senderId, targetId } = body;

    if (!roomId || !type || !senderId || !targetId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const signal: Signal = { roomId, type, payload, senderId, targetId, timestamp: Date.now() };
    getOrCreateRoomSignals(roomId).push(signal);

    // Notify the target peer's SSE connection if they're already listening
    const clients = getRoomClients(roomId);
    const targetController = clients.get(targetId);
    if (targetController) {
      try {
        const data = `data: ${JSON.stringify(signal)}\n\n`;
        targetController.enqueue(new TextEncoder().encode(data));
      } catch {
        // controller closed – clean up
        clients.delete(targetId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[WebRTC Signal POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────
// GET – SSE subscription for a specific peer in a room
// Query params: roomId, peerId, lastIndex (optional, for catch-up)
// ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const peerId = searchParams.get('peerId');
  const lastIndex = parseInt(searchParams.get('lastIndex') || '0', 10);

  if (!roomId || !peerId) {
    return NextResponse.json({ error: 'roomId and peerId are required' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Register this SSE connection
      getRoomClients(roomId).set(peerId, controller);

      // Replay any missed signals since lastIndex
      const signals = getOrCreateRoomSignals(roomId);
      const missed = signals.slice(lastIndex).filter((s) => s.targetId === peerId);
      for (const signal of missed) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(signal)}\n\n`));
      }

      // Send a heartbeat comment every 20s to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 20_000);

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        getRoomClients(roomId).delete(peerId);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable Nginx buffering if behind proxy
    },
  });
}
