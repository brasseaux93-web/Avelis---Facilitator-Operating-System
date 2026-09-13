# Visual System

> Binding interface constitution for Avelis. Implements Product Instruction §11 and the Language Guide. If a visual choice conflicts with this document, it is wrong.

## 1. Intent

Avelis is operational software for facilitators — a calm, dense institutional OS, not a social product, advocacy brand, or consumer chat app.

First impression target: Bloomberg / Linear–meets–protocol tooling. Investors should see precision and restraint in under ten seconds. No marketing fluff in the facilitator surface.

## 2. Principles

1. Clarity over decoration
2. Factual status language only (see Language Guide)
3. No implied legal guarantees in UI copy or imagery
4. Room UI must disclose ephemeral / no-scrollback behavior
5. Prefer accessible contrast (WCAG 2.2 AA minimum for text)
6. Motion is optional: reveal fades only; honor `prefers-reduced-motion`
7. 8pt spacing grid; hairline borders; soft elevation; generous whitespace on marketing, calm density in facilitator app

## 3. Tokens

Canonical CSS tokens live in `src/styles/tokens.css`, imported by `style.css`.

| Role | Direction |
|---|---|
| Canvas (dark) | Deep near-black `oklch(0.16 0.01 260)` |
| Panels | Warm paper in light mode; elevated near-black surfaces in dark |
| Accent | Single desaturated teal/cyan (`oklch` ~195 hue) — institutional, not startup purple |
| Ink | Near-black on paper; warm off-white on dark canvas |
| Ledger type | `ui-monospace, SFMono-Regular, Menlo, …` |
| UI type | `"Segoe UI", "Helvetica Neue", system-ui` — Google-free; no hosted webfonts required |
| Eyebrows | Uppercase, tight tracking (`--tracking-eyebrow`) |

Do not introduce a second brand accent. Status colors (success, danger) are functional only.

## 4. Surfaces & components

- **Buttons**: Primary uses accent fill + `--color-on-accent` text. Secondary is hairline border on surface. Focus rings use `--color-focus`.
- **Inputs**: Surface fill, hairline border, teal focus ring. Invalid uses danger color only — no iconography required.
- **Status pills**: Compact uppercase labels; border + muted fill; no badges that imply gamification.
- **Ledger tables**: Dense editorial tables — mono for sequence/time, restrained row dividers, no zebra spectacle.
- **Room stream**: Protocol/terminal stream, not consumer chat bubbles. Meta line (identity class) above text. No avatars, reactions, or timestamps-as-chat-chrome beyond operational need.
- **Empty states**: Short factual copy + required disclosure that room messages are not stored.

## 5. Forbidden imagery & motifs

Per Product Instruction §11 — do not use:

| Forbidden | Why |
|---|---|
| People / portrait illustrations | Social / advocacy signal |
| Locks, shields, surveillance reassurance icons | Security theater |
| Doves, olive branches, globes, handshakes, peace symbolism | Advocacy symbolism |
| Speech bubbles, chat-transcript motifs, waveform histories, recording glyphs | Implies persistence / consumer chat |
| Gamification, streaks, reactions, popularity counters | Out of product scope |

Protocol mark: geometric **A** / flanking rules only. Not a lock, vault, or safe.

## 6. Required disclosures (UI)

Use Language Guide wording verbatim where applicable:

- Live room: `Room messages are delivered live and are not stored by Avelis.`
- Close: `Closing ends room access and destroys the live room. Messages cannot be recovered.`
- Joint minute: `The joint minute is optional. It is separate from the live room and may be exported or wiped.`

## 7. Motion

- Reveal: opacity / translate fades on marketing sections (`data-reveal`)
- Interactive: ≤280ms ease-out
- No parallax, no bounce, no attention-seeking loops
- `@media (prefers-reduced-motion: reduce)` disables non-essential animation

## 8. Facilitator app density

Routes `sessions*`, `join`, `room`:

- Calm density, not marketing hero layout
- Clear keyboard focus order; visible `:focus-visible`
- Disclosures near the top of each session/room surface
- Empty lists explain next action without reassurance language

## 9. Review questions (visual PRs)

1. Does any new icon imply lock, shield, surveillance, peace, or chat history?
2. Does room UI look like consumer chat (bubbles, avatars, reactions)?
3. Are required non-persistence disclosures present?
4. Does copy stay clinical-neutral (Language Guide)?
5. Are tokens used instead of one-off gold/purple accents?

## 10. Change control

Token or motif changes that affect brand or §11 constraints require a docs update in this file in the same PR. Silent visual scope creep is a defect.
