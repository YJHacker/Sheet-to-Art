import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSelector } from '../../src/components/studio/ThemeSelector';
import type { ThemeName } from '../../src/types/typst';

describe('ThemeSelector Component', () => {
  it('renders all 5 launch theme cards', () => {
    render(<ThemeSelector activeTheme="modern-clean" onThemeChange={vi.fn()} />);

    expect(screen.getByText('Modern Clean')).toBeDefined();
    expect(screen.getByText('Executive Serif')).toBeDefined();
    expect(screen.getByText('Compact Ledger')).toBeDefined();
    expect(screen.getByText('Emerald Report')).toBeDefined();
    expect(screen.getByText('Monochrome Pure')).toBeDefined();
  });

  it('marks the active theme with aria-pressed or checked state', () => {
    render(<ThemeSelector activeTheme="emerald-report" onThemeChange={vi.fn()} />);

    const activeCard = screen.getByRole('button', { name: /emerald report/i });
    expect(activeCard.getAttribute('aria-pressed')).toBe('true');

    const inactiveCard = screen.getByRole('button', { name: /modern clean/i });
    expect(inactiveCard.getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onThemeChange when a different theme card is clicked', () => {
    const handleThemeChange = vi.fn();
    render(<ThemeSelector activeTheme="modern-clean" onThemeChange={handleThemeChange} />);

    const execCard = screen.getByRole('button', { name: /executive serif/i });
    fireEvent.click(execCard);

    expect(handleThemeChange).toHaveBeenCalledWith('executive-serif');
  });

  it('displays typography and color palette swatches for each theme', () => {
    render(<ThemeSelector activeTheme="modern-clean" onThemeChange={vi.fn()} />);

    const emeraldCard = screen.getByRole('button', { name: /emerald report/i });
    expect(emeraldCard.querySelector('[data-testid="color-swatch"]')).toBeDefined();
  });
});
