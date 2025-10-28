import { ValidationError } from "../errors";

/**
 * Validate URL to prevent open redirect vulnerabilities
 * @param url URL to validate
 * @param allowedHosts Optional list of allowed hosts
 * @returns true if URL is valid
 * @throws ValidationError if URL is invalid
 */
export function validateUrl(url: string, allowedHosts?: string[]): boolean {
  try {
    const parsedUrl = new URL(url);

    // Check protocol - only allow http and https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new ValidationError(
        `Invalid protocol: ${parsedUrl.protocol}. Only HTTP and HTTPS are allowed.`,
      );
    }

    // If allowed hosts are specified, validate against them
    if (allowedHosts && allowedHosts.length > 0) {
      const hostname = parsedUrl.hostname.toLowerCase();
      const isAllowed = allowedHosts.some(
        (allowedHost) =>
          hostname === allowedHost.toLowerCase() ||
          hostname.endsWith(`.${allowedHost.toLowerCase()}`),
      );

      if (!isAllowed) {
        throw new ValidationError(
          `URL host ${hostname} is not in the allowed hosts list`,
        );
      }
    }

    return true;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError("Invalid URL format", undefined, error);
  }
}

/**
 * Sanitize redirect URI to prevent open redirect attacks
 * @param redirectUri Redirect URI to validate
 * @param expectedScheme Expected URI scheme (e.g., 'myapp')
 * @returns true if redirect URI is valid
 * @throws ValidationError if redirect URI is invalid
 */
export function validateRedirectUri(
  redirectUri: string,
  expectedScheme?: string,
): boolean {
  try {
    // For custom schemes (deep links), just validate format
    if (redirectUri.includes("://")) {
      const [scheme] = redirectUri.split("://");

      // If expected scheme is provided, validate it
      if (expectedScheme && scheme !== expectedScheme) {
        throw new ValidationError(
          `Invalid redirect URI scheme. Expected ${expectedScheme}, got ${scheme}`,
        );
      }

      // Validate scheme format (alphanumeric and hyphens only)
      if (!/^[a-z0-9-]+$/.test(scheme)) {
        throw new ValidationError(
          "Invalid redirect URI scheme format. Only lowercase alphanumeric and hyphens allowed.",
        );
      }

      return true;
    }

    // For HTTP(S) URIs, use standard URL validation
    return validateUrl(redirectUri);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError("Invalid redirect URI format", undefined, error);
  }
}

/**
 * Validate email format
 * @param email Email to validate
 * @returns true if email is valid
 * @throws ValidationError if email is invalid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format", "email");
  }

  return true;
}

/**
 * Validate password strength
 * @param password Password to validate
 * @param minLength Minimum length (default: 8)
 * @returns true if password meets requirements
 * @throws ValidationError if password is weak
 */
export function validatePassword(
  password: string,
  minLength: number = 8,
): boolean {
  if (password.length < minLength) {
    throw new ValidationError(
      `Password must be at least ${minLength} characters long`,
      "password",
    );
  }

  return true;
}

/**
 * Sanitize string input to prevent injection attacks
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  // Remove null bytes and control characters (intentional for security)
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x1F\x7F]/g, "");
}
