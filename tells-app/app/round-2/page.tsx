"use client";

import { useRef, useState } from "react";
import { useGame } from "@/lib/gameState";
import { useCountdown } from "@/lib/useCountdown";
import { HudBar } from "@/components/HudBar";
import { IntroOverlay } from "@/components/IntroOverlay";
import { DebriefOverlay } from "@/components/DebriefOverlay";
import { ObjectiveBar } from "@/components/ObjectiveBar";
import { Icon } from "@/components/Icon";

const ROUND_SECONDS = 240; // one clock for all three systems
const SOLVE = 250;
const FIRST_TRY_BONUS = 150;
const FAIL_COST = 80;

interface Control {
  id: string;
  label: string; // plain language
  tag: string; // the technical name
  correct: boolean;
  note: string; // why right (correct) / what goes wrong (incorrect) — shown on reveal & debrief
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
  atRisk: string; // one-line: what's sensitive here
  controls: Control[]; // 6 controls, exactly 3 correct
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
    atRisk: "The summary only needs the problem — none of the name, card, SSN or health note.",
    controls: [
      { id: "sup-redact", label: "Mask the personal details before the model sees them", tag: "redaction", correct: true, note: "The summary needs the issue, not her SSN or card — so send none of it." },
      { id: "sup-nolog", label: "Turn off logging of the raw prompts sent to the model", tag: "request logging", correct: true, note: "PII sitting in plain-text request logs is the quiet leak that turns up in the next breach." },
      { id: "sup-noretain", label: "Use a no-retention / no-training endpoint", tag: "zero-retention", correct: true, note: "So the provider can't keep the tickets or train future models on them." },
      { id: "sup-prompt", label: "Add “never store personal data” to the prompt", tag: "prompt instruction", correct: false, note: "The model still received everything — a written instruction isn't an access control." },
      { id: "sup-audit", label: "Keep a full audit log of every ticket sent", tag: "audit log", correct: false, note: "That copies every SSN and card number into a log — the opposite of protecting it. (Contrast with the hiring system, where logging is right.)" },
      { id: "sup-encrypt", label: "Encrypt the ticket database at rest", tag: "encryption at rest", correct: false, note: "Guards the files on disk, not the copy you hand to the model." },
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
    atRisk: "The risk here isn't customer PII — it's live secrets and proprietary code.",
    controls: [
      { id: "code-secret", label: "Scan for and strip secrets & keys before indexing", tag: "secret scanning", correct: true, note: "API keys and signing secrets must never reach the model — or its logs." },
      { id: "code-private", label: "Use a private / no-training enterprise endpoint", tag: "no-training tenancy", correct: true, note: "So proprietary code isn't retained or used to train a public model." },
      { id: "code-access", label: "Only retrieve docs the asking engineer is allowed to see", tag: "access-scoped retrieval", correct: true, note: "Stops the assistant surfacing repos and wiki pages a user isn't cleared for." },
      { id: "code-pii", label: "Redact customer names and SSNs", tag: "PII redaction", correct: false, note: "There's no customer PII in this data — the risk is secrets and IP, so this protects nothing here." },
      { id: "code-prompt", label: "Add “don't reveal secrets” to the prompt", tag: "prompt instruction", correct: false, note: "The secrets are still in what you sent — asking the model nicely doesn't remove them." },
      { id: "code-sso", label: "Require SSO + 2FA to use the assistant", tag: "SSO / MFA", correct: false, note: "Controls who logs in, not what the model receives or keeps." },
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
    atRisk: "The identity details invite bias; the experience & skills are what the score should be based on.",
    controls: [
      { id: "hire-strip", label: "Remove protected attributes (name, age, gender, photo, address) before scoring", tag: "de-biasing", correct: true, note: "Scoring on skills, not identity, is what cuts biased outcomes." },
      { id: "hire-audit", label: "Log each decision and the reasons behind it", tag: "audit trail", correct: true, note: "A hiring decision has to be explainable and challengeable — here you NEED the record. (The opposite of the support system.)" },
      { id: "hire-human", label: "Require a human to review before any advance / reject", tag: "human-in-the-loop", correct: true, note: "No candidate should be auto-rejected by a model with no appeal." },
      { id: "hire-dropskills", label: "Redact the candidate's skills and experience too", tag: "over-redaction", correct: false, note: "That's the very data you need to score — redacting it breaks the task, it doesn't reduce bias." },
      { id: "hire-prompt", label: "Add “be fair and unbiased” to the prompt", tag: "prompt instruction", correct: false, note: "Telling the model to be fair doesn't remove the age, photo and gender it can still see." },
      { id: "hire-encrypt", label: "Encrypt the CV files at rest", tag: "encryption at rest", correct: false, note: "Protects stored files, not the biased decision being made." },
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
  const [fb, setFb] = useState<{ tone: "ok" | "bad" | "info"; msg: string } | null>(null);

  const scoreRef = useRef(0);
  const clearedRef = useRef(0);
  const leaksRef = useRef(0);
  const attemptsRef = useRef<Record<string, number>>({});
  const recorded = useRef(false);

  const { timeLeft, reset } = useCountdown(ROUND_SECONDS, phase === "play", () => finalize());

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

  function finalize() {
    if (recorded.current) return;
    recorded.current = true;
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
          "Three different AI systems are about to go live, each fed a different kind of data — customer tickets, your own source code, and job applications.",
          "There's no universal checklist. The controls that protect one system are useless — or harmful — for another. Your job is to fit the right guardrails to each.",
        ]}
        objective="For each of the three systems, read its prompt and the data it's about to receive, then arm the 3 controls that actually protect that specific data flow before opening the gate."
        instructions={[
          "Read the system prompt and the sample record — note which parts are sensitive and whether the model even needs them.",
          "From the 6 controls, arm exactly 3 that fit THIS system. Ask: what must the model not receive, not keep, and who must stay accountable?",
          "Open the gate. A control that protects the wrong thing lets data leak and costs points.",
          "The correct controls differ every system — don't reuse the last answer.",
        ]}
        onStart={start}
        startLabel="Go to the gate"
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
    return (
      <DebriefOverlay
        roundNum={2}
        headline={clearedRef.current === SCENARIOS.length ? "All three systems secured" : `${clearedRef.current} of ${SCENARIOS.length} secured`}
        intro="Different systems, different data, different risks — and different guardrails. The controls that fit customer tickets don't fit source code or hiring decisions."
        stats={[
          { v: String(score), l: "score", color: "text-acc" },
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
        onReplay={start}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-[1180px] mx-auto">
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
      />

      <ObjectiveBar
        maxW="max-w-[1040px]"
        goal={
          <>
            Fit the right guardrails to <b className="text-ink">each</b> system. Read its prompt and data, then arm the{" "}
            <b className="text-acc">3</b> controls that actually protect this specific data flow.
          </>
        }
        scoring="The correct controls differ every system — don't reuse the last answer. A control that guards the wrong thing lets data leak and costs points."
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
              <div className="px-3.5 py-2 border-b border-line flex items-center gap-2 text-[12px] font-semibold">
                <Icon name="inbox" className="text-info" /> {sc.source}
              </div>
              <div className="px-3.5 py-3 text-[12px] font-mono flex flex-col gap-1">
                {sc.fields.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-ink3 shrink-0 min-w-[92px]">{f.label}:</span>
                    <span className={f.risk ? "rounded px-1 bg-crit/20 text-crit border border-crit/40" : "text-ink2"}>{f.value}</span>
                  </div>
                ))}
              </div>
              <div className="px-3.5 py-2 border-t border-line text-[11px] text-ink3 flex items-start gap-1.5">
                <Icon name="alert" className="text-crit mt-px shrink-0" /> {sc.atRisk}
              </div>
            </div>
          </div>

          {/* RIGHT — controls */}
          <div className="flex flex-col min-h-0">
            <div className="text-[11px] font-mono uppercase tracking-wide text-ink3 mb-1">{sc.question}</div>
            <div className="flex items-baseline justify-between mb-2.5">
              <h2 className="text-[15px] font-semibold">
                Arm 3 controls that fit this system
              </h2>
              <span className={`text-[12px] font-mono ${armedInScenario === CORRECT_PER ? "text-acc" : "text-ink3"}`}>{armedInScenario}/3 armed</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {sc.controls.map((c) => {
                const on = armed[c.id];
                const mark = marks[c.id];
                const good = mark === "right";
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    disabled={solved}
                    className={[
                      "text-left rounded-xl border px-3 py-2.5 transition-all disabled:cursor-default",
                      mark ? (good ? "border-ok bg-ok/10" : "border-crit bg-crit/10") : on ? "border-acc bg-acc/10" : "border-line2 bg-panel2 hover:border-acc2",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={[
                          "mt-0.5 w-[18px] h-[18px] rounded-[6px] shrink-0 flex items-center justify-center text-[12px] border",
                          mark ? (good ? "bg-ok/20 border-ok text-ok" : "bg-crit/20 border-crit text-crit") : on ? "bg-acc/20 border-acc text-acc" : "border-line2 text-transparent",
                        ].join(" ")}
                      >
                        <Icon name={mark ? (good ? "check" : "x") : "check"} />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[12.5px] font-semibold leading-snug">{c.label}</span>
                          <span className="text-[9.5px] font-mono uppercase tracking-wide text-ink3 border border-line2 rounded px-1 py-px shrink-0">
                            {c.tag}
                          </span>
                        </div>
                        {mark && <div className={`text-[10.5px] leading-snug mt-1 ${good ? "text-ok" : "text-crit"}`}>{c.note}</div>}
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
