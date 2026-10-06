import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UrlAuditForm from './UrlAuditForm';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('UrlAuditForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error when submitting empty input', async () => {
    const user = userEvent.setup();
    render(<UrlAuditForm />);

    const submitBtn = screen.getByRole('button', { name: /scan/i });
    await user.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a URL.');
  });

  it('shows error when submitting an invalid URL', async () => {
    const user = userEvent.setup();
    render(<UrlAuditForm />);

    const input = screen.getByRole('textbox', { name: /website url to audit/i });
    const submitBtn = screen.getByRole('button', { name: /scan/i });

    await user.type(input, 'not-a-valid-url');
    await user.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please enter a valid URL starting with https:// or http://'
    );
  });

  it('clears the validation error when user edits the input', async () => {
    const user = userEvent.setup();
    render(<UrlAuditForm />);

    const input = screen.getByRole('textbox', { name: /website url to audit/i });
    const submitBtn = screen.getByRole('button', { name: /scan/i });

    await user.click(submitBtn);
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a URL.');

    await user.type(input, 'https://');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits valid URL and navigates on success', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: async () => ({ ok: true, id: 'scan-123' }),
    });

    render(<UrlAuditForm />);

    const input = screen.getByRole('textbox', { name: /website url to audit/i });
    const submitBtn = screen.getByRole('button', { name: /scan/i });

    await user.type(input, 'https://example.com');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/audit/scan-123');
    });
  });
});
