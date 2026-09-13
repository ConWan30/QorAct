"""Fail-closed bars for QorAct v0.1. Stdlib unittest."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from qoract import build_qoract, clock_commitment, verify_qoract
from qoract.record import Rollup, Verdict


RECAP = {
    "schema": "session-recap-1",
    "session": "sess-live-1",
    "event_count": 2,
    "status": "live",
}


class TestQorAct(unittest.TestCase):
    def test_determinism(self) -> None:
        a = build_qoract(session_id="s1", session_display="a", recap_payload=RECAP)
        b = build_qoract(session_id="s1", session_display="a", recap_payload=RECAP)
        self.assertEqual(a.to_dict(), b.to_dict())
        self.assertEqual(a.clock_commitment, clock_commitment(RECAP))

    def test_producer_status_ignored_in_commitment(self) -> None:
        dirty = dict(RECAP)
        dirty["status"] = "FORGED_OK"
        self.assertEqual(clock_commitment(RECAP), clock_commitment(dirty))

    def test_empty_hid_without_kas_is_unverifiable_outcome(self) -> None:
        rec = build_qoract(
            session_id="s1",
            recap_payload=RECAP,
            hid_bodied_on_host=False,
            ivc_joined=False,
        )
        assert rec.outcome is not None
        self.assertEqual(rec.outcome.verdict, Verdict.UNVERIFIABLE)
        self.assertEqual(rec.outcome.agent_actuator, "undeployed")
        self.assertEqual(rec.rollup, Rollup.PARTIAL_SURFACES)

    def test_hid_without_ivc_still_unverifiable(self) -> None:
        rec = build_qoract(session_id="s1", hid_bodied_on_host=True, ivc_joined=False)
        assert rec.outcome is not None
        self.assertEqual(rec.outcome.verdict, Verdict.UNVERIFIABLE)

    def test_kas_reference_allows_human_outcome(self) -> None:
        rec = build_qoract(
            session_id="s1",
            kas_commitment="sha256:abc",
            kas_verdict="INSUFFICIENT_KILLS",
        )
        assert rec.outcome is not None
        self.assertEqual(rec.outcome.verdict, Verdict.HUMAN_AUTHORED)

    def test_tampered_kas_fails_verify(self) -> None:
        rec = build_qoract(session_id="s1", kas_commitment="sha256:abc")
        out = verify_qoract(rec, expected_kas_commitment="sha256:OTHER")
        self.assertFalse(out["ok"])
        self.assertIn("kas_commitment reference mismatch", out["reasons"])

    def test_clock_recompute(self) -> None:
        rec = build_qoract(session_id="s1", recap_payload=RECAP)
        self.assertTrue(verify_qoract(rec, recap_payload=RECAP)["ok"])
        forged = dict(RECAP)
        forged["event_count"] = 99
        self.assertFalse(verify_qoract(rec, recap_payload=forged)["ok"])

    def test_arm_without_file_is_not_pixels_span(self) -> None:
        rec = build_qoract(
            session_id="s1",
            media_actuator_log=[
                {
                    "kind": "pixels",
                    "armed": True,
                    "commit": False,
                    "path": "fast",
                    "source": "arm",
                    "stem": "",
                }
            ],
        )
        self.assertEqual(rec.media, ())

    def test_fast_speech_is_agent(self) -> None:
        rec = build_qoract(
            session_id="s1",
            media_actuator_log=[
                {
                    "kind": "speech",
                    "commit": True,
                    "path": "fast",
                    "source": "clutchbot",
                    "ticket_id": "QORESENCE-COUPLING-TICKET-v0-1",
                    "text": "Clutch window opening.",
                }
            ],
        )
        self.assertEqual(len(rec.media), 1)
        self.assertEqual(rec.media[0].verdict, Verdict.AGENT_AUTHORED)

    def test_hold_speech_is_not_a_span(self) -> None:
        rec = build_qoract(
            session_id="s1",
            media_actuator_log=[
                {"kind": "speech", "commit": True, "path": "hold", "text": "Unlabeled."}
            ],
        )
        self.assertEqual(rec.media, ())

    def test_operator_clip_is_human_pixels(self) -> None:
        rec = build_qoract(
            session_id="s1",
            media_actuator_log=[
                {
                    "kind": "pixels",
                    "commit": True,
                    "operator_post": True,
                    "path": "operator",
                    "source": "studio",
                    "stem": "hdmi_clip_aa",
                }
            ],
        )
        self.assertEqual(rec.media[0].verdict, Verdict.HUMAN_AUTHORED)

    def test_operator_and_fast_clip_is_mixed(self) -> None:
        rec = build_qoract(
            session_id="s1",
            media_actuator_log=[
                {
                    "kind": "pixels",
                    "commit": True,
                    "operator_post": True,
                    "path": "fast",
                    "source": "local_hdmi",
                    "stem": "hdmi_clip_bb",
                    "armed": True,
                }
            ],
        )
        self.assertEqual(rec.media[0].verdict, Verdict.MIXED)

    def test_forbidden_signer_unseals(self) -> None:
        rec = build_qoract(session_id="s1", sealed=True, signed_by="operator")
        self.assertFalse(rec.sealed)
        self.assertEqual(rec.rollup, Rollup.UNVERIFIABLE)

    def test_sealed_pre_u1_unverifiable(self) -> None:
        rec = build_qoract(session_id=None, sealed=True, signed_by="ConWanZo")
        self.assertEqual(rec.rollup, Rollup.UNVERIFIABLE)

    def test_live_flag_fails_verify(self) -> None:
        rec = build_qoract(session_id="s1")
        self.assertFalse(rec.live)
        self.assertTrue(verify_qoract(rec)["ok"])


if __name__ == "__main__":
    unittest.main()
