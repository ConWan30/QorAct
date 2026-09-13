#!/usr/bin/env python3
"""Poll Qoresence Recap over HTTP and issue a QorAct draft.

Does not import qoresence. Does not join the grab loop.
Optional --start-deck spawns `python -m qoresence --play --deck` as a
sibling process (compose, not merge). Default-OFF extra flags stay off.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from qoract.recap_door import issue_from_recap, recap_door_health


def _get(url: str, timeout: float) -> dict | None:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
        return None


def _write(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")


def _spawn_deck(qoresence_root: Path) -> subprocess.Popen | None:
    if not qoresence_root.is_dir():
        print("no qoresence root", qoresence_root, file=sys.stderr)
        return None
    cmd = [sys.executable, "-m", "qoresence", "--play", "--deck"]
    print("SPAWN", " ".join(cmd), "cwd=", qoresence_root, file=sys.stderr)
    return subprocess.Popen(cmd, cwd=str(qoresence_root))


def main() -> int:
    p = argparse.ArgumentParser(description="Watch Recap and issue QorAct drafts")
    p.add_argument("--base", default="http://127.0.0.1:8765")
    p.add_argument("--interval", type=float, default=5.0)
    p.add_argument("--timeout", type=float, default=2.0)
    p.add_argument("--out-dir", default=str(ROOT / "audits"))
    p.add_argument("--start-deck", action="store_true")
    p.add_argument("--qoresence-root", default="")
    p.add_argument("--once", action="store_true")
    args = p.parse_args()

    child = None
    if args.start_deck:
        root = Path(args.qoresence_root) if args.qoresence_root else Path(r"C:\Users\Contr\Qoresence")
        if not root.is_dir():
            sibling = ROOT.parent / "Qoresence"
            root = sibling if sibling.is_dir() else root
        child = _spawn_deck(root)

    out_dir = Path(args.out_dir)
    recap_url = args.base.rstrip("/") + "/api/session/recap"
    last_key = None
    print("WATCH", recap_url, file=sys.stderr)

    try:
        while True:
            payload = _get(recap_url, args.timeout)
            if payload is None:
                print("WAIT deck", recap_url, file=sys.stderr)
            else:
                schema = payload.get("schema") or payload.get("schema_version")
                session = payload.get("session") or payload.get("session_id") or "unknown"
                events = payload.get("event_count")
                key = (str(schema), str(session), str(events), str(payload.get("status")))
                if key != last_key:
                    last_key = key
                    stamp = time.strftime("%Y%m%dT%H%M%S")
                    recap_path = out_dir / f"session-recap-{stamp}.json"
                    draft_path = out_dir / f"qact3b-draft-{stamp}.json"
                    _write(recap_path, payload)
                    rec = issue_from_recap(payload)
                    _write(draft_path, rec.to_dict())
                    health = recap_door_health(rec)
                    print(json.dumps({"recap": str(recap_path), **health}, indent=2))
            if args.once:
                return 0
            time.sleep(max(0.5, args.interval))
    except KeyboardInterrupt:
        print("STOP watch", file=sys.stderr)
        return 0
    finally:
        if child is not None and child.poll() is None:
            print("Deck process left running (operator stops capture)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
