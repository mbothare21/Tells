"use client";

import Link from "next/link";
import { ROUNDS } from "@/lib/rounds";
import { useGame } from "@/lib/gameState";
import { Icon } from "@/components/Icon";
import { GAME_TITLE, GAME_TAGLINE } from "@/lib/config";

export default function Home() {
  const game = useGame();

  return (
    <main className="mx-auto max-w-4xl px-5 pb-16 pt-10">
      <div className="text-center py-6">
        <span className="font-mono text-[11px] tracking-[1.5px] uppercase text-acc">
          AI security exercise
        </span>
        <h1 className="text-4xl font-bold tracking-tight mt-3 mb-2">{GAME_TITLE}</h1>
        <p className="mx-auto max-w-xl text-ink2 text-[15px]">
          {GAME_TAGLINE} Four shifts on the job, each an ordinary task with one
          simple question: can you tell what&rsquo;s safe from what isn&rsquo;t? Score points for
          getting it right and being quick about it.
        </p>
        {game.totalScore > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line2 px-4 py-1.5 font-mono text-sm text-acc">
            <Icon name="check" /> {game.totalScore.toLocaleString()} pts so far
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        {ROUNDS.map((r) => {
          const done = game.isComplete(r.slug);
          const inner = (
            <div
              className={[
                "relative rounded-2xl border p-4 transition",
                r.ready
                  ? "border-line hover:border-acc2 hover:-translate-y-0.5 cursor-pointer bg-panel"
                  : "border-line bg-panel opacity-60 cursor-not-allowed",
                done ? "border-ok/40" : "",
              ].join(" ")}
            >
              <div className="absolute top-4 right-5 font-mono text-2xl font-bold text-line2">
                {r.n}
              </div>
              <h3 className="text-base font-semibold mb-1.5 pr-8">{r.title}</h3>
              <p className="text-[13px] text-ink2 min-h-[36px] m-0">{r.blurb}</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px]">
                {done ? (
                  <span className="rounded-full border border-ok/40 text-ok px-2.5 py-0.5">
                    cleared · {game.results[r.slug].score} pts
                  </span>
                ) : r.ready ? (
                  <span className="rounded-full border border-acc/40 text-acc px-2.5 py-0.5">
                    available
                  </span>
                ) : (
                  <span className="rounded-full border border-line2 text-ink3 px-2.5 py-0.5">
                    <Icon name="lock" /> in development
                  </span>
                )}
              </div>
            </div>
          );
          return r.ready ? (
            <Link key={r.slug} href={`/${r.slug}`}>{inner}</Link>
          ) : (
            <div key={r.slug}>{inner}</div>
          );
        })}
      </div>

      <div className="text-center mt-7">
        <Link
          href="/round-1"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-acc to-acc2 text-[#04221d] font-bold px-6 py-3 hover:brightness-110"
        >
          <Icon name="arrow" /> {game.totalScore > 0 ? "Continue" : "Start the first shift"}
        </Link>
        {Object.keys(game.results).length > 0 && (
          <div className="mt-3">
            <Link href="/debrief" className="text-sm text-ink2 hover:text-acc underline-offset-4 hover:underline">
              View overall debrief
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
