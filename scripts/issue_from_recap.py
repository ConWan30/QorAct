#!/usr/bin/env python3
"""Fail-open Recap door. Safe to call from a session stop hook.

Does not open capture. Writes a draft JSON or prints it.
Exit 0 even when the record is UNVERIFIABLE — that is honest issuance.
Exit 2 only when the caller omitted --recap.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from qoract.recap_door import issue_from_recap_path, recap_door_health


def main() -> int:
    p = argparse.ArgumentParser(description="Issue a QorAct draft from session-recap-1")
    p.add_argument("--recap", required=True, help="path to session-recap-1 JSON")
    p.add_argument("--actuators", help="optional media actuator log JSON")
    p.add_argument("--out", help="write qoract-record-1 JSON here")
    p.add_argument("--kas", help="optional kas_commitment reference")
    p.add_argument("--signed-by", dest="signed_by", default="")
    p.add_argument("--sealed", action="store_true")
    args = p.parse_args()

    rec = issue_from_recap_path(
        args.recap,
        actuator_log_path=args.actuators,
        out_path=args.out,
        kas_commitment=args.kas,
        signed_by=args.signed_by or None,
        sealed=bool(args.sealed),
    )
    health = recap_door_health(rec)
    print(json.dumps(health, indent=2))
    if args.out is None:
        print(json.dumps(rec.to_dict(), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
