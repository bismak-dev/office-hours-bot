"use client";

import { useState } from "react";
import { DEMO_INTRO } from "../lib/answer";

type Passage = { source: string; text: string };
type Exchange = { question: string; answer: string; passages: Passage[] };

const MAX_QUESTION_LENGTH = 2000;

export default function Home() {
  const [name, setName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Exchange[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function askQuestion(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, question }),
      });
      const data: { answer?: string; passages?: Passage[]; error?: string } = await res.json();
      if (!res.ok || !data.answer) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setHistory((h) => [...h, { question: question.trim(), answer: data.answer!, passages: data.passages ?? [] }]);
      setQuestion("");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!name) {
    return (
      <main>
        <h1>Office Hours Bot</h1>
        <p className="muted">Ask questions about the course syllabus and lecture slides.</p>
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            setName(nameInput.trim());
          }}
        >
          <label htmlFor="name">Your name</label>
          <input id="name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} autoFocus />
          <button type="submit" disabled={!nameInput.trim()}>
            Continue
          </button>
        </form>
      </main>
    );
  }

  return (
    <main>
      <div className="row">
        <h1>Office Hours Bot</h1>
        <span className="muted">
          Signed in as {name} ·{" "}
          <button className="link" onClick={() => { setName(""); setHistory([]); }}>
            change name
          </button>
        </span>
      </div>
      <p className="muted">
        Answers come only from the course materials and may be incomplete or wrong. Check important details
        with the course staff.
      </p>

      {history.map((item, i) => (
        <div className="card" key={i}>
          <div className="question">{item.question}</div>
          {item.passages.length === 0 ? (
            <div className="answer">{item.answer}</div>
          ) : (
            <>
              <div className="answer">{DEMO_INTRO}</div>
              <ul className="passages" aria-label="Passages from the course materials">
                {item.passages.map((p, j) => (
                  <li key={j}>
                    <p className="passage">{p.text}</p>
                    <p className="source">Source: {p.source}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}

      <form className="card" onSubmit={askQuestion}>
        <label htmlFor="question">Your question</label>
        <textarea
          id="question"
          value={question}
          maxLength={MAX_QUESTION_LENGTH}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What is the late policy for homework?"
        />
        <div className="row">
          <button type="submit" disabled={loading || !question.trim()}>
            {loading ? "Searching…" : "Ask"}
          </button>
          <span className="muted">
            {question.length} / {MAX_QUESTION_LENGTH.toLocaleString("en-US")}
          </span>
        </div>
        {error && <p className="error">{error}</p>}
      </form>
    </main>
  );
}
