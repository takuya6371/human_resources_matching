#!/usr/bin/env python3
"""Serve this folder with caching turned off.

Plain `python3 -m http.server` lets the browser hold on to old copies of the
JavaScript, which during a demo looks exactly like a broken feature — a rule you
just changed appears not to work, and a hard reload does not fix it because
module caching ignores that. This sends no-store on everything.

    python3 serve.py            # http://localhost:8766
    python3 serve.py 9000       # a different port
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):        # keep the terminal quiet
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    print(f"AfriTalent Messages — http://localhost:{port}")
    print("Open that address in two or three tabs. Press Control-C to stop.")
    try:
        ThreadingHTTPServer(("", port), NoCache).serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
