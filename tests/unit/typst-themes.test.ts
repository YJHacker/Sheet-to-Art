import { describe, it, expect } from 'vitest';
import { THEMES, getTheme } from '../../src/lib/typst/themes';
import type { ThemeName, ThemeDefinition } from '../../src/types/typst';

describe('Theme Configuration & Styling Engine', () => {
  it('should define all 5 launch themes', () => {
    const themeNames: ThemeName[] = [
      'modern-clean',
      'executive-serif',
      'compact-ledger',
      'emerald-report',
      'monochrome-pure',
    ];

    for (const name of themeNames) {
      const theme = THEMES[name];
      expect(theme).toBeDefined();
      expect(theme.name).toBe(name);
      expect(theme.displayName).toBeTruthy();
      expect(theme.fontFamily).toBeTruthy();
      expect(theme.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.headerBackground).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.margins.top).toBeTruthy();
      expect(theme.cellPadding.x).toBeTruthy();
      expect(theme.baseFontSize).toBeGreaterThan(5);
    }
  });

  it('getTheme() should return default theme "modern-clean" when given undefined or unknown', () => {
    const defaultTheme = getTheme();
    expect(defaultTheme.name).toBe('modern-clean');

    const unknownTheme = getTheme('unknown-theme' as any);
    expect(unknownTheme.name).toBe('modern-clean');
  });

  it('getTheme() should return the requested theme definition', () => {
    const execTheme = getTheme('executive-serif');
    expect(execTheme.name).toBe('executive-serif');
    expect(execTheme.headerTextColor).toBe('#FFFFFF');

    const compactTheme = getTheme('compact-ledger');
    expect(compactTheme.name).toBe('compact-ledger');
    expect(compactTheme.margins.top).toBe('10mm');

    const emeraldTheme = getTheme('emerald-report');
    expect(emeraldTheme.name).toBe('emerald-report');
    expect(emeraldTheme.primaryColor).toBe('#059669');

    const monoTheme = getTheme('monochrome-pure');
    expect(monoTheme.name).toBe('monochrome-pure');
    expect(monoTheme.primaryColor).toBe('#000000');
  });

  it('getTheme() should accept custom ThemeDefinition object directly', () => {
    const custom: ThemeDefinition = {
      name: 'modern-clean',
      displayName: 'Custom Brand',
      fontFamily: 'CustomSans',
      primaryColor: '#FF0000',
      secondaryColor: '#880000',
      accentColor: '#FF5555',
      headerBackground: '#FFEAEA',
      headerTextColor: '#000000',
      zebraBackground: '#FFF5F5',
      borderColor: '#FFCCCC',
      textColor: '#111111',
      kpiBackground: '#FFF0F0',
      kpiBorderColor: '#FFAAAA',
      kpiAccentColor: '#FF0000',
      noteBackground: '#FFFBEA',
      noteBorderColor: '#D97706',
      tableStroke: '0.5pt + rgb("ffcccc")',
      margins: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' },
      cellPadding: { x: '4pt', y: '3pt' },
      baseFontSize: 9,
    };

    const resolved = getTheme(custom);
    expect(resolved.displayName).toBe('Custom Brand');
    expect(resolved.primaryColor).toBe('#FF0000');
  });
});
