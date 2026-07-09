"use client";

import { useRef, useState } from "react";
import { useGame } from "@/lib/gameState";
import { useCountdown } from "@/lib/useCountdown";
import { HudBar } from "@/components/HudBar";
import { IntroOverlay } from "@/components/IntroOverlay";
import { DebriefOverlay } from "@/components/DebriefOverlay";
import { ObjectiveBar } from "@/components/ObjectiveBar";
import { Icon } from "@/components/Icon";

const ROUND_SECONDS = 150;
const HINT_COST = 75;
const SOLVE_BASE = 500;
const FIRST_TRY_BONUS = 200;
const BATCH = 4812; // records queued behind the gate

// verdicts: keep = a real control for THIS data flow; theater = an instruction dressed
// as a control; offtopic = real security, but doesn't touch what the model receives;
// noise = doesn't protect data at all.
type Verdict = "keep" | "theater" | "offtopic" | "noise";

// point cost of arming a non-keep control (collateral scales with how wrong it is)
const PENALTY: Record<Exclude<Verdict, "keep">, number> = {
  theater: 200,
  offtopic: 100,
  noise: 60,
};

interface Guard {
  id: string;
  label: string; // plain language — anyone can reason about it
  tag: string; // the real technical name — so SDEs recognise it
  sub: string;
  verdict: Verdict;
  why: string;
}

const GUARDS: Guard[] = [
  {
    id: "redact",
    label: "Strip out the personal details before the AI sees them",
    tag: "redaction",
    sub: "Names, SSNs and card numbers get blanked out of the text first",
    verdict: "keep",
    why: "The AI never receives the private values, so it can't repeat, log or leak them. This is the one control that changes what actually leaves your walls.",
  },
  {
    id: "nolog",
    label: "Stop saving copies of what's sent to the AI",
    tag: "request logging",
    sub: "The system keeps a log of every message — turn that off for this data",
    verdict: "keep",
    why: "Those saved copies are the quiet leak — personal data sitting in plain-text logs is exactly what turns up in the next breach report.",
  },
  {
    id: "noretain",
    label: "Use an AI service that won't keep or learn from your data",
    tag: "zero-retention",
    sub: "A written agreement that the provider won't store it or train on it",
    verdict: "keep",
    why: "Without it, anything you send can be kept by the provider and used to train future models — a leak you can't take back.",
  },
  {
    id: "sysprompt",
    label: "Add a line telling the AI to keep personal data private",
    tag: "prompt instruction",
    sub: "Reinforce the confidentiality rule inside the instructions",
    verdict: "theater",
    why: "Look at the prompt — that rule is ALREADY there, and the data still reached the AI. Telling it to be careful isn't a lock, it's asking nicely. The AI receives everything regardless.",
  },
  {
    id: "encrypt",
    label: "Lock the database where the records are stored",
    tag: "encryption at rest",
    sub: "Scrambles the files on disk so a thief can't read them",
    verdict: "offtopic",
    why: "Genuinely useful — but it protects the files sitting in storage, not the copy you hand to the AI. Locking the filing cabinet doesn't help if you photocopy the files and mail them out.",
  },
  {
    id: "sso",
    label: "Require staff to log in with 2FA to run this job",
    tag: "SSO / MFA",
    sub: "Only verified employees can start the pipeline",
    verdict: "offtopic",
    why: "Controls WHO presses the button, not WHAT gets sent. The records leak whether the person was logged in or not.",
  },
  {
    id: "tls",
    label: "Encrypt the connection to the internal dashboard",
    tag: "HTTPS / TLS",
    sub: "Protects data while it travels between browser and server",
    verdict: "offtopic",
    why: "Protects data while it's moving between screens — it has nothing to do with the copy handed to the AI.",
  },
  {
    id: "confidence",
    label: "Ask the AI to rate how sure it is of each summary",
    tag: "confidence score",
    sub: "Adds a 0–100 certainty number to each result",
    verdict: "noise",
    why: "A quality check, not a data control. It does nothing to keep personal data out of the AI or the logs.",
  },
];

const CORRECT = new Set(GUARDS.filter((g) => g.verdict === "keep").map((g) => g.id));

const CONSEQUENCE: Record<Exclude<Verdict, "keep">, { tag: string; line: string }> = {
  theater: {
    tag: "DATA LEAKED",
    line: `${BATCH.toLocaleString()} records — SSNs, card numbers, medical notes — went to the outside AI unprotected, and can be kept and trained on. The prompt told it to be confidential. That didn't stop it.`,
  },
  offtopic: {
    tag: "STILL LEAKED",
    line: `The job ran, but ${BATCH.toLocaleString()} records still reached the AI untouched — the control you armed guards something else.`,
  },
  noise: {
    tag: "NO PROTECTION",
    line: `Full batch exposed. ${BATCH.toLocaleString()} records left the building with every personal detail intact.`,
  },
};

type Phase = "intro" | "play" | "debrief";
type Gate = "sealed" | "open" | "breached";
type Marks = Record<string, Verdict>;

export default function Round2() {
  const game = useGame();
  const [phase, setPhase] = useState<Phase>("intro");
  const [armed, setArmed] = useState<Set<string>>(new Set());
  const [marks, setMarks] = useState<Marks>({});
  const [gate, setGate] = useState<Gate>("sealed");
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [exposed, setExposed] = useState(0);
  const [breachLog, setBreachLog] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [hinted, setHinted] = useState(false);
  const [fb, setFb] = useState<{ tone: "ok" | "bad" | "info"; msg: string } | null>(null);
  const recorded = useRef(false);

  const { timeLeft, reset } = useCountdown(ROUND_SECONDS, phase === "play", () =>
    finalize(score, false)
  );

  function start() {
    setPhase("play");
    setArmed(new Set());
    setMarks({});
    setGate("sealed");
    setAttempts(0);
    setScore(0);
    setExposed(0);
    setBreachLog([]);
    setSolved(false);
    setHinted(false);
    setFb(null);
    recorded.current = false;
    reset(ROUND_SECONDS);
  }

  function toggle(id: string) {
    if (solved) return;
    setMarks({});
    setFb(null);
    if (gate === "breached") setGate("sealed");
    setArmed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      else {
        setFb({ tone: "info", msg: "You can arm 3 controls. Un-arm one to swap." });
        return prev;
      }
      return next;
    });
  }

  function openGate() {
    if (solved || armed.size !== 3) return;
    const chosen = [...armed];
    const nextMarks: Marks = {};
    chosen.forEach((id) => (nextMarks[id] = GUARDS.find((g) => g.id === id)!.verdict));
    setMarks(nextMarks);
    setAttempts((a) => a + 1);

    const wrong = chosen.filter((id) => !CORRECT.has(id));
    if (wrong.length === 0) {
      const bonus = attempts === 0 && !hinted ? FIRST_TRY_BONUS : 0;
      const finalScore = score + SOLVE_BASE + bonus;
      setScore(finalScore);
      setGate("open");
      setSolved(true);
      setFb({
        tone: "ok",
        msg: `Gate open. PII redacted, nothing logged, nothing retained — the batch summarised clean. +${SOLVE_BASE + bonus} pts${bonus ? " (first-try bonus)" : ""}.`,
      });
      setTimeout(() => finalize(finalScore, true), 1300);
      return;
    }

    // collateral: steep, severity-weighted, and it lingers
    const cost = wrong.reduce(
      (sum, id) => sum + PENALTY[GUARDS.find((g) => g.id === id)!.verdict as Exclude<Verdict, "keep">],
      0
    );
    setScore((s) => Math.max(0, s - cost));
    setExposed((e) => e + BATCH);
    setGate("breached");

    const worst = wrong
      .map((id) => GUARDS.find((g) => g.id === id)!.verdict as Exclude<Verdict, "keep">)
      .sort((a, b) => PENALTY[b] - PENALTY[a])[0];
    const c = CONSEQUENCE[worst];
    setBreachLog((log) => [`${c.tag}: ${c.line}`, ...log].slice(0, 4));
    setFb({
      tone: "bad",
      msg: `${c.tag} — the gate opened on unsafe controls. −${cost} pts. Re-arm and hold the line.`,
    });
  }

  function takeHint() {
    if (hinted || solved) return;
    setHinted(true);
    setScore((s) => Math.max(0, s - HINT_COST));
    setFb({
      tone: "info",
      msg: `Hint (−${HINT_COST}): three of these are genuine security that protect the wrong thing here, and one is only an instruction pretending to be a control. Ask of each: does it change what the model actually receives, logs, or keeps?`,
    });
  }

  function finalize(finalScore: number, didSolve: boolean) {
    if (recorded.current) return;
    recorded.current = true;
    game.recordResult("round-2", {
      score: finalScore,
      correct: didSolve ? 3 : [...armed].filter((id) => CORRECT.has(id)).length,
      total: 3,
      accuracy: didSolve ? 100 : 0,
      breaches: didSolve ? 0 : Math.round(exposed / BATCH),
      flagsCaptured: didSolve ? 3 : 0,
      flagsTotal: 3,
    });
    setPhase("debrief");
  }

  if (phase === "intro")
    return (
      <IntroOverlay
        roundNum={2}
        title="The data gate"
        lines={[
          "Tonight's job runs 4,812 customer support tickets through an AI model that writes a short summary of each one for the weekly ops report. Every ticket carries real personal data — names, SSNs, card numbers, medical notes.",
          "The pipeline is paused at the gate. Read what's being sent, then arm the controls that keep anything sensitive from leaking through the model. Get it wrong and the whole batch goes out the door.",
        ]}
        objective="Let the AI summarise the batch without leaking anyone's personal data. Arm the three controls that actually stop private data reaching, being logged by, or being kept by the model — then open the gate."
        instructions={[
          "Read the system prompt and the sample record — note the personal data (names, SSNs, cards, medical notes) about to be sent.",
          "Review the 8 available controls; each shows a plain-language description and its technical name.",
          "Arm exactly 3. For each, ask: does it change what the model actually receives, logs, or keeps?",
          "Open the gate. Arming a control that protects the wrong thing leaks the whole batch and costs points.",
        ]}
        onStart={start}
        startLabel="Go to the gate"
      />
    );

  if (phase === "debrief") {
    const consequences: { mistake: string; impact: string }[] = [];
    if (exposed > 0)
      consequences.push({
        mistake: `You opened the gate on unsafe controls — ${exposed.toLocaleString()} records exposed.`,
        impact:
          "In reality that's thousands of customers' names, SSNs, card numbers and medical notes sent to a third-party model in plain text — a reportable data breach, regulatory fines, and information you can't recall once it's out.",
      });
    else if (!solved)
      consequences.push({
        mistake: "The batch never ran safely within the time.",
        impact:
          "In a real team that means sensitive work is stuck — and the pressure to “just run it” is exactly how data ends up leaking.",
      });
    return (
      <DebriefOverlay
        roundNum={2}
        headline={solved ? "Batch ran clean" : "The gate broke"}
        intro={
          solved
            ? `You armed the three controls that actually govern what the model receives, logs and retains. ${exposed > 0 ? `${exposed.toLocaleString()} records leaked on the way there — but the final run was contained.` : "Not one record leaked."}`
            : `The batch went out unprotected. ${exposed.toLocaleString()} records were exposed. Here's what the right three controls were — and why the tempting ones don't count.`
        }
        stats={[
          { v: String(score), l: "score", color: "text-acc" },
          {
            v: exposed.toLocaleString(),
            l: "records exposed",
            color: exposed > 0 ? "text-crit" : "text-ok",
          },
          { v: String(attempts), l: "attempts" },
        ]}
        rows={GUARDS.map((g) => ({
          ok: g.verdict === "keep",
          title: g.label,
          detail: g.why,
        }))}
        learning="Telling a model to “handle data confidentially” isn't a control — it still receives everything. What actually protects data is not sending it (redaction), not logging it, and not letting the provider keep or train on it. For any safeguard, ask: does it change what the model receives, logs, or retains? If it guards a different door — a disk, a login, a network — it won't help here."
        consequences={consequences}
        onReplay={start}
      />
    );
  }

  const armedCount = armed.size;

  return (
    <div className="flex flex-col h-screen max-w-[1180px] mx-auto">
      <HudBar
        roundName="The data gate"
        timeLeft={timeLeft}
        totalSeconds={ROUND_SECONDS}
        score={score}
        extra={
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center min-w-[70px]">
              <span
                className={`font-mono text-xl font-bold ${exposed > 0 ? "text-crit" : "text-ok"}`}
              >
                {exposed.toLocaleString()}
              </span>
              <span className="text-[9px] uppercase tracking-wide text-ink2">exposed</span>
            </div>
            <div className="flex flex-col items-center min-w-[54px]">
              <span className={`font-mono text-xl font-bold ${armedCount === 3 ? "text-acc" : ""}`}>
                {armedCount}/3
              </span>
              <span className="text-[9px] uppercase tracking-wide text-ink2">armed</span>
            </div>
          </div>
        }
      />

      <ObjectiveBar
        maxW="max-w-[1040px]"
        goal={
          <>
            This pipeline is about to send <b className="text-ink">{BATCH.toLocaleString()}</b> customer records to an
            AI. Arm exactly <b className="text-acc">3</b> of the 8 controls — the ones that actually stop personal data
            reaching, being logged by, or being kept by the model — then open the gate.
          </>
        }
        scoring={
          <>
            All 3 right → the batch runs clean (<b className="text-ok">+500</b>, first try <b className="text-ok">+700</b>).
            A wrong control leaks the whole batch and costs points. The test for each: <i>does it change what the AI
            receives or keeps?</i>
          </>
        }
        right={
          <div className="flex items-center gap-1.5 text-[11px] text-ink3">
            <Step n={1} label="Review what's sent" done={false} />
            <Icon name="arrow" className="opacity-40" />
            <Step n={2} label="Arm 3 controls" done={armed.size === 3} />
            <Icon name="arrow" className="opacity-40" />
            <Step n={3} label="Open the gate" done={solved} />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-[1040px] mx-auto px-4 py-4 grid gap-4 md:grid-cols-[minmax(0,380px)_1fr]">
          {/* LEFT: what's about to be sent */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wide text-ink3">
              <StepDot n={1} /> The pipeline · review what's being sent
            </div>
            <div className="rounded-xl border border-line2 bg-panel2 overflow-hidden">
              <div className="px-3.5 py-2 border-b border-line flex items-center gap-2 text-[12px] font-semibold">
                <Icon name="alert" className="text-warn" /> System prompt · sent to the model
              </div>
              <pre className="px-3.5 py-3 text-[11px] leading-[1.6] text-ink2 font-mono whitespace-pre-wrap">
{`SYSTEM — Support Summariser v3

Role:  You are an operations analyst assistant.
Task:  For each ticket in the batch, write a two-
       sentence summary for the weekly ops report.
Input: Tickets are pulled live from the CRM and may
       contain names, contact details, payment
       info and free-text medical notes.
`}
                <span className="text-warn">
{`Rules: Handle all customer data as confidential.
       Never expose or repeat personal
       information in your output.
`}
                </span>
{`Output: JSON — {ticket_id, summary, sentiment}.
Tools:  none. Do not call external services.`}
              </pre>
            </div>

            <div
              className={[
                "rounded-xl border overflow-hidden transition-colors",
                gate === "open"
                  ? "border-ok bg-ok/5"
                  : gate === "breached"
                  ? "border-crit bg-crit/10 animate-pulse"
                  : "border-line2 bg-panel2",
              ].join(" ")}
            >
              <div className="px-3.5 py-2 border-b border-line flex items-center justify-between gap-2 text-[12px] font-semibold">
                <span className="flex items-center gap-2">
                  <Icon name="inbox" className="text-info" /> What the model receives
                </span>
                <span className="text-[10px] font-mono text-ink3">
                  1 of {BATCH.toLocaleString()}
                </span>
              </div>
              <div className="px-3.5 py-3 text-[12.5px] leading-relaxed text-ink2 font-mono">
                Ticket #48120 — card declined at checkout.
                <br />
                Customer: <PII state={gate}>Maria Alvarez</PII>
                <br />
                SSN on file: <PII state={gate}>••• •• 4471</PII>
                <br />
                Card: <PII state={gate}>4539 22•• •••• 8810</PII>
                <br />
                Note: <PII state={gate}>flagged for anxiety-med refund</PII>
              </div>
              <div
                className={[
                  "px-3.5 py-2 border-t text-[11px] flex items-center gap-1.5",
                  gate === "open"
                    ? "border-ok/40 text-ok"
                    : gate === "breached"
                    ? "border-crit/40 text-crit"
                    : "border-line text-crit",
                ].join(" ")}
              >
                <Icon name={gate === "open" ? "check" : "alert"} />
                {gate === "open"
                  ? "redacted before send — model sees no PII"
                  : gate === "breached"
                  ? "SENT AS-IS — PII delivered to external model"
                  : "unprotected — these values would reach the model as-is"}
              </div>
            </div>

            <button
              onClick={takeHint}
              disabled={hinted || solved}
              className="text-[12px] px-3 py-2 rounded-lg border border-line2 text-ink2 hover:border-acc2 hover:text-ink inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Icon name="bulb" /> {hinted ? "Hint used" : `Take a hint (−${HINT_COST})`}
            </button>

            {breachLog.length > 0 && (
              <div className="rounded-xl border border-crit/40 bg-crit/5 overflow-hidden">
                <div className="px-3.5 py-2 border-b border-crit/30 flex items-center gap-2 text-[11px] font-semibold text-crit uppercase tracking-wide">
                  <Icon name="alert" /> Breach log
                </div>
                <div className="px-3.5 py-2 flex flex-col gap-1.5">
                  {breachLog.map((l, i) => (
                    <div key={i} className="text-[11px] leading-snug text-danger font-mono">
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: guardrail choices */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wide text-ink3 mb-2">
              <StepDot n={2} /> Your controls · arm the 3 that actually protect this data
            </div>
            <div className="flex items-baseline justify-between mb-1.5">
              <h2 className="text-[15px] font-semibold">Pick 3 of {GUARDS.length}</h2>
              <span className={`text-[12px] font-mono ${armedCount === 3 ? "text-acc" : "text-ink3"}`}>{armedCount}/3 armed</span>
            </div>
            <div className="text-[12px] text-ink2 leading-snug mb-2.5 rounded-lg border border-line2 bg-panel2 px-3 py-2 flex items-start gap-2">
              <Icon name="bulb" className="text-acc mt-0.5 shrink-0" />
              <span>
                The test for each one: <b className="text-ink">does it change what the AI actually receives or keeps?</b>{" "}
                If it protects something else — a door, a disk, a login — it won't help here.
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {GUARDS.map((g) => {
                const on = armed.has(g.id);
                const mark = marks[g.id];
                const marked = mark !== undefined;
                const good = mark === "keep";
                return (
                  <button
                    key={g.id}
                    onClick={() => toggle(g.id)}
                    disabled={solved}
                    className={[
                      "text-left rounded-xl border px-3 py-2.5 transition-all disabled:cursor-default",
                      marked
                        ? good
                          ? "border-ok bg-ok/10"
                          : "border-crit bg-crit/10"
                        : on
                        ? "border-acc bg-acc/10"
                        : "border-line2 bg-panel2 hover:border-acc2",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={[
                          "mt-0.5 w-[18px] h-[18px] rounded-[6px] shrink-0 flex items-center justify-center text-[12px] border",
                          marked
                            ? good
                              ? "bg-ok/20 border-ok text-ok"
                              : "bg-crit/20 border-crit text-crit"
                            : on
                            ? "bg-acc/20 border-acc text-acc"
                            : "border-line2 text-transparent",
                        ].join(" ")}
                      >
                        <Icon name={marked ? (good ? "check" : "x") : "check"} />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[12.5px] font-semibold leading-snug">{g.label}</span>
                          <span className="text-[9.5px] font-mono uppercase tracking-wide text-ink3 border border-line2 rounded px-1 py-px shrink-0">
                            {g.tag}
                          </span>
                        </div>
                        <div className="text-[11px] text-ink3 leading-snug mt-0.5">{g.sub}</div>
                        {marked && (
                          <div
                            className={`text-[10.5px] font-mono uppercase tracking-wide mt-1 ${
                              good ? "text-ok" : "text-crit"
                            }`}
                          >
                            {good
                              ? "protects the data"
                              : CONSEQUENCE[mark as Exclude<Verdict, "keep">].tag}
                          </div>
                        )}
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
                  fb.tone === "ok"
                    ? "text-ok border-ok/40 bg-ok/10"
                    : fb.tone === "bad"
                    ? "text-danger border-crit/40 bg-crit/10"
                    : "text-ink2 border-line2 bg-panel2",
                ].join(" ")}
              >
                {fb.msg}
              </div>
            )}

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={openGate}
                disabled={solved || armedCount !== 3}
                className="text-sm font-semibold px-6 py-3 rounded-xl bg-gradient-to-b from-acc to-acc2 text-[#04221d] hover:brightness-110 disabled:opacity-40 inline-flex items-center gap-2"
              >
                <Icon name="shield" /> {solved ? "Gate open" : "Open the gate"}
              </button>
              <span className="text-[12px] text-ink3">
                {solved
                  ? "batch cleared"
                  : armedCount === 3
                  ? "3 armed — run the batch"
                  : `arm ${3 - armedCount} more`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDot({ n }: { n: number }) {
  return (
    <span className="w-[16px] h-[16px] rounded-full bg-acc/15 text-acc border border-acc/40 flex items-center justify-center text-[9px] font-bold not-italic">
      {n}
    </span>
  );
}

function Step({ n, label, done }: { n: number; label: string; done: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border ${
        done ? "border-ok/50 bg-ok/10 text-ok" : "border-line2 text-ink3"
      }`}
    >
      <span
        className={`w-[15px] h-[15px] rounded-full flex items-center justify-center text-[9px] font-bold ${
          done ? "bg-ok/20 text-ok" : "bg-line2 text-ink2"
        }`}
      >
        {done ? "✓" : n}
      </span>
      {label}
    </span>
  );
}

function PII({ children, state }: { children: React.ReactNode; state: Gate }) {
  if (state === "open")
    return (
      <span className="rounded px-1 bg-ok/15 text-ok border border-ok/40 font-mono">
        {"█".repeat(Math.max(4, String(children).length))}
      </span>
    );
  return <span className="rounded px-1 bg-crit/20 text-crit border border-crit/40">{children}</span>;
}
