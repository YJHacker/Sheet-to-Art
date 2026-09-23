/**
 * Typst Syntax Escaper & Sanitizer
 *
 * Sanitizes arbitrary spreadsheet cell text and user input
 * to prevent Typst compilation syntax errors or unintentional
 * markup execution.
 */

/**
 * Escapes characters that have special meaning in Typst markup mode:
 * \ [ ] # $ _ * @ < > " ~
 */
export function escapeTypst(text: string | null | undefined): string {
  if (text === null || text === undefined || text === '') {
    return '';
  }

  const str = String(text);

  // Note: Backslash MUST be escaped first before escaping other special characters
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/@/g, '\\@')
    .replace(/</g, '\\<')
    .replace(/>/g, '\\>')
    .replace(/"/g, '\\"')
    .replace(/~/g, '\\~');
}

/**
 * Escapes characters for double-quoted string literals inside Typst code mode ("...").
 */
export function escapeTypstString(text: string | null | undefined): string {
  if (text === null || text === undefined || text === '') {
    return '';
  }

  const str = String(text);

  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
