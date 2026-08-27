#!/usr/bin/env python3
"""Scrape UT Austin transcript-recognized minors and certificates from the catalog."""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

CATALOG_URL = (
    "https://catalog.utexas.edu/undergraduate/"
    "the-university/minor-and-certificate-programs/"
)
OUTPUT = Path(__file__).resolve().parent / "ut-programs.json"


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def fetch_html() -> str:
    req = urllib.request.Request(CATALOG_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_section(html: str, start_marker: str, end_marker: str, ptype: str) -> list[dict]:
    start = html.find(start_marker)
    if start < 0:
        return []
    end = html.find(end_marker, start + len(start_marker)) if end_marker else len(html)
    chunk = html[start:end]
    pattern = re.compile(
        r"<p><strong>([^<]+)</strong></p>\s*<ul>(.*?)</ul>",
        re.DOTALL | re.IGNORECASE,
    )
    programs: list[dict] = []
    for match in pattern.finditer(chunk):
        school = re.sub(r"\s+", " ", match.group(1)).strip()
        items = re.findall(r"<li>([^<]+)</li>", match.group(2))
        for item in items:
            name = re.sub(r"\s+", " ", item).strip()
            name = re.sub(r"\*$", "", name).strip()
            if not name:
                continue
            programs.append(
                {
                    "key": slugify(name),
                    "name": name,
                    "school": school,
                    "type": ptype,
                    "credits": 18 if ptype == "certificate" else 15,
                    "hours": "18-24 hrs" if ptype == "certificate" else "15-18 hrs",
                }
            )
    return programs


def scrape() -> dict:
    html = fetch_html()
    minors = parse_section(
        html,
        '<h3 class="introtext" headerid="1"',
        '<h2 class="page-title" headerid="2"',
        "minor",
    )
    certificates = parse_section(
        html,
        '<h3 class="introtext" headerid="3"',
        '<div class="footer',
        "certificate",
    )
    return {
        "source": CATALOG_URL,
        "scrapedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "minors": minors,
        "certificates": certificates,
    }


def main() -> int:
    data = scrape()
    OUTPUT.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(
        f"Wrote {len(data['minors'])} minors and {len(data['certificates'])} certificates to {OUTPUT}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
