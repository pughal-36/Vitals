import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SeoLoadingTips, { LOADING_TIPS } from './SeoLoadingTips';

describe('SeoLoadingTips Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders aria attributes and shows a tip from the list after mounting', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<SeoLoadingTips />);

    const paragraph = screen.getByRole('paragraph');
    expect(paragraph).toHaveAttribute('aria-live', 'polite');
    expect(paragraph).toHaveAttribute('aria-atomic', 'true');
    expect(paragraph).toHaveTextContent(LOADING_TIPS[0]);
  });

  it('rotates to the next tip every 6 seconds in order', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // Math.floor(0.1 * 20) = 2
    render(<SeoLoadingTips />);

    expect(screen.getByRole('paragraph')).toHaveTextContent(LOADING_TIPS[2]);

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByRole('paragraph')).toHaveTextContent(LOADING_TIPS[3]);

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByRole('paragraph')).toHaveTextContent(LOADING_TIPS[4]);
  });

  it('wraps around to the first tip when reaching the end of the array', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999); // last index (19)
    render(<SeoLoadingTips />);

    expect(screen.getByRole('paragraph')).toHaveTextContent(LOADING_TIPS[19]);

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByRole('paragraph')).toHaveTextContent(LOADING_TIPS[0]);
  });
});
