/**
 * URL validation and normalization with SSRF protection.
 * Requires https:// and blocks loopback, private networks, and internal hostnames.
 */

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^0\.0\.0\.0$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd/i,
];

const BLOCKED_HOST_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".lan",
  ".home",
  ".corp",
];

export type UrlValidationResult =
  | { valid: true; normalizedUrl: string }
  | { valid: false; error: string };

export function validateAndNormalizeUrl(rawInput: string): UrlValidationResult {
  if (!rawInput || typeof rawInput !== "string") {
    return { valid: false, error: "URL is required." };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { valid: false, error: "URL cannot be empty." };
  }

  let parsed: URL;
  try {
    // Add protocol if user typed example.com
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(withProtocol);
  } catch {
    return { valid: false, error: "Please enter a valid URL." };
  }

  // Enforce HTTPS only (per requirement: "https only")
  if (parsed.protocol !== "https:") {
    return {
      valid: false,
      error: "Only secure HTTPS URLs (https://) are supported.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check for localhost and private IP patterns
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return {
        valid: false,
        error: "Scanning localhost, private networks, or internal IP addresses is not permitted.",
      };
    }
  }

  // Check blocked suffixes
  for (const suffix of BLOCKED_HOST_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return {
        valid: false,
        error: "Internal or private domain names cannot be scanned.",
      };
    }
  }

  // Must contain a dot in hostname (e.g., example.com, not just 'machine')
  if (!hostname.includes(".")) {
    return {
      valid: false,
      error: "Please enter a fully qualified domain name (e.g., https://example.com).",
    };
  }

  // Clean and normalize
  parsed.hash = "";
  // Strip default 443 port if explicitly entered
  if (parsed.port === "443") {
    parsed.port = "";
  }
  // If path is just "/" without query params, normalize to root
  let normalized = parsed.toString();
  if (parsed.pathname === "/" && !parsed.search) {
    normalized = `${parsed.protocol}//${parsed.host}`;
  }

  return { valid: true, normalizedUrl: normalized };
}
