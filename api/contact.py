from trio import _subprocess_platform
from trio import _subprocess_platform
import os
import json
import time
import resend
from http.server import BaseHTTPRequestHandler

# Resend needs your API key from environment variables
# (never hardcode keys in code)
resend.api_key = os.environ.get("RESEND_API_KEY", "")

# In-memory rate limiter: stores { ip_address: last_request_timestamp }
# Resets when Vercel cold-starts the function, which is fine for a portfolio
_rate_map: dict[str, float] = {}
RATE_WINDOW_SECONDS = 60  # one submission per IP per minute

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        # Browsers send a "preflight" OPTIONS request before POST
        # when the request comes from a different origin (your HTML page
        # calling /api/contact). We need to tell the browser it's allowed.
        self.send_response(200)
        self._cors_headers()
        self.end_headers()
    def do_GET(self):
        self._respond(404, {"error": "Not found"})
    def do_POST(self):
        # --- RATE LIMITING ---
        # x-forwarded-for is the real client IP when behind Vercel's proxy
        ip = self.headers.get("x-forwarded-for", "unknown").split(",")[0].strip()
        now = time.time()
        if now - _rate_map.get(ip, 0) < RATE_WINDOW_SECONDS:
            self._respond(429, {"error": "Too many requests. Please wait a moment."})
            return
        _rate_map[ip] = now

        # --- PARSE BODY ---
        content_length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(content_length)
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            self._respond(400, {"error": "Invalid request"})
            return

        name    = body.get("name", "").strip()
        email   = body.get("email", "").strip()
        message = body.get("message", "").strip()
        honeypot = body.get("website", "")  # bots fill this, humans don't

        # --- HONEYPOT CHECK ---
        # If the hidden "website" field has anything in it, it's a bot
        if honeypot:
            # Return 200 so bots think they succeeded, but send nothing
            self._respond(200, {"ok": True})
            return

        # --- VALIDATION ---
        if not name or not email or not message:
            self._respond(400, {"error": "Please fill in all fields."})
            return

        if "@" not in email or "." not in email.split("@")[-1]:
            self._respond(400, {"error": "Please enter a valid email."})
            return

        if len(message) > 5000:
            self._respond(400, {"error": "Message too long."})
            return

        # --- SEND EMAIL ---
        try:
            from_addr = os.environ.get("RESEND_FROM", "Portfolio Contact <onboarding@resend.dev>")
            recipient = os.environ.get("RECIPIENT_EMAIL", "bhavya.tia@gmail.com")
            resend.Emails.send({
                "from":     from_addr,
                "to":       [recipient],
                "reply_to": email,
                "subject":  f"New inquiry from {name}",
                "html": f"""
                    <h2>New portfolio inquiry</h2>
                    <p><strong>Name:</strong> {name}</p>
                    <p><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
                    <p><strong>Message:</strong></p>
                    <p>{message.replace(chr(10), '<br>')}</p>
                """,
                "text": f"From: {name} <{email}>\n\n{message}",
            })
            self._respond(200, {"ok": True})
        except Exception as e:
            print(f"Email send error: {e}")
            self._respond(500, {"error": "Failed to send. Please email directly."})

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _respond(self, code: int, data: dict):
        body = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass  # suppress Vercel's default request logging noise