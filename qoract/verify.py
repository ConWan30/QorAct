"""Stranger verify. Recompute commitments. Ignore producer status."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from .record import FORBIDDEN_SIGNERS, QorActRecord


def _canonical(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode(
        "utf-8"
    )


def clock_commitment(payload: dict[str, Any] | None) -> str | None:
    if not isinstance(payload, dict):
        return None
    body = dict(payload)
    body.pop("status", None)
    body.pop("producer_status", None)
    return "sha256:" + hashlib.sha256(_canonical(body)).hexdigest()


def verify_qoract(
    record: QorActRecord,
    *,
    recap_payload: dict[str, Any] | None = None,
    expected_kas_commitment: str | None = None,
    signed_by: str | None = None,
) -> dict[str, Any]:
    """Return {ok, reasons[]}. Never trusts record-producer status."""
    reasons: list[str] = []
    if record.schema != "qoract-record-1":
        reasons.append("unknown schema")

    if recap_payload is not None:
        recomputed = clock_commitment(recap_payload)
        if not record.clock_commitment or record.clock_commitment != recomputed:
            reasons.append("clock_commitment does not recompute")

    if expected_kas_commitment:
        got = record.outcome.kas_commitment if record.outcome else None
        if got != expected_kas_commitment:
            reasons.append("kas_commitment reference mismatch")

    if record.sealed:
        signer = (signed_by or "").strip().lower()
        if not signer:
            reasons.append("sealed record missing gamer signer")
        elif signer in FORBIDDEN_SIGNERS:
            reasons.append("forbidden signer")
        if not record.session_id:
            reasons.append("sealed record missing session_id")

    if record.live:
        reasons.append("live:true is not issued by this candidate")

    return {"ok": not reasons, "reasons": reasons}
