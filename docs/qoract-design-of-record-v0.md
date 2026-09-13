# QorAct — design of record v0.1 (CANDIDATE)

**Status:** CANDIDATE code on `ConWan30/QorAct`. Not a FROZEN family. `live: false`.
**Date:** 2026-09-13

Third claim class: who or what actuated this span. Compose Qoresence Recap + optional QorTroller KAS/PoSP hashes. Do not merge verdicts into `poep_enabled`, eligibility, humanity, or ban.

Reference-and-bind only. No new domain tag. No PV-CI ceremony. No chain writes. Same deployer wallet.

Two surfaces:

- `outcome_authorship` — pad ↔ named game event. Agent actuator **undeployed**. DualSense-on-PS5 ⇒ `UNVERIFIABLE` unless KAS/PoSP ref or bodied+IVC.
- `media_authorship` — v0 kinds `pixels` + `speech`. Intent without a file is not a pixels span. `path=hold` is not a speech span.

Enum: `HUMAN_AUTHORED` | `AGENT_AUTHORED` | `MIXED` | `UNVERIFIABLE`
Rollup: `COMPLETE` | `PARTIAL_SURFACES` | `UNVERIFIABLE`

Preferred door: Recap export → optional Clock Notary (`I am the gamer`) → `build_qoract`. Forbidden signers: bridge, operator, qoresence, qortroller, qoract.

Q-ACT-2 Recap door lifted: `issue_from_recap` / `scripts/issue_from_recap.py`. Fail-open. Clip links do not mint pixels verdicts. Do not import this into the Qoresence grab loop.

Q-ACT-3 offline archived Recap HOLD. Q-ACT-4 live bar ask-before-launch. Do not speak QorAct enums on Qoresence Deck/MCP (SEQGATE vocab veto).
