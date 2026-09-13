"""Q-ACT-2 Recap door — fail-open issuance from session-recap-1.

Never opens capture. Never raises to the caller.
A Recap clip link is not authorship. Actuator log is optional.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .build import SCHEMA, build_qoract
from .record import QorActRecord
from .verify import clock_commitment


def _session_id(payload: dict[str, Any]) -> str | None:
    for key in ("session_id", "session"):
        raw = payload.get(key)
        if isinstance(raw, dict):
            raw = raw.get("id") or raw.get("session_id")
        text = str(raw or "").strip()
        if text:
            return text
    return None


def _load_json(path: str | Path) -> Any:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _linked_stems(payload: dict[str, Any]) -> list[str]:
    stems: list[str] = []
    events = payload.get("events")
    if not isinstance(events, list):
        return stems
    for ev in events:
        if not isinstance(ev, dict):
            continue
        clip = ev.get("clip")
        if not isinstance(clip, dict) or not clip.get("available"):
            continue
        stem = str(clip.get("clip_id") or clip.get("stem") or "").strip()
        if stem.startswith("hdmi_clip_"):
            stems.append(stem)
    return stems


def issue_from_recap(
    recap_payload: Any,
    *,
    media_actuator_log: list[dict[str, Any]] | None = None,
    kas_commitment: str | None = None,
    kas_verdict: str | None = None,
    fusion_proof_refs: list[str] | None = None,
    hid_bodied_on_host: bool = False,
    ivc_joined: bool = False,
    sealed: bool = False,
    signed_by: str | None = None,
    hygiene_note: str = "",
) -> QorActRecord:
    """Build a draft from a Recap object. Fail-open: never raises."""
    try:
        if not isinstance(recap_payload, dict):
            return build_qoract(
                session_id=None,
                hygiene_note="recap payload is not an object",
            )
        schema = str(recap_payload.get("schema") or "")
        note = hygiene_note
        if schema and schema != "session-recap-1":
            note = (note + f" unexpected recap schema {schema}").strip()
        stems = _linked_stems(recap_payload)
        if stems and not media_actuator_log:
            note = (
                note
                + f" {len(stems)} linked clip(s) present; initiator unknown so no pixels verdict"
            ).strip()
        rec = build_qoract(
            session_id=_session_id(recap_payload),
            session_display=str(
                recap_payload.get("session_display") or recap_payload.get("session") or ""
            ),
            recap_payload=recap_payload,
            recap_ref=clock_commitment(recap_payload),
            kas_commitment=kas_commitment,
            kas_verdict=kas_verdict,
            fusion_proof_refs=fusion_proof_refs,
            media_actuator_log=media_actuator_log,
            hid_bodied_on_host=hid_bodied_on_host,
            ivc_joined=ivc_joined,
            sealed=sealed,
            signed_by=signed_by,
            producer_status=str(recap_payload.get("status") or ""),
            hygiene_note=note,
        )
        return rec
    except Exception as exc:
        return build_qoract(
            session_id=None,
            hygiene_note=f"recap door fail-open: {type(exc).__name__}",
        )


def issue_from_recap_path(
    recap_path: str | Path,
    *,
    actuator_log_path: str | Path | None = None,
    out_path: str | Path | None = None,
    **kwargs: Any,
) -> QorActRecord:
    """Read Recap JSON from disk. Fail-open. Optional write of the record."""
    try:
        payload = _load_json(recap_path)
    except Exception as exc:
        rec = build_qoract(
            session_id=None,
            hygiene_note=f"recap unreadable: {type(exc).__name__}",
        )
        _maybe_write(out_path, rec)
        return rec
    log: list[dict[str, Any]] | None = None
    if actuator_log_path is not None:
        try:
            raw = _load_json(actuator_log_path)
            if isinstance(raw, list):
                log = [row for row in raw if isinstance(row, dict)]
            elif isinstance(raw, dict) and isinstance(raw.get("spans"), list):
                log = [row for row in raw["spans"] if isinstance(row, dict)]
        except Exception:
            log = None
    rec = issue_from_recap(payload, media_actuator_log=log, **kwargs)
    _maybe_write(out_path, rec)
    return rec


def _maybe_write(out_path: str | Path | None, rec: QorActRecord) -> None:
    if out_path is None:
        return
    try:
        Path(out_path).write_text(
            json.dumps(rec.to_dict(), indent=2) + "\n", encoding="utf-8"
        )
    except Exception:
        return


def recap_door_health(rec: QorActRecord) -> dict[str, Any]:
    """Issuance health for a stop-hook. Never a ban or humanity flag."""
    return {
        "schema": rec.schema if rec.schema == SCHEMA else "unknown",
        "live": rec.live,
        "sealed": rec.sealed,
        "rollup": rec.rollup.value,
        "outcome": None if rec.outcome is None else rec.outcome.verdict.value,
        "media_spans": len(rec.media),
        "issued": rec.schema == SCHEMA,
        "fail_open": True,
        "humanity_claim": False,
    }
