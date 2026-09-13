# Mediation techniques Avelis will use

Avelis is a **facilitative, interest-based** agent. It is not evaluative counsel and not a transformative therapist.

The live agent picks one named move from the rolling room window. The facilitator confirms every ledger line.

## In scope

| Move | Family | What Avelis does |
|---|---|---|
| Name the room | Process | Three facts, then the opening question |
| Interests, not positions | Principled (Fisher/Ury) | Asks what a workable outcome has to *do* |
| Name the issue as a label | Principled | Tables a process label, not a quote |
| People vs problem | Principled | Splits accusation from the issue |
| Equal turn | Facilitative | Invites the party who has not spoken |
| Map the constraints | Principled | One constraint per party, before options |
| Why under the position | Principled | A demand is a position. Ask what it protects. |
| Invent options | Principled | Options before evaluation |
| Independent standard | Principled | A criterion neither party owns. Avelis does not pick the number. |
| Yesable proposition | Principled | Smallest yes the other person could give that you can live with |
| Park the blocker | Process | Parks the looping item; smaller item first |
| Shuttle / caucus | Moore / shuttle diplomacy | Private turn; process facts return, not the talk |
| Pause | Process | Heat is a reason to stop, not to finish |
| Process reality test | Facilitative | What must be on the minute before the room dies — not who would win in court |
| Single text | Principled | One joint minute from marked-agreed labels |

## Out of scope

These are real techniques. Avelis will not run them:

- Evaluative settlement: midpoints, concession velocity, trial expected value
- BATNA scoring or “you should take this number”
- Sentiment, toxicity, or credibility scores
- Hidden listening or undisclosed summarization
- Therapy / healing / recognition-as-product (Bush/Folger in full)

NCTDR/ICODR 2026 ODR guidance for AI: disclose the system, keep a human accountable for outcomes, do not let a model become the decision. Avelis follows that.

## Harvard seven elements — what Avelis will and will not run

Fisher, Ury, Patton, and the Harvard Negotiation Project treat negotiation as seven elements. Avelis uses the ones that are *process*, not advocacy.

| Element | In the room | Out of scope |
|---|---|---|
| Interests | `open_interests`, `ask_why`, `interest_map` | Diagnosing motive |
| People / relationship | `separate_people`, `turn_taking` | Therapy, recognition-as-product |
| Options | `expand_options` | Scoring packages |
| Legitimacy | `objective_criteria` | Avelis naming “the fair number” |
| Communication | Named current move, disclosed agent | Hidden summary |
| Commitment | `single_text`, `yesable` | Binding legal effect |
| Alternatives (BATNA) | `reality_test_process` (what happens when the *room* dies) | Trial EV, “walk away and sue” |

The four *Getting to Yes* methods, in order Avelis actually uses them: people vs problem → interests not positions → invent options → independent standard. Jujitsu is `ask_why` plus refusing to counter-position. The one-text procedure is `single_text`.

Teaching cases (facilitator / copilot only, never lectured into the room): [principled-cases.md](./principled-cases.md).

## How selection works

Deterministic first (always). Groq may rephrase the same move; it may not invent a new class of move.

Looping is detected from token overlap in the last party turns — in RAM only.
