import fs from "node:fs";
import path from "node:path";

export type Passage = {
  document: string; // e.g. "Lecture 3" or "Syllabus"
  section: string | null; // e.g. "Slide 3: Correlation is not causation"; null when the document has no sections
  source: string; // what students see, e.g. "Lecture 3 — Slide 3: Correlation is not causation"
  text: string;
};

const MATERIALS_DIR = path.join(process.cwd(), "materials");

const cache = new Map<string, Passage[]>();

// Each file is one document. Its "# Title" names it (the part before " — ", so
// "Lecture 3 — Correlation and Causation" becomes "Lecture 3"), and each "## Heading"
// starts one passage. Text that sits under no heading is cited by the document name only.
export function loadPassages(dir: string = MATERIALS_DIR): Passage[] {
  const cached = cache.get(dir);
  if (cached) return cached;

  const passages: Passage[] = [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), "utf8");
    let document = file.replace(/\.md$/, "");
    let section: string | null = null;
    let lines: string[] = [];

    const flush = () => {
      const text = lines.join(" ").replace(/\s+/g, " ").trim();
      if (text) {
        passages.push({ document, section, source: section ? `${document} — ${section}` : document, text });
      }
      lines = [];
    };

    for (const line of content.split("\n")) {
      if (line.startsWith("## ")) {
        flush();
        section = line.slice(3).trim();
      } else if (line.startsWith("# ")) {
        document = line.slice(2).replace(/\(.*\)/, "").split(" — ")[0].trim();
      } else {
        lines.push(line);
      }
    }
    flush();
  }

  cache.set(dir, passages);
  return passages;
}
