# Roadmap

A running list of things that would make the planner more useful. Not all of these are commitments. They are sorted roughly by how much value they add per hour of work.

## Near term

### Prerequisite graph and validation
Show a warning when a course is placed in a semester before its prerequisites. The data is already in the `note` field for most courses, but it is free text. Parsing it into a real list of prereq codes would unlock real validation, and eventually a visual graph of which courses unblock which.

### Real course catalog import
Right now the default curriculum is hard coded. Pulling from the UT course schedule, even as a one time scrape per semester, would let users search by department and add real classes with real credit hours instead of typing them by hand.

### Conflict and load warnings
Flag semesters that are over 18 hours, under 12 hours, or that pile too many writing flag or quantitative reasoning flag courses together. Same idea for advanced tech components in ECB, where the program has minimum and maximum counts per area.

### Flag and core requirement tracking
UT degrees require a certain number of flags (writing, ethics, independent inquiry, quantitative reasoning, cultural diversity, global cultures). Track these as a checklist that ticks off as you add flagged courses, so you do not get to graduation week and find out you are missing one.

### Cloud sync
Local storage is fine until you switch devices or clear your browser. A lightweight optional sync, either through a free tier service or through GitHub gists, would make this less scary to rely on. Has to be opt in.

## Medium term

### Schedule generator (the IDA killer)
Given a list of courses you still need and the times they are offered, produce all valid weekly schedules with no time conflicts. Rank them by criteria the user picks, things like no eight AMs, no Friday classes, professor rating, or compact day. This is what makes IDA so painful and what would make people actually switch.

### Professor and section data
Integrate RateMyProfessor or the UT grade distribution data so each course shows the average GPA and the top rated section. Helps users pick between sections of the same class.

### What if mode
Pick a category like Advanced Tech Components and have the planner show every legal combination that satisfies the degree requirement. Useful for ECB students who are deciding which technical track to pursue without manually trying each one.

### Calendar export
Export a chosen semester as an .ics file you can drop into Google Calendar or Apple Calendar. Bonus: include exam dates and add date deadlines.

### Mobile polish
The current layout works on phones but is not designed for them. Touch friendly drag and drop, swipeable semester cards, and an add course flow that does not require pinch zoom.

## Long term

### Multi degree and minor support
Right now there is one degree plan in view at a time. Real students often have a major plus a minor plus a certificate. Showing all three sets of requirements and the courses that satisfy more than one at once would be genuinely new.

### Collaborative plans
Two students working on a plan together in real time, the way Figma works. Especially useful for ECB cohorts where everyone takes the same core sequence and people compare paths constantly.

### Other school support
Pull the same trick for Texas A&M, Rice, UT Dallas, and Texas State. The hard part is the catalog data, not the UI. A community contributed set of curriculum JSON files would let one codebase serve every Texas school.

### Advising mode
A read only view your advisor can open with a short code. They see your plan, drop comments on specific semesters or courses, and you accept or reject the changes. Removes the back and forth of screenshot driven advising sessions.

### AI assistant
Ask "what is the lightest path to graduation if I want to study abroad junior spring" and get back a plan with the swaps already made. The hard part is making it cite real catalog rules instead of hallucinating prereqs, so this only makes sense after the catalog import and prereq graph are real.

## Probably never

- Native mobile apps. A good progressive web app covers this.
- Login accounts. The whole point is no friction. If sync ships, it should be optional and tokenless.
- Tuition or financial aid calculations. Too far from the core problem and the numbers change every year.
