# QorAct

**Authorship plane** for the Qor family. CANDIDATE v0.2. Not anti-cheat. Not observation. Not a humanity proof.

QorAct answers one question about a session span:

**Who made this act — the gamer, a bot, both, or we do not know?**

| Plane | Repo | Speaks |
|---|---|---|
| Truth | [ConWan30/QorTroller](https://github.com/ConWan30/QorTroller) | receipts, consent, eligibility |
| Observation | [ConWan30/Qoresence](https://github.com/ConWan30/Qoresence) | coupling, Recap, empty glyphs |
| Authorship (this repo) | [ConWan30/QorAct](https://github.com/ConWan30/QorAct) | `HUMAN_AUTHORED` / `AGENT_AUTHORED` / `MIXED` / `UNVERIFIABLE` |

## Verify

```powershell
cd C:\Users\Contr\QorAct
python -m unittest discover -s tests -p "test_*.py"
python scripts/issue_from_recap.py --recap path\to\session-recap.json --out qoract-draft.json
```

A linked Foundry clip is not an authorship verdict. The Recap door (`read_recap_door`) is fail-open on miss/bad JSON so verify never tracebacks. `scripts/issue_from_recap.py` stays exit 0 so a stop hook cannot take down capture. `live: false` on every candidate record.
