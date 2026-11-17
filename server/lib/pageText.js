// Turns a page's editor HTML into plain blocks: headings, paragraphs and to-dos.
// Used to find action items on a page and to search across pages.

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };

export function decodeEntities(s) {
  return s
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e) => ENTITIES[e])
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

// Inline tags (bold, links...) vanish without a gap; block tags become a space. No space before punctuation.
const stripTags = (s) =>
  decodeEntities(s.replace(/<\/?(strong|b|em|i|u|s|a|code|span|mark)\b[^>]*>/gi, "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?)])/g, "$1")
    .trim();

/**
 * @returns {{ type: "heading" | "text" | "todo", text: string, checked?: boolean, heading: string }[]}
 * `heading` is the nearest heading above the block (for context when it is shown alone).
 */
export function pageBlocks(html = "") {
  const marked = String(html)
    // Code blocks are not prose; keep them out of tasks and answers.
    .replace(/<pre[\s\S]*?<\/pre>/gi, "\n")
    .replace(/<li[^>]*data-type="taskItem"[^>]*>([\s\S]*?)<\/li>/gi, (m, inner) => {
      const checked = /data-checked="true"/i.test(m);
      return `\n\uE000${checked ? "done" : "todo"}\uE001${stripTags(inner)}\n`;
    })
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, inner) => `\n\uE000heading\uE001${stripTags(inner)}\n`)
    .replace(/<\/(p|li|blockquote|summary|div|tr)>|<br\s*\/?>/gi, "\n");

  const blocks = [];
  let heading = "";
  for (const raw of marked.split("\n")) {
    const tagged = /^\s*\uE000(todo|done|heading)\uE001(.*)$/.exec(raw);
    const text = tagged ? tagged[2].trim() : stripTags(raw);
    if (!text) continue;
    if (tagged?.[1] === "heading") { heading = text; blocks.push({ type: "heading", text, heading }); continue; }
    if (tagged) { blocks.push({ type: "todo", text, checked: tagged[1] === "done", heading }); continue; }
    blocks.push({ type: "text", text, heading });
  }
  return blocks;
}

export const pagePlainText = (html) =>
  pageBlocks(html)
    .map((b) => (b.type === "heading" ? `## ${b.text}` : b.type === "todo" ? `- [${b.checked ? "x" : " "}] ${b.text}` : b.text))
    .join("\n");
