"""QorAct — authorship-plane labeler (CANDIDATE).

Reference-and-bind only. Mints no FROZEN-v1 primitive.
Compose Qoresence Recap + optional QorTroller commitments.
Never humanity, eligibility, ban, or heat speech.
"""

from .record import (
    MediaKind,
    MediaSpan,
    OutcomeSurface,
    QorActRecord,
    Rollup,
    Verdict,
)
from .build import build_qoract
from .verify import clock_commitment, verify_qoract

__version__ = "0.1.0"
__all__ = [
    "MediaKind",
    "MediaSpan",
    "OutcomeSurface",
    "QorActRecord",
    "Rollup",
    "Verdict",
    "build_qoract",
    "clock_commitment",
    "verify_qoract",
]
