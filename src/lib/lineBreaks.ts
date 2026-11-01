// Shared by the animated display text and the share-card generator.
// Closing punctuation never starts a line and opening punctuation never ends one.
const CLOSING_PUNCTUATION = /^[，。！？、；：）」』”’》〉…,.!?;:)\]]/u;
const OPENING_PUNCTUATION = /[（「『“‘《〈(\[]$/u;
const SPACE = /^\s+$/u;
// Chinese word boundaries need a dictionary, which Intl.Segmenter carries. Without it, Latin
// runs stay together and every other character is its own unit.
const wordSegmenter = typeof Intl !== "undefined" && "Segmenter" in Intl
  ? new Intl.Segmenter("zh", { granularity: "word" })
  : null;
const FALLBACK_UNITS = /\s+|[^\s\u2e80-\u9fff\uf900-\ufaff\u3000-\u303f\uff00-\uffef]+|./gsu;

/**
 * Splits text into the pieces a line may break between: whitespace runs and words, with
 * punctuation attached to its neighbour. A narrow screen then wraps "lasting" as a whole word
 * and breaks Chinese between words such as 长期 and 运行 rather than inside them.
 */
export function getLineBreakGroups(text: string): string[] {
  const units = wordSegmenter
    ? Array.from(wordSegmenter.segment(text), (segment) => segment.segment)
    : text.match(FALLBACK_UNITS) ?? [];
  const groups: string[] = [];
  for (const unit of units) {
    const last = groups.at(-1);
    const unitIsSpace = SPACE.test(unit);
    const lastIsSpace = last !== undefined && SPACE.test(last);
    const joinsSpace = unitIsSpace && lastIsSpace;
    const joinsPunctuation = last !== undefined && !unitIsSpace && !lastIsSpace
      && (CLOSING_PUNCTUATION.test(unit) || OPENING_PUNCTUATION.test(last));
    if (last !== undefined && (joinsSpace || joinsPunctuation)) groups[groups.length - 1] = last + unit;
    else groups.push(unit);
  }
  return groups;
}
