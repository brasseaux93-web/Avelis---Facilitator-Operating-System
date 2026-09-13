import { SupabaseSignaling, SignalingMessage } from './supabaseSignaling';

export type WebRTCMessage = 
  | { type: 'key-exchange'; key: CryptoKey } // Not transmitted directly, but we'll export/import it in crypto.ts
  | { type: 'chat'; text: string }
  | { type: 'binary'; payload: ArrayBuffer };

export class WebRTCManager {
  public pc: RTCPeerConnection;
  public dataChannel: RTCDataChannel | null = null;
  private signaling: SupabaseSignaling;
  private targetPartyId: string | null = null;
  
  public onDataChannelOpen: (() => void) | null = null;
  public onMessage: ((event: MessageEvent) => void) | null = null;

  constructor(signaling: SupabaseSignaling) {
    this.signaling = signaling;
    
    // Standard STUN servers for NAT traversal
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.targetPartyId) {
        this.signaling.send({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
          fromPartyId: (this.signaling as any).partyId,
          toPartyId: this.targetPartyId,
        });
      }
    };

    // When the remote peer creates a data channel (if we are the guest responding to an offer)
    this.pc.ondatachannel = (event) => {
      this.setDataChannel(event.channel);
    };
  }

  private setDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;
    this.dataChannel.binaryType = 'arraybuffer';
    
    this.dataChannel.onopen = () => {
      if (this.onDataChannelOpen) this.onDataChannelOpen();
    };
    
    this.dataChannel.onmessage = (event) => {
      if (this.onMessage) this.onMessage(event);
    };
  }

  // Host initiates connection
  public async createOffer(targetPartyId: string) {
    this.targetPartyId = targetPartyId;
    
    // Create data channel before offer
    const channel = this.pc.createDataChannel('avelis-zero-knowledge-bus', {
      negotiated: false,
    });
    this.setDataChannel(channel);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    this.signaling.send({
      type: 'offer',
      sdp: offer,
      fromPartyId: (this.signaling as any).partyId,
      toPartyId: targetPartyId,
    });
  }

  public async handleOffer(offer: RTCSessionDescriptionInit, fromPartyId: string) {
    this.targetPartyId = fromPartyId;
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    this.signaling.send({
      type: 'answer',
      sdp: answer,
      fromPartyId: (this.signaling as any).partyId,
      toPartyId: fromPartyId,
    });
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  public async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error('Error adding received ice candidate', e);
    }
  }

  public sendData(data: string | ArrayBuffer) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(data);
    } else {
      console.warn('DataChannel is not open. Cannot send data.');
    }
  }

  public close() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    this.pc.close();
  }
}
