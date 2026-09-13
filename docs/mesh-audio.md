# Mesh voice

Optional voice in the live room is **browser-to-browser WebRTC mesh**.

Avelis’s room server carries **signaling only** (SDP/ICE on the existing socket). It does not receive audio frames, does not mix, does not record, does not caption.

## Why mesh, not SFU

| Topology | Who can hear | Avelis uses |
|---|---|---|
| Mesh | Peers only (plus TURN if a direct path fails — we do not run TURN yet) | Yes |
| SFU | A server that sees RTP | No |
| MCU | A server that decodes and mixes | No |

An SFU is how Zoom and Meet scale. It is also how they become a file. For 2–4 people in a difficult conversation, mesh is the topology that matches the constitution: the operator never touches the media.

STUN (Cloudflare) helps NAT traversal. There is no TURN in this cut. If a corporate network blocks UDP, voice will not open; **text continues**. That failure is disclosed. We will not add a media relay that can hear the room in order to raise connect rates.

## Rules

- Audio is opt-in. Default is off.
- No waveform, no captions, no transcript, no model on the mic.
- Avelis (the conflict agent) does not receive audio.
- When a RAM caucus opens, plenary voice stops. Private turns stay text. Quotes still cannot return.
- `audio_started` is a **forbidden** ledger type. Voice is not a process line.

## Limits

Mesh uplink is O(n²). Fine for a shuttle of two or three. Not a town hall. Avelis is not a town hall.
