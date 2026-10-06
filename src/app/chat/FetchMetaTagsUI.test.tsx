import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FetchMetaTagsUI } from './AuditChat';

describe('FetchMetaTagsUI (Tool Result Component)', () => {
  it('renders successfully retrieved meta tags in a table', () => {
    const part = {
      type: 'tool-fetchMetaTags',
      state: 'output-available',
      output: {
        title: 'My Awesome Website',
        description: 'The best site on the web',
        ogTitle: 'Social Title',
        ogDescription: 'Social Description',
        ogImage: 'https://example.com/image.png',
        canonicalUrl: 'https://example.com/canonical',
      },
    };

    render(<FetchMetaTagsUI part={part} />);

    expect(screen.getByText('Meta Tags Found')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('My Awesome Website')).toBeInTheDocument();
    expect(screen.getByText('The best site on the web')).toBeInTheDocument();
    expect(screen.getByText('Social Title')).toBeInTheDocument();
    expect(screen.getByText('Social Description')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'OG Image Thumbnail' })).toBeInTheDocument();
    expect(screen.getByText('https://example.com/canonical')).toBeInTheDocument();
  });

  it('handles missing/empty fields by displaying "Not found"', () => {
    const part = {
      type: 'tool-fetchMetaTags',
      state: 'output-available',
      output: {
        title: 'Only Title Present',
        description: null,
        ogTitle: undefined,
      },
    };

    render(<FetchMetaTagsUI part={part} />);

    expect(screen.getByText('Only Title Present')).toBeInTheDocument();
    const notFoundElements = screen.getAllByText('Not found');
    expect(notFoundElements.length).toBeGreaterThan(0);
  });

  it('renders failure state when tool execution fails', () => {
    const part = {
      type: 'tool-fetchMetaTags',
      state: 'output-error',
      errorText: 'Failed to fetch URL: 500 Internal Server Error',
    };

    render(<FetchMetaTagsUI part={part} />);

    expect(screen.getByText('Error fetching meta tags')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch URL: 500 Internal Server Error')).toBeInTheDocument();
  });

  it('renders loading states for input preparation and execution', () => {
    const { rerender } = render(
      <FetchMetaTagsUI
        part={{
          type: 'tool-fetchMetaTags',
          state: 'input-streaming',
          input: { url: 'https://test.com' },
        }}
      />
    );
    expect(screen.getByText('preparing to check https://test.com...')).toBeInTheDocument();

    rerender(
      <FetchMetaTagsUI
        part={{
          type: 'tool-fetchMetaTags',
          state: 'input-available',
          input: { url: 'https://test.com' },
        }}
      />
    );
    expect(screen.getByText(/Fetching meta tags for/i)).toBeInTheDocument();
  });
});
