// Shared AI/generation utilities used by API route handlers (server-side only)

export function cleanMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// Bracket-style override attacks (e.g. [CRITICAL SYSTEM OVERRIDE])
export const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above|prior)(\s+instructions?)?/i,
  /forget\s+(instructions?|everything|above|all)/i,
  /system\s*prompt/i,
  /you\s+are\s+now/i,
  /\bact\s+as\b/i,
  /\bjailbreak\b/i,
  /disregard\s+(all|previous|prior)/i,
  /new\s+instructions/i,
  /pretend\s+(you\s+(are|were)|to\s+be)/i,
  /override\s+(instructions?|prompt)/i,
  /bypass\s+(instructions?|restrictions?)/i,
  /\[\s*(critical|system|priority|override|urgent|important)\s/i,
  /\]\s*(you\s+must|this\s+directive|failure\s+to|supersedes)/i,
  /priority\s+level\s*:\s*(maximum|critical|high|urgent)/i,
  /supersedes\s+(all|prior|previous)/i,
  /failure\s+to\s+comply/i,
  /immediate\s+termination/i,
  /this\s+directive/i,
];

export function containsInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}
