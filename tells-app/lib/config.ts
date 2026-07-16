// The game's display name lives here so it can be swapped in one place
// once stakeholders confirm. Candidates: "Tells", "Flagged", "The Eye",
// "Catch Me If You Can", "Red Flag".
export const GAME_TITLE = "Tells";
export const GAME_TAGLINE = "Spot what doesn't add up.";

// Speed reward: whatever time is left on the clock when you finish a round is
// converted to points, so answering faster scores more. Capped so speed can't
// outweigh getting it right.
export const TIME_BONUS_PER_SEC = 2;
export const TIME_BONUS_CAP = 300;
export function timeBonus(secondsLeft: number): number {
  return Math.min(TIME_BONUS_CAP, Math.max(0, Math.round(secondsLeft)) * TIME_BONUS_PER_SEC);
}
