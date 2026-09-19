export const EDU_PATTERN = /^[^\s@]+@[^\s@]+\.edu$/i;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isEduEmail(email: string) {
  return EDU_PATTERN.test(normalizeEmail(email));
}

export function emailDomain(email: string) {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  if (at < 0) return "";
  return normalized.slice(at + 1);
}

/** Strip student./mail. prefixes that some campuses use. */
export function canonicalDomain(domain: string) {
  return domain
    .toLowerCase()
    .replace(/^(student|students|mail|email|alumni|my)\./, "");
}
