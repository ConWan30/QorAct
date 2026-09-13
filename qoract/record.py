"""Frozen record types. Closed enums. No inference helpers here."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class Verdict(str, Enum):
    HUMAN_AUTHORED = "HUMAN_AUTHORED"
    AGENT_AUTHORED = "AGENT_AUTHORED"
    MIXED = "MIXED"
    UNVERIFIABLE = "UNVERIFIABLE"


class Rollup(str, Enum):
    """Record-level only. Never a fifth inferred authorship state."""

    COMPLETE = "COMPLETE"
    PARTIAL_SURFACES = "PARTIAL_SURFACES"
    UNVERIFIABLE = "UNVERIFIABLE"


class MediaKind(str, Enum):
    PIXELS = "pixels"
    SPEECH = "speech"


FORBIDDEN_SIGNERS = frozenset(
    {"bridge", "operator", "qoresence", "qortroller", "qoract"}
)


@dataclass(frozen=True)
class OutcomeSurface:
    verdict: Verdict
    agent_actuator: str
    kas_commitment: str | None
    kas_verdict: str | None
    hid_bodied_on_host: bool
    ivc_joined: bool


@dataclass(frozen=True)
class MediaSpan:
    kind: MediaKind
    verdict: Verdict
    commit: bool
    armed: bool
    path: str
    source: str
    ticket_id: str
    clock_ns: int
    frame_seq: int | None
    stem: str | None


@dataclass(frozen=True)
class QorActRecord:
    schema: str
    live: bool
    sealed: bool
    session_id: str | None
    session_display: str
    recap_ref: str | None
    clock_commitment: str | None
    outcome: OutcomeSurface | None
    media: tuple[MediaSpan, ...]
    fusion_proof_refs: tuple[str, ...]
    rollup: Rollup
    hygiene_note: str
    honesty: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema": self.schema,
            "live": self.live,
            "sealed": self.sealed,
            "session_id": self.session_id,
            "session_display": self.session_display,
            "recap_ref": self.recap_ref,
            "clock_commitment": self.clock_commitment,
            "outcome": None
            if self.outcome is None
            else {
                "verdict": self.outcome.verdict.value,
                "agent_actuator": self.outcome.agent_actuator,
                "kas_commitment": self.outcome.kas_commitment,
                "kas_verdict": self.outcome.kas_verdict,
                "hid_bodied_on_host": self.outcome.hid_bodied_on_host,
                "ivc_joined": self.outcome.ivc_joined,
            },
            "media": [
                {
                    "kind": s.kind.value,
                    "verdict": s.verdict.value,
                    "commit": s.commit,
                    "armed": s.armed,
                    "path": s.path,
                    "source": s.source,
                    "ticket_id": s.ticket_id,
                    "clock_ns": s.clock_ns,
                    "frame_seq": s.frame_seq,
                    "stem": s.stem,
                }
                for s in self.media
            ],
            "fusion_proof_refs": list(self.fusion_proof_refs),
            "rollup": self.rollup.value,
            "hygiene_note": self.hygiene_note,
            "honesty": dict(self.honesty),
        }
