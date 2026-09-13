#!/usr/bin/env python3
"""Stranger check. Stdlib only. No network. No secrets."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from qoract import build_qoract, verify_qoract
from qoract.record import QorActRecord, Verdict, Rollup, MediaKind, MediaSpan, OutcomeSurface


def _record_from_dict(d: dict) -> QorActRecord:
    out = d.get("outcome")
    media = []
    for s in d.get("media") or []:
        media.append(
            MediaSpan(
                kind=MediaKind(s["kind"]),
                verdict=Verdict(s["verdict"]),
                commit=bool(s.get("commit")),
                armed=bool(s.get("armed")),
                path=str(s.get("path") or ""),
                source=str(s.get("source") or ""),
                ticket_id=str(s.get("ticket_id") or ""),
                clock_ns=int(s.get("clock_ns") or 0),
                frame_seq=s.get("frame_seq"),
                stem=s.get("stem"),
            )
        )
    outcome = None
    if isinstance(out, dict):
        outcome = OutcomeSurface(
            verdict=Verdict(out["verdict"]),
            agent_actuator=str(out.get("agent_actuator") or "undeployed"),
            kas_commitment=out.get("kas_commitment"),
            kas_verdict=out.get("kas_verdict"),
            hid_bodied_on_host=bool(out.get("hid_bodied_on_host")),
            ivc_joined=bool(out.get("ivc_joined")),
        )
    return QorActRecord(
        schema=str(d.get("schema") or ""),
        live=bool(d.get("live")),
        sealed=bool(d.get("sealed")),
        session_id=d.get("session_id"),
        session_display=str(d.get("session_display") or ""),
        recap_ref=d.get("recap_ref"),
        clock_commitment=d.get("clock_commitment"),
        outcome=outcome,
        media=tuple(media),
        fusion_proof_refs=tuple(d.get("fusion_proof_refs") or []),
        rollup=Rollup(d.get("rollup") or "UNVERIFIABLE"),
        hygiene_note=str(d.get("hygiene_note") or ""),
        honesty=dict(d.get("honesty") or {}),
    )


def main() -> int:
    p = argparse.ArgumentParser(description="Verify a QorAct pack (or build from a Recap).")
    p.add_argument("--record", help="qoract-record-1 JSON")
    p.add_argument("--recap", help="session-recap-1 JSON")
    p.add_argument("--kas", help="expected kas_commitment")
    p.add_argument("--signed-by", dest="signed_by", default="")
    p.add_argument("--build", action="store_true", help="build a draft from --recap and print it")
    args = p.parse_args()

    recap = None
    if args.recap:
        recap = json.loads(Path(args.recap).read_text(encoding="utf-8"))

    if args.build:
        if recap is None:
            print("need --recap to build", file=sys.stderr)
            return 2
        rec = build_qoract(
            session_id=(recap.get("session") or recap.get("session_id")),
            recap_payload=recap,
            signed_by=args.signed_by or None,
        )
        print(json.dumps(rec.to_dict(), indent=2))
        out = verify_qoract(rec, recap_payload=recap, expected_kas_commitment=args.kas)
    else:
        if not args.record:
            print("need --record or --build --recap", file=sys.stderr)
            return 2
        raw = json.loads(Path(args.record).read_text(encoding="utf-8"))
        rec = _record_from_dict(raw)
        out = verify_qoract(
            rec,
            recap_payload=recap,
            expected_kas_commitment=args.kas,
            signed_by=args.signed_by or None,
        )

    print("VERIFY", "OK" if out["ok"] else "FAIL", file=sys.stderr)
    for r in out["reasons"]:
        print(" -", r, file=sys.stderr)
    return 0 if out["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
