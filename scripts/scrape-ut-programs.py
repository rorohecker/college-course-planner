#!/usr/bin/env python3
"""Scrape UT Austin minors/certificates and their course requirements from the catalog."""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

CATALOG_URL = (
    "https://catalog.utexas.edu/undergraduate/"
    "the-university/minor-and-certificate-programs/"
)
PROGRAMS_INDEX = "https://catalog.utexas.edu/undergraduate/programs/"
OUTPUT = Path(__file__).resolve().parent / "ut-programs.json"
WORD_NUMS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
}


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
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
                    "key": slugify(f"{ptype}-{school}-{name}"),
                    "name": name,
                    "school": school,
                    "type": ptype,
                    "credits": 18 if ptype == "certificate" else 15,
                    "hours": "18-24 hrs" if ptype == "certificate" else "15-18 hrs",
                }
            )
    return programs


def load_catalog_links() -> dict[str, str]:
    html = fetch_html(PROGRAMS_INDEX)
    links: dict[str, str] = {}
    for path, slug, title in re.findall(
        r'href="(/undergraduate/programs/([^"/]+)/)"[^>]*>([^<]+)</a>', html
    ):
        links[slug] = path
        links[slugify(title)] = path
        t = title.strip()
        for suffix in (
            " Minor",
            " Certificate",
            " Bridging Disciplines Program Certificate",
        ):
            if t.endswith(suffix):
                links[slugify(t[: -len(suffix)])] = path
    return links


def guess_catalog_slugs(prog: dict) -> list[str]:
    name = prog["name"]
    ptype = prog["type"]
    slugs = [
        slugify(f"{name}-minor") if ptype == "minor" else slugify(f"{name}-certificate"),
        slugify(f"{name.replace(' and ', ' ')}-certificate"),
        slugify(f"{name.replace(' and ', '')}-certificate"),
        slugify(f"{name}-bridging-disciplines-program-certificate"),
        slugify(name),
    ]
    if ptype == "certificate":
        slugs.append(slugify(f"{name}-certificate"))
    return list(dict.fromkeys(slugs))


def match_catalog_url(prog: dict, links: dict[str, str]) -> str | None:
    for slug in guess_catalog_slugs(prog):
        if slug in links:
            return links[slug]
    title_key = slugify(
        f"{prog['name']} {'minor' if prog['type'] == 'minor' else 'certificate'}"
    )
    return links.get(title_key)


def extract_course_code(row: str) -> str | None:
    m = re.search(r'class="bubblelink code"[^>]*>([^<]+)</a>', row, re.I)
    if not m:
        return None
    code = re.sub(r"[\xa0\s]+", " ", m.group(1)).strip().upper()
    # Normalize department spacing for catalog consistency.
    code = re.sub(r"^C S ", "CS ", code)
    code = re.sub(r"^E S ", "ES ", code)
    code = re.sub(r"^M E ", "ME ", code)
    code = re.sub(r"^A R E ", "ARE ", code)
    return code


def finalize_requirements(req: dict) -> dict:
    cores = req.get("cores") or []
    electives = req.get("electives") or []
    pick = int(req.get("pick") or 0)

    if not cores and electives and pick == 0:
        cores = electives
        electives = []

    total = len(cores) + len(electives)
    if electives and pick >= len(electives) and total <= 8:
        cores = cores + electives
        electives = []
        pick = 0

    if electives and pick > len(electives):
        pick = len(electives)

    if electives and pick == 0:
        pick = max(1, min(len(electives), 3))

    return {"cores": cores, "electives": electives, "pick": pick}


def parse_pick_from_comment(comment: str, hours: str | None) -> int:
    comment_l = comment.lower()
    m = re.search(
        r"(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+of\s+the\s+following",
        comment_l,
    )
    if m:
        token = m.group(1)
        return int(token) if token.isdigit() else WORD_NUMS.get(token, 0)
    m = re.search(r"choose\s+(\d+)", comment_l)
    if m:
        return int(m.group(1))
    if hours and hours.isdigit():
        h = int(hours)
        if h >= 3:
            return max(1, round(h / 3))
    return 0


def parse_courselist_table(table_html: str) -> dict | None:
    rows = re.findall(r"<tr[^>]*>.*?</tr>", table_html, re.DOTALL)
    cores: list[dict] = []
    electives: list[dict] = []
    pick = 0
    in_electives = False
    seen_elective: set[str] = set()

    for row in rows:
        if "listsum" in row:
            continue
        comment_m = re.search(
            r'class="courselistcomment"[^>]*>([^<]+)</span>', row, re.I
        )
        if comment_m:
            comment = re.sub(r"\s+", " ", comment_m.group(1)).strip()
            hours_m = re.search(r'class="hourscol"[^>]*>\s*(\d+)\s*</td>', row)
            hours = hours_m.group(1) if hours_m else None
            if re.search(
                r"chosen from|following|select|complete|additional|elective",
                comment,
                re.I,
            ):
                in_electives = True
                pick = max(pick, parse_pick_from_comment(comment, hours))
            continue

        code_m = re.search(
            r'class="bubblelink code"[^>]*>([^<]+)</a>', row, re.I
        )
        if not code_m:
            continue
        code = extract_course_code(row)
        if not code:
            continue
        name_m = re.search(r"</td>\s*<td>([^<]+)</td>", row)
        name = name_m.group(1).strip() if name_m else code
        if not name or name.lower() in {"hours", "total hours"}:
            continue
        credits_m = re.search(
            r'class="hourscol"[^>]*>\s*(\d+)\s*</td>', row
        )
        credits = int(credits_m.group(1)) if credits_m else 3
        entry = {"code": code, "name": name, "credits": credits}
        is_indented = "blockindent" in row
        if in_electives or is_indented:
            if code in seen_elective:
                continue
            seen_elective.add(code)
            electives.append({"code": code, "name": name})
        else:
            cores.append(entry)

    if not cores and not electives:
        return None

    if not cores and electives:
        if pick == 0:
            cores = electives
            electives = []
        else:
            # Gateway-style: first course required, rest are electives.
            cores = [electives[0]]
            electives = electives[1:]

    if electives and pick == 0:
        pick = max(1, min(len(electives), 3 if len(cores) >= 2 else len(electives)))

    return finalize_requirements({"cores": cores, "electives": electives, "pick": pick})


def parse_program_requirements(html: str) -> dict | None:
    tables = re.findall(
        r'<table class="sc_courselist">(.*?)</table>', html, re.DOTALL | re.I
    )
    best: dict | None = None
    for table in tables:
        parsed = parse_courselist_table(table)
        if not parsed:
            continue
        score = len(parsed["cores"]) + len(parsed["electives"])
        if not best or score > len(best["cores"]) + len(best["electives"]):
            best = parsed
    return best


def enrich_with_requirements(programs: list[dict], links: dict[str, str]) -> None:
    cache: dict[str, dict | None] = {}
    matched = 0
    for i, prog in enumerate(programs):
        url_path = match_catalog_url(prog, links)
        if not url_path:
            continue
        prog["catalogUrl"] = f"https://catalog.utexas.edu{url_path}"
        slug = url_path.rstrip("/").split("/")[-1]
        if slug not in cache:
            try:
                page = fetch_html(prog["catalogUrl"])
                cache[slug] = parse_program_requirements(page)
                time.sleep(0.05)
            except (urllib.error.URLError, TimeoutError):
                cache[slug] = None
        req = cache[slug]
        if req and (req["cores"] or req["electives"]):
            prog["req"] = req
            matched += 1
        if (i + 1) % 25 == 0:
            print(f"  …{i + 1}/{len(programs)}", file=sys.stderr)
    print(f"  requirements scraped for {matched}/{len(programs)}", file=sys.stderr)


def scrape(fetch_requirements: bool = True) -> dict:
    html = fetch_html(CATALOG_URL)
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
    all_programs = minors + certificates
    if fetch_requirements:
        print("Loading catalog program index…", file=sys.stderr)
        links = load_catalog_links()
        print(f"Enriching {len(all_programs)} programs with course requirements…", file=sys.stderr)
        enrich_with_requirements(all_programs, links)
    return {
        "source": CATALOG_URL,
        "scrapedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "minors": minors,
        "certificates": certificates,
    }


def main() -> int:
    data = scrape(fetch_requirements="--no-req" not in sys.argv)
    OUTPUT.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    with_req = sum(1 for p in data["minors"] + data["certificates"] if p.get("req"))
    print(
        f"Wrote {len(data['minors'])} minors and {len(data['certificates'])} certificates "
        f"({with_req} with requirements) to {OUTPUT}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
