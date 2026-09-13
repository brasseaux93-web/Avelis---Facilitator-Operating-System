# Deprecated / gated experiments

These files are **not on the production speech path**.

| Path | Why it is here |
|---|---|
| `webrtc-experiment/` | Optional peer audio + data-channel chat via a third-party signaling vendor. Gated until the speech-safety suite covers it. A production host must not put live speech on a vendor realtime channel. |

Canonical live room: `src/room/` (memory-only WebSocket, HMAC tokens, deliver-and-drop).
