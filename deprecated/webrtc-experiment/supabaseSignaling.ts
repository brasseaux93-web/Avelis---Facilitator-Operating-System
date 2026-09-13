import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Requires SUPABASE_URL and SUPABASE_ANON_KEY to be exposed to the client.
// In Vite, these would be VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type SignalingMessage = 
  | { type: 'join'; partyId: string; avelisRole: 'host' | 'guest' }
  | { type: 'offer'; sdp: RTCSessionDescriptionInit; fromPartyId: string; toPartyId: string }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit; fromPartyId: string; toPartyId: string }
  | { type: 'ice-candidate'; candidate: RTCIceCandidateInit; fromPartyId: string; toPartyId: string };

export class SupabaseSignaling {
  private channel: RealtimeChannel | null = null;
  private sessionId: string;
  private partyId: string;
  private role: 'host' | 'guest';
  private onMessageCallback: ((msg: SignalingMessage) => void) | null = null;

  constructor(sessionId: string, partyId: string, role: 'host' | 'guest', jwt: string) {
    this.sessionId = sessionId;
    this.partyId = partyId;
    this.role = role;

    // Apply the custom JWT so RLS/Channel permissions are respected
    if (jwt) {
      supabase.realtime.setAuth(jwt);
    }
  }

  public connect() {
    this.channel = supabase.channel(`room:${this.sessionId}`);

    this.channel
      .on('broadcast', { event: 'signaling' }, (payload) => {
        const msg = payload.payload as SignalingMessage;
        
        // Ignore messages not meant for us (unless it's a join broadcast)
        if ('toPartyId' in msg && msg.toPartyId !== this.partyId) {
          return;
        }

        // Ignore our own messages
        if ('fromPartyId' in msg && msg.fromPartyId === this.partyId) {
          return;
        }
        
        if (msg.type === 'join' && msg.partyId === this.partyId) {
          return;
        }

        if (this.onMessageCallback) {
          this.onMessageCallback(msg);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Announce presence
          this.send({ type: 'join', partyId: this.partyId, avelisRole: this.role });
        }
      });
  }

  public send(message: SignalingMessage) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'signaling',
      payload: message,
    });
  }

  public onMessage(callback: (msg: SignalingMessage) => void) {
    this.onMessageCallback = callback;
  }

  public disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
