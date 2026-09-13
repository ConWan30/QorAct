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
