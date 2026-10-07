import type { Passage } from "./materials";

const STOP_WORDS = new Set(
  "a an and are as at be by can do does for from how i in is it its me my of on or the this to was what when where which who why will with you your about".split(" "),
);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((w) => !STOP_WORDS.has(w))
    .map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w));
}

// Simple keyword search: passages score higher for matching rarer words from the question.
export function searchPassages(question: string, passages: Passage[], limit = 3): Passage[] {
  const queryTerms = new Set(tokenize(question));
  if (queryTerms.size === 0) return [];

  const docs = passages.map((p) => tokenize(`${p.source} ${p.text}`));
  const docFreq = new Map<string, number>();
  for (const tokens of docs) {
    for (const t of new Set(tokens)) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
  }

  return passages
    .map((passage, i) => {
      let score = 0;
      for (const term of queryTerms) {
        const count = docs[i].filter((t) => t === term).length;
        if (count > 0) score += (1 + Math.log(count)) * Math.log(1 + passages.length / docFreq.get(term)!);
      }
      return { passage, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.passage);
}
