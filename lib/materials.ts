import fs from "node:fs";
import path from "node:path";

export type Passage = {
  source: string; // e.g. "Lecture 3 — Slide 3: Correlation is not causation"
  text: string;
};

const MATERIALS_DIR = path.join(process.cwd(), "materials");

let cached: Passage[] | null = null;

// Each file is one document: "# Title" names it, and each "## Heading" starts one passage.
export function loadPassages(): Passage[] {
  if (cached) return cached;

  const passages: Passage[] = [];
  const files = fs.readdirSync(MATERIALS_DIR).filter((f) => f.endsWith(".md")).sort();

  for (const file of files) {
    const content = fs.readFileSync(path.join(MATERIALS_DIR, file), "utf8");
    let docTitle = file;
    let heading: string | null = null;
    let lines: string[] = [];

    const flush = () => {
      const text = lines.join(" ").replace(/\s+/g, " ").trim();
      if (heading && text) passages.push({ source: `${docTitle} — ${heading}`, text });
      lines = [];
    };

    for (const line of content.split("\n")) {
      if (line.startsWith("## ")) {
        flush();
        heading = line.slice(3).trim();
      } else if (line.startsWith("# ")) {
        docTitle = line.slice(2).replace(/\(.*\)/, "").trim();
      } else {
        lines.push(line);
      }
    }
    flush();
  }

  cached = passages;
  return passages;
}
