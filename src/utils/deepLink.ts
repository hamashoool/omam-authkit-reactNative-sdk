import * as Linking from "expo-linking";
import { DeepLinkParams } from "../types";
import { DeepLinkError } from "../errors";

/**
 * Parse OAuth callback URL parameters
 * @param url Deep link URL
 * @returns Parsed parameters
 */
export function parseDeepLinkUrl(url: string): DeepLinkParams {
  try {
    const { queryParams } = Linking.parse(url);

    if (!queryParams) {
      throw new DeepLinkError("No query parameters found in deep link");
    }

    return {
      code: queryParams.code as string | undefined,
      state: queryParams.state as string | undefined,
      error: queryParams.error as string | undefined,
      error_description: queryParams.error_description as string | undefined,
    };
  } catch (error) {
    if (error instanceof DeepLinkError) {
      throw error;
    }
    throw new DeepLinkError("Failed to parse deep link URL", error);
  }
}

/**
 * Get the initial deep link URL (if app was opened with one)
 * @returns Promise resolving to the initial URL or null
 */
export async function getInitialUrl(): Promise<string | null> {
  try {
    return await Linking.getInitialURL();
  } catch (error) {
    throw new DeepLinkError("Failed to get initial URL", error);
  }
}

/**
 * Add deep link event listener
 * @param handler Callback function to handle deep link URLs
 * @returns Subscription object
 */
export function addEventListener(handler: (url: string) => void): {
  remove: () => void;
} {
  const subscription = Linking.addEventListener("url", (event) => {
    handler(event.url);
  });

  return {
    remove: () => subscription.remove(),
  };
}

/**
 * Build OAuth authorization URL with parameters
 * @param baseUrl Base URL of the OAuth provider
 * @param params Query parameters
 * @returns Complete authorization URL
 */
export function buildAuthorizationUrl(
  baseUrl: string,
  params: Record<string, string>,
): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

/**
 * Open URL in external browser or WebBrowser
 * @param url URL to open
 */
export async function openUrl(url: string): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      throw new DeepLinkError(`Cannot open URL: ${url}`);
    }
    await Linking.openURL(url);
  } catch (error) {
    if (error instanceof DeepLinkError) {
      throw error;
    }
    throw new DeepLinkError("Failed to open URL", error);
  }
}
