"""Q-ACT-2 Recap door — fail-open, no invented authorship."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from qoract.reader import record_from_dict
from qoract.recap_door import issue_from_recap, issue_from_recap_path, recap_door_health
from qoract.record import Rollup, Verdict
from qoract.verify import verify_qoract


RECAP = {
    "schema": "session-recap-1",
    "ok": True,
    "status": "live",
    "session": "sess-door-1",
    "duration_ms": 12000,
    "event_count": 1,
    "confirmed_event_count": 0,
    "linked_clip_count": 1,
    "incomplete": True,
    "events": [
        {
            "qualification": "observed",
            "clip": {"available": True, "clip_id": "hdmi_clip_aa"},
        }
    ],
    "freshness": {"stale": False},
}


class TestRecapDoor(unittest.TestCase):
    def test_recap_alone_does_not_author_pixels(self) -> None:
        rec = issue_from_recap(RECAP)
        self.assertEqual(rec.session_id, "sess-door-1")
        self.assertFalse(rec.live)
        self.assertFalse(rec.sealed)
        assert rec.outcome is not None
        self.assertEqual(rec.outcome.verdict, Verdict.UNVERIFIABLE)
        self.assertEqual(rec.media, ())
        self.assertEqual(rec.rollup, Rollup.PARTIAL_SURFACES)
        self.assertIn("initiator unknown", rec.hygiene_note)

    def test_producer_status_ignored(self) -> None:
        rec = issue_from_recap(RECAP)
        self.assertTrue(verify_qoract(rec, recap_payload=RECAP)["ok"])

    def test_malformed_payload_fail_open(self) -> None:
        rec = issue_from_recap("not-a-recap")
        self.assertEqual(rec.schema, "qoract-record-1")
        self.assertFalse(rec.live)
        self.assertIn("not an object", rec.hygiene_note)

    def test_missing_file_fail_open(self) -> None:
        rec = issue_from_recap_path("/no/such/recap.json")
        self.assertEqual(rec.schema, "qoract-record-1")
        self.assertIn("unreadable", rec.hygiene_note)

    def test_actuator_log_authors_speech_only(self) -> None:
        rec = issue_from_recap(
            RECAP,
            media_actuator_log=[
                {
                    "kind": "speech",
                    "commit": True,
                    "path": "fast",
                    "source": "clutchbot",
                    "ticket_id": "tick-1",
                    "text": "Clutch window opening.",
                }
            ],
        )
        self.assertEqual(len(rec.media), 1)
        self.assertEqual(rec.media[0].verdict, Verdict.AGENT_AUTHORED)
        self.assertEqual(rec.rollup, Rollup.COMPLETE)

    def test_path_roundtrip_and_health(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            recap_p = Path(tmp) / "recap.json"
            out_p = Path(tmp) / "qoract.json"
            recap_p.write_text(json.dumps(RECAP), encoding="utf-8")
            rec = issue_from_recap_path(recap_p, out_path=out_p)
            self.assertTrue(out_p.is_file())
            loaded = record_from_dict(json.loads(out_p.read_text(encoding="utf-8")))
            assert loaded is not None
            self.assertEqual(loaded.session_id, rec.session_id)
            health = recap_door_health(rec)
            self.assertFalse(health["humanity_claim"])
            self.assertTrue(health["fail_open"])
            self.assertFalse(health["live"])

    def test_reader_null_safe(self) -> None:
        self.assertIsNone(record_from_dict(None))
        self.assertIsNone(record_from_dict("x"))
        rec = record_from_dict({"schema": "qoract-record-1", "rollup": "nope", "media": [1]})
        assert rec is not None
        self.assertEqual(rec.rollup, Rollup.UNVERIFIABLE)
        self.assertEqual(rec.media, ())


if __name__ == "__main__":
    unittest.main()
