"""Claude OAuth 2.0 PKCE 授权流程"""

import hashlib
import http.server
import json
import os
import secrets
import subprocess
import sys
import threading
import urllib.parse
import urllib.request
from base64 import urlsafe_b64encode
from typing import Optional


def _base64url(data: bytes) -> str:
    return urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _open_browser(url: str) -> None:
    if sys.platform == "darwin":
        subprocess.Popen(["open", url])
    elif sys.platform == "win32":
        os.startfile(url)
    else:
        subprocess.Popen(["xdg-open", url])


def start_oauth() -> Optional[str]:
    """启动 OAuth 2.0 PKCE 流程，返回 access_token 或 None"""

    # 1. 生成 PKCE
    verifier = _base64url(secrets.token_bytes(48))
    challenge = _base64url(hashlib.sha256(verifier.encode("ascii")).digest())

    result = {"token": None}
    server_ready = threading.Event()

    class CallbackHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path != "/callback":
                self.send_response(404)
                self.end_headers()
                return

            params = urllib.parse.parse_qs(parsed.query)
            code = params.get("code", [None])[0]
            error = params.get("error", [None])[0]

            if error or not code:
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write("<h2>授权失败</h2><p>请关闭此页面重试。</p>".encode())
                return

            # 用 code 换取 token
            try:
                port = self.server.server_address[1]
                token_data = json.dumps({
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": f"http://localhost:{port}/callback",
                    "code_verifier": verifier,
                    "client_id": "flowing-agent",
                }).encode()

                req = urllib.request.Request(
                    "https://console.anthropic.com/v1/oauth/token",
                    data=token_data,
                    headers={"Content-Type": "application/json"},
                )
                with urllib.request.urlopen(req) as resp:
                    resp_data = json.loads(resp.read())
                    result["token"] = resp_data.get("access_token")

                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write("<h2>授权成功!</h2><p>可以关闭此页面了。</p>".encode())
            except Exception as e:
                print(f"OAuth 错误: {e}")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(f"<h2>授权失败</h2><p>{e}</p>".encode())

            # 通知主线程关闭
            threading.Thread(target=self.server.shutdown).start()

        def log_message(self, format, *args):
            pass  # 静默日志

    # 2. 启动本地服务器（随机端口）
    server = http.server.HTTPServer(("127.0.0.1", 0), CallbackHandler)
    port = server.server_address[1]

    # 3. 打开浏览器
    auth_url = (
        f"https://console.anthropic.com/oauth/authorize"
        f"?client_id=flowing-agent"
        f"&redirect_uri={urllib.parse.quote(f'http://localhost:{port}/callback')}"
        f"&response_type=code"
        f"&code_challenge={challenge}"
        f"&code_challenge_method=S256"
        f"&scope=api"
    )

    print(f"\n请在浏览器中完成授权 (已自动打开)")
    print(f"如果浏览器未自动打开，请手动访问:\n{auth_url}\n")
    _open_browser(auth_url)

    # 4. 等待回调（60 秒超时）
    server.timeout = 60
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.start()
    server_thread.join(timeout=65)

    if server_thread.is_alive():
        server.shutdown()
        print("OAuth 超时，请重试。")

    return result["token"]
