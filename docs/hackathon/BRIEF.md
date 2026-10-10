# Banana Hacks 2026 — Event Brief

Checked: 2026-10-10 ~20:15 EDT (2026-10-11 ~04:15 SGT). Snapshots of every page are in `sources/`.

Sources:
- Devpost overview: https://banana-hacks-1111.devpost.com/ (`sources/devpost_overview.txt`)
- Devpost rules: https://banana-hacks-1111.devpost.com/rules (`sources/devpost_rules.txt`)
- Devpost schedule: https://banana-hacks-1111.devpost.com/details/dates (`sources/devpost_schedule.txt`)
- Official site: https://www.bananahacks.tech — /prizes /faq /schedule /code-of-conduct /about (`sources/site_*.txt`)

## CONFIRMED

**What it is.** First edition of an online Image-AI / generative-AI hackathon for students. "Build apps, games, and tools that solve real problems in a weekend around Image AI." Classification, synthetic generation, CV, fine-tuning all count. Organizer contact: team@bananahacks.tech. Not an MLH member event, but follows the MLH Code of Conduct.

**Eligibility.** Ages 14–24, currently enrolled at a school or educational institution, any country (standard Devpost exceptions). Companies excluded. Teams 1–4; solo is judged in the same pool. One team per person. Organizers and judges cannot win.

**Timeline (EDT).** Opening/hacking began Fri Oct 9, 20:45 EDT (Devpost submission period opens 20:00). Judging: Oct 12, 09:00–17:00 EDT. Winners: Oct 12, 18:00–19:00 EDT (closing ceremony on Zoom/Discord).

**Deadline conflict. Use the earliest one.**
| Source | Stated deadline | In SGT |
|---|---|---|
| Site /schedule | Sun Oct 11, 11:59 PM **EDT** | Mon Oct 12, 11:59 |
| Devpost | Oct 12, 12:00 AM EDT | Mon Oct 12, 12:00 |
| Site /prizes, /about, /code-of-conduct | Sun Oct 11, 11:59 PM **AoE** | Mon Oct 12, 19:59 |
→ **Hard deadline: Sun Oct 11, 23:59 EDT = Mon Oct 12, 11:59 SGT.** The Devpost portal closes at 00:00 EDT anyway. Late entries are not accepted. Do not assume the AoE time applies.

**Judging.** Five criteria, **equally weighted**, each scored 1–5 (site /faq and /prizes):
1. Technical Execution & Difficulty. "Thin API wrappers should score lower." Thoughtful model choice, non-trivial integration.
2. Innovation & Creativity. "Generic clones of well-known apps score lower."
3. Use of the Image AI Theme. Image AI must be core: "If the image AI could be removed without breaking the core experience, score lower."
4. Impact & Usefulness. Clear user, clear benefit, plausible use after the weekend.
5. Design, Presentation & Demo. Polished UI and visual output, plus a clear video and write-up.
Judges (Devpost): Chakri Cherukuri (Quant @ Bloomberg), Rajveer Dharkar (SWE @ Maximor AI), Amit Panda (SWE @ LinkedIn), Nandish Nanjappa (SWE @ Attentive), Fenil Shah (SWE @ Amazon), Kariaa Team. FAQ: "Judges will poke at live demos where they can."

**Prizes.**
- $500 cash: 1 winner (top project). This is the only cash prize.
- CodeCrafters VIP: 2 years for 1st, 1 year for 2nd, 6 months for 3rd. Every member of the winning team gets one.
- Category awards (site /prizes; no application needed; the prize attached to each is UNPUBLISHED): Best Creative Tool, Best Fine-tune, Most Surprising Output, People's Choice (participant vote on demo day).
- Participation perks. Devpost lists 200 n8n Pro licenses, 300 .xyz domains, and 300 Kariaa "40 credits". The site lists 50 Interview Cake licenses and .xyz domains. The two lists differ.

**Required deliverables.**
- Devpost: project name, team members, **public YouTube video ≤3 min (strict)**, a Devpost description, and a **GitHub link**. The description and the video should both cover brainstorming, inspiration, design process, resources, and the final product.
- Devpost rules say the demo video is "2–3 minutes". Target 2:15–2:50 to satisfy both.
- Site: a working demo (a live URL or video; "a working link is better than a polished video"), the GitHub repo, and **≤500 words** on what was built and why.
- Code must be in a **public GitHub repo with commits inside the hacking window** ("We check commit timestamps"). No reused code. A previously used idea is allowed.
- Cite the open-source libraries, datasets, and pretrained models used in the README. **Disclose the generative AI tools used** (including Claude Code).
- No cross-submission to other hackathons.
- Winners must be available for a short demo call with sponsors after the event.
- No hardware needed. Projects should be demoable over screen share or at a hosted link.

**Tech.** Any stack is allowed. Pretrained models are allowed and expected. Judging focuses on what is built on top (app, fine-tune, prompting, wiring). There are no mandatory sponsor technologies.

**Sponsors.** CodeCrafters, Interview Cake, Rosebud AI (AI game building), XYZ (.xyz domains), Kariaa (jobs platform). n8n appears on Devpost only. No sponsor has a tech-integration prize.

## INFERENCES
- The event is small (Devpost shows 480 participants; the site shows 218 registered). Many entrants are beginners, so a polished, technically deep, working project can stand out.
- The judges are industry SWEs, not artists or domain experts. They will likely reward visible engineering depth, a clear "who cares", and a demo that works when they poke at it.
- Devpost says website submissions are "much preferred", but the site's rules say to "submit through the official portal". Submit on Devpost (the authoritative portal with the deadline), and also use a website form if one exists.

## UNKNOWN
- What prize, if any, comes with each category award.
- Whether the promised "compute credits" actually exist. The FAQ says "we're lining up". Do not rely on them.
- The theme/challenge details "revealed at the opening ceremony" (site /code-of-conduct). The site and Devpost describe only the broad Image-AI theme, and Discord updates have not been seen. The Devpost Updates page is empty. **Ask the user to check Discord for any announced sub-theme.**
- Whether the user is registered on Devpost and/or the website form.

## Environment (verified 2026-10-11 SGT)
- Local: RTX 4080 16 GB, i9-14900KF, 48 GB RAM, Windows 11, Python 3.14, Node 24, git, gh (logged in as N-H-L). The user's timezone is SGT (UTC+8).
