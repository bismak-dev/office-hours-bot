import { describe, expect, it } from "vitest";
import { POST } from "../app/api/ask/route";

function ask(body: unknown) {
  return POST(
    new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("User Story 1: ask questions about course materials", () => {
  it("test_authenticated_student_can_receive_answer_from_course_materials", async () => {
    const res = await ask({ name: "Test Student", question: "What is the late policy for homework?" });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.answer).toContain("loses 10% of its points");
    expect(data.passages.length).toBeGreaterThan(0);
    expect(data.passages[0].source).toContain("Syllabus");
    expect(data.passages[0].text).toContain("24 hours late");
  });

  it("finds the right lecture slide for a concept question", async () => {
    const res = await ask({ name: "Test Student", question: "What is a confounder?" });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.passages[0].source).toContain("Lecture 3");
    expect(data.passages[0].text).toContain("confounder");
  });

  it("refuses a question when no name was entered", async () => {
    const res = await ask({ name: "  ", question: "What is the late policy?" });
    expect(res.status).toBe(401);
  });

  it("rejects a question longer than 2,000 characters", async () => {
    const res = await ask({ name: "Test Student", question: "a".repeat(2001) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/shorten/i);
  });
});
