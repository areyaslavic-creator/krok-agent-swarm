import base64
import ipaddress
import json
import os
import re
import socket
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

MAX_BYTES = 350_000
USER_AGENT = "KROK-Agent-Swarm/1.0 (+public-research-only)"


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = []
        self.description = ""
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag.lower() == "title":
            self._in_title = True
        if tag.lower() == "meta":
            key = (attrs.get("name") or attrs.get("property") or "").lower()
            if key in {"description", "og:description", "twitter:description"} and not self.description:
                self.description = attrs.get("content", "")

    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title.append(data.strip())


class SearchParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.results = []
        self._current = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag.lower() == "a" and "result__a" in (attrs.get("class") or ""):
            self._current = {"title": [], "url": attrs.get("href", "")}

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._current:
            item = {"title": clean("".join(self._current["title"]), 180), "url": self._current["url"]}
            if item["title"] and item["url"]:
                self.results.append(item)
            self._current = None

    def handle_data(self, data):
        if self._current is not None:
            self._current["title"].append(data)


def clean(value, limit=600):
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def search_public_web(query):
    query = clean(query, 300)
    if not query:
        return []
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote_plus(query)
    try:
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
        with urllib.request.urlopen(request, timeout=12) as response:
            html = response.read(MAX_BYTES).decode("utf-8", errors="replace")
        parser = SearchParser()
        parser.feed(html)
        results = parser.results
        if not results:
            bing_url = "https://www.bing.com/search?q=" + urllib.parse.quote_plus(query)
            request = urllib.request.Request(bing_url, headers={"User-Agent": "Mozilla/5.0 " + USER_AGENT, "Accept": "text/html"})
            with urllib.request.urlopen(request, timeout=12) as response:
                bing_html = response.read(MAX_BYTES).decode("utf-8", errors="replace")
            results = [{"title": clean(unescape(re.sub(r"<[^>]+>", " ", title)), 180), "url": unwrap_search_url(unescape(link))} for link, title in re.findall(r'<li class="b_algo"[\s\S]*?<h2><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>', bing_html)[:8]]
        return [{"url": item["url"], "title": item["title"], "kind": "public_search_result", "public": True} for item in results[:6] if is_research_candidate(item["url"])]
    except Exception:
        return []


def unwrap_search_url(url):
    parsed = urllib.parse.urlparse(url)
    token = urllib.parse.parse_qs(parsed.query).get("u", [""])[0]
    if token.startswith("a1"):
        try:
            return base64.urlsafe_b64decode(token[2:] + "===").decode("utf-8")
        except (ValueError, UnicodeDecodeError):
            pass
    return url


def valid_public_url(raw):
    parsed = urllib.parse.urlparse(raw.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return False
    host = parsed.hostname.lower()
    if host in {"localhost", "localhost.localdomain"} or host.endswith(".local"):
        return False
    try:
        addresses = socket.getaddrinfo(host, None)
        for address in addresses:
            ip = ipaddress.ip_address(address[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
    except (socket.gaierror, ValueError):
        return False
    return True


def is_research_candidate(raw):
    if not valid_public_url(raw):
        return False
    parsed = urllib.parse.urlparse(raw)
    host = (parsed.hostname or "").lower()
    blocked_hosts = {"bing.com", "www.bing.com", "google.com", "www.google.com", "duckduckgo.com", "html.duckduckgo.com", "chat.openai.com", "android.chat.openai.com", "ios.chat.openai.com"}
    blocked_path = parsed.path.lower().startswith(("/auth", "/login", "/cdn-cgi", "/search"))
    return host not in blocked_hosts and not blocked_path


def fetch_public(url):
    if not valid_public_url(url):
        return {"url": url, "ok": False, "error": "URL має бути публічним http(s)-джерелом."}
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/rss+xml,application/atom+xml;q=0.9,*/*;q=0.5"})
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            raw = response.read(MAX_BYTES)
            content_type = response.headers.get("Content-Type", "")
        timestamp = datetime.now(timezone.utc).isoformat()
        text = raw.decode("utf-8", errors="replace")
        if "xml" in content_type.lower() or text.lstrip().startswith("<rss") or text.lstrip().startswith("<feed"):
            return parse_feed(url, text, timestamp)
        parser = PageParser()
        parser.feed(text)
        return {"url": url, "ok": True, "kind": "public_page", "title": clean("".join(parser.title), 180) or urllib.parse.urlparse(url).netloc, "summary": clean(parser.description or re.sub(r"<[^>]+>", " ", text), 420), "fetched_at": timestamp, "public": True}
    except Exception as exc:
        return {"url": url, "ok": False, "error": f"Не вдалося прочитати відкрите джерело: {type(exc).__name__}."}


def parse_feed(url, text, timestamp):
    try:
        root = ET.fromstring(text)
        items = []
        for node in root.findall(".//item")[:8] + root.findall(".//{http://www.w3.org/2005/Atom}entry")[:8]:
            title = node.findtext("title") or node.findtext("{http://www.w3.org/2005/Atom}title") or "Без заголовка"
            link_node = node.find("link") or node.find("{http://www.w3.org/2005/Atom}link")
            link = (link_node.text if link_node is not None else "") or (link_node.attrib.get("href", "") if link_node is not None else "")
            description = node.findtext("description") or node.findtext("summary") or node.findtext("{http://www.w3.org/2005/Atom}summary") or ""
            items.append({"title": clean(title, 180), "url": clean(link, 500), "summary": clean(re.sub(r"<[^>]+>", " ", description), 300)})
        return {"url": url, "ok": True, "kind": "public_rss", "title": urllib.parse.urlparse(url).netloc + " feed", "items": items, "summary": f"Отримано публічних записів: {len(items)}", "fetched_at": timestamp, "public": True}
    except ET.ParseError:
        return {"url": url, "ok": False, "error": "Джерело не є коректним RSS/Atom XML."}


def json_response(handler, payload, status=200):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.end_headers()
    handler.wfile.write(body)


class KrokHandler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        json_response(self, {"ok": True})

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/_app/health":
            json_response(self, {"ok": True, "service": "krok-agent-swarm", "research": "public-only"})
            return
        if path == "/api/status":
            json_response(self, {"ok": True, "capabilities": ["public-web-search", "public-page-research", "public-rss-research", "clarification-flow", "multilingual-site-draft"]})
            return
        return super().do_GET()

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        try:
            length = min(int(self.headers.get("Content-Length", "0")), 100_000)
            payload = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            json_response(self, {"ok": False, "error": "Некоректний JSON-запит."}, 400)
            return
        if path == "/api/research":
            urls = []
            for key in ("competitors", "social_sources"):
                values = payload.get(key, [])
                if isinstance(values, str):
                    values = re.split(r"[\n,]+", values)
                urls.extend(clean(value, 800) for value in values if clean(value, 800))
            urls = list(dict.fromkeys(urls))[:12]
            brief = clean(payload.get("brief", ""), 500)
            discovered = []
            if not urls and len(brief) >= 12:
                discovered = search_public_web(brief)
                urls = [item["url"] for item in discovered]
            if not urls:
                json_response(self, {"ok": True, "needs_clarification": True, "questions": ["Опишіть бізнес і ринок простими словами, щоб знайти публічні конкурентні джерела.", "Додайте 1–3 публічні URL конкурентів або RSS-канали соціальних мереж, якщо вони відомі.", "Хто головний клієнт і яку дію він має виконати на сайті?"]})
                return
            results = [fetch_public(url) for url in urls]
            json_response(self, {"ok": True, "needs_clarification": False, "query": brief, "languages": payload.get("languages", ["uk", "en", "bs"]), "discovered": discovered, "sources": results, "human_review_required": True, "policy": "Тільки відкриті джерела; без входу, CAPTCHA, paywall, robots.txt обходу або приватних даних."})
            return
        if path == "/api/clarify":
            brief = clean(payload.get("brief", ""), 1000)
            questions = []
            if len(brief) < 30:
                questions.append("Опишіть одним реченням, що продає або робить ваш бізнес.")
            for label, terms in [("аудиторію", ["для", "клієнт", "люд"]), ("локацію", ["місто", "країн", "онлайн"]), ("контактну дію", ["запис", "куп", "зв'яз", "замов"]), ("стиль", ["стиль", "колір", "мінім", "преміум"])]:
                if not any(term in brief.lower() for term in terms):
                    questions.append(f"Якою має бути {label} сайту?")
            json_response(self, {"ok": True, "questions": questions[:4], "ready": not questions})
            return
        if path == "/api/generate":
            json_response(self, {"ok": True, "message": "Чернетка готова до передачі у браузерний редактор.", "languages": payload.get("languages", ["uk", "en", "bs"]), "review_required": True})
            return
        json_response(self, {"ok": False, "error": "Маршрут API не знайдено."}, 404)

    def log_message(self, format, *args):
        print(f"[krok-web] {self.address_string()} - {format % args}", flush=True)


port = int(os.environ.get("PORT", "3000"))
server = ThreadingHTTPServer(("0.0.0.0", port), KrokHandler)
print(f"KROK one-page server listening on 0.0.0.0:{port}", flush=True)
server.serve_forever()
