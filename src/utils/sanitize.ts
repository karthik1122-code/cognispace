/**
 * Minimal allowlist HTML sanitizer for AI output and restored content.
 * Everything not on the allowlist is unwrapped (children kept, tag dropped);
 * scripts/styles/iframes are removed entirely; only safe attributes survive.
 */
const ALLOWED_TAGS = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'CODE', 'PRE', 'BLOCKQUOTE',
  'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'HR', 'A', 'SPAN', 'DETAILS', 'SUMMARY',
]);
const DROP_WITH_CHILDREN = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'MATH']);
const ALLOWED_ATTRS: Record<string, string[]> = {
  A: ['href', 'title'],
  LI: ['data-type', 'data-checked'],
  UL: ['data-type'],
  DETAILS: ['open'],
};

function isSafeHref(href: string): boolean {
  return /^(https?:|mailto:|#|\/)/i.test(href.trim());
}

function cleanNode(node: Node, doc: Document): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as Element;
    const tag = el.tagName.toUpperCase();

    if (DROP_WITH_CHILDREN.has(tag)) {
      node.removeChild(el);
      continue;
    }

    cleanNode(el, doc);

    if (!ALLOWED_TAGS.has(tag)) {
      while (el.firstChild) node.insertBefore(el.firstChild, el);
      node.removeChild(el);
      continue;
    }

    const keep = ALLOWED_ATTRS[tag] ?? [];
    for (const attr of Array.from(el.attributes)) {
      if (!keep.includes(attr.name)) el.removeAttribute(attr.name);
    }
    if (tag === 'A') {
      const href = el.getAttribute('href') ?? '';
      if (!isSafeHref(href)) el.removeAttribute('href');
      el.setAttribute('rel', 'noopener noreferrer nofollow');
      el.setAttribute('target', '_blank');
    }
  }
}

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  const doc = new DOMParser().parseFromString(`<body>${dirty}</body>`, 'text/html');
  cleanNode(doc.body, doc);
  return doc.body.innerHTML;
}

/** Strips ```html fences that models sometimes add despite instructions. */
export function stripCodeFences(text: string): string {
  return text.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '');
}
