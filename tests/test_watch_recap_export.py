"""Watcher talks HTTP only. No capture card."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

_spec = importlib.util.spec_from_file_location(
    "watch_recap_export", ROOT / "scripts" / "watch_recap_export.py"
)
assert _spec and _spec.loader
watch = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(watch)

RECAP = {
    "schema": "session-recap-1",
    "ok": True,
    "status": "live",
    "session": "watch-1",
    "event_count": 2,
    "events": [],
}


class _Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        body = json.dumps(RECAP).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_a: object) -> None:
        return


class TestWatchRecap(unittest.TestCase):
    def test_once_writes_draft(self) -> None:
        httpd = HTTPServer(("127.0.0.1", 0), _Handler)
        port = httpd.server_address[1]
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        try:
            with tempfile.TemporaryDirectory() as tmp:
                argv = sys.argv
                sys.argv = [
                    "watch_recap_export.py",
                    "--base",
                    f"http://127.0.0.1:{port}",
                    "--once",
                    "--out-dir",
                    tmp,
                ]
                try:
                    code = watch.main()
                finally:
                    sys.argv = argv
                self.assertEqual(code, 0)
                drafts = list(Path(tmp).glob("qact3b-draft-*.json"))
                self.assertEqual(len(drafts), 1)
                draft = json.loads(drafts[0].read_text(encoding="utf-8"))
                self.assertEqual(draft["session_id"], "watch-1")
                self.assertFalse(draft["live"])
        finally:
            httpd.shutdown()


if __name__ == "__main__":
    unittest.main()
