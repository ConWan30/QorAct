"""Q-ACT-3b sidecar discovery. Missing sidecar is not pixels. Empty HID stays UNVERIFIABLE."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from qoract.recap_door import issue_from_recap_path, recap_door_health
from qoract.record import Rollup, Verdict
from qoract.verify import verify_qoract

FIX = ROOT / "tests" / "fixtures"
RECAP_3B = FIX / "qact3b_session_recap.json"
RECAP_SPEECH = FIX / "qact3b_speech_recap.json"


class TestQact3bSidecar(unittest.TestCase):
    def test_3b_recap_without_sidecar_is_unverifiable_partial_empty_media(self) -> None:
        recap = json.loads(RECAP_3B.read_text(encoding="utf-8"))
        self.assertEqual(recap["schema"], "session-recap-1")
        self.assertEqual(recap["session"], "qoresence_06b8c404882b")
        self.assertEqual(recap["status"], "live")
        self.assertEqual(recap["event_count"], 22)
        self.assertEqual(len(recap["events"]), 22)
        self.assertEqual(recap["linked_clip_count"], 0)
        self.assertTrue(all(ev.get("bodied") is False for ev in recap["events"]))
        rec = issue_from_recap_path(RECAP_3B)
        self.assertFalse(rec.live)
        assert rec.outcome is not None
        self.assertEqual(rec.outcome.verdict, Verdict.UNVERIFIABLE)
        self.assertFalse(rec.outcome.hid_bodied_on_host)
        self.assertFalse(rec.outcome.ivc_joined)
        self.assertEqual(rec.outcome.agent_actuator, "undeployed")
        self.assertEqual(rec.media, ())
        self.assertEqual(rec.rollup, Rollup.PARTIAL_SURFACES)
        health = recap_door_health(rec)
        self.assertFalse(health["sidecar_used"])
        self.assertFalse(health["humanity_claim"])
        self.assertFalse(health["live"])
        self.assertTrue(verify_qoract(rec, recap_payload=recap)["ok"])

    def test_situation_shift_does_not_synthesize_spans(self) -> None:
        rec = issue_from_recap_path(RECAP_3B)
        self.assertEqual(rec.media, ())
        self.assertNotIn("pixels", {s.kind.value for s in rec.media})

    def test_stem_sidecar_authors_speech_only(self) -> None:
        recap = json.loads(RECAP_SPEECH.read_text(encoding="utf-8"))
        rec = issue_from_recap_path(RECAP_SPEECH)
        self.assertFalse(rec.live)
        self.assertEqual(len(rec.media), 1)
        self.assertEqual(rec.media[0].kind.value, "speech")
        self.assertEqual(rec.media[0].verdict, Verdict.AGENT_AUTHORED)
        self.assertEqual(rec.media[0].path, "confirm")
        assert rec.outcome is not None
        self.assertEqual(rec.outcome.verdict, Verdict.UNVERIFIABLE)
        self.assertEqual(rec.rollup, Rollup.COMPLETE)
        health = recap_door_health(rec)
        self.assertTrue(health["sidecar_used"])
        self.assertTrue(verify_qoract(rec, recap_payload=recap)["ok"])

    def test_audits_session_sidecar_discovered(self) -> None:
        recap = json.loads(RECAP_3B.read_text(encoding="utf-8"))
        with tempfile.TemporaryDirectory() as tmp:
            t = Path(tmp)
            recap_p = t / "session-recap.json"
            recap_p.write_text(json.dumps(recap), encoding="utf-8")
            audits = t / "audits"
            audits.mkdir()
            (audits / "qact_actuators_qoresence_06b8c404882b.json").write_text(
                json.dumps(
                    [
                        {
                            "kind": "speech",
                            "commit": True,
                            "path": "confirm",
                            "source": "match_agent",
                            "ticket_id": "tick-audits",
                            "text": "Board locked.",
                        }
                    ]
                ),
                encoding="utf-8",
            )
            rec = issue_from_recap_path(recap_p)
            self.assertEqual(len(rec.media), 1)
            self.assertEqual(rec.media[0].source, "match_agent")
            self.assertTrue(recap_door_health(rec)["sidecar_used"])

    def test_cli_prints_sidecar_used(self) -> None:
        script = ROOT / "scripts" / "issue_from_recap.py"
        with tempfile.TemporaryDirectory() as tmp:
            draft = Path(tmp) / "draft.json"
            out = subprocess.check_output(
                [
                    sys.executable,
                    str(script),
                    "--recap",
                    str(RECAP_3B),
                    "--out",
                    str(draft),
                ],
                text=True,
            )
            health = json.loads(out)
            self.assertIn("sidecar_used", health)
            self.assertFalse(health["sidecar_used"])
            out2 = subprocess.check_output(
                [
                    sys.executable,
                    str(script),
                    "--recap",
                    str(RECAP_SPEECH),
                    "--out",
                    str(draft),
                ],
                text=True,
            )
            health2 = json.loads(out2)
            self.assertTrue(health2["sidecar_used"])


if __name__ == "__main__":
    unittest.main()
