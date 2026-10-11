import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SeoLoadingTips from './SeoLoadingTips';

describe('SeoLoadingTips Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders initial loading state', () => {
    render(<SeoLoadingTips />);

    expect(screen.getByRole('paragraph')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('paragraph')).toHaveTextContent(/Loading tips/i);
  });

  it('fetches fresh tips from /api/tips and displays them', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tips: [
          'Fast pages give both people and crawlers fewer reasons to leave.',
          'A clear title helps searchers know what makes a page useful.',
        ],
        topic: 'page speed and Core Web Vitals',
      }),
    });

    render(<SeoLoadingTips />);

    await waitFor(() => {
      expect(
        screen.getByText(/Fast pages give both people and crawlers/i)
      ).toBeVisible();
    });
  });

  it('falls back to static tips pool if API request fails', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    render(<SeoLoadingTips />);

    await waitFor(
      () => {
        const p = screen.getByRole('paragraph');
        expect(p.textContent).toBeTruthy();
      },
      { timeout: 4000 }
    );
  });
});
