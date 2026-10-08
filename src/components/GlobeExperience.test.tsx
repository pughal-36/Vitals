import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GlobeExperience from './GlobeExperience';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

describe('GlobeExperience Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the instrument container with calm baseline state by default', () => {
    render(<GlobeExperience />);

    expect(screen.getByText('EARTH / 001')).toBeVisible();
    expect(screen.getByText('BASELINE / CALM')).toBeVisible();
    expect(screen.getByText(/DRAG TO TILT/i)).toBeVisible();
  });

  it('renders locked signal readout when scan and score are provided', () => {
    render(<GlobeExperience scanId="test-scan-123" score={92} />);

    expect(screen.getByText('EARTH / 001')).toBeVisible();
    expect(screen.getByText('SITE SIGNAL LOCKED')).toBeVisible();
  });

  it('renders static SVG fallback when WebGL or reduced-motion is preferred', () => {
    render(<GlobeExperience />);

    const fallbackImg = screen.getByRole('img', { name: /illustration of the vitals audit globe/i });
    expect(fallbackImg).toBeVisible();
  });
});
