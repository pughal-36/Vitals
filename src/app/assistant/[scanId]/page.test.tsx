import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AssistantPage from './page';

vi.mock('@/lib/supabase/scans', () => ({
  getScanById: vi.fn().mockImplementation((id: string) => {
    if (id === 'valid-scan-id') {
      return Promise.resolve({
        id: 'valid-scan-id',
        url: 'https://example.com',
        strategy: 'mobile',
        status: 'done',
        score_performance: 95,
        score_accessibility: 90,
        score_best_practices: 85,
        score_seo: 100,
        raw_categories: {},
      });
    }
    return Promise.resolve(null);
  }),
}));

vi.mock('@/lib/supabase/chat', () => ({
  getChatHistory: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/app/chat/AuditChat', () => ({
  default: () => <div data-testid="audit-chat" />,
}));

vi.mock('@/components/RememberScan', () => ({
  default: () => null,
}));

describe('AssistantPage', () => {
  it('renders graceful fallback when scan is not found', async () => {
    const jsx = await AssistantPage({
      params: Promise.resolve({ scanId: 'missing-scan-id' }),
    });
    render(jsx);

    expect(screen.getByRole('heading', { name: /scan not found/i })).toBeVisible();
    expect(screen.getByText(/could not be found or has expired/i)).toBeVisible();
    expect(screen.getByRole('link', { name: /back to audit/i })).toBeVisible();
  });

  it('renders AuditChat when scan is found', async () => {
    const jsx = await AssistantPage({
      params: Promise.resolve({ scanId: 'valid-scan-id' }),
    });
    render(jsx);

    expect(screen.getByTestId('audit-chat')).toBeVisible();
  });
});
