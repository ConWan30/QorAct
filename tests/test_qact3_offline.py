"""Q-ACT-3 offline door on Qoresence-archived Recap contracts.

These fixtures are in-repo Qoresence test contracts, not a laptop hour.
A linked clip still does not mint pixels authorship.
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from qoract.recap_door import issue_from_recap_path, recap_door_health
from qoract.record import Rollup, Verdict
from qoract.verify import verify_qoract

FIX = ROOT / "fixtures"


class TestQact3Offline(unittest.TestCase):
    def test_bodied_locked_partial_no_pixels(self) -> None:
        recap = json.loads((FIX / "qoresence_bodied_locked_recap.json").read_text())
        rec = issue_from_recap_path(FIX / "qoresence_bodied_locked_recap.json")
        self.assertEqual(rec.session_id, "1842")
        self.assertFalse(rec.live)
        assert rec.outcome is not None
        self.assertEqual(rec.outcome.verdict, Verdict.UNVERIFIABLE)
        self.assertEqual(rec.media, ())
        self.assertEqual(rec.rollup, Rollup.PARTIAL_SURFACES)
        self.assertTrue(verify_qoract(rec, recap_payload=recap)["ok"])

    def test_clip_link_does_not_author_pixels(self) -> None:
        rec = issue_from_recap_path(FIX / "qoresence_clip_linked_recap.json")
        self.assertEqual(rec.media, ())
        self.assertIn("initiator unknown", rec.hygiene_note)
        self.assertEqual(rec.rollup, Rollup.PARTIAL_SURFACES)

    def test_wrong_schema_still_issues(self) -> None:
        rec = issue_from_recap_path(FIX / "qoresence_observation_journal_not_recap.json")
        self.assertEqual(rec.schema, "qoract-record-1")
        self.assertIn("unexpected recap schema", rec.hygiene_note)
        health = recap_door_health(rec)
        self.assertTrue(health["issued"])
        self.assertTrue(health["fail_open"])
        self.assertFalse(health["humanity_claim"])
        self.assertFalse(health["live"])


if __name__ == "__main__":
    unittest.main()
