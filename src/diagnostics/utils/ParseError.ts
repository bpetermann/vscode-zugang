/**
 * Thrown when a pipeline's `parse()` stage cannot turn the input text into a
 * usable ParsedDocument. Carries the underlying parser error as `cause`.
 */
export class ParseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ParseError';
  }
}
