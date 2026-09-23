import { describe, it, expect } from 'vitest';
import { escapeTypst, escapeTypstString } from '../../src/lib/typst/typst-escaper';

describe('Typst Escaper & Sanitizer', () => {
  describe('escapeTypst (content mode)', () => {
    it('should return empty string for null, undefined or empty input', () => {
      expect(escapeTypst(null as any)).toBe('');
      expect(escapeTypst(undefined as any)).toBe('');
      expect(escapeTypst('')).toBe('');
    });

    it('should pass plain text through untouched', () => {
      expect(escapeTypst('Hello World 123')).toBe('Hello World 123');
      expect(escapeTypst('Sales Report Q3')).toBe('Sales Report Q3');
    });

    it('should escape backslashes first', () => {
      expect(escapeTypst('C:\\Program Files\\App')).toBe('C:\\\\Program Files\\\\App');
    });

    it('should escape Typst syntax characters: #, $, [, ], _, *, @, <, >, ", ~', () => {
      expect(escapeTypst('#tag $100 [note]')).toBe('\\#tag \\$100 \\[note\\]');
      expect(escapeTypst('User_Name *bold*')).toBe('User\\_Name \\*bold\\*');
      expect(escapeTypst('@mention <id> "quoted" ~space')).toBe('\\@mention \\<id\\> \\"quoted\\" \\~space');
    });

    it('should handle complex mixed spreadsheet cell content', () => {
      const complex = 'Formula: =SUM(A1:A10) * 100% #1 [$50_000] <Target>';
      const expected = 'Formula: =SUM(A1:A10) \\* 100% \\#1 \\[\\$50\\_000\\] \\<Target\\>';
      expect(escapeTypst(complex)).toBe(expected);
    });
  });

  describe('escapeTypstString (string literal mode)', () => {
    it('should escape quotes and backslashes for string literals', () => {
      expect(escapeTypstString('Hello "World"')).toBe('Hello \\"World\\"');
      expect(escapeTypstString('Path\\to\\file')).toBe('Path\\\\to\\\\file');
      expect(escapeTypstString('Multi\nLine')).toBe('Multi\\nLine');
    });
  });
});
