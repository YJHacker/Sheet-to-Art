import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../src/components/common/Button';
import { Select } from '../../src/components/common/Select';
import { Slider } from '../../src/components/common/Slider';
import { Switch } from '../../src/components/common/Switch';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { Toast } from '../../src/components/common/Toast';

describe('UI Primitives Components', () => {
  describe('Button', () => {
    it('renders with label and triggers onClick', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeDefined();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('respects disabled state', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);

      const btn = screen.getByRole('button', { name: /disabled/i });
      expect(btn).toHaveProperty('disabled', true);
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders variant classes properly', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toBeDefined();

      rerender(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toBeDefined();
    });
  });

  describe('Select', () => {
    it('renders options and responds to selection changes', () => {
      const handleChange = vi.fn();
      const options = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
      ];

      render(
        <Select
          label="Choose option"
          value="opt1"
          options={options}
          onChange={handleChange}
        />
      );

      const select = screen.getByLabelText(/choose option/i) as HTMLSelectElement;
      expect(select.value).toBe('opt1');

      fireEvent.change(select, { target: { value: 'opt2' } });
      expect(handleChange).toHaveBeenCalledWith('opt2');
    });
  });

  describe('Slider', () => {
    it('renders label, min, max, value and handles change', () => {
      const handleChange = vi.fn();
      render(
        <Slider
          label="Font Scale"
          value={8.5}
          min={7}
          max={12}
          step={0.5}
          unit="pt"
          onChange={handleChange}
        />
      );

      expect(screen.getByText(/font scale/i)).toBeDefined();
      expect(screen.getByText('8.5 pt')).toBeDefined();

      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input.value).toBe('8.5');

      fireEvent.change(input, { target: { value: '9.5' } });
      expect(handleChange).toHaveBeenCalledWith(9.5);
    });
  });

  describe('Switch', () => {
    it('renders checked state and toggles on click', () => {
      const handleToggle = vi.fn();
      render(
        <Switch
          label="Repeat Table Headers"
          checked={false}
          onChange={handleToggle}
        />
      );

      const switchBtn = screen.getByRole('switch', { name: /repeat table headers/i });
      expect(switchBtn.getAttribute('aria-checked')).toBe('false');

      fireEvent.click(switchBtn);
      expect(handleToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('ProgressBar', () => {
    it('renders progress bar with percentage and stage message', () => {
      render(
        <ProgressBar
          stage="compiling"
          percent={75}
          message="Compiling Typst WASM to PDF..."
        />
      );

      expect(screen.getAllByText(/compiling/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/75%/i)).toBeDefined();
      expect(screen.getByText('Compiling Typst WASM to PDF...')).toBeDefined();
    });
  });

  describe('Toast', () => {
    it('renders error toast with message and close button', () => {
      const handleClose = vi.fn();
      render(
        <Toast
          type="error"
          message="Failed to parse spreadsheet file."
          onClose={handleClose}
        />
      );

      expect(screen.getByText('Failed to parse spreadsheet file.')).toBeDefined();
      const closeBtn = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
