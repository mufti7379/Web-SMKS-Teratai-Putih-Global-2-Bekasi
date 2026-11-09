/** Text typed into the CMS split into its paragraphs (at blank lines), each for its own <p> — see TypedLines. */
export function typedParagraphs(text: string) {
  return text.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}
