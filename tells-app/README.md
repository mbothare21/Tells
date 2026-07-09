# Tells — AI Security Awareness Game (Next.js)

A competitive, awareness-style security game for a broad workplace audience (developers,
consultants, HR, admins). Four self-contained rounds, each an ordinary workplace task
that quietly teaches one AI/security lesson. Mundane framing (no spy-thriller narration),
per-round timers, score that persists across rounds, a clear objective + how-to-play
briefing before each round, and a debrief that teaches even on a miss — including the
real-world consequences of the mistakes you made.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run typecheck` — TypeScript check

## The rounds

### 1. The assistant's inbox — *Spotting AI hijacking (prompt injection)*
Your company switched on an AI assistant that reads incoming emails, documents, tickets
and web pages and acts on them automatically (drafting replies, screening CVs, scheduling
payments). Attackers hide instructions inside that content to hijack it — a **prompt
injection**. You review a queue of 6 items and, for each, **approve** the safe ones or
**block** the ones that have been hijacked.

- **6 items, 3 clean / 3 injected** — a support ticket (clean), an invoice email with
  *hidden* text rerouting a £12,400 payment, a routine vendor renewal (clean), a
  **web/knowledge-base page the AI *retrieved*** carrying an indirect injection that turns
  its reply into a request for the customer's 2FA code, a CV with *hidden* text forcing a
  10/10 "strong hire", and a security notice that *uses* the words "ignore instructions"
  but is legitimate advice (keyword trap).
- **Mechanics:** three-zone layout (incoming item → the assistant's proposed action →
  your decision), an "Inspect for hidden text" reveal, and immediate per-item feedback.
- **Scoring:** +200 correct; −250 for approving a hijack (it executes); −100 for blocking
  a legitimate task — so both missing a hijack *and* over-blocking cost you.
- **Lesson:** an AI can't reliably tell content from commands; anything it reads (including
  what it *fetches*) can hijack it. Check what it's about to do before it acts.

### 2. The data gate — *Protecting the data you give to AI*
A pipeline is about to send 4,812 customer support tickets (names, SSNs, card numbers,
medical notes) through an AI model for summarisation. It's paused at the gate. You **arm
exactly 3 of 8 controls**, then open the gate.

- **The controls** are in plain language with their technical name shown (redaction,
  request logging, zero-retention, encryption at rest, SSO/MFA, TLS, a confidence score,
  and the trap: *"add a line to the prompt telling the AI to keep data private"* — which
  is already in the visible system prompt and does nothing).
- **Mechanics:** a shared test — *"does it change what the model receives, logs, or
  keeps?"*; a live EXPOSED counter and breach log; the sample record's PII flips to
  redaction blocks on success or "sent as-is" on a leak; a costed category-not-location
  hint.
- **Scoring:** all 3 right → +500 (first try +700). Wrong controls leak the whole batch,
  with severity-weighted penalties and a lingering "records exposed" tally.
- **Lesson:** a polite instruction isn't a control — only not-sending (redaction),
  not-logging, and no-retention actually protect data given to a model.

### 3. Face value — *Detecting AI fakes & manipulated content*
Three escalating tests under one shared clock (4 minutes), later tests worth more:

- **Test 1 — Human or AI?** Classify short writing samples as Human / AI / **can't tell**
  (honest uncertainty scores highest — there's no perfect detector).
- **Test 2 — Real or fabricated applicant?** A realistic **rendered résumé** with a
  photorealistic (StyleGAN, `public/applicant.jpg`) headshot, plus a portfolio and a
  reference email. Flag the fabricated pieces and, in a **reason modal**, say *why*
  (everyday tells: claimed 15+ years vs. dates back to 2016, two full-time jobs in two
  countries at once, a reference from a 6-day-old look-alike domain, a photo with no web
  footprint). Right item + wrong reason scores half; flagging the genuine portfolio costs.
- **Test 3 — Clean or compromised article?** A longer AI-drafted blog post with **three
  camouflaged injections** hidden as an "editorial reviewer note" (exfiltrate the
  subscriber list), a "system instruction" (redirect phishing reports to an attacker), and
  a mid-paragraph aside (hijack the AI summary into a phishing message). Flag each
  compromised **section**, then justify it in the reason modal.
- **Lesson:** verify against independent evidence, name the specific tell, and treat
  AI-generated content as untrusted input.

### 4. The review board — *AI governance & fairness*
Three automated decisions were flagged for human review. Tag each with the single
governance failure that best explains what went wrong — **unfair bias** (a hiring tool
using postal code as a proxy), **no explanation** (a loan denial no one can interpret), or
a **privacy violation** (medical prioritisation using brokered browsing data). +250 per
correct call.

## Briefings & debriefs
- **Before each round:** an intro overlay with a highlighted **objective** and a numbered
  **how-to-play** list.
- **After each round:** the per-item breakdown, a **"What this round was really about"**
  lesson, and — when you made mistakes — an **"If this were a live system"** block spelling
  out the real-world consequences of *your* specific errors.
- **After the game (`/debrief`):** a comprehensive report — total score, rounds cleared,
  average accuracy, hijacks/leaks that slipped through; **strong zones vs. focus areas**
  mapped to named competencies; a **"what the game taught you"** checklist of every round's
  core takeaway; and a round-by-round table with a Strong / Solid / Needs-work band.

## Changing the name
The game title is in ONE place: `lib/config.ts` → `GAME_TITLE` (and `GAME_TAGLINE`).
Currently set to "Tells".

## Tuning
- Each round's data, copy, and `ROUND_SECONDS` live at the top of its
  `app/round-N/page.tsx`.
- Per-round competency, takeaway, and focus text (used by the final report) live in
  `lib/rounds.ts`.
- Round 2's batch size, penalties, and hint/solve values are constants at the top of
  `app/round-2/page.tsx`.

## Structure
- `app/page.tsx` — mission map
- `app/round-1..4/page.tsx` — the four rounds
- `app/debrief/page.tsx` — the comprehensive end-of-game report
- `components/` — Icon, HudBar, IntroOverlay, DebriefOverlay, ObjectiveBar (shared chrome)
- `lib/` — game state (localStorage), rounds registry, types, config, countdown
- `public/applicant.jpg` — the generated headshot used in Round 3, Test 2

## Note for a real event
All answers and matchers are client-side — perfect for testing the design, but for a live
competitive event move validation (and the Round 3 headshot / answer keys) server-side so
players can't read the source.
