import * as Crypto from "expo-crypto";
import { PKCEParams, CodeChallengeMethod } from "../types";

/**
 * Generate a random code verifier for PKCE
 * @param length Length of the code verifier (43-128 characters)
 * @returns Random code verifier string
 */
export function generateCodeVerifier(length: number = 128): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  // Generate random bytes
  const randomBytes = Crypto.getRandomBytes(length);

  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[randomBytes[i] % charset.length];
  }

  return result;
}

/**
 * Base64url encode a string
 * @param str String to encode
 * @returns Base64url-encoded string
 */
function base64UrlEncode(str: string): string {
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Generate a code challenge from a code verifier
 * @param codeVerifier The code verifier
 * @param method The challenge method ('S256' or 'plain')
 * @returns Promise resolving to the code challenge
 */
export async function generateCodeChallenge(
  codeVerifier: string,
  method: CodeChallengeMethod = "S256",
): Promise<string> {
  if (method === "plain") {
    return codeVerifier;
  }

  // S256 method - hash with SHA-256
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );

  return base64UrlEncode(hash);
}

/**
 * Generate PKCE parameters (code verifier and challenge)
 * @param method The challenge method ('S256' or 'plain')
 * @returns Promise resolving to PKCE parameters
 */
export async function generatePKCEParams(
  method: CodeChallengeMethod = "S256",
): Promise<PKCEParams> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier, method);

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: method,
  };
}

/**
 * Generate a random state parameter for OAuth
 * @returns Random state string
 */
export function generateState(): string {
  return generateCodeVerifier(32);
}
