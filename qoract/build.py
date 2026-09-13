"""build_qoract — reference-and-bind. Fail closed. No new crypto ground."""

from __future__ import annotations

from typing import Any

from .record import (
    FORBIDDEN_SIGNERS,
    MediaKind,
    MediaSpan,
    OutcomeSurface,
    QorActRecord,
    Rollup,
    Verdict,
)
from .verify import clock_commitment as compute_clock

SCHEMA = "qoract-record-1"
OUTCOME_AGENT = "undeployed"


def _s(v: Any) -> str:
    return str(v or "").strip()


def _classify_media(row: dict[str, Any]) -> MediaSpan | None:
    """Intent without commit is not an authored pixels span.

    Speech silence (hold / empty text) is not a span.
    """
    kind_raw = _s(row.get("kind")).lower()
    if kind_raw not in {MediaKind.PIXELS.value, MediaKind.SPEECH.value}:
        return None
    kind = MediaKind(kind_raw)
    path = _s(row.get("path")) or "absent"
    source = _s(row.get("source")) or "absent"
    ticket_id = _s(row.get("ticket_id"))
    stem = _s(row.get("stem")) or None
    clock_ns = int(row.get("clock_ns") or 0)
    frame_seq = row.get("frame_seq")
    try:
        frame_seq = int(frame_seq) if frame_seq is not None and frame_seq != "" else None
    except (TypeError, ValueError):
        frame_seq = None

    armed = bool(row.get("armed"))
    commit = bool(row.get("commit"))
    operator = bool(row.get("operator_post") or path == "operator" or source in {"studio", "operator"})
    agent = source in {
        "arm",
        "local_hdmi",
        "agent_clip",
        "clutchbot",
        "match_agent",
        "mcp",
        "fast_moment",
    } or path in {"fast", "confirm"}
    leftover = path == "leftover" or source == "twitch_clip"

    if kind is MediaKind.SPEECH:
        text = _s(row.get("text"))
        if path == "hold" or not text or not commit:
            return None
        if not ticket_id:
            verdict = Verdict.UNVERIFIABLE
        elif operator and agent:
            verdict = Verdict.MIXED
        elif operator:
            verdict = Verdict.HUMAN_AUTHORED
        elif agent:
            verdict = Verdict.AGENT_AUTHORED
        else:
            verdict = Verdict.UNVERIFIABLE
        return MediaSpan(
            kind=kind,
            verdict=verdict,
            commit=True,
            armed=False,
            path=path,
            source=source,
            ticket_id=ticket_id,
            clock_ns=clock_ns,
            frame_seq=frame_seq,
            stem=None,
        )

    # pixels
    if not commit or not stem:
        return None
    if leftover:
        verdict = Verdict.AGENT_AUTHORED
        path = "leftover"
    elif operator and agent:
        verdict = Verdict.MIXED
    elif operator:
        verdict = Verdict.HUMAN_AUTHORED
    elif agent:
        verdict = Verdict.AGENT_AUTHORED
    else:
        verdict = Verdict.UNVERIFIABLE
    if bool(row.get("locked_score_delta")) and not operator:
        verdict = Verdict.MIXED
    return MediaSpan(
        kind=kind,
        verdict=verdict,
        commit=True,
        armed=armed,
        path=path,
        source=source,
        ticket_id=ticket_id,
        clock_ns=clock_ns,
        frame_seq=frame_seq,
        stem=stem,
    )


def _outcome(
    *,
    kas_commitment: str | None,
    kas_verdict: str | None,
    hid_bodied_on_host: bool,
    ivc_joined: bool,
) -> OutcomeSurface:
    kas = _s(kas_commitment) or None
    kv = _s(kas_verdict) or None
    if kas:
        verdict = Verdict.HUMAN_AUTHORED
    elif hid_bodied_on_host and ivc_joined:
        verdict = Verdict.HUMAN_AUTHORED
    else:
        verdict = Verdict.UNVERIFIABLE
    return OutcomeSurface(
        verdict=verdict,
        agent_actuator=OUTCOME_AGENT,
        kas_commitment=kas,
        kas_verdict=kv,
        hid_bodied_on_host=bool(hid_bodied_on_host),
        ivc_joined=bool(ivc_joined),
    )


def _rollup(outcome: OutcomeSurface | None, media: tuple[MediaSpan, ...]) -> Rollup:
    if outcome is None and not media:
        return Rollup.UNVERIFIABLE
    if outcome is None or not media:
        return Rollup.PARTIAL_SURFACES
    if outcome.verdict is Verdict.UNVERIFIABLE and all(
        s.verdict is Verdict.UNVERIFIABLE for s in media
    ):
        return Rollup.UNVERIFIABLE
    return Rollup.COMPLETE


def build_qoract(
    *,
    session_id: str | None,
    session_display: str = "",
    recap_payload: dict[str, Any] | None = None,
    recap_ref: str | None = None,
    clock_commitment: str | None = None,
    kas_commitment: str | None = None,
    kas_verdict: str | None = None,
    fusion_proof_refs: list[str] | None = None,
    media_actuator_log: list[dict[str, Any]] | None = None,
    hid_bodied_on_host: bool = False,
    ivc_joined: bool = False,
    sealed: bool = False,
    signed_by: str | None = None,
    producer_status: str | None = None,
    hygiene_note: str = "",
) -> QorActRecord:
    """Build a frozen record. producer_status is ignored on purpose."""
    _ = producer_status
    sid = _s(session_id) or None
    payload = recap_payload if isinstance(recap_payload, dict) else None
    computed = compute_clock(payload) if payload is not None else _s(clock_commitment) or None
    given = _s(clock_commitment) or None
    if given and computed and given != computed:
        computed = given
        clock_ok = False
    else:
        clock_ok = True
        if computed is None:
            computed = given

    signer = _s(signed_by).lower()
    if sealed and (not signer or signer in FORBIDDEN_SIGNERS):
        sealed_ok = False
    else:
        sealed_ok = True

    if sealed and not sid:
        outcome = _outcome(
            kas_commitment=None,
            kas_verdict=None,
            hid_bodied_on_host=False,
            ivc_joined=False,
        )
        media: tuple[MediaSpan, ...] = ()
        rollup = Rollup.UNVERIFIABLE
        note = "pre-U1 sealed pack has no session_id"
    else:
        outcome = _outcome(
            kas_commitment=kas_commitment,
            kas_verdict=kas_verdict,
            hid_bodied_on_host=hid_bodied_on_host,
            ivc_joined=ivc_joined,
        )
        spans: list[MediaSpan] = []
        for row in media_actuator_log or []:
            if isinstance(row, dict):
                span = _classify_media(row)
                if span is not None:
                    spans.append(span)
        media = tuple(spans)
        rollup = _rollup(outcome, media)
        note = hygiene_note

    if not clock_ok:
        rollup = Rollup.UNVERIFIABLE
        note = (note + " clock_commitment mismatch").strip()
    if sealed and not sealed_ok:
        rollup = Rollup.UNVERIFIABLE
        note = (note + " forbidden or missing gamer signer").strip()

    return QorActRecord(
        schema=SCHEMA,
        live=False,
        sealed=bool(sealed) and sealed_ok,
        session_id=sid,
        session_display=_s(session_display),
        recap_ref=_s(recap_ref) or None,
        clock_commitment=computed,
        outcome=outcome,
        media=media,
        fusion_proof_refs=tuple(_s(x) for x in (fusion_proof_refs or []) if _s(x)),
        rollup=rollup,
        hygiene_note=note,
        honesty={
            "outcome_agent_actuator": OUTCOME_AGENT,
            "producer_status_ignored": True,
            "kinds_v0": ["pixels", "speech"],
            "edit_publish_narrative": "undeployed",
            "deployed_verified": [],
            "emulated": ["build_qoract offline"],
            "undeployed": [
                "outcome.agent_actuator",
                "kind=edit",
                "kind=publish",
                "kind=narrative",
                "live Recap issuance",
            ],
        },
    )
