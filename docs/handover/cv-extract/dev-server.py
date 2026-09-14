#!/usr/bin/env python3
"""Local stand-in for the three verification functions, so the Didit flow can be
run end to end from a laptop.

    python3 dev-server.py                # http://localhost:8767

It serves the demo files AND answers the three endpoints the page needs:

    POST /api/start-verification   opens a Didit session
    POST /api/verification-status  what the page polls
    POST /api/verification-webhook receives the signed decision

Decisions land in .dev-verification.json instead of a database. This is a
development shim — no auth, no RLS, one user. The Supabase functions in
supabase/functions/ are the real implementation and the two agree on the parts
that matter: the same canonicalisation, the same freshness window, the same
event_id de-duplication.

Didit will not deliver to localhost, so put a tunnel in front of it:

    npx cloudflared tunnel --url http://localhost:8767

That prints an https://<something>.trycloudflare.com URL. Register the webhook
against <that>/api/verification-webhook — see README.

Secrets come from .env.local next to this file:

    DIDIT_API_KEY=...
    DIDIT_WEBHOOK_SECRET=...
"""
import hashlib
import hmac
import json
import os
import sys
import time
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).parent
STORE = HERE / ".dev-verification.json"
WORKFLOW_ID = "b298bbe5-267f-4af3-9107-11025cebb290"      # "Free KYC" — config, not a secret
DIDIT_BASE = "https://verification.didit.me"

# One pretend user. The real function takes this from the signed-in session and
# never from the request body, because whoever controls vendor_data controls
# which profile the webhook marks verified.
DEV_USER = "dev-user-0001"

STATUS_MAP = {
    "Approved": "verified",
    "Declined": "failed",
    "Kyc Expired": "unverified",
    "Expired": "unverified",
    "Abandoned": "unverified",
    "Not Started": "pending",
    "In Progress": "pending",
    "Awaiting User": "pending",
    "In Review": "pending",
    "Resubmitted": "pending",
}


def load_env():
    env = HERE / ".env.local"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


def read_store():
    try:
        return json.loads(STORE.read_text(encoding="utf-8"))
    except Exception:
        return {"sessions": {}, "events": [], "profile": {"status": "unverified"}}


def write_store(s):
    STORE.write_text(json.dumps(s, indent=2, ensure_ascii=False), encoding="utf-8")


# ---------------------------------------------------------------- signature
def shorten_floats(v):
    """1.0 -> 1, recursively.

    In JavaScript this is a no-op — 1.0 and 1 are the same number and both
    serialise as `1`. In Python they are different types and json.dumps writes
    `1.0`, which would not match the signature. So this conversion is required
    here and merely documented there.
    """
    if isinstance(v, list):
        return [shorten_floats(x) for x in v]
    if isinstance(v, dict):
        return {k: shorten_floats(x) for k, x in v.items()}
    if isinstance(v, float) and v.is_integer():
        return int(v)
    return v


def canonical(payload):
    """Match JSON.stringify(sortKeys(shortenFloats(body))) exactly.

    sort_keys gives the recursive lexicographic ordering; separators drops the
    spaces Python adds by default; ensure_ascii=False leaves Unicode unescaped
    the way JavaScript does. Any one of the three wrong and every signature
    fails.
    """
    return json.dumps(
        shorten_floats(payload),
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )


def valid_signature(raw_body, header_sig, secret):
    expected = hmac.new(secret.encode("utf-8"), raw_body.encode("utf-8"), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header_sig or "")


# ---------------------------------------------------------------- didit calls
def didit(method, path, body=None):
    key = os.environ.get("DIDIT_API_KEY", "")
    req = urllib.request.Request(
        DIDIT_BASE + path,
        method=method,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers={"x-api-key": key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, {"detail": e.read().decode("utf-8", "replace")[:500]}
    except Exception as e:
        return 0, {"detail": str(e)[:300]}


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type, authorization")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        super().end_headers()

    def log_message(self, *a):
        pass

    def reply(self, obj, status=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length).decode("utf-8") if length else ""

        if self.path.startswith("/api/start-verification"):
            return self.start_verification()
        if self.path.startswith("/api/verification-status"):
            return self.verification_status()
        if self.path.startswith("/api/verification-webhook"):
            return self.verification_webhook(raw)
        self.reply({"error": "not_found"}, 404)

    # ---- 1. open a session -------------------------------------------------
    def start_verification(self):
        if not os.environ.get("DIDIT_API_KEY"):
            print("  ✗ start-verification: DIDIT_API_KEY is not set in .env.local")
            return self.reply({"error": "missing_didit_key"}, 500)

        code, session = didit("POST", "/v3/session/", {
            "workflow_id": WORKFLOW_ID,
            "vendor_data": DEV_USER,
            "metadata": {"surface": "afritalent-dev"},
        })
        if code != 201 and code != 200:
            print(f"  ✗ start-verification: Didit returned {code} — {session.get('detail','')[:160]}")
            return self.reply({
                "error": "didit_key_rejected" if code == 403 else "session_create_failed",
                "detail": session.get("detail", ""),
            }, 502)

        s = read_store()
        s["sessions"][session["session_id"]] = {"status": "pending", "detail": "Not Started"}
        s["profile"] = {"status": "pending", "ref": session["session_id"]}
        write_store(s)
        print(f"  → session {session['session_id'][:8]}… opened")
        self.reply({"url": session["url"], "session_id": session["session_id"]})

    # ---- 2. what the page polls -------------------------------------------
    def verification_status(self):
        s = read_store()
        profile = s.get("profile", {})
        if profile.get("status") and profile["status"] != "pending":
            return self.reply({
                "status": profile["status"], "detail": profile.get("detail"),
                "at": profile.get("at"), "by": "webhook",
            })

        # Still pending: ask Didit rather than leaving the page spinning. This
        # is a read; the webhook is still what writes the decision.
        ref = profile.get("ref")
        if ref and os.environ.get("DIDIT_API_KEY"):
            code, decision = didit("GET", f"/v3/session/{ref}/decision/")
            if code == 200:
                live = str(decision.get("status", ""))
                return self.reply({"status": STATUS_MAP.get(live, "pending"), "detail": live, "by": "poll"})
        self.reply({"status": "pending", "by": "store"})

    # ---- 3. the signed decision -------------------------------------------
    def verification_webhook(self, raw):
        secret = os.environ.get("DIDIT_WEBHOOK_SECRET", "")
        sig = self.headers.get("x-signature-v2", "")
        ts = self.headers.get("x-timestamp", "")

        if not secret:
            print("  ✗ webhook: DIDIT_WEBHOOK_SECRET is not set")
            return self.reply({"error": "not_configured"}, 500)
        try:
            if abs(time.time() - float(ts)) > 300:
                print("  ✗ webhook rejected: stale timestamp")
                return self.reply({"error": "stale"}, 401)
        except (TypeError, ValueError):
            print("  ✗ webhook rejected: no X-Timestamp")
            return self.reply({"error": "stale"}, 401)

        try:
            payload = json.loads(raw)
        except Exception:
            return self.reply({"error": "bad_json"}, 400)

        if not valid_signature(canonical(payload), sig, secret):
            print("  ✗ webhook rejected: signature did not match")
            return self.reply({"error": "bad_signature"}, 401)

        s = read_store()
        event_id = payload.get("event_id")
        if event_id in s["events"]:
            print(f"  · webhook {event_id[:8]}… already handled, ignoring retry")
            return self.reply({"ok": True})
        s["events"].append(event_id)

        status = str(payload.get("status", ""))
        mapped = STATUS_MAP.get(status)
        if mapped:
            s["profile"] = {
                "status": mapped, "detail": status,
                "ref": payload.get("session_id"),
                "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            print(f"  ✓ webhook: {status} → {mapped}")
        else:
            print(f"  · webhook: unhandled status {status!r}")
        write_store(s)
        # Nothing from `decision` is stored. Only the verdict.
        self.reply({"ok": True})


# ---------------------------------------------------------------- tunnel
def start_tunnel(port):
    """Run cloudflared and return the public https URL it prints.

    A quick tunnel needs no cloudflare account. The hostname is public, which
    is all Didit's SSRF guard cares about; the traffic still ends up here.
    """
    import re
    import subprocess
    import threading

    import shutil

    # A real binary if it is installed, otherwise borrow one through npx.
    exe = shutil.which("cloudflared")
    cmd = ([exe] if exe else ["npx", "-y", "cloudflared"]) + \
          ["tunnel", "--url", f"http://localhost:{port}"]

    print("  starting tunnel…")
    try:
        proc = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1,
        )
    except FileNotFoundError:
        print("  ✗ cloudflared is not installed. Install it with:")
        print("        brew install cloudflared")
        print("    then run this again.")
        return None, None

    found = {}
    done = threading.Event()

    def watch():
        # cloudflared announces the URL on stderr, among a lot of other noise.
        for line in proc.stdout:
            m = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", line)
            if m and "url" not in found:
                found["url"] = m.group(0)
                done.set()
        done.set()

    threading.Thread(target=watch, daemon=True).start()
    done.wait(timeout=90)
    if "url" not in found:
        print("  ✗ tunnel did not report a URL — check your network")
        proc.terminate()
        return None, None
    return found["url"], proc


def register_webhook(public_url):
    """Point Didit at this machine and keep the signing secret it mints.

    Each call creates a destination. Quick-tunnel hostnames change on every
    restart, so these accumulate — clear the old ones out in the Didit console
    now and then.
    """
    code, res = didit("POST", "/v3/webhook/destinations/", {
        "label": f"AfriTalent dev {time.strftime('%m-%d %H:%M')}",
        "url": public_url + "/api/verification-webhook",
        "webhook_version": "v3",
        "subscribed_events": ["status.updated", "data.updated"],
    })
    if code not in (200, 201):
        print(f"  ✗ could not register the webhook: HTTP {code} {str(res)[:200]}")
        return None
    secret = res.get("secret_shared_key") or res.get("secret")
    if not secret:
        print(f"  ✗ no secret_shared_key in Didit's reply: {str(res)[:200]}")
        return None
    return secret


def save_secret(secret):
    """Persist the secret so a plain restart does not need to re-register."""
    env = HERE / ".env.local"
    lines = env.read_text(encoding="utf-8").splitlines() if env.exists() else []
    out, replaced = [], False
    for line in lines:
        if line.startswith("DIDIT_WEBHOOK_SECRET="):
            out.append(f"DIDIT_WEBHOOK_SECRET={secret}")
            replaced = True
        else:
            out.append(line)
    if not replaced:
        out.append(f"DIDIT_WEBHOOK_SECRET={secret}")
    env.write_text("\n".join(out) + "\n", encoding="utf-8")


if __name__ == "__main__":
    # Deliveries should appear the moment they land, not when the process exits.
    sys.stdout.reconfigure(line_buffering=True)
    load_env()

    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    port = int(args[0]) if args else 8767
    want_tunnel = "--no-tunnel" not in sys.argv

    print(f"\nAfriTalent CV extractor")
    print(f"  demo   http://localhost:{port}/cv-extract-demo.html")

    if not os.environ.get("DIDIT_API_KEY"):
        print("\n  ✗ DIDIT_API_KEY is empty in .env.local.")
        print("    Open it with:  open -e .env.local")
        print("    Paste your key after DIDIT_API_KEY= and run this again.")
        print("    (Without it the page falls back to the labelled simulation.)\n")
        want_tunnel = False

    tunnel_proc = None
    if want_tunnel:
        public_url, tunnel_proc = start_tunnel(port)
        if public_url:
            print(f"  public {public_url}")
            secret = register_webhook(public_url)
            if secret:
                os.environ["DIDIT_WEBHOOK_SECRET"] = secret
                save_secret(secret)
                print("  ✓ webhook registered, signing secret saved to .env.local")
                print("\n  Put these two lines in config.js:")
                print(f"    VERIFY_START_URL:  'http://localhost:{port}/api/start-verification',")
                print(f"    VERIFY_STATUS_URL: 'http://localhost:{port}/api/verification-status',")

    print("\n  Ctrl-C to stop.\n")
    try:
        ThreadingHTTPServer(("", port), Handler).serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
    finally:
        if tunnel_proc:
            tunnel_proc.terminate()
