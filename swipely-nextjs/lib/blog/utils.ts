import { marked } from "marked";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ёЁ]/g, "е")
    .replace(/[а-яА-Я]/g, (ch) => {
      const map: Record<string, string> = {
        а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ж:"zh",з:"z",и:"i",й:"y",
        к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",
        ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",
        э:"e",ю:"yu",я:"ya",
      };
      return map[ch.toLowerCase()] ?? ch;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Extract H2/H3 headings from markdown for Table of Contents */
export function extractToc(md: string): { id: string; text: string; depth: 2 | 3 }[] {
  const lines = md.split("\n");
  const toc: { id: string; text: string; depth: 2 | 3 }[] = [];
  const seen = new Map<string, number>();

  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (!m) continue;
    const depth = (m[1].length as 2 | 3);
    const text = m[2].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
    let id = slugify(text);
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;
    toc.push({ id, text, depth });
  }

  return toc;
}

/** Extract FAQ pairs from markdown ### Question / Answer blocks under ## Частые вопросы */
export function extractFaq(md: string): { question: string; answer: string }[] {
  const faqSection = md.match(/## Частые вопросы([\s\S]*?)(?=^##|\Z)/m)?.[1] ?? "";
  if (!faqSection) return [];

  const pairs: { question: string; answer: string }[] = [];
  const blocks = faqSection.split(/^### /m).filter(Boolean);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const question = lines[0].replace(/\?$/, "").trim() + "?";
    const answer = lines.slice(1).join(" ").replace(/\s+/g, " ").trim();
    if (question && answer) pairs.push({ question, answer });
  }

  return pairs.slice(0, 8);
}

export function renderMarkdown(md: string): string {
  const renderer = new marked.Renderer();
  const headingIds = new Map<string, number>();

  renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
    const plain = text.replace(/<[^>]*>/g, "");
    let id = slugify(plain);
    const count = headingIds.get(id) ?? 0;
    headingIds.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };

  return marked.parse(md, { async: false, renderer }) as string;
}
