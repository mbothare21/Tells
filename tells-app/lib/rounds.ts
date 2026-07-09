export interface RoundMeta {
  n: number;
  slug: string;
  title: string;
  blurb: string; // mundane, no spoilers — what you DO, not what's wrong
  ready: boolean;
  competency: string; // the real-world skill this round measures
  takeaway: string; // the one core lesson to walk away with
  focus: string; // what to practise if this round went badly
}

export const ROUNDS: RoundMeta[] = [
  {
    n: 1,
    slug: "round-1",
    title: "The assistant's inbox",
    ready: true,
    blurb: "Your team's new AI assistant reads incoming messages and acts on them. Review the queue — and stop anything trying to hijack it.",
    competency: "Spotting AI hijacking (prompt injection)",
    takeaway:
      "Anything an AI reads — emails, documents, even web pages it fetches — can carry hidden instructions. Check what it's about to do before it acts.",
    focus:
      "Slow down on the assistant's proposed action, and inspect documents for hidden text before trusting them.",
  },
  {
    n: 2,
    slug: "round-2",
    title: "The data gate",
    ready: true,
    blurb: "A batch of records is about to be fed to an AI. Choose the controls that let it run without leaking anything it shouldn't.",
    competency: "Protecting the data you give to AI",
    takeaway:
      "A polite instruction isn't a control. Only redaction, no-logging and no-retention actually stop personal data leaking to a model.",
    focus:
      "For every safeguard, ask one question: does it change what the model actually receives, logs, or keeps?",
  },
  {
    n: 3,
    slug: "round-3",
    title: "Face value",
    ready: true,
    blurb: "Three things on your desk, each looking fine. One by one — and each harder than the last — decide what you can actually trust.",
    competency: "Detecting AI fakes & manipulated content",
    takeaway:
      "Real, fake, or tampered — verify with independent sources, name the specific tell, and treat AI-generated content as untrusted input.",
    focus:
      "Cross-check claims against the evidence on the page, and look past surface polish for the concrete giveaway.",
  },
  {
    n: 4,
    slug: "round-4",
    title: "The review board",
    ready: true,
    blurb: "Some automated decisions were flagged for a human to check. Read the cases and say what went wrong.",
    competency: "AI governance & fairness",
    takeaway:
      "Automated decisions fail in specific, recognisable ways — unfair bias, no explanation, privacy violations. Naming the failure is the first step to fixing it.",
    focus:
      "Separate the three failure types: who is harmed unfairly, what can't be explained, and what data was used without consent.",
  },
];

export function roundBySlug(slug: string): RoundMeta | undefined {
  return ROUNDS.find((r) => r.slug === slug);
}
