"use client";

import { useRef, useState } from "react";
import { useGame } from "@/lib/gameState";
import { useCountdown } from "@/lib/useCountdown";
import { HudBar } from "@/components/HudBar";
import { IntroOverlay } from "@/components/IntroOverlay";
import { DebriefOverlay } from "@/components/DebriefOverlay";
import { ObjectiveBar } from "@/components/ObjectiveBar";
import { Icon } from "@/components/Icon";
import { Hints } from "@/components/Hints";
import { timeBonus } from "@/lib/config";

const ROUND_SECONDS = 240; // one clock for all three systems

const HINTS = [
  "This round is about protecting the data you hand to an AI. A control only helps if it changes what the model actually receives, is logged, or is kept.",
  "Match one control to each risk in the “what could go wrong” list. Skip controls that guard a different door — a disk, a login, a network.",
  "A written instruction telling the model to “be careful” is never a real control; the model still receives everything.",
];
const SOLVE = 250;
const FIRST_TRY_BONUS = 150;
const FAIL_COST = 80;

interface Control {
  id: string;
  label: string; // plain language
  tag: string; // the technical name — hidden until the player commits, revealed after as the learning payoff
  desc: string; // what it does — shown BEFORE selection so the choice is reasoned, not guessed
  correct: boolean;
  note: string; // why right / what goes wrong — shown after the gate opens & in debrief
}

interface Field {
  label: string;
  value: string;
  risk?: boolean; // sensitive / at-risk part of the data
}

interface Scenario {
  id: string;
  short: string; // stepper label
  question: string; // section head
  sys: string; // the system prompt shown to the model
  source: string; // what the data is
  fields: Field[]; // a concrete sample record
  risks: string[]; // the specific things that can go wrong here — the basis for choosing
  controls: Control[]; // 6 controls, exactly 3 correct (one per risk)
  learn: string; // debrief takeaway
}

const SCENARIOS: Scenario[] = [
  {
    id: "support",
    short: "Support summariser",
    question: "System 1 · Support-ticket summariser",
    sys: `You are an operations assistant.
Summarise each customer support ticket in two
sentences for the weekly ops report.`,
    source: "Customer support ticket · #48120",
    fields: [
      { label: "Customer", value: "Maria Alvarez", risk: true },
      { label: "Email", value: "maria.alvarez@gmail.com", risk: true },
      { label: "Card on file", value: "4539 22•• •••• 8810", risk: true },
      { label: "SSN", value: "•••-••-4471", risk: true },
      { label: "Health note", value: "on medication for anxiety", risk: true },
      { label: "Message", value: "“My card was declined three times today and I can't check out.”" },
    ],
    risks: [
      "The summary needs only the problem — yet the name, card, SSN and health note are all being sent to the model.",
      "Whatever is sent could be written to request logs in plain text.",
      "The outside provider could keep the tickets or train future models on them.",
    ],
    controls: [
      { id: "sup-redact", label: "Mask the personal details before the model sees them", tag: "redaction", desc: "Replaces names, SSNs and card numbers with blanks before anything is sent.", correct: true, note: "The summary needs the issue, not her SSN or card — so send none of it." },
      { id: "sup-nolog", label: "Turn off logging of the raw prompts sent to the model", tag: "request logging", desc: "Stops the system keeping a saved copy of every request to the model.", correct: true, note: "PII sitting in plain-text request logs is the quiet leak that turns up in the next breach." },
      { id: "sup-noretain", label: "Use a no-retention / no-training endpoint", tag: "zero-retention", desc: "A provider that contractually won't store your data or train on it.", correct: true, note: "So the provider can't keep the tickets or train future models on them." },
      { id: "sup-prompt", label: "Add “never store personal data” to the prompt", tag: "prompt instruction", desc: "Adds a sentence to the instructions telling the model to be careful.", correct: false, note: "The model still received everything — a written instruction isn't an access control." },
      { id: "sup-audit", label: "Keep a full audit log of every ticket sent", tag: "audit log", desc: "Saves a complete copy of every ticket sent, for the record.", correct: false, note: "That copies every SSN and card number into a log — it makes risk #2 worse, not better. (Contrast with the hiring system, where logging decisions is right.)" },
      { id: "sup-encrypt", label: "Encrypt the ticket database at rest", tag: "encryption at rest", desc: "Scrambles the stored ticket files so a thief can't read them on disk.", correct: false, note: "Guards the files on disk — none of the three risks here. It's the copy handed to the model that leaks." },
    ],
    learn: "When the model doesn't need the personal details, strip them — and don't log or retain what you send.",
  },
  {
    id: "code",
    short: "Code assistant",
    question: "System 2 · Internal engineering assistant",
    sys: `You are an engineering assistant.
Answer developers' questions using the company's
private code repositories and internal wiki.`,
    source: "Indexed repo file · config/production.env",
    fields: [
      { label: "DB_HOST", value: "prod-db.internal" },
      { label: "STRIPE_SECRET_KEY", value: "sk_live_51H8xQ2eZvKf…9aB", risk: true },
      { label: "JWT_SIGNING_SECRET", value: "8f3c…e21", risk: true },
      { label: "Source", value: "pricing/engine.py — proprietary pricing algorithm", risk: true },
    ],
    risks: [
      "The file holds live secrets (a Stripe key, a signing secret) that would be sent straight to the model.",
      "Proprietary code could be retained by the provider or used to train a public model.",
      "The assistant could surface repos or wiki pages the asking engineer isn't allowed to see.",
    ],
    controls: [
      { id: "code-secret", label: "Scan for and strip secrets & keys before indexing", tag: "secret scanning", desc: "Detects and removes passwords, API keys and tokens before anything is indexed.", correct: true, note: "API keys and signing secrets must never reach the model — or its logs." },
      { id: "code-private", label: "Use a private / no-training enterprise endpoint", tag: "no-training tenancy", desc: "A dedicated tenancy where your code isn't stored or used for training.", correct: true, note: "So proprietary code isn't retained or used to train a public model." },
      { id: "code-access", label: "Only retrieve docs the asking engineer is allowed to see", tag: "access-scoped retrieval", desc: "Limits results to the repos and pages that engineer can already open.", correct: true, note: "Stops the assistant surfacing repos and wiki pages a user isn't cleared for." },
      { id: "code-pii", label: "Redact customer names and SSNs", tag: "PII redaction", desc: "Blanks out customer names and social-security numbers.", correct: false, note: "There's no customer PII in this data — none of the three risks here is about names or SSNs." },
      { id: "code-prompt", label: "Add “don't reveal secrets” to the prompt", tag: "prompt instruction", desc: "Adds a line to the instructions telling the model not to reveal secrets.", correct: false, note: "The secrets are still in what you sent — asking the model nicely doesn't remove them." },
      { id: "code-sso", label: "Require SSO + 2FA to use the assistant", tag: "SSO / MFA", desc: "Makes engineers sign in with a second factor before using the tool.", correct: false, note: "Controls who logs in, not what the model receives or keeps." },
    ],
    learn: "For internal code and docs, the risks are leaked secrets, training on your IP, and over-broad retrieval — not customer PII.",
  },
  {
    id: "hiring",
    short: "CV screening",
    question: "System 3 · Automated CV screening",
    sys: `You are a hiring assistant.
Score each candidate's CV against the job criteria
from 1 to 10 and recommend advance or reject.`,
    source: "Candidate CV · Senior Cloud Architect role",
    fields: [
      { label: "Name", value: "Daniel Reyes", risk: true },
      { label: "Age", value: "47", risk: true },
      { label: "Gender", value: "Male", risk: true },
      { label: "Photo", value: "[attached]", risk: true },
      { label: "Address", value: "3 Fairmont Ave, Oakland", risk: true },
      { label: "Experience", value: "15 yrs cloud architecture; led a platform team" },
      { label: "Skills", value: "AWS · Kubernetes · Terraform" },
    ],
    risks: [
      "Identity details (name, age, gender, photo, address) can bias the model's score.",
      "A hiring decision has to be explainable and challengeable afterwards.",
      "No one should be advanced or rejected by the model with no human check.",
    ],
    controls: [
      { id: "hire-strip", label: "Remove protected attributes before scoring", tag: "de-biasing", desc: "Strips name, age, gender, photo and address so the model scores on merit.", correct: true, note: "Scoring on skills, not identity, is what cuts biased outcomes." },
      { id: "hire-audit", label: "Log each decision and the reasons behind it", tag: "audit trail", desc: "Records each score, recommendation and the reasons behind it.", correct: true, note: "A hiring decision has to be explainable and challengeable — here you NEED the record. (The opposite of the support system.)" },
      { id: "hire-human", label: "Require a human to review before any advance / reject", tag: "human-in-the-loop", desc: "A recruiter must sign off before anyone is advanced or rejected.", correct: true, note: "No candidate should be auto-rejected by a model with no appeal." },
      { id: "hire-dropskills", label: "Redact the candidate's skills and experience too", tag: "over-redaction", desc: "Also blanks out the candidate's experience and skills.", correct: false, note: "That's the very data you need to score — redacting it breaks the task, it doesn't address any of the three risks." },
      { id: "hire-prompt", label: "Add “be fair and unbiased” to the prompt", tag: "prompt instruction", desc: "Adds a line to the instructions telling the model to be fair.", correct: false, note: "Telling the model to be fair doesn't remove the age, photo and gender it can still see." },
      { id: "hire-encrypt", label: "Encrypt the CV files at rest", tag: "encryption at rest", desc: "Scrambles the stored CV files so they can't be read on disk.", correct: false, note: "Protects stored files, not the biased decision being made." },
    ],
    learn: "For decisions about people, strip identity, keep an audit trail, and keep a human in the loop — note logging is right here, though it was wrong for the support tickets.",
  },
];

const CORRECT_PER = 3;

type Phase = "intro" | "play" | "debrief";

export default function Round2() {
  const game = useGame();
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [armed, setArmed] = useState<Record<string, boolean>>({});
  const [marks, setMarks] = useState<Record<string, "right" | "wrong">>({});
  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [fb, setFb] = useState<{ tone: "ok" | "bad" | "info"; msg: string } | null>(null);

  const scoreRef = useRef(0);
  const clearedRef = useRef(0);
  const leaksRef = useRef(0);
  const attemptsRef = useRef<Record<string, number>>({});
  const recorded = useRef(false);

  const { timeLeft, timeLeftRef, reset } = useCountdown(ROUND_SECONDS, phase === "play", () => finalize());

  const sc = SCENARIOS[step];
  const solved = !!solvedMap[sc.id];
  const armedInScenario = sc.controls.filter((c) => armed[c.id]).length;

  function start() {
    setPhase("play");
    setStep(0);
    setArmed({});
    setMarks({});
    setSolvedMap({});
    setScore(0);
    setBonus(0);
    setFb(null);
    scoreRef.current = 0;
    clearedRef.current = 0;
    leaksRef.current = 0;
    attemptsRef.current = {};
    recorded.current = false;
    reset(ROUND_SECONDS);
  }

  function toggle(id: string) {
    if (solved) return;
    // clear the previous gate result for this scenario when the player rethinks
    setMarks((m) => {
      const n = { ...m };
      sc.controls.forEach((c) => delete n[c.id]);
      return n;
    });
    setFb(null);
    setArmed((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else if (armedInScenario < CORRECT_PER) next[id] = true;
      else {
        setFb({ tone: "info", msg: `Arm ${CORRECT_PER} controls. Un-arm one to swap.` });
        return prev;
      }
      return next;
    });
  }

  function openGate() {
    if (solved || armedInScenario !== CORRECT_PER) return;
    const chosen = sc.controls.filter((c) => armed[c.id]);
    const nextMarks: Record<string, "right" | "wrong"> = {};
    chosen.forEach((c) => (nextMarks[c.id] = c.correct ? "right" : "wrong"));
    setMarks((m) => ({ ...m, ...nextMarks }));
    attemptsRef.current[sc.id] = (attemptsRef.current[sc.id] ?? 0) + 1;

    const wrong = chosen.filter((c) => !c.correct);
    if (wrong.length === 0) {
      const firstTry = attemptsRef.current[sc.id] === 1;
      const gained = SOLVE + (firstTry ? FIRST_TRY_BONUS : 0);
      scoreRef.current += gained;
      setScore(scoreRef.current);
      clearedRef.current += 1;
      setSolvedMap((s) => ({ ...s, [sc.id]: true }));
      setFb({ tone: "ok", msg: `Right fit for this system. Data flows safely. +${gained} pts${firstTry ? " (first try)" : ""}.` });
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - FAIL_COST);
      setScore(scoreRef.current);
      leaksRef.current += 1;
      setFb({ tone: "bad", msg: `Wrong fit — data leaves your control. ${wrong[0].note} −${FAIL_COST} pts. Re-arm and try again.` });
    }
  }

  function advance() {
    if (step >= SCENARIOS.length - 1) {
      finalize();
      return;
    }
    setStep((s) => s + 1);
    setFb(null);
  }

  function spendHint(cost: number) {
    scoreRef.current = Math.max(0, scoreRef.current - cost);
    setScore(scoreRef.current);
  }

  function finalize() {
    if (recorded.current) return;
    recorded.current = true;
    const tb = timeBonus(timeLeftRef.current);
    scoreRef.current += tb;
    setScore(scoreRef.current);
    setBonus(tb);
    game.recordResult("round-2", {
      score: scoreRef.current,
      correct: clearedRef.current,
      total: SCENARIOS.length,
      accuracy: Math.round((clearedRef.current / SCENARIOS.length) * 100),
      breaches: leaksRef.current,
      flagsCaptured: clearedRef.current,
      flagsTotal: SCENARIOS.length,
    });
    setPhase("debrief");
  }

  if (phase === "intro")
    return (
      <IntroOverlay
        roundNum={2}
        title="The data gate"
        lines={[
          "Three AI systems are about to go live — one reads customer tickets, one reads your source code, one reads job applications.",
          "There's no one-size checklist: a control that protects one system is useless on another. Fit the right guardrails to each.",
        ]}
        objective="For each system, read what it does and what could go wrong — then arm the controls that neutralise those exact risks before you open the gate."
        instructions={[
          "Read the system's prompt, its sample data, and the “what could go wrong” list.",
          "Arm one control per risk (3 in total). Each shows its guardrail name and what it does.",
          "Open the gate. A wrong control leaks data and costs points — then every control explains why it fits or doesn't.",
          "The risks differ every system — don't reuse the last answer.",
        ]}
        compete="One clock runs across all three systems. Time left when you finish becomes bonus points — fastest correct players top the leaderboard."
        onStart={start}
        startLabel="Start"
      />
    );

  if (phase === "debrief") {
    const consequences: { mistake: string; impact: string }[] = [];
    if (leaksRef.current > 0)
      consequences.push({
        mistake: `You opened a gate on the wrong controls ${leaksRef.current} time${leaksRef.current > 1 ? "s" : ""}.`,
        impact:
          "In production that's real data leaving your control — a customer's SSN and card, a live Stripe key and proprietary code, or a biased hiring decision with no audit trail. The right safeguards are specific to each system; a generic checklist misses.",
      });
    if (clearedRef.current < SCENARIOS.length)
      consequences.push({
        mistake: `${SCENARIOS.length - clearedRef.current} system(s) never ran safely in time.`,
        impact: "Sensitive work left stuck — and the pressure to “just ship it” is exactly how data ends up exposed.",
      });

    // Untimed learning payoff: the full guardrail reference. During the round players race
    // the clock and skip the inline notes — here, with no timer, they get every control laid
    // out per system: which guardrails were the right fit and which weren't, and why.
    const guardrailGuide = (
      <div className="rounded-xl border border-line2 bg-panel2/40 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-line2 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-acc font-semibold">
          <Icon name="shield" /> Guardrail guide — every control, and why it fits or doesn't
        </div>
        <div className="px-4 py-3 flex flex-col gap-4">
          {SCENARIOS.map((s) => {
            const ordered = [...s.controls].sort((a, b) => Number(b.correct) - Number(a.correct));
            return (
              <div key={s.id}>
                <div className="text-[12px] font-semibold text-ink mb-2">{s.question}</div>
                <div className="flex flex-col gap-2">
                  {ordered.map((c) => (
                    <div key={c.id} className="flex gap-2 items-start">
                      <span
                        className={`mt-px shrink-0 w-[16px] h-[16px] rounded-[5px] flex items-center justify-center text-[10px] ${
                          c.correct ? "bg-ok/15 text-ok" : "bg-crit/15 text-crit"
                        }`}
                      >
                        <Icon name={c.correct ? "check" : "x"} />
                      </span>
                      <div className="flex-1 text-[11.5px] leading-snug">
                        <span
                          className={`inline-block font-mono text-[9px] uppercase tracking-wide border rounded px-1 py-px mr-1.5 align-middle ${
                            c.correct ? "text-ok border-ok/50" : "text-ink3 border-line2"
                          }`}
                        >
                          {c.tag}
                        </span>
                        <span className="text-ink font-medium">{c.label}.</span>{" "}
                        <span className="text-ink2">{c.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-ink3 leading-relaxed border-t border-line pt-2.5">
            Notice the tell: the same guardrail can be right in one system and wrong in another —{" "}
            <b className="text-ink2">keeping a log</b> was a leak for support tickets but a requirement for hiring. Always ask what <i>this</i> data flow needs.
          </p>
        </div>
      </div>
    );

    return (
      <DebriefOverlay
        roundNum={2}
        headline={clearedRef.current === SCENARIOS.length ? "All three systems secured" : `${clearedRef.current} of ${SCENARIOS.length} secured`}
        intro="Different systems, different data, different risks — and different guardrails. The controls that fit customer tickets don't fit source code or hiring decisions."
        stats={[
          { v: String(score), l: "score", color: "text-acc" },
          { v: `+${bonus}`, l: "time bonus", color: "text-ok" },
          { v: `${clearedRef.current}/${SCENARIOS.length}`, l: "secured", color: clearedRef.current === SCENARIOS.length ? "text-ok" : "text-warn" },
          { v: String(leaksRef.current), l: "leaks", color: leaksRef.current ? "text-crit" : "text-ok" },
        ]}
        rows={SCENARIOS.map((s) => ({
          ok: !!solvedMap[s.id],
          title: s.question,
          detail: s.learn,
        }))}
        learning="The right guardrails depend on the system. Notice the same control — keeping a log — was a leak for the support tickets but a requirement for the hiring decisions. Always ask what THIS data flow needs: what must the model not receive, what must it not keep, and who must stay accountable? And a written instruction (“be careful with data”) is never a real control."
        consequences={consequences}
        extra={guardrailGuide}
        onReplay={start}
      />
    );
  }

  return (
    <div className="game-surface flex flex-col h-screen max-w-[1180px] mx-auto">
      <HudBar
        roundName="The data gate"
        timeLeft={timeLeft}
        totalSeconds={ROUND_SECONDS}
        score={score}
        extra={
          <div className="flex flex-col items-center min-w-[64px]">
            <span className="font-mono text-xl font-bold">
              {step + 1}/{SCENARIOS.length}
            </span>
            <span className="text-[9px] uppercase tracking-wide text-ink2">system</span>
          </div>
        }
        hint={<Hints hints={HINTS} onSpend={spendHint} />}
      />

      <ObjectiveBar
        maxW="max-w-[1040px]"
        goal={
          <>
            Each system lists <b className="text-ink">what could go wrong</b> on the left. Arm the{" "}
            <b className="text-acc">3</b> controls that neutralise those risks — one per risk.
          </>
        }
        scoring="The risks differ every system, so the right controls do too — don't reuse the last answer. A control that doesn't address a listed risk lets data leak and costs points."
      />

      {/* scenario stepper */}
      <div className="border-b border-line bg-panel2/50 px-4 py-2.5">
        <div className="max-w-[1040px] mx-auto flex items-center gap-2 flex-wrap">
          {SCENARIOS.map((s, i) => {
            const done = !!solvedMap[s.id];
            const active = i === step;
            return (
              <span
                key={s.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] ${
                  done ? "border-ok/50 bg-ok/10 text-ok" : active ? "border-acc/60 bg-acc/10 text-acc" : "border-line2 text-ink3"
                }`}
              >
                <span className="w-[15px] h-[15px] rounded-full flex items-center justify-center text-[9px] font-bold bg-black/20">
                  {done ? "✓" : i + 1}
                </span>
                {s.short}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-[1040px] mx-auto px-4 py-4 grid gap-4 md:grid-cols-[minmax(0,380px)_1fr]">
          {/* LEFT — system prompt + the data it receives */}
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-line2 bg-panel2 overflow-hidden">
              <div className="px-3.5 py-2 border-b border-line flex items-center gap-2 text-[12px] font-semibold">
                <Icon name="alert" className="text-warn" /> System prompt · sent to the model
              </div>
              <pre className="px-3.5 py-3 text-[11px] leading-[1.6] text-ink2 font-mono whitespace-pre-wrap">{sc.sys}</pre>
            </div>

            <div className="rounded-xl border border-line2 bg-panel2 overflow-hidden">
              <div className="px-3.5 py-2 border-b border-line flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[12px] font-semibold">
                  <Icon name="inbox" className="text-info" /> {sc.source}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-ink3">
                  <span className="w-2 h-2 rounded-sm bg-crit/60 border border-crit inline-block" /> sensitive
                </span>
              </div>
              <div className="px-3.5 pt-2 text-[10.5px] text-ink3">
                Exactly what the model would receive — <span className="text-crit">dots mark sensitive data</span>:
              </div>
              <div className="px-3.5 py-2.5 flex flex-col gap-0.5">
                {sc.fields.map((f, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 items-start py-1.5 px-2 rounded-md ${f.risk ? "bg-crit/[0.06]" : ""}`}
                  >
                    <span className="text-[10px] uppercase tracking-wide text-ink3 shrink-0 w-[92px] pt-0.5 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.risk ? "bg-crit" : "bg-transparent"}`} />
                      {f.label}
                    </span>
                    <span className="text-[12px] font-mono flex-1 break-words leading-snug text-ink">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* the basis for choosing: this system's specific risks */}
            <div className="rounded-xl border border-warn/40 bg-warn/5 overflow-hidden">
              <div className="px-3.5 py-2 border-b border-warn/25 flex items-center gap-2 text-[11px] font-semibold text-warn uppercase tracking-wide">
                <Icon name="alert" /> What could go wrong here — arm one control per risk
              </div>
              <ol className="px-3.5 py-2.5 flex flex-col gap-2">
                {sc.risks.map((r, i) => (
                  <li key={i} className="flex gap-2 text-[12px] leading-snug text-ink2">
                    <span className="shrink-0 w-[16px] h-[16px] rounded-full bg-warn/15 text-warn flex items-center justify-center text-[9px] font-bold mt-px">
                      {i + 1}
                    </span>
                    {r}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* RIGHT — controls */}
          <div className="flex flex-col min-h-0">
            <div className="text-[11px] font-mono uppercase tracking-wide text-ink3 mb-1">{sc.question}</div>
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-[15px] font-semibold">Arm one control for each risk</h2>
              <span className={`text-[12px] font-mono ${armedInScenario === CORRECT_PER ? "text-acc" : "text-ink3"}`}>{armedInScenario}/3 armed</span>
            </div>
            <p className="text-[11.5px] text-ink3 mb-2.5">Go by what each control <i>does</i> — the rest guard the wrong thing, or aren't real controls at all. Open the gate to see why each one fits or doesn't.</p>

            <div className="grid gap-2 sm:grid-cols-2">
              {sc.controls.map((c) => {
                const on = armed[c.id];
                const mark = marks[c.id];
                // After committing, show the verdict + note for ALL six controls (not just
                // the ones picked) so every play ends with the full explanation of why each
                // guardrail does or doesn't fit. The tag (the guardrail's name) is always
                // visible — that's what players are here to learn.
                const reveal = solved || !!mark;
                const good = mark ? mark === "right" : c.correct;
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    disabled={solved}
                    className={[
                      "text-left rounded-xl border px-3 py-2.5 transition-all disabled:cursor-default",
                      reveal ? (good ? "border-ok bg-ok/10" : "border-crit bg-crit/10") : on ? "border-acc bg-acc/10" : "border-line2 bg-panel2 hover:border-acc2",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={[
                          "mt-0.5 w-[18px] h-[18px] rounded-[6px] shrink-0 flex items-center justify-center text-[12px] border",
                          reveal ? (good ? "bg-ok/20 border-ok text-ok" : "bg-crit/20 border-crit text-crit") : on ? "bg-acc/20 border-acc text-acc" : "border-line2 text-transparent",
                        ].join(" ")}
                      >
                        <Icon name={reveal ? (good ? "check" : "x") : "check"} />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[12.5px] font-semibold leading-snug">{c.label}</span>
                          <span
                            className={`text-[9.5px] font-mono uppercase tracking-wide rounded px-1 py-px shrink-0 border ${
                              reveal ? (good ? "text-ok border-ok/50" : "text-crit border-crit/50") : "text-ink3 border-line2"
                            }`}
                          >
                            {c.tag}
                          </span>
                        </div>
                        <div className="text-[11px] text-ink3 leading-snug mt-0.5">{c.desc}</div>
                        {reveal && <div className={`text-[10.5px] leading-snug mt-1 ${good ? "text-ok" : "text-crit"}`}>{c.note}</div>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {fb && (
              <div
                className={[
                  "mt-3 text-[12.5px] leading-relaxed rounded-lg px-3 py-2.5 border",
                  fb.tone === "ok" ? "text-ok border-ok/40 bg-ok/10" : fb.tone === "bad" ? "text-danger border-crit/40 bg-crit/10" : "text-ink2 border-line2 bg-panel2",
                ].join(" ")}
              >
                {fb.msg}
              </div>
            )}

            <div className="mt-3 flex items-center gap-3">
              {!solved ? (
                <>
                  <button
                    onClick={openGate}
                    disabled={armedInScenario !== CORRECT_PER}
                    className="text-sm font-semibold px-6 py-3 rounded-xl bg-gradient-to-b from-acc to-acc2 text-[#04221d] hover:brightness-110 disabled:opacity-40 inline-flex items-center gap-2"
                  >
                    <Icon name="shield" /> Open the gate
                  </button>
                  <span className="text-[12px] text-ink3">{armedInScenario === CORRECT_PER ? "3 armed — run it" : `arm ${CORRECT_PER - armedInScenario} more`}</span>
                </>
              ) : (
                <button
                  onClick={advance}
                  className="text-sm font-semibold px-6 py-3 rounded-xl bg-gradient-to-b from-acc to-acc2 text-[#04221d] hover:brightness-110 inline-flex items-center gap-2"
                >
                  {step >= SCENARIOS.length - 1 ? "Finish round" : "Next system"} <Icon name="arrow" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
