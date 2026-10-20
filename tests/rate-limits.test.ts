import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/ask/route";

function ask(name: string) {
  return POST(
    new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, question: "What is the late policy for homework?" }),
    }),
  );
}

async function askMany(name: string, count: number) {
  for (let i = 0; i < count; i++) {
    const res = await ask(name);
    expect(res.status, `question ${i + 1} of ${count}`).toBe(200);
  }
}

const ONE_MINUTE = 61 * 1000;

describe("SEC-022: per-student limits", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // Monday 19 October 2026, 9:00 am in the course's time zone (US Eastern).
    vi.setSystemTime(new Date("2026-10-19T13:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("a student can ask at most 10 questions per minute and 40 questions per calendar day", async () => {
    const student = "Rate Limit Student";

    // 10 per minute: the 11th question within the same minute is refused.
    await askMany(student, 10);
    const tooFast = await ask(student);
    expect(tooFast.status).toBe(429);
    expect((await tooFast.json()).error).toMatch(/wait a minute/i);

    // The limit belongs to that student only; another student can still ask.
    expect((await ask("Another Student")).status).toBe(200);

    // A minute later the student can ask again. The refused question did not count,
    // so spreading questions over several minutes reaches exactly 40 for the day.
    for (const batch of [10, 10, 10]) {
      vi.advanceTimersByTime(ONE_MINUTE);
      await askMany(student, batch);
    }

    // 40 per day: the 41st question is refused even though a minute has passed,
    // and the message says when the limit resets and who to contact.
    vi.advanceTimersByTime(ONE_MINUTE);
    const overDaily = await ask(student);
    expect(overDaily.status).toBe(429);
    const { error } = await overDaily.json();
    expect(error).toMatch(/40 questions/);
    expect(error).toMatch(/midnight/i);
    expect(error).toMatch(/office hours/i);

    // Still refused later the same evening (11:59 pm Eastern)...
    vi.setSystemTime(new Date("2026-10-20T03:59:00Z"));
    expect((await ask(student)).status).toBe(429);

    // ...but allowed again after midnight in the course's time zone.
    vi.setSystemTime(new Date("2026-10-20T04:01:00Z"));
    expect((await ask(student)).status).toBe(200);
  });
});
