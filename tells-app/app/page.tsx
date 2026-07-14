"use client";

import Link from "next/link";
import { ROUNDS, SEQUENTIAL_LOCK } from "@/lib/rounds";
import { useGame } from "@/lib/gameState";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/Icon";
import { GAME_TITLE, GAME_TAGLINE } from "@/lib/config";

export default function Home() {
  const game = useGame();
  const { penalty, disqualified } = useAuth();

  const effective = Math.max(0, game.totalScore - penalty);
  const unlockedIndex = (i: number) => !SEQUENTIAL_LOCK || i === 0 || game.isComplete(ROUNDS[i - 1].slug);
  const nextRound = ROUNDS.find((r, i) => !game.isComplete(r.slug) && unlockedIndex(i));
  const allDone = ROUNDS.every((r) => game.isComplete(r.slug));

  return (
    <main className="mx-auto max-w-4xl px-5 pb-16 pt-10">
      <div className="text-center py-6">
        <span className="font-mono text-[11px] tracking-[1.5px] uppercase text-acc">AI security exercise</span>
        <h1 className="text-4xl font-bold tracking-tight mt-3 mb-2">{GAME_TITLE}</h1>
        <p className="mx-auto max-w-xl text-ink2 text-[15px]">
          {GAME_TAGLINE} Four short rounds, each an ordinary work task with one question: can you tell what&rsquo;s
          safe from what isn&rsquo;t? Score points for getting it right, and quickly.
        </p>
        {(effective > 0 || penalty > 0) && !disqualified && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line2 px-4 py-1.5 font-mono text-sm text-acc">
            <Icon name="check" /> {effective.toLocaleString()} pts so far
            {penalty > 0 && <span className="text-danger">· −{penalty} penalty</span>}
          </div>
        )}
      </div>

      {disqualified && (
        <div className="rounded-xl border border-crit/50 bg-crit/10 px-4 py-3 mb-5 text-center text-danger text-[13px] flex items-center justify-center gap-2">
          <Icon name="alert" /> You switched tabs too many times and have been disqualified. You can review your results, but rounds are locked.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        {ROUNDS.map((r, i) => {
          const done = game.isComplete(r.slug);
          const unlocked = unlockedIndex(i) && !disqualified;
          const canPlay = unlocked && !done;

          const inner = (
            <div
              className={[
                "relative rounded-2xl border p-4 transition h-full",
                canPlay
                  ? "border-line hover:border-acc2 hover:-translate-y-0.5 cursor-pointer bg-panel"
                  : done
                  ? "border-ok/40 bg-panel"
                  : "border-line bg-panel opacity-55 cursor-not-allowed",
              ].join(" ")}
            >
              <div className="absolute top-4 right-5 font-mono text-2xl font-bold text-line2">{r.n}</div>
              <h3 className="text-base font-semibold mb-1.5 pr-8 flex items-center gap-2">
                {!unlocked && !done && <Icon name="lock" className="text-ink3" />}
                {r.title}
              </h3>
              <p className="text-[13px] text-ink2 min-h-[36px] m-0">{r.blurb}</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px]">
                {done ? (
                  <span className="rounded-full border border-ok/40 text-ok px-2.5 py-0.5">
                    cleared · {game.results[r.slug].score} pts
                  </span>
                ) : canPlay ? (
                  <span className="rounded-full border border-acc/40 text-acc px-2.5 py-0.5">available now</span>
                ) : (
                  <span className="rounded-full border border-line2 text-ink3 px-2.5 py-0.5 inline-flex items-center gap-1">
                    <Icon name="lock" /> {disqualified ? "locked" : "finish the round before"}
                  </span>
                )}
              </div>
            </div>
          );
          return canPlay ? (
            <Link key={r.slug} href={`/${r.slug}`}>
              {inner}
            </Link>
          ) : (
            <div key={r.slug}>{inner}</div>
          );
        })}
      </div>

      <div className="text-center mt-7">
        {disqualified ? (
          <Link
            href="/debrief"
            className="inline-flex items-center gap-2 rounded-xl border border-line2 text-ink px-6 py-3 hover:border-acc2"
          >
            <Icon name="arrow" /> View your results
          </Link>
        ) : nextRound ? (
          <Link
            href={`/${nextRound.slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-acc to-acc2 text-[#04221d] font-bold px-6 py-3 hover:brightness-110"
          >
            <Icon name="arrow" /> {game.totalScore > 0 ? `Continue — ${nextRound.title}` : "Start"}
          </Link>
        ) : (
          <Link
            href="/debrief"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-acc to-acc2 text-[#04221d] font-bold px-6 py-3 hover:brightness-110"
          >
            <Icon name="check" /> {allDone ? "See your results" : "View your results"}
          </Link>
        )}
        {Object.keys(game.results).length > 0 && !disqualified && nextRound && (
          <div className="mt-3">
            <Link href="/debrief" className="text-sm text-ink2 hover:text-acc underline-offset-4 hover:underline">
              View your results
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
