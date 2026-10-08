import { describe, it, expect } from 'vitest';
import { validateAndNormalizeUrl } from './url';

describe('validateAndNormalizeUrl', () => {
  it('accepts valid https public domains', () => {
    const res = validateAndNormalizeUrl('https://example.com');
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.normalizedUrl).toBe('https://example.com');
    }
  });

  it('prepends https if no protocol specified', () => {
    const res = validateAndNormalizeUrl('vercel.com/docs');
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.normalizedUrl).toBe('https://vercel.com/docs');
    }
  });

  it('rejects http URLs (https only)', () => {
    const res = validateAndNormalizeUrl('http://example.com');
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.error).toContain('https://');
    }
  });

  it('blocks localhost and loopback IPv4', () => {
    expect(validateAndNormalizeUrl('https://localhost').valid).toBe(false);
    expect(validateAndNormalizeUrl('https://127.0.0.1').valid).toBe(false);
    expect(validateAndNormalizeUrl('https://127.0.1.1:8080').valid).toBe(false);
  });

  it('blocks private IP ranges (10.x, 192.168.x, 172.16.x)', () => {
    expect(validateAndNormalizeUrl('https://10.0.0.1').valid).toBe(false);
    expect(validateAndNormalizeUrl('https://192.168.1.1').valid).toBe(false);
    expect(validateAndNormalizeUrl('https://172.16.0.1').valid).toBe(false);
    expect(validateAndNormalizeUrl('https://172.31.255.255').valid).toBe(false);
    expect(validateAndNormalizeUrl('https://169.254.169.254').valid).toBe(false);
  });

  it('blocks internal suffixes (.local, .internal, .lan)', () => {
    expect(validateAndNormalizeUrl('https://app.local').valid).toBe(false);
    expect(validateAndNormalizeUrl('https://service.internal').valid).toBe(false);
    expect(validateAndNormalizeUrl('https://router.lan').valid).toBe(false);
  });

  it('blocks empty or single-word hostnames without dot', () => {
    expect(validateAndNormalizeUrl('').valid).toBe(false);
    expect(validateAndNormalizeUrl('https://myhostname').valid).toBe(false);
  });
});
