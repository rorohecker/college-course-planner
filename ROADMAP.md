# Roadmap

Shipped features are marked ✅. Remaining items are future improvements.

## Shipped ✅

- **Auto-update** — periodic GitHub checks, remembered file apply, notifications
- **Prerequisite validation** — warns when courses appear before prereqs (parsed from notes + seed map)
- **Credit load warnings** — flags semesters over 18 or under 12 credits
- **Requirement overlap** — shows courses counting for multiple programs/tracks
- **What-if ECE tracks** — compare all 8 tracks against your current plan
- **Calendar export** — download `.ics` per semester
- **Weekly schedule / conflict check** — add meeting times (`MWF 9-10`) and detect overlaps
- **Professor field** — optional prof name on course cards
- **Cloud sync** — optional GitHub Gist push/pull from Backup modal
- **Mobile polish** — horizontal swipe carousel for semester cards on narrow screens
- **Advising share link** — read-only `?advise=` URL for advisors
- **PDF export** — print-optimized tab in Share modal
- **Diff view** — textual add/remove/move/grade diff in Compare mode
- **PWA basics** — web manifest + service worker when hosted on https/localhost
- **Minors & certificates** — 153 with catalog data; improved placeholders for the rest
- **Pre-2026 ECE curricula** — 2024–2026 ECE General, ECE Honors, and ECB templates from official flowcharts
- **Named track electives** — course titles + filter in the ECE track picker
- **Tech Core Packet quick link** — ECE/ECB header pill + Tools links (packet, elective schedule)
- **Catalog-year migration helper** — remap 24-26 ↔ 26-28 course numbers (Tools → Catalog migrate)
- **Free-elective hour meter** — progress toward 14 hrs (pre-2026) or 11 hrs (26-28) in header + plan health
- **First-open tutorial** — short natural-language walkthrough; replay from More ▾
- **Programs in primary header** — Minors & Certificates button + always-visible Programs pill

## Near term (next improvements)

### Deeper catalog import
Pull from the UT course schedule each semester so search/add uses live sections, not just the static snapshot.

### Live tech-core packet sync
Scrape / refresh TRACKS cores + electives from the Chandra tech-core packet so approved lists stay current without hand edits. Packet date badge + Box links ship today; auto-import of elective tables is next.

### Full schedule generator (IDA-style)
Given real section times from the registrar, rank conflict-free weekly schedules by user preferences (no 8 AMs, no Friday, compact days).

### Expand grade / professor data
Scrape or embed UT grade distributions and RateMyProfessor for more courses.

### Scrape remaining minors
37 McCombs/Liberal Arts programs still use placeholder plans — improve the scraper for those catalog pages.

## Medium term

### Collaborative plans
Real-time co-editing for ECB cohorts comparing paths.

### Advising comments
Let advisors leave comments on specific courses in the advising view (accept/reject workflow).

### AI assistant
Natural-language plan changes — only after prereq graph and catalog import are rock-solid.

## Probably never

- Native mobile apps (PWA covers this)
- Login accounts (friction; Gist sync is opt-in and tokenless-ish)
- Tuition / financial aid calculations
