"""Additive SDK reader. Null-safe. Does not issue."""

from __future__ import annotations

from typing import Any

from .record import (
    MediaKind,
    MediaSpan,
    OutcomeSurface,
    QorActRecord,
    Rollup,
    Verdict,
)


def _verdict(v: Any, default: Verdict = Verdict.UNVERIFIABLE) -> Verdict:
    try:
        return Verdict(str(v))
    except ValueError:
        return default


def _rollup(v: Any) -> Rollup:
    try:
        return Rollup(str(v))
    except ValueError:
        return Rollup.UNVERIFIABLE


def record_from_dict(d: Any) -> QorActRecord | None:
    """Return a record or None if the payload is not an object."""
    if not isinstance(d, dict):
        return None
    out = d.get("outcome")
    media: list[MediaSpan] = []
    for s in d.get("media") or []:
        if not isinstance(s, dict):
            continue
        try:
            kind = MediaKind(str(s.get("kind")))
        except ValueError:
            continue
        media.append(
            MediaSpan(
                kind=kind,
                verdict=_verdict(s.get("verdict")),
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
            verdict=_verdict(out.get("verdict")),
            agent_actuator=str(out.get("agent_actuator") or "undeployed"),
            kas_commitment=out.get("kas_commitment"),
            kas_verdict=out.get("kas_verdict"),
            hid_bodied_on_host=bool(out.get("hid_bodied_on_host")),
            ivc_joined=bool(out.get("ivc_joined")),
        )
    try:
        rollup = _rollup(d.get("rollup"))
    except Exception:
        rollup = Rollup.UNVERIFIABLE
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
        fusion_proof_refs=tuple(
            str(x) for x in (d.get("fusion_proof_refs") or []) if str(x)
        ),
        rollup=rollup,
        hygiene_note=str(d.get("hygiene_note") or ""),
        honesty=dict(d.get("honesty") or {}) if isinstance(d.get("honesty"), dict) else {},
    )
