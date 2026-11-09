import { Fragment } from "react";

/**
 * Text typed into the CMS with its line breaks as real <br>s, for inside a <p> or a heading —
 * never as "\n" left to CSS (white-space: pre-line). Google's translator reads a bare "\n" as a
 * space, so a translated article ran together into one block; elements it keeps. Paragraphs go
 * in their own <p>s: see typedParagraphs.
 */
export function TypedLines({ text }: { text: string }) {
  return text.split(/\r?\n/).map((line, index) => <Fragment key={index}>{index > 0 && <br />}{line}</Fragment>);
}
