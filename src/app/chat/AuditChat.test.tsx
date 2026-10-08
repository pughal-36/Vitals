import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UIMessage } from 'ai';
import AuditChat from './AuditChat';

// Mock state for useChat
let mockChatState = {
  messages: [] as UIMessage[],
  sendMessage: vi.fn(),
  stop: vi.fn(),
  status: 'ready' as 'ready' | 'submitted' | 'streaming' | 'error',
  setMessages: vi.fn(),
  error: null as Error | null,
  regenerate: vi.fn(),
  clearError: vi.fn(),
};

vi.mock('@ai-sdk/react', () => ({
  useChat: () => mockChatState,
}));

describe('AuditChat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChatState = {
      messages: [],
      sendMessage: vi.fn(),
      stop: vi.fn(),
      status: 'ready',
      setMessages: vi.fn(),
      error: null,
      regenerate: vi.fn(),
      clearError: vi.fn(),
    };
  });

  it('renders the empty state with title and suggested prompts', () => {
    render(<AuditChat />);

    expect(screen.getByRole('heading', { name: 'Audit Assistant' })).toBeVisible();
    expect(screen.getByText(/Ask about web performance/i)).toBeVisible();
    expect(screen.getByRole('button', { name: "What's causing my low LCP score?" })).toBeVisible();
    expect(screen.getByRole('button', { name: 'How can I improve accessibility?' })).toBeVisible();
  });

  it('renders user and assistant text messages with markdown formatting', () => {
    mockChatState.messages = [
      {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'How do I optimize images?' }],
      },
      {
        id: 'msg-2',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Use modern formats like **WebP** or **AVIF**.' }],
      },
    ];

    render(<AuditChat />);

    expect(screen.getByText('How do I optimize images?')).toBeVisible();
    expect(screen.getByText(/Use modern formats like/i)).toBeVisible();
    expect(screen.getByText('WebP')).toBeVisible();
  });

  it('renders tool execution parts in assistant messages', () => {
    mockChatState.messages = [
      {
        id: 'msg-1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-fetchMetaTags',
            state: 'output-available',
            toolCallId: 'call-1',
            input: { url: 'https://example.com' },
            output: {
              title: 'Example Homepage',
              description: 'Fast modern web vitals audit',
            },
          },
        ],
      },
    ];

    render(<AuditChat />);

    expect(screen.getByText('Meta Tags Found')).toBeVisible();
    expect(screen.getByText('Example Homepage')).toBeVisible();
    expect(screen.getByText('Fast modern web vitals audit')).toBeVisible();
  });

  it('renders pending/submitted state when AI is generating', () => {
    mockChatState.status = 'submitted';

    render(<AuditChat />);

    const stopButton = screen.getByRole('button', { name: 'Stop' });
    expect(stopButton).toBeVisible();
    expect(screen.getByPlaceholderText('Ask about web performance…')).toBeDisabled();
  });

  it('renders streaming state with active indicator and allows stopping', async () => {
    const user = userEvent.setup();
    mockChatState.status = 'streaming';
    mockChatState.messages = [
      {
        id: 'msg-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Streaming in progress…' }],
      },
    ];

    render(<AuditChat />);

    expect(screen.getByLabelText('Generating…')).toBeInTheDocument();
    const stopButton = screen.getByRole('button', { name: 'Stop' });
    expect(stopButton).toBeVisible();

    await user.click(stopButton);
    expect(mockChatState.stop).toHaveBeenCalledTimes(1);
  });

  it('renders error state and handles message retry', async () => {
    const user = userEvent.setup();
    mockChatState.status = 'error';
    mockChatState.error = new Error('AI service unreachable');

    render(<AuditChat />);

    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByText('Something went wrong')).toBeVisible();

    const retryButton = screen.getByRole('button', { name: 'Retry this message' });
    await user.click(retryButton);

    expect(mockChatState.clearError).toHaveBeenCalledTimes(1);
    expect(mockChatState.regenerate).toHaveBeenCalledTimes(1);
  });

  it('allows user to type a message and send it', async () => {
    const user = userEvent.setup();
    render(<AuditChat />);

    const input = screen.getByPlaceholderText('Ask about web performance…');
    const sendButton = screen.getByRole('button', { name: 'Send' });

    await user.type(input, 'Tell me about CLS');
    expect(sendButton).not.toBeDisabled();

    await user.click(sendButton);
    expect(mockChatState.sendMessage).toHaveBeenCalledWith({ text: 'Tell me about CLS' });
  });
});
