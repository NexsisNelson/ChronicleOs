"""Tools for web search and data gathering (Phase 2)."""

import re
from html.parser import HTMLParser
from typing import Any, Dict, List
from urllib.parse import parse_qs, quote_plus, unquote_plus

import httpx


class _LinkExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links: List[Dict[str, str]] = []
        self.current_href: str | None = None
        self.current_text: List[str] = []
        self.in_link = False

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return

        attr_map = {name: value for name, value in attrs}
        href = attr_map.get("href")
        if not href:
            return

        self.current_href = href
        self.current_text = []
        self.in_link = True

    def handle_data(self, data):
        if self.in_link and self.current_href:
            self.current_text.append(data)

    def handle_endtag(self, tag):
        if tag != "a" or not self.in_link or not self.current_href:
            return

        title = " ".join(self.current_text).strip()
        if title:
            self.links.append({"href": self.current_href, "title": title})

        self.current_href = None
        self.current_text = []
        self.in_link = False


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_chunks: List[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "noscript"}:
            self.skip_depth += 1

    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript"} and self.skip_depth > 0:
            self.skip_depth -= 1
        elif tag == "p":
            self.text_chunks.append("\n")

    def handle_data(self, data):
        if self.skip_depth == 0:
            self.text_chunks.append(data)

    def get_text(self) -> str:
        raw = "".join(self.text_chunks)
        text = re.sub(r"\s+", " ", raw).strip()
        return text


def _normalize_url(href: str) -> str | None:
    if href.startswith("/") and "uddg=" in href:
        try:
            query = href.split("uddg=", 1)[1]
            return unquote_plus(query)
        except Exception:
            return None

    if href.startswith("http://") or href.startswith("https://"):
        return href

    return None


async def search_web(query: str) -> List[Dict[str, str]]:
    """Search the web for information.

    Args:
        query: Search query

    Returns:
        List of search results with title, url, snippet
    """
    url = f"https://lite.duckduckgo.com/lite/?q={quote_plus(query)}"
    async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": "ChronicleOS/1.0"}) as client:
        response = await client.get(url)
        response.raise_for_status()

    parser = _LinkExtractor()
    parser.feed(response.text)

    results: List[Dict[str, str]] = []
    for link in parser.links:
        normalized = _normalize_url(link["href"])
        if not normalized:
            continue

        title = link["title"]
        if title.lower().startswith("ddg " ) or title.lower().startswith("more "):
            continue

        results.append({"title": title, "url": normalized, "snippet": ""})
        if len(results) >= 8:
            break

    return results


async def fetch_url(url: str) -> str:
    """Fetch and extract content from a URL.

    Args:
        url: URL to fetch

    Returns:
        Extracted page content
    """
    async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": "ChronicleOS/1.0"}) as client:
        response = await client.get(url, follow_redirects=True)
        response.raise_for_status()

    content_type = response.headers.get("content-type", "")
    if "text/html" in content_type:
        extractor = _TextExtractor()
        extractor.feed(response.text)
        return extractor.get_text()

    return response.text


async def search_academic(query: str) -> List[Dict[str, Any]]:
    """Search academic databases.

    Args:
        query: Research query

    Returns:
        List of academic papers
    """
    api_url = f"https://export.arxiv.org/api/query?search_query=all:{quote_plus(query)}&max_results=5"
    async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": "ChronicleOS/1.0"}) as client:
        response = await client.get(api_url)
        response.raise_for_status()

    try:
        import xml.etree.ElementTree as ET

        root = ET.fromstring(response.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        entries = []
        for entry in root.findall("atom:entry", ns):
            title = entry.find("atom:title", ns)
            summary = entry.find("atom:summary", ns)
            published = entry.find("atom:published", ns)
            link = None
            for link_node in entry.findall("atom:link", ns):
                if link_node.attrib.get("rel") == "alternate":
                    link = link_node.attrib.get("href")
                    break
            authors = [author.find("atom:name", ns).text for author in entry.findall("atom:author", ns) if author.find("atom:name", ns) is not None]
            entries.append(
                {
                    "title": title.text.strip() if title is not None and title.text else "",
                    "summary": summary.text.strip() if summary is not None and summary.text else "",
                    "published": published.text if published is not None else "",
                    "url": link or "",
                    "authors": authors,
                }
            )
        return entries
    except Exception:
        return []
