/**
 * WebRTC Room Management API
 *
 * POST /api/webrtc/room  – Join (or create) a room, returns peerId + role
 * GET  /api/webrtc/room  – Get current room state (peers joined)
 */

import { NextRequest, NextResponse } from 'next/server';

// ──────────────────────────────────────────────────────────────
// In-memory room registry
// ──────────────────────────────────────────────────────────────
interface RoomPeer {
  peerId: string;
  role: 'host' | 'guest';
  joinedAt: number;
}

interface Room {
  roomId: string;
  peers: RoomPeer[];
  createdAt: number;
}

const rooms = new Map<string, Room>();

function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { roomId, peers: [], createdAt: Date.now() });
  }
  return rooms.get(roomId)!;
}

// ──────────────────────────────────────────────────────────────
// POST – join a room
// Body: { roomId: string, userId: string }
// Returns: { peerId, role, existingPeerId? }
// ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { roomId, userId } = await req.json();

    if (!roomId || !userId) {
      return NextResponse.json({ error: 'roomId and userId are required' }, { status: 400 });
    }

    const room = getOrCreateRoom(roomId);

    // Remove stale peers (older than 2 hours)
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    room.peers = room.peers.filter((p) => Date.now() - p.joinedAt < TWO_HOURS);

    // Check if this userId already joined
    const existingPeer = room.peers.find((p) => p.peerId.startsWith(userId));
    if (existingPeer) {
      const otherPeer = room.peers.find((p) => p.peerId !== existingPeer.peerId);
      return NextResponse.json({
        peerId: existingPeer.peerId,
        role: existingPeer.role,
        existingPeerId: otherPeer?.peerId ?? null,
      });
    }

    // First peer becomes the host (offer creator), second is the guest
    const role: 'host' | 'guest' = room.peers.length === 0 ? 'host' : 'guest';
    const peerId = `${userId}-${Date.now()}`;
    const otherPeer = room.peers[0] ?? null;

    room.peers.push({ peerId, role, joinedAt: Date.now() });

    return NextResponse.json({
      peerId,
      role,
      existingPeerId: otherPeer?.peerId ?? null,
    });
  } catch (err) {
    console.error('[WebRTC Room POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────
// GET – room status
// Query: roomId
// ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return NextResponse.json({ peers: [], ready: false });
  }

  return NextResponse.json({
    peers: room.peers.map((p) => ({ peerId: p.peerId, role: p.role })),
    ready: room.peers.length >= 2,
  });
}

// ──────────────────────────────────────────────────────────────
// DELETE – leave / clean up room
// ──────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const peerId = searchParams.get('peerId');

  if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 });

  const room = rooms.get(roomId);
  if (room && peerId) {
    room.peers = room.peers.filter((p) => p.peerId !== peerId);
    if (room.peers.length === 0) rooms.delete(roomId);
  }

  return NextResponse.json({ ok: true });
}
