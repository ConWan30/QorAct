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
from .reader import record_from_dict
from .recap_door import issue_from_recap, issue_from_recap_path, recap_door_health
from .verify import clock_commitment, verify_qoract

__version__ = "0.2.0"
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
    "record_from_dict",
    "issue_from_recap",
    "issue_from_recap_path",
    "recap_door_health",
]
