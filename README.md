# College Course Planner

A college course planner for UT Austin students. Built originally for the Engineering and Business Honors (ECB) program, it now also ships a McCombs BBA template with all eight major tracks and Canfield Business Honors as a dual-track option. It runs entirely in your browser as a single HTML file, with no backend, no signup, and no install.

If you have ever wished UT IDA could let you build and compare what-if schedules without clicking through a dozen menus, this is meant to be that tool.

## What it does

- Drop-in ECB default curriculum covering AP credits, Physics I (summer/AP), Physics II in Year 2 Fall, and all eight semesters of the four year plan, updated to the 2026-2028 catalog (ECE 402H/406H/412H/419H/313H, PHY 303E, Canfield BA 110G/111G/120G/130G/140G).
- Curriculum picker covers both catalog eras from the Texas ECE flowcharts: **2026–2028** (ECE 402/406/419/412 + PHY 303E) and **2024–2026 / pre-Fall 2026** (ECE 302/306/319K/312 + PHY 303L/105N, 14 hrs free electives) for ECB, ECE Honors, and ECE General.
- ECE technical-component track picker shows approved elective **course names** next to codes, with a filter box.
- ECE/ECB header quick link to the official Tech Core Packet; Tools include catalog migrate (24-26 ↔ 26-28) and a free-elective hour meter (14 / 11).
- Swap to an Undeclared Business BBA template at any time from the curriculum picker, with McCombs major tracks (Finance, Accounting, MIS, Marketing, BAX, IB Skills, iMPA) and Canfield Business Honors layered on top.
- Auto-checks GitHub on startup so you know when a newer version is published, with one click to grab the latest copy.
- Build multiple schedule plans side by side and compare them. The compare view highlights which courses you share between plans and which ones are unique to each.
- Drag courses between semesters to rearrange your plan.
- Track degree completion with per semester progress and a total credit count.
- Add custom courses, custom semesters, or wipe everything and start fresh for a different major.
- Filter by category (ECE, Math, Business, Core, Advanced Tech, Physics, Other) to see how balanced any given semester looks.
- Save automatically to your browser. Export a share string to send a plan to a friend or move it to another device.
- Light and dark mode that follows your system theme.

## How to use it

Open `college-course-planner.html` in any modern browser. That is the whole install.

Releases on this repo always ship the latest planner as a downloadable asset, so you can grab a known version without cloning.

## Who it is for

- ECB students who want to see how their plan changes if they swap a semester or push a course back.
- Anyone in any UT major who wants a faster, draggable degree audit.

## Privacy

Everything stays in your browser. There is no account, no server, and no analytics. The share feature encodes your plan into a string that you copy and paste yourself, so nothing leaves your machine unless you send it.

## License

MIT. Do whatever you want with it.
