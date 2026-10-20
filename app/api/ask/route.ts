import { loadPassages } from "../../../lib/materials";
import { searchPassages } from "../../../lib/search";
import { fakeAnswer } from "../../../lib/answer";
import { saveQuestion } from "../../../lib/store";
import { checkRateLimit } from "../../../lib/rate-limit";

export const runtime = "nodejs";

const MAX_QUESTION_LENGTH = 2000;

export async function POST(request: Request) {
  let body: { name?: unknown; question?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The request could not be read." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const question = typeof body.question === "string" ? body.question.trim() : "";

  if (!name) {
    return Response.json({ error: "Please enter your name before asking a question." }, { status: 401 });
  }
  if (!question) {
    return Response.json({ error: "Please type a question." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return Response.json(
      { error: `Your question is too long. Please shorten it to ${MAX_QUESTION_LENGTH.toLocaleString("en-US")} characters or fewer.` },
      { status: 400 },
    );
  }

  const limit = checkRateLimit(name);
  if (!limit.allowed) {
    return Response.json({ error: limit.error }, { status: 429 });
  }

  const passages = searchPassages(question, loadPassages());
  const answer = await fakeAnswer({ question, passages });
  saveQuestion({ name, question, answer, askedAt: new Date().toISOString() });

  return Response.json({ answer, passages });
}
