"use client";

import Link from "next/link";
import { ROUNDS } from "@/lib/rounds";
import { useGame } from "@/lib/gameState";
import { Icon } from "@/components/Icon";

type Band = "strong" | "solid" | "work";

function bandOf(accuracy: number): Band {
  if (accuracy >= 100) return "strong";
  if (accuracy >= 60) return "solid";
  return "work";
}

const BAND_META: Record<Band, { label: string; cls: string }> = {
  strong: { label: "Strong", cls: "text-ok border-ok/50 bg-ok/10" },
  solid: { label: "Solid", cls: "text-acc border-acc/50 bg-acc/10" },
  work: { label: "Needs work", cls: "text-warn border-warn/50 bg-warn/10" },
};

export default function DebriefPage() {
  const game = useGame();
  const done = ROUNDS.filter((r) => game.isComplete(r.slug));
  const notDone = ROUNDS.filter((r) => !game.isComplete(r.slug));

  const rated = done.map((r) => ({ meta: r, res: game.results[r.slug], band: bandOf(game.results[r.slug].accuracy) }));
  const strengths = rated.filter((x) => x.band === "strong" || x.band === "solid");
  const focus = rated.filter((x) => x.band === "work");
  const avgAccuracy = done.length
    ? Math.round(done.reduce((s, r) => s + game.results[r.slug].accuracy, 0) / done.length)
    : 0;
  const totalBreaches = done.reduce((s, r) => s + (game.results[r.slug].breaches || 0), 0);
  const allDone = notDone.length === 0 && done.length > 0;

  const verdict = !done.length
    ? "Play a round to build your report."
    : allDone && focus.length === 0
    ? "Sharp across the board — you can tell what's safe from what isn't."
    : focus.length === 0
    ? "Strong so far. Finish the remaining rounds for a complete picture."
    : `Good instincts in ${strengths.length} area${strengths.length === 1 ? "" : "s"}; ${focus.length} to sharpen up.`;

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <div className="text-center mb-6">
        <span className="font-mono text-[11px] tracking-[1.5px] uppercase text-acc">Operative assessment</span>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Mission debrief</h1>
        <p className="text-ink2 mt-2 text-[14px] max-w-md mx-auto">{verdict}</p>
      </div>

      {/* headline stats */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Stat v={game.totalScore.toLocaleString()} l="total score" color="text-acc" />
        <Stat v={`${done.length}/${ROUNDS.length}`} l="rounds cleared" />
        <Stat v={`${avgAccuracy}%`} l="avg accuracy" color={avgAccuracy >= 80 ? "text-ok" : ""} />
        <Stat v={String(totalBreaches)} l="hijacks / leaks" color={totalBreaches ? "text-crit" : "text-ok"} />
      </div>

      {done.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* strengths */}
          <div className="rounded-2xl border border-ok/30 bg-ok/5 p-4">
            <div className="flex items-center gap-1.5 text-ok font-mono uppercase tracking-wide text-[10px] font-semibold mb-2.5">
              <Icon name="check" /> Your strong zones
            </div>
            {strengths.length ? (
              <ul className="flex flex-col gap-2.5">
                {strengths.map((x) => (
                  <li key={x.meta.slug} className="text-[13px]">
                    <div className="font-semibold text-ink leading-snug">{x.meta.competency}</div>
                    <div className="text-ink3 text-[11px] mt-0.5">
                      Round {x.meta.n} · {x.res.accuracy}% · {BAND_META[x.band].label}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink2 text-[12.5px]">Nothing here yet — the focus areas are where to start.</p>
            )}
          </div>

          {/* focus areas */}
          <div className="rounded-2xl border border-warn/30 bg-warn/5 p-4">
            <div className="flex items-center gap-1.5 text-warn font-mono uppercase tracking-wide text-[10px] font-semibold mb-2.5">
              <Icon name="alert" /> Work on these
            </div>
            {focus.length ? (
              <ul className="flex flex-col gap-2.5">
                {focus.map((x) => (
                  <li key={x.meta.slug} className="text-[13px]">
                    <div className="font-semibold text-ink leading-snug">{x.meta.competency}</div>
                    <div className="text-ink2 text-[11.5px] mt-0.5 leading-snug">{x.meta.focus}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink2 text-[12.5px]">No weak spots in what you've played — nicely done.</p>
            )}
          </div>
        </div>
      )}

      {/* what the game taught you */}
      <div className="rounded-2xl border border-acc/30 bg-acc/5 p-4 mb-6">
        <div className="flex items-center gap-1.5 text-acc font-mono uppercase tracking-wide text-[10px] font-semibold mb-2.5">
          <Icon name="bulb" /> What the game taught you
        </div>
        <ul className="flex flex-col gap-2.5">
          {ROUNDS.map((r) => {
            const cleared = game.isComplete(r.slug);
            return (
              <li key={r.slug} className="flex gap-2.5 text-[13px] leading-snug">
                <span
                  className={`shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] mt-px ${
                    cleared ? "bg-ok/20 text-ok" : "bg-line2/40 text-ink3"
                  }`}
                >
                  <Icon name={cleared ? "check" : "lock"} />
                </span>
                <span className="text-ink2">
                  <b className="text-ink">{r.competency}.</b> {r.takeaway}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* per-round detail */}
      <div className="bg-panel border border-line rounded-2xl p-5">
        <div className="text-[11px] font-mono uppercase tracking-wide text-ink3 mb-1">Round by round</div>
        {ROUNDS.map((r) => {
          const res = game.results[r.slug];
          const band = res ? bandOf(res.accuracy) : null;
          return (
            <div key={r.slug} className="flex gap-3 py-2.5 border-b border-line items-center last:border-0">
              <div className={`w-[26px] h-[26px] rounded-[7px] shrink-0 flex items-center justify-center text-[13px] ${res ? "bg-ok/15 text-ok" : "bg-line2/30 text-ink3"}`}>
                <Icon name={res ? "check" : "lock"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">
                  {r.n}. {r.title}
                </div>
                {res ? (
                  <div className="text-xs text-ink2">
                    {res.score} pts · {res.accuracy}% · {res.flagsCaptured}/{res.flagsTotal}
                    {res.breaches ? ` · ${res.breaches} slipped through` : ""}
                  </div>
                ) : (
                  <div className="text-xs text-ink3">not attempted</div>
                )}
              </div>
              {band ? (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${BAND_META[band].cls}`}>
                  {BAND_META[band].label}
                </span>
              ) : (
                r.ready && (
                  <Link href={`/${r.slug}`} className="text-xs text-acc hover:underline shrink-0">
                    play →
                  </Link>
                )
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-6 flex gap-2.5 justify-center flex-wrap">
        <Link href="/" className="text-sm px-5 py-2.5 rounded-[10px] border border-line2 text-ink hover:border-acc2">
          Mission map
        </Link>
        <button
          onClick={() => {
            if (confirm("Reset all progress?")) game.reset();
          }}
          className="text-sm px-5 py-2.5 rounded-[10px] border border-line2 text-ink2 hover:border-danger hover:text-danger"
        >
          Reset progress
        </button>
      </div>
    </main>
  );
}

function Stat({ v, l, color }: { v: string; l: string; color?: string }) {
  return (
    <div className="bg-panel2 border border-line rounded-[11px] px-4 py-3.5 flex-1 min-w-[110px] text-center">
      <div className={`font-mono text-2xl font-bold ${color ?? ""}`}>{v}</div>
      <div className="text-[11px] text-ink2 uppercase tracking-wide mt-0.5">{l}</div>
    </div>
  );
}
