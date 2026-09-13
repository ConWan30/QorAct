# Grok Build packet — Q-ACT-3b / Q-ACT-4

## Autonomous Recap while Con plays

Two windows. Watcher does not import qoresence.

```powershell
cd C:\Users\Contr\Qoresence
python -m qoresence --play --deck
```

```powershell
cd C:\Users\Contr\QorAct
git pull
python scripts/watch_recap_export.py --interval 5 --out-dir audits
```

Grok Build prompt (QorAct tree):

```text
Read AGENTS.md. Do not push main. Do not flip haptic/OCR/wrap flags.
Start: python scripts/watch_recap_export.py --start-deck --qoresence-root C:\Users\Contr\Qoresence --interval 5 --out-dir audits
Leave it running while Con plays. Ctrl+C stops the watcher only; operator stops Deck.
```

DualSense stays on the PS5. `live: false` on every QorAct draft.
