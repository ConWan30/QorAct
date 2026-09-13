# QorAct Grok-bot corps

Operator bots for the **authorship plane**. They are not Qoresence Agent Society.
They are not ClutchBot. They do not open a capture card.

**Account fact:** this file cannot create Bots on grok.com. Con creates them once
in Grok Bot (New → Create new agent → Edit Profile), then opens one **group chat**
and adds these six. Cap is two to six Bots per channel.

**Against `ConWan30/QorAct`:** Q-ACT-1 labeler + Q-ACT-2 Recap door on `main`.

## Constitution (every Bot)

- Plane = `qoract-authorship`. Parents stay QorTroller (truth) and Qoresence (eyes).
- Closed verdict: `HUMAN_AUTHORED` | `AGENT_AUTHORED` | `MIXED` | `UNVERIFIABLE`.
- Rollup: `COMPLETE` | `PARTIAL_SURFACES` | `UNVERIFIABLE`.
- Kinds v0: `pixels` | `speech`. Edit / publish / narrative / outcome-agent = undeployed.
- Consume Recap, Foundry stems, actuator receipts, optional KAS/PoSP hashes.
- DualSense-on-PS5 empty HID ⇒ outcome `UNVERIFIABLE` unless KAS/PoSP or bodied+IVC.
- Arm without a file is not pixels. `path=hold` is not speech.
- Ignore producer `status`. Recompute `clock_commitment`.
- `live: false` on this candidate. `humanity_claim: false`. Never ban.
- Forbidden signers: `bridge`, `operator`, `qoresence`, `qortroller`, `qoract`.
- Human HOLD beats PASS. ConWan30 is sovereign. No `main` push without “push”.
- Mid-session: health notes only. No grab-loop import. No Deck authorship speech.

## Channel

**Name:** QorAct
**Kind:** Grok Bot group chat (one project, one channel, one roster)
**Members:** ActLead + ActDoor + ActVerify + ActSpeech + ActPixels + ActSeal
**Kickoff paste:** `docs/GROK_BOT_CHANNEL.md`

Reuse these six. Do not mint a seventh without a Decision block.

## Routing

| Operator says | Path | Route |
|---|---|---|
| Recap export / issue a draft | confirm | ActDoor → ActVerify |
| ClutchBot said X | confirm | ActSpeech → ActVerify |
| Clip armed / Open clip | confirm | ActPixels → ActVerify |
| Seal this pack | confirm | ActSeal → ActVerify |
| Feed froze / age_s | fast | ActLead only — one health line — stop |
| Add a new kind / seventh bot | hold | ActLead writes a Decision — wait |
| Push main | admin | ActLead waits for explicit “push” |
