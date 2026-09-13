"""Q-ACT-2 Recap door — fail-open offline session-recap reader.

Never raises for miss / IO / JSON / schema. Soft-fail only.
A Recap clip link is not authorship. Actuator log is optional.
live Recap issuance stays undeployed.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .build import SCHEMA, build_qoract
from .record import QorActRecord
from .verify import clock_commitment

_SESSION_RECAP_FAMILY = "session-recap"
_SESSION_RECAP_CANON = "session-recap-1"


@dataclass(frozen=True)
class RecapDoorResult:
    ok: bool
    payload: dict | None
    path: str | None
    reasons: tuple[str, ...]


def _schema_token(payload: dict[str, Any]) -> str | None:
    # schema / schema_id / type are Q-ACT-2 door fields; schema_version is Q-ACT-3 hygiene.
    for key in ("schema", "schema_id", "type", "schema_version"):
        if key not in payload:
            continue
        raw = payload.get(key)
        if raw is None:
            continue
        text = str(raw).strip()
        if text:
            return text
    return None


def _is_session_recap_family(token: str) -> bool:
    t = token.strip().lower()
    return t == _SESSION_RECAP_CANON or t.startswith(_SESSION_RECAP_FAMILY)


def _resolved_path_str(path: str | Path) -> str:
    try:
        return str(Path(path).expanduser().resolve())
    except Exception:
        return str(path)


def read_recap_door(path: str | Path | None) -> RecapDoorResult:
    """Read session-recap JSON. NEVER raises for miss/IO/JSON/schema."""
    if path is None or (isinstance(path, str) and not str(path).strip()):
        return RecapDoorResult(
            ok=False,
            payload=None,
            path=None,
            reasons=("recap door miss: no path",),
        )

    resolved = _resolved_path_str(path)
    p = Path(path).expanduser()
    try:
        exists = p.is_file()
    except OSError:
        return RecapDoorResult(
            ok=False,
            payload=None,
            path=resolved,
            reasons=("recap door miss: unreadable",),
        )
    if not exists:
        return RecapDoorResult(
            ok=False,
            payload=None,
            path=resolved,
            reasons=("recap door miss: not found",),
        )

    try:
        text = p.read_text(encoding="utf-8")
    except OSError:
        return RecapDoorResult(
            ok=False,
            payload=None,
            path=resolved,
            reasons=("recap door miss: unreadable",),
        )

    try:
        raw = json.loads(text)
    except json.JSONDecodeError:
        return RecapDoorResult(
            ok=False,
            payload=None,
            path=resolved,
            reasons=("recap door miss: invalid json",),
        )
    except Exception:
        return RecapDoorResult(
            ok=False,
            payload=None,
            path=resolved,
            reasons=("recap door miss: unreadable",),
        )

    if not isinstance(raw, dict):
        return RecapDoorResult(
            ok=False,
            payload=None,
            path=resolved,
            reasons=("recap door miss: not an object",),
        )

    schema = _schema_token(raw)
    if schema is not None and not _is_session_recap_family(schema):
        return RecapDoorResult(
            ok=False,
            payload=raw,
            path=resolved,
            reasons=("recap door miss: unexpected schema",),
        )

    return RecapDoorResult(
        ok=True,
        payload=raw,
        path=resolved,
        reasons=(),
    )


def _session_id(payload: dict[str, Any]) -> str | None:
    for key in ("session_id", "session"):
        raw = payload.get(key)
        if isinstance(raw, dict):
            raw = raw.get("id") or raw.get("session_id")
        text = str(raw or "").strip()
        if text:
            return text
    return None


def _recap_ref(resolved: str | None) -> str | None:
    if not resolved:
        return None
    return f"file:{resolved}"


def build_from_recap_door(path: str | Path | None, **build_kwargs: Any) -> QorActRecord:
    """read_recap_door then build_qoract. Soft-fail on door miss."""
    door = read_recap_door(path)
    safe_keys = {
        "session_display",
        "kas_commitment",
        "kas_verdict",
        "fusion_proof_refs",
        "media_actuator_log",
        "hid_bodied_on_host",
        "ivc_joined",
        "sealed",
        "signed_by",
        "producer_status",
        "hygiene_note",
        "clock_commitment",
    }
    passthrough = {k: v for k, v in build_kwargs.items() if k in safe_keys}

    if not door.ok:
        note_parts: list[str] = []
        existing = str(passthrough.pop("hygiene_note", "") or "").strip()
        if existing:
            note_parts.append(existing)
        if door.reasons:
            note_parts.append("; ".join(door.reasons))
        return build_qoract(
            session_id=None,
            recap_payload=None,
            recap_ref=None,
            hygiene_note="; ".join(note_parts),
            **passthrough,
        )

    payload = door.payload if isinstance(door.payload, dict) else {}
    existing = str(passthrough.pop("hygiene_note", "") or "").strip()
    return build_qoract(
        session_id=_session_id(payload),
        recap_payload=payload,
        recap_ref=_recap_ref(door.path),
        hygiene_note=existing,
        **passthrough,
    )


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
        schema = str(
            recap_payload.get("schema")
            or recap_payload.get("schema_version")
            or ""
        )
        note = hygiene_note
        if schema != "session-recap-1" and not (
            schema and _is_session_recap_family(schema)
        ):
            shown = schema or "missing"
            note = (note + f" unexpected recap schema {shown}").strip()
        stems = _linked_stems(recap_payload)
        if stems and not media_actuator_log:
            note = (
                note
                + f" {len(stems)} linked clip(s) present; initiator unknown so no pixels verdict"
            ).strip()
        return build_qoract(
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
    except Exception as exc:
        return build_qoract(
            session_id=None,
            hygiene_note=f"recap door fail-open: {type(exc).__name__}",
        )


def _load_actuator_log(actuator_log_path: str | Path) -> list[dict[str, Any]] | None:
    try:
        raw = json.loads(Path(actuator_log_path).read_text(encoding="utf-8"))
    except Exception:
        return None
    if isinstance(raw, list):
        return [row for row in raw if isinstance(row, dict)]
    if isinstance(raw, dict) and isinstance(raw.get("spans"), list):
        return [row for row in raw["spans"] if isinstance(row, dict)]
    return None


def issue_from_recap_path(
    recap_path: str | Path,
    *,
    actuator_log_path: str | Path | None = None,
    out_path: str | Path | None = None,
    **kwargs: Any,
) -> QorActRecord:
    """Read Recap JSON from disk. Fail-open. Optional write of the record."""
    door = read_recap_door(recap_path)
    log = _load_actuator_log(actuator_log_path) if actuator_log_path is not None else None

    if door.ok and isinstance(door.payload, dict):
        rec = issue_from_recap(door.payload, media_actuator_log=log, **kwargs)
        _maybe_write(out_path, rec)
        return rec

    # Soft-fail path: keep prior "unreadable" wording for disk misses so stop-hooks stay quiet.
    joined = "; ".join(door.reasons) if door.reasons else "recap door miss"
    if door.payload is not None:
        note = joined
        extra = str(kwargs.get("hygiene_note") or "").strip()
        if extra:
            note = f"{extra} {joined}".strip()
        kw = {k: v for k, v in kwargs.items() if k != "hygiene_note"}
        rec = issue_from_recap(door.payload, media_actuator_log=log, hygiene_note=note, **kw)
        _maybe_write(out_path, rec)
        return rec

    if any(r.endswith("not found") or r.endswith("unreadable") for r in door.reasons):
        note = "recap unreadable: OSError"
    elif any(r.endswith("invalid json") for r in door.reasons):
        note = "recap payload is not an object" if False else (
            "recap unreadable: JSONDecodeError" if any(r.endswith("invalid json") for r in door.reasons) else (
                "recap payload is not an object" if any(r.endswith("not an object") for r in door.reasons) else joined
            )
        )
    elif any(r.endswith("not an object") for r in door.reasons):
        note = "recap payload is not an object"
    else:
        note = joined
    # Fix the botched ternary above - use clean logic matching local file
    if any(r.endswith("not found") or r.endswith("unreadable") for r in door.reasons):
        note = "recap unreadable: OSError"
    elif any(r.endswith("invalid json") for r in door.reasons):
        note = "recap unreadable: JSONDecodeError"
    elif any(r.endswith("not an object") for r in door.reasons):
        note = "recap payload is not an object"
    else:
        note = joined
    rec = build_qoract(session_id=None, hygiene_note=note)
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
