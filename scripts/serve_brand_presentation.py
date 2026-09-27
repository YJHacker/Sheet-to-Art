import http.server
import socketserver
import os
import sys

PORT = 5174
DIRECTORY = "/root"

class BrandPresentationHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def translate_path(self, path):
        if path in ("/", "/index.html"):
            return os.path.join(DIRECTORY, "brand_identity_presentation.html")
        return super().translate_path(path)

def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), BrandPresentationHandler) as httpd:
        print(f"Brand presentation server listening on 0.0.0.0:{PORT}")
        sys.stdout.flush()
        httpd.serve_forever()

if __name__ == "__main__":
    run()
