# Grok Build packet — Q-ACT-3b / Q-ACT-4

This sandbox has no `grok` CLI and no Qoresence Deck. A live Recap can only be minted on the capture box.

## On the rig (PowerShell)

```powershell
cd C:\Users\Contr\QorAct
grok -p "Read AGENTS.md. Run python -m unittest discover -s tests -p test_*.py. Stop if red. Do not open a capture card. Do not push main."
```

Windows: `python -m unittest tests/test_qoract.py` used to fail because `tests/` was not a package. `discover` is the packet bar. `tests/__init__.py` also allows `python -m unittest tests.test_qoract`.

## Live session — only if Recap export is missing

```powershell
cd <Qoresence>
python -m qoresence --play --deck
```

Recap → Export → then `python scripts/issue_from_recap.py --recap PATH\session-recap.json --out audits\qact3b_rig_draft.json`.

Refuse: FROZEN ceremony, chain write, QorAct enum on Deck/MCP, OCR engine flip, forbidden signer. DualSense stays on the PS5.
