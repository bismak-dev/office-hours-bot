// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Home from "../app/page";
import { POST } from "../app/api/ask/route";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Send the page's requests straight to the real server code, so the test covers both.
function connectPageToServer() {
  vi.stubGlobal("fetch", (url: string, init: RequestInit) => POST(new Request(`http://localhost${url}`, init)));
}

async function askOnPage(question: string) {
  render(<Home />);
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Test Student" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: question } });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  return screen.findByRole("list", { name: "Passages from the course materials" });
}

describe("User Story 2 on screen", () => {
  // Criterion G: a plain-text "Source: …" line is visible under each passage.
  it("test_page_shows_source_under_each_passage", async () => {
    connectPageToServer();
    const list = await askOnPage("What is a confounder?");

    const items = within(list).getAllByRole("listitem");
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const lines = Array.from(item.children).map((el) => el.textContent ?? "");
      expect(lines.at(-1)).toMatch(/^Source: .+/);
      expect(lines[0].length).toBeGreaterThan(0);
      expect(within(item).queryByRole("link")).toBeNull();
    }
    expect(within(items[0]).getByText("Source: Lecture 3 — Slide 3: Correlation is not causation")).toBeTruthy();
    expect(within(items[0]).getByText(/a third variable, called a confounder/)).toBeTruthy();
  });
});
