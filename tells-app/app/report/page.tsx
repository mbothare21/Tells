"use client";

import Link from "next/link";
import { ROUNDS } from "@/lib/rounds";
import { useGame } from "@/lib/gameState";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/Icon";

/**
 * The take-home "AI Security Field Guide" — a personalised, printable document.
 * Styled as light "paper" with its own fixed palette (independent of the app theme)
 * so it reads like a real handout and prints/saves-to-PDF cleanly. This is where the
 * learning lands after the competition: plain-English glossary tables of every term
 * the rounds teach, the player's own results, and where to focus.
 */

// ---- plain-English glossary, grouped by the round that teaches it ----
interface Term { term: string; plain: string; matters: string; }
interface Group { round: string; heading: string; intro: string; terms: Term[]; }

const GLOSSARY: Group[] = [
  {
    round: "Round 1",
    heading: "When an AI reads your messages and acts on them",
    intro: "Modern assistants don't just answer — they take actions (reply, pay, schedule). Attackers exploit that.",
    terms: [
      { term: "Prompt injection", plain: "Hidden instructions planted inside content an AI reads — an email, a document, a web page — to trick it into doing something no human asked for.", matters: "An attacker can make your assistant leak data or move money just by sending it a message. Always check what the AI is about to DO before it acts." },
      { term: "Hidden / invisible text", plain: "Text coloured to blend into the background so a person skims past it — but the AI still reads every word.", matters: "Highlight or select-all a suspicious message to reveal it. The AI sees what your eyes miss." },
      { term: "AI agent", plain: "An assistant that takes actions on your behalf, not just one that chats.", matters: "The more it can do, the more damage a hijack causes — so keep a human check on anything consequential." },
    ],
  },
  {
    round: "Round 2",
    heading: "Protecting the data you hand to an AI",
    intro: "The right guardrail depends on the system. The same control can be essential for one and a mistake for another.",
    terms: [
      { term: "Redaction (PII masking)", plain: "Blanks out names, card numbers and SSNs before the model ever sees them.", matters: "Use it whenever the model doesn't need personal details to do its job." },
      { term: "Zero-retention endpoint", plain: "A provider that contractually will not store your data or train on it.", matters: "Use for anything sensitive or proprietary you send to an outside AI." },
      { term: "Turn off request logging", plain: "Stops the system keeping plain-text copies of everything sent to the model.", matters: "Raw prompt logs are a quiet leak — don't let personal data pile up there." },
      { term: "Secret scanning", plain: "Detects and strips API keys, passwords and tokens before anything is indexed.", matters: "Live secrets must never reach a model or its logs." },
      { term: "Access-scoped retrieval", plain: "The AI can only surface documents the person asking is already allowed to see.", matters: "Stops the assistant leaking files across permission boundaries." },
      { term: "Audit trail", plain: "Records each decision and the reason behind it.", matters: "RIGHT for decisions about people (you must explain them later); WRONG for raw customer data (it just copies the sensitive stuff)." },
      { term: "Human-in-the-loop", plain: "A person must review and sign off before the AI's decision takes effect.", matters: "Use for high-stakes calls like hiring or lending, so no one is auto-rejected with no appeal." },
      { term: "De-biasing", plain: "Strips identity details (name, age, gender, photo, address) so scoring is on merit.", matters: "Stops the model discriminating on who someone is instead of what they can do." },
      { term: "Encryption at rest", plain: "Scrambles stored files so a thief can't read them off the disk.", matters: "Protects stored files — but does nothing about what you hand to the model." },
      { term: "Prompt instruction (“be careful”)", plain: "A sentence in the prompt telling the model to behave.", matters: "NOT a real control — the model still receives everything. Never rely on asking nicely." },
      { term: "PII", plain: "Personally identifiable information — anything that identifies a person.", matters: "The category you most need to keep out of AI systems unless it's truly required." },
    ],
  },
  {
    round: "Round 3",
    heading: "Telling real from fake from tampered",
    intro: "AI can produce convincing text, images and profiles. Polish is not proof — verify.",
    terms: [
      { term: "AI-generated content", plain: "Text, images or profiles produced by AI, often indistinguishable at a glance.", matters: "Treat unverified content as untrusted input, however professional it looks." },
      { term: "Deepfake / synthetic media", plain: "AI-created photos or video of people who may not exist, or didn't do what's shown.", matters: "A clean headshot can be generated — verify a person's identity independently." },
      { term: "Reverse image search", plain: "Checking where else an image appears online.", matters: "A real person's photo usually turns up somewhere; a zero footprint is a red flag." },
      { term: "Independent verification", plain: "Checking a claim against a separate, trustworthy source.", matters: "The reliable way to tell real from fake — don't trust the artifact on its own." },
      { term: "“Can't tell”", plain: "Honestly saying the evidence isn't enough to decide.", matters: "Often the correct, professional answer — false certainty is its own risk." },
    ],
  },
  {
    round: "Round 4",
    heading: "When automated decisions go wrong",
    intro: "Automated decisions fail in specific, nameable ways. Naming the failure is the first step to fixing it.",
    terms: [
      { term: "Algorithmic bias", plain: "The system produces unfair outcomes for a group — often through a proxy, like a postal code standing in for income.", matters: "Bias can hide even when no protected detail is used directly." },
      { term: "Proxy discrimination", plain: "Using an innocent-looking field that correlates with a protected trait.", matters: "Watch for postcode, name or school acting as a stand-in for race, gender or class." },
      { term: "Explainability", plain: "Being able to give a person a reason for a decision they can understand and challenge.", matters: "“Score below threshold” is not an explanation — people have a right to a real one." },
      { term: "Privacy violation / consent", plain: "Using someone's data for a purpose they never agreed to.", matters: "Buying browsing history to make a medical decision has no lawful basis." },
    ],
  },
];

// score → an encouraging band title so the document feels earned and personal
function bandTitle(avg: number, allDone: boolean): string {
  if (!allDone) return "In progress";
  if (avg >= 90) return "AI Security Champion";
  if (avg >= 70) return "Sharp Analyst";
  if (avg >= 50) return "Getting there";
  return "In training";
}

export default function ReportPage() {
  const game = useGame();
  const { user, penalty } = useAuth();

  const done = ROUNDS.filter((r) => game.isComplete(r.slug));
  const allDone = done.length === ROUNDS.length;
  const effective = Math.max(0, game.totalScore - penalty);
  const avgAccuracy = done.length
    ? Math.round(done.reduce((s, r) => s + game.results[r.slug].accuracy, 0) / done.length)
    : 0;
  const totalIssues = done.reduce((s, r) => s + (game.results[r.slug].breaches || 0), 0);
  const focus = done.filter((r) => game.results[r.slug].accuracy < 100);

  const name = user?.name || "Player";
  const dateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <main className="min-h-screen py-8 px-4 flex justify-center">
      <div className="w-full max-w-[860px]">
        {/* action bar — screen only */}
        <div className="no-print flex items-center justify-between mb-4 gap-2">
          <Link href="/debrief" className="text-sm px-4 py-2 rounded-[10px] border border-line2 text-ink2 hover:border-acc2 inline-flex items-center gap-1.5">
            <Icon name="arrow" /> Back to results
          </Link>
          <button
            onClick={() => window.print()}
            className="text-sm font-semibold px-5 py-2 rounded-[10px] bg-gradient-to-b from-acc to-acc2 text-[#04221d] hover:brightness-110 inline-flex items-center gap-1.5"
          >
            <Icon name="doc" /> Download / Print
          </button>
        </div>

        {/* the document */}
        <article className="report-paper rounded-2xl overflow-hidden shadow-xl border" style={{ background: "#ffffff", color: "#1c2230", borderColor: "#e3e7ee" }}>
          {/* masthead */}
          <header className="px-8 py-8" style={{ background: "linear-gradient(135deg,#0f766e,#0d9488)", color: "#eafffb" }}>
            <div className="font-mono text-[11px] tracking-[2px] uppercase" style={{ color: "#a7f3e4" }}>
              Tells · AI Security Field Guide
            </div>
            <h1 className="text-[30px] font-bold tracking-tight mt-1.5" style={{ color: "#ffffff" }}>
              Your AI Security Field Guide
            </h1>
            <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: "#d3fbf1" }}>
              A plain-English handout of everything the rounds covered — keep it, and use it the next time an AI touches your work.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px]" style={{ color: "#eafffb" }}>
              <span>Prepared for <b>{name}</b></span>
              <span style={{ color: "#8fe6d5" }}>·</span>
              <span>{dateStr}</span>
              <span style={{ color: "#8fe6d5" }}>·</span>
              <span>Level: <b>{bandTitle(avgAccuracy, allDone)}</b></span>
            </div>
          </header>

          <div className="px-8 py-7 flex flex-col gap-8">
            {/* snapshot */}
            <section>
              <SectionTitle n="1" text="Your results at a glance" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <PaperStat v={effective.toLocaleString()} l="total score" strong />
                <PaperStat v={`${done.length}/${ROUNDS.length}`} l="rounds completed" />
                <PaperStat v={`${avgAccuracy}%`} l="average accuracy" good={avgAccuracy >= 80} />
                <PaperStat v={String(totalIssues)} l="issues missed" bad={totalIssues > 0} />
              </div>
              {!allDone && (
                <p className="text-[12.5px] mt-3" style={{ color: "#8a6d1f" }}>
                  You haven&rsquo;t finished every round yet — complete them all for your full field guide and level.
                </p>
              )}
            </section>

            {/* round by round */}
            <section>
              <SectionTitle n="2" text="How you did, round by round" />
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-[12.5px] border-collapse">
                  <thead>
                    <tr style={{ background: "#f3f5f9", color: "#5a6b86" }}>
                      <Th>Round</Th>
                      <Th>What it tested</Th>
                      <Th right>Your accuracy</Th>
                      <Th right>Result</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROUNDS.map((r) => {
                      const res = game.results[r.slug];
                      const acc = res?.accuracy ?? null;
                      const label = acc === null ? "Not attempted" : acc >= 100 ? "Strong" : acc >= 60 ? "Solid" : "Review";
                      const col = acc === null ? "#8b93a5" : acc >= 100 ? "#067a4e" : acc >= 60 ? "#0d9488" : "#b47814";
                      return (
                        <tr key={r.slug} style={{ borderTop: "1px solid #edf0f4" }}>
                          <Td><b style={{ color: "#0f1720" }}>{r.n}. {r.title}</b></Td>
                          <Td>{r.competency}</Td>
                          <Td right>{acc === null ? "—" : `${acc}%`}</Td>
                          <Td right><span style={{ color: col, fontWeight: 600 }}>{label}</span></Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* where to focus */}
            <section>
              <SectionTitle n="3" text="Where to focus next" />
              {focus.length ? (
                <ul className="mt-3 flex flex-col gap-2.5">
                  {focus.map((r) => {
                    const meta = ROUNDS.find((m) => m.slug === r.slug)!;
                    return (
                      <li key={r.slug} className="flex gap-2.5 text-[13px] leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: "#b47814" }}><Icon name="alert" /></span>
                        <span><b style={{ color: "#0f1720" }}>{meta.competency}.</b> <span style={{ color: "#3a465c" }}>{meta.focus}</span></span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-[13px]" style={{ color: "#067a4e" }}>
                  {allDone ? "Sharp across the board — you can tell what's safe from what isn't. Keep this guide handy anyway." : "No weak spots so far. Finish the remaining rounds for the full picture."}
                </p>
              )}
            </section>

            {/* the glossary — the core reference */}
            <section>
              <SectionTitle n="4" text="The terms, in plain English" />
              <p className="text-[12.5px] mt-1" style={{ color: "#5a6b86" }}>
                Every idea the game teaches, explained simply. No jargon assumed.
              </p>
              <div className="flex flex-col gap-6 mt-4">
                {GLOSSARY.map((g) => (
                  <div key={g.round}>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: "#e6f6f3", color: "#0f766e" }}>{g.round}</span>
                      <h3 className="text-[14.5px] font-bold" style={{ color: "#0f1720" }}>{g.heading}</h3>
                    </div>
                    <p className="text-[12px] mt-1 mb-2.5" style={{ color: "#5a6b86" }}>{g.intro}</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px] border-collapse" style={{ minWidth: 560 }}>
                        <thead>
                          <tr style={{ background: "#f3f5f9", color: "#5a6b86" }}>
                            <Th w="24%">Term</Th>
                            <Th w="40%">In plain English</Th>
                            <Th>Why it matters</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.terms.map((t) => (
                            <tr key={t.term} style={{ borderTop: "1px solid #edf0f4" }}>
                              <Td><b style={{ color: "#0d5c56" }}>{t.term}</b></Td>
                              <Td>{t.plain}</Td>
                              <Td>{t.matters}</Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* four habits recap */}
            <section>
              <SectionTitle n="5" text="Four habits to walk away with" />
              <div className="mt-3 flex flex-col gap-2">
                {ROUNDS.map((r) => (
                  <div key={r.slug} className="flex gap-3 items-start rounded-lg px-3 py-2.5" style={{ background: "#f7f9fc", border: "1px solid #eef1f6" }}>
                    <span className="shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: "#0d9488", color: "#fff" }}>{r.n}</span>
                    <p className="text-[12.5px] leading-snug" style={{ color: "#3a465c" }}>{r.takeaway}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* footer */}
            <footer className="pt-4 text-[11.5px]" style={{ borderTop: "1px solid #e3e7ee", color: "#8b93a5" }}>
              Tells — an AI security awareness exercise. This guide reflects your run on {dateStr}. Share it, pin it, or revisit it whenever an AI system enters your workflow.
            </footer>
          </div>
        </article>

        <div className="no-print text-center mt-5">
          <Link href="/" className="text-sm px-5 py-2.5 rounded-[10px] border border-line2 text-ink2 hover:border-acc2">
            Back to all rounds
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ---- small paper-styled building blocks (fixed light palette) ---- */
function SectionTitle({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0 w-[24px] h-[24px] rounded-md flex items-center justify-center text-[12px] font-bold font-mono" style={{ background: "#0f766e", color: "#fff" }}>{n}</span>
      <h2 className="text-[17px] font-bold tracking-tight" style={{ color: "#0f1720" }}>{text}</h2>
    </div>
  );
}

function PaperStat({ v, l, strong, good, bad }: { v: string; l: string; strong?: boolean; good?: boolean; bad?: boolean }) {
  const color = bad ? "#c81e1e" : good ? "#067a4e" : strong ? "#0d9488" : "#1c2230";
  return (
    <div className="rounded-xl px-3 py-3 text-center" style={{ background: "#f7f9fc", border: "1px solid #eef1f6" }}>
      <div className="text-[22px] font-bold font-mono leading-none" style={{ color }}>{v}</div>
      <div className="text-[10.5px] uppercase tracking-wide mt-1" style={{ color: "#5a6b86" }}>{l}</div>
    </div>
  );
}

function Th({ children, right, w }: { children: React.ReactNode; right?: boolean; w?: string }) {
  return (
    <th className="font-medium text-[10px] font-mono uppercase tracking-wide px-2.5 py-2" style={{ textAlign: right ? "right" : "left", width: w }}>
      {children}
    </th>
  );
}

function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <td className="px-2.5 py-2 align-top leading-snug" style={{ textAlign: right ? "right" : "left", color: "#3a465c" }}>
      {children}
    </td>
  );
}
