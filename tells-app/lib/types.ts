export type Truth = "phish" | "legit";
export type Verdict = "allow" | "quar";

// A capturable tell on a phishing email. Players TYPE these; we match on keywords.
export interface Flag {
  id: string;
  label: string;       // canonical description (shown after capture / in debrief)
  why: string;         // one-line teaching note
  keywords: string[];  // any of these (substring, case-insensitive) counts as a hit
}

export interface Email {
  id: string;
  truth: Truth;
  from: string;
  addr: string;
  real: string;        // what the sender address "resolves to" on hover
  realBad: boolean;    // is that resolution suspicious?
  init: string;        // avatar initials
  subject: string;
  bodyHtml: string;    // may contain <a data-link data-bad> for hover reveal
  foot: string;
  tells: string[];     // plain-language giveaways (debrief)
  flags?: Flag[];      // only phishing emails have capturable flags
}

export interface Decision {
  verdict: Verdict;
  correct: boolean;
  dwellMs: number;
  hinted: boolean;
  truth: Truth;
}

export interface RoundResult {
  score: number;
  correct: number;
  total: number;
  accuracy: number;
  breaches: number;
  flagsCaptured: number;
  flagsTotal: number;
}
