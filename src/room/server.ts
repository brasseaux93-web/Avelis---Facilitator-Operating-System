import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'node:crypto';

// The Room Service maintains state purely in memory.
// There is NO database connection in this file, fulfilling Product Law L1.

interface RoomState {
  id: string;
  parties: Set<WebSocket>;
  messages: Array<{
    id: string;
    senderClass: string;
    text: string;
    timestamp: number;
  }>;
}

const activeRooms = new Map<string, RoomState>();

const wss = new WebSocketServer({ port: 3002 });

wss.on('connection', (ws, req) => {
  // In a real implementation, we would extract the sessionId and party authentication token from the URL/headers.
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('sessionId');
  const partyClass = url.searchParams.get('partyClass') || 'anonymous';

  if (!sessionId) {
    ws.close(1008, 'Session ID required');
    return;
  }

  let room = activeRooms.get(sessionId);
  if (!room) {
    room = { id: sessionId, parties: new Set(), messages: [] };
    activeRooms.set(sessionId, room);
  }

  room.parties.add(ws);

  // Send ephemeral chat history to the new participant
  ws.send(JSON.stringify({ type: 'history', messages: room.messages }));

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'chat') {
        const message = {
          id: crypto.randomUUID(),
          senderClass: partyClass,
          text: parsed.text, // Text exists only in memory
          timestamp: Date.now(),
        };
        
        // Append to memory-only array
        room!.messages.push(message);

        // Broadcast to all parties in the room
        const broadcastPayload = JSON.stringify({ type: 'message', message });
        for (const partyWs of room!.parties) {
          if (partyWs.readyState === WebSocket.OPEN) {
            partyWs.send(broadcastPayload);
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse message', e);
    }
  });

  ws.on('close', () => {
    room!.parties.delete(ws);
    // Note: We deliberately do NOT persist room state when parties leave.
    // When the room is closed by the facilitator, we must call a teardown function
    // to instantly delete the Map entry.
  });
});

export function teardownRoom(sessionId: string) {
  const room = activeRooms.get(sessionId);
  if (room) {
    for (const partyWs of room.parties) {
      partyWs.send(JSON.stringify({ type: 'room_closed' }));
      partyWs.close(1000, 'Session Closed');
    }
    // Delete all memory references
    room.messages = [];
    room.parties.clear();
    activeRooms.delete(sessionId);
  }
}

console.log('Memory-only Ephemeral Room Service running on ws://localhost:3002');
