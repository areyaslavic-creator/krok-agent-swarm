import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class KrokHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?", 1)[0] == "/_app/health":
            body = b"ok\n"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def log_message(self, format, *args):
        print(f"[krok-web] {self.address_string()} - {format % args}", flush=True)


port = int(os.environ.get("PORT", "3000"))
server = ThreadingHTTPServer(("0.0.0.0", port), KrokHandler)
print(f"KROK one-page server listening on 0.0.0.0:{port}", flush=True)
server.serve_forever()
