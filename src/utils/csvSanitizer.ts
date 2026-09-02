export const sanitizeNarrative = (value: unknown) =>
  String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .replace(/^\s*[=+\-@]/, "")
    .slice(0, 500);

export const normalizeNarrative = (value: unknown) => {
  return sanitizeNarrative(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};