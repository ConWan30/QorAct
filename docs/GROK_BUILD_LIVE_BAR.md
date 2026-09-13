# Grok Build packet — Q-ACT-3b / Q-ACT-4

This sandbox has no `grok` CLI and no Qoresence Deck. A live Recap can only be minted on the capture box.

## On the rig (PowerShell)

```powershell
cd $HOME\src\QorAct
grok -p "Read AGENTS.md. Run python -m unittest tests/test_qoract.py tests/test_recap_door.py tests/test_qact3_offline.py. Stop if red. Do not open a capture card. Do not push main."
```

## Live session — only if Recap export is missing

```powershell
cd $HOME\src\Qoresence
python -m qoresence --play --deck
```

Then Recap → Export recap → `session-recap.json`. DualSense stays on the PS5.

```powershell
cd $HOME\src\QorAct
python scripts/issue_from_recap.py --recap PATH\session-recap.json --out audits\qact3b_rig_draft.json
python scripts/verify_qoract.py --record audits\qact3b_rig_draft.json --recap PATH\session-recap.json
```

Pass bars: `session-recap-1`; door exit 0; `live: false`; `humanity_claim: false`; outcome `UNVERIFIABLE` without KAS/bodied+IVC; clip link is not pixels authorship.

Refuse: FROZEN ceremony, chain write, QorAct enum on Deck/MCP, OCR engine flip, forbidden signer.
