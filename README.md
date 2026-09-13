# QorAct

**Authorship plane** for the Qor family. CANDIDATE v0.1. Not anti-cheat. Not observation. Not a humanity proof.

QorAct answers one question about a session span:

**Who made this act — the gamer, a bot, both, or we do not know?**

It is a **reference-and-bind labeler**. It reads a Qoresence Recap (and optional QorTroller KAS/PoSP hashes). It mints no FROZEN-v1 primitive, writes no chain, and opens no capture card.

| Plane | Repo | Speaks |
|---|---|---|
| Truth | [ConWan30/QorTroller](https://github.com/ConWan30/QorTroller) | receipts, consent, eligibility |
| Observation | [ConWan30/Qoresence](https://github.com/ConWan30/Qoresence) | coupling, Recap, empty glyphs |
| Authorship (this repo) | [ConWan30/QorAct](https://github.com/ConWan30/QorAct) | `HUMAN_AUTHORED` / `AGENT_AUTHORED` / `MIXED` / `UNVERIFIABLE` |

Compose. Do not merge QorAct verdicts into `poep_enabled`, Deck speech, or a ban. SEQGATE on Qoresence already forbids the word *authorship* on observation mouths.

## Honest limits

- `live: false` on every record this candidate issues.
- Outcome-agent (a bot that pulls the trigger) is **`undeployed`**. ClutchBot chat is media, not a trigger pull.
- DualSense left on the PS5 (empty laptop HID) is success for Qoresence and **`UNVERIFIABLE`** here for *outcome* unless a KAS/PoSP reference or bodied+IVC join is present.
- Media v0 kinds: `pixels` and `speech` only. Intent without a file is not a pixels span. Silence is not a speech span.
- No token. No new wallet. `CHAIN_SUBMISSION_PAUSED` stays paused.

## Verify with nothing

```powershell
git clone https://github.com/ConWan30/QorAct.git
cd QorAct
python -m unittest tests/test_qoract.py
python scripts/verify_qoract.py --build --recap path\to\session-recap.json
```

Stdlib only. No secrets. No network.

## Docs

- [Design of record v0.1](docs/qoract-design-of-record-v0.md)
- [Grok Bot profile](docs/GROK_BOT_PROFILE.md) — paste into Grok Bot → Create
- [AGENTS.md](AGENTS.md) — standing orders for `grok` (Grok Build CLI)
