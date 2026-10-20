import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { POST } from "../app/api/ask/route";
import { loadPassages } from "../lib/materials";

type Passage = { document: string; section: string | null; source: string; text: string };

// Each question comes from a different test student, because these tests ask far more
// than the 10-per-minute limit (SEC-022) allows one student; that limit is tested separately.
let studentNumber = 0;

async function ask(question: string): Promise<{ answer: string; passages: Passage[] }> {
  const res = await POST(
    new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: `Test Student ${++studentNumber}`, question }),
    }),
  );
  expect(res.status).toBe(200);
  return res.json();
}

// Reads the material files directly (independently of the app's own loader) so the
// tests can check citations against what is really in the files.
function readMaterials() {
  const dir = path.join(process.cwd(), "materials");
  return fs.readdirSync(dir).map((file) => {
    const content = fs.readFileSync(path.join(dir, file), "utf8");
    const title = content.match(/^# (.+)$/m)![1];
    const sections = new Map<string, string>();
    for (const block of content.split(/^## /m).slice(1)) {
      const [heading, ...body] = block.split("\n");
      sections.set(heading.trim(), body.join(" ").replace(/\s+/g, " ").trim());
    }
    return { title, sections };
  });
}

function findCitedSection(passage: Passage) {
  const doc = readMaterials().find((m) => m.title.startsWith(`${passage.document} — `));
  return doc && passage.section ? doc.sections.get(passage.section) : undefined;
}

const SAMPLE_QUESTIONS: Array<[question: string, expectedSource: string]> = [
  ["What is the late policy for homework?", "Syllabus — Late policy"],
  ["When is the midterm exam?", "Syllabus — Key deadlines"],
  ["When are the instructor's office hours?", "Syllabus — Instructor and office hours"],
  ["How much is the final project worth?", "Syllabus — Grading"],
  ["Can I use AI tools for homework?", "Syllabus — AI use policy"],
  ["What is the difference between mean and median?", "Lecture 1 — Slide 2: Mean, median, and mode"],
  ["What does standard deviation measure?", "Lecture 1 — Slide 3: Measuring spread"],
  ["How do outliers affect the mean?", "Lecture 1 — Slide 4: Outliers"],
  ["What is a control group?", "Lecture 2 — Slide 3: Control and treatment"],
  ["What is a confounder?", "Lecture 3 — Slide 3: Correlation is not causation"],
];

describe("User Story 2: show where an answer came from", () => {
  // Criterion A: every answer that uses the materials names the source document.
  it("test_answer_includes_relevant_course_source", async () => {
    const data = await ask("What is the late policy for homework?");

    expect(data.passages.length).toBeGreaterThan(0);
    for (const p of data.passages) expect(p.document).toBeTruthy();
    expect(data.passages[0].document).toBe("Syllabus");
    expect(data.passages[0].section).toBe("Late policy");
    expect(data.passages[0].source).toBe("Syllabus — Late policy");
  });

  // Criterion B: it also names the page or section (slide number for lectures).
  it("test_slide_answer_cites_deck_and_slide_number", async () => {
    const data = await ask("What is a confounder?");

    expect(data.passages[0].document).toBe("Lecture 3");
    expect(data.passages[0].section).toBe("Slide 3: Correlation is not causation");
    expect(data.passages[0].source).toBe("Lecture 3 — Slide 3: Correlation is not causation");
  });

  // Criterion C: the cited section really contains the text that is shown.
  it("test_cited_section_contains_the_quoted_text", async () => {
    for (const [question] of SAMPLE_QUESTIONS) {
      const data = await ask(question);
      for (const p of data.passages) {
        expect(findCitedSection(p), `${question} -> ${p.source}`).toContain(p.text);
      }
    }
  });

  // Criterion D: it never cites a document or slide that does not exist.
  it("test_citations_only_reference_existing_slides", async () => {
    const extraQuestions = ["What is a p-value?", "What is correlation?", "How is the course graded?", "What is an A/B test?"];
    for (const question of [...SAMPLE_QUESTIONS.map(([q]) => q), ...extraQuestions]) {
      const data = await ask(question);
      for (const p of data.passages) {
        expect(findCitedSection(p), `${question} -> ${p.source}`).toBeDefined();
      }
    }
  });

  // Criterion E: "when available" — a document with no sections is cited by its name only.
  it("test_document_without_sections_cited_by_name_only", () => {
    const passages = loadPassages(path.join(process.cwd(), "tests/fixtures/no-sections"));

    expect(passages).toHaveLength(1);
    expect(passages[0].document).toBe("Course Welcome Letter");
    expect(passages[0].section).toBeNull();
    expect(passages[0].source).toBe("Course Welcome Letter");
    expect(passages[0].text).toContain("bring a laptop");
  });

  // Criterion F: no made-up source when nothing was found.
  it("test_no_source_shown_when_nothing_found", async () => {
    const data = await ask("Who won the World Cup?");

    expect(data.passages).toEqual([]);
    expect(data.answer).not.toMatch(/source|from syllabus|lecture/i);
  });

  // Accuracy check (mini version of eval_concept_answers_cite_correct_slide): the best
  // passage cites the expected slide or section for at least 90% of sample questions.
  it("test_concept_questions_cite_expected_slide", async () => {
    const misses: string[] = [];
    for (const [question, expectedSource] of SAMPLE_QUESTIONS) {
      const data = await ask(question);
      if (data.passages[0]?.source !== expectedSource) {
        misses.push(`${question} -> got "${data.passages[0]?.source}", expected "${expectedSource}"`);
      }
    }
    const correct = SAMPLE_QUESTIONS.length - misses.length;
    expect(correct / SAMPLE_QUESTIONS.length, misses.join("\n")).toBeGreaterThanOrEqual(0.9);
  });
});
