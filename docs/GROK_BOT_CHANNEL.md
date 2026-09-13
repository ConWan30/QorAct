# Stand up the QorAct Grok Bot channel

This sandbox cannot click Create. Do this once on the machine that runs Grok Bot.

## 1. Create the six Bots

Grok Bot → **New** → **Create new agent** → **Bot actions → Edit Profile**.

| Name | Title | Profile file |
|---|---|---|
| ActLead | Authorship conductor | `docs/bots/actlead.md` |
| ActDoor | Recap-door clerk | `docs/bots/actdoor.md` |
| ActVerify | Stranger verifier | `docs/bots/actverify.md` |
| ActSpeech | Speech clerk | `docs/bots/actspeech.md` |
| ActPixels | Pixels clerk | `docs/bots/actpixels.md` |
| ActSeal | Seal and honesty clerk | `docs/bots/actseal.md` |

Paste only the fenced `Job:` block from each file into Description.

## 2. Open the channel

**New** → select all six → group chat. Rename it **QorAct**.

Desktop: New chat → pick two to six Bots.
Phone: **+ → New Group Chat**.

## 3. First message (paste)

```
This channel owns QorAct (authorship plane), not Qoresence and not QorTroller.

@ActLead read docs/GROK_BOT_CORPS.md and AGENTS.md in ConWan30/QorAct.
Do not open capture. Do not speak humanity or ban.

Standing work:
- Mid-session: health only if I ask. Otherwise quiet.
- After Recap: @ActDoor issue_from_recap fail-open, then @ActVerify.
- Speech log: @ActSpeech. Clip file: @ActPixels. Seal: @ActSeal.

First task now: clone ConWan30/QorAct, run
python -m unittest discover -s tests -p test_*.py
Report green or red. Do not merge. Do not push main.
```
