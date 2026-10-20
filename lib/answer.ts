import type { Passage } from "./materials";

// Only the question and the retrieved passages go to the answerer — never the student's name.
export type AnswerInput = { question: string; passages: Passage[] };

export const DEMO_INTRO = "Demo mode (no AI connected yet). Here is what the course materials say:";

// Demo mode: no AI is connected yet, so the "answer" is the passages the search found.
// A real AI can replace this later as long as it takes the same input and returns text.
export async function fakeAnswer({ passages }: AnswerInput): Promise<string> {
  if (passages.length === 0) {
    return "Demo mode (no AI connected yet): I couldn't find anything in the course materials about that question.";
  }
  return [DEMO_INTRO, ...passages.map((p) => p.text)].join("\n\n");
}
