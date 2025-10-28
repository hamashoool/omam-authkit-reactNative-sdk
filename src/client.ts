import axios, { AxiosInstance, AxiosError } from "axios";
import * as WebBrowser from "expo-web-browser";
import {
  AuthKitConfig,
  User,
  TokenResponse,
  RegistrationData,
  RegistrationResponse,
  SocialProvider,
  AuthEvent,
  EventListener,
  StorageAdapter,
  UpdateProfileData,
  Scope,
} from "./types";
import {
  AuthKitError,
  AuthenticationError,
  NetworkError,
  TokenError,
  ValidationError,
  ConfigurationError,
} from "./errors";
import { AsyncStorageAdapter } from "./storage/AsyncStorageAdapter";
import { SecureStoreAdapter } from "./storage/SecureStoreAdapter";
import { generatePKCEParams, generateState } from "./utils/pkce";
import { buildAuthorizationUrl, parseDeepLinkUrl } from "./utils/deepLink";
import {
  STORAGE_KEYS,
  ENDPOINTS,
  GRANT_TYPES,
  EVENTS,
  DEFAULTS,
} from "./utils/constants";

/**
 * Main AuthKit React Native SDK client
 */
export class AuthKitClient {
  private config: Required<AuthKitConfig>;
  private http: AxiosInstance;
  private storage: StorageAdapter;
  private eventListeners: Map<AuthEvent, Set<EventListener>>;
  private lastRefreshAttempt: number = 0;
  private readonly REFRESH_COOLDOWN = 1000; // 1 second
  private readonly USER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(config: AuthKitConfig) {
    // Validate required config
    if (!config.authKitUrl) {
      throw new ConfigurationError("authKitUrl is required");
    }
    if (!config.clientId) {
      throw new ConfigurationError("clientId is required");
    }
    if (!config.redirectUri) {
      throw new ConfigurationError("redirectUri is required");
    }

    // Merge with defaults
    this.config = {
      authKitUrl: config.authKitUrl,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: Array.isArray(config.scopes)
        ? config.scopes
        : ([...DEFAULTS.SCOPES] as Scope[]),
      pkce: config.pkce !== undefined ? Boolean(config.pkce) : DEFAULTS.PKCE,
      autoRefresh:
        config.autoRefresh !== undefined
          ? Boolean(config.autoRefresh)
          : DEFAULTS.AUTO_REFRESH,
      refreshThreshold: config.refreshThreshold || DEFAULTS.REFRESH_THRESHOLD,
      timeout: config.timeout || DEFAULTS.TIMEOUT,
      debug:
        config.debug !== undefined ? Boolean(config.debug) : DEFAULTS.DEBUG,
      secureStorage:
        config.secureStorage !== undefined
          ? Boolean(config.secureStorage)
          : DEFAULTS.SECURE_STORAGE,
      headers: config.headers || {},
      storage: config.storage,
      clientSecret: config.clientSecret,
    } as Required<AuthKitConfig>;

    // Initialize storage
    this.storage =
      this.config.storage ||
      (this.config.secureStorage
        ? new SecureStoreAdapter()
        : new AsyncStorageAdapter());

    // Initialize event listeners
    this.eventListeners = new Map();

    // Create HTTP client
    this.http = axios.create({
      baseURL: this.config.authKitUrl,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        ...this.config.headers,
      },
    });

    // Setup interceptors
    this.setupInterceptors();

    this.log("AuthKit React Native SDK initialized", this.config);
  }

  /**
   * Sanitize object to remove sensitive data from logs
   */
  private sanitizeForLog(obj: unknown): unknown {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    // Handle arrays separately to preserve array structure
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeForLog(item));
    }

    const sensitiveKeys = [
      "access_token",
      "refresh_token",
      "code",
      "code_verifier",
      "client_secret",
      "password",
    ];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeForLog(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Log debug message (only in development mode)
   */
  private log(message: string, ...args: unknown[]): void {
    // Only log in debug mode AND development environment
    if (this.config.debug && typeof __DEV__ !== "undefined" && __DEV__) {
      const sanitizedArgs = args.map((arg) => this.sanitizeForLog(arg));
      // eslint-disable-next-line no-console
      console.log(`[AuthKit] ${message}`, ...sanitizedArgs);
    }
  }

  /**
   * Setup HTTP interceptors for automatic token refresh
   */
  private setupInterceptors(): void {
    // List of endpoints that require authentication
    const protectedEndpoints = [
      ENDPOINTS.USERINFO,
      ENDPOINTS.PROFILE,
      ENDPOINTS.INTROSPECT,
      ENDPOINTS.REVOKE,
    ];

    // Request interceptor - add auth header
    this.http.interceptors.request.use(
      async (config) => {
        // Only add authorization header to protected endpoints
        if (
          config.url &&
          protectedEndpoints.some((endpoint) => config.url?.includes(endpoint))
        ) {
          const token = await this.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - handle errors
    this.http.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as typeof error.config & {
          _retry?: boolean;
        };

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();

            // Retry original request
            const token = await this.getAccessToken();
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.http(originalRequest);
          } catch (refreshError) {
            this.emit(EVENTS.TOKEN_EXPIRED, { error: refreshError });
            throw refreshError;
          }
        }

        throw this.handleError(error);
      },
    );
  }

  /**
   * Handle axios error and convert to AuthKit error
   */
  private handleError(error: unknown): AuthKitError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        error?: string;
        error_description?: string;
      }>;

      if (axiosError.response) {
        const { status, data } = axiosError.response;
        const message =
          data?.error_description || data?.error || axiosError.message;

        if (status === 401) {
          return new AuthenticationError(message, data?.error);
        }

        return new NetworkError(message, status, data);
      }

      if (axiosError.request) {
        this.emit(EVENTS.NETWORK_ERROR, { error: axiosError });
        return new NetworkError(
          "Network request failed",
          undefined,
          axiosError,
        );
      }
    }

    if (error instanceof AuthKitError) {
      return error;
    }

    return new AuthKitError(
      error instanceof Error ? error.message : "Unknown error",
      undefined,
      error,
    );
  }

  /**
   * Register event listener
   */
  on<T = unknown>(event: AuthEvent, listener: EventListener<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener as EventListener);
  }

  /**
   * Remove event listener
   */
  off<T = unknown>(event: AuthEvent, listener: EventListener<T>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener as EventListener);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit<T = unknown>(event: AuthEvent, data: T): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }

  /**
   * Start OAuth login flow
   */
  async login(): Promise<void> {
    try {
      // Generate state for CSRF protection
      const state = generateState();
      await this.storage.setItem(STORAGE_KEYS.OAUTH_STATE, state);

      // Generate PKCE parameters if enabled
      let codeChallenge: string | undefined;
      let codeChallengeMethod: string | undefined;

      if (this.config.pkce) {
        const pkceParams = await generatePKCEParams();
        await this.storage.setItem(
          STORAGE_KEYS.PKCE_VERIFIER,
          pkceParams.codeVerifier,
        );
        codeChallenge = pkceParams.codeChallenge;
        codeChallengeMethod = pkceParams.codeChallengeMethod;
      }

      // Build authorization URL
      const params: Record<string, string> = {
        client_id: this.config.clientId,
        response_type: "code",
        redirect_uri: this.config.redirectUri,
        scope: this.config.scopes.join(" "),
        state,
      };

      if (codeChallenge && codeChallengeMethod) {
        params.code_challenge = codeChallenge;
        params.code_challenge_method = codeChallengeMethod;
      }

      const authUrl = buildAuthorizationUrl(
        `${this.config.authKitUrl}${ENDPOINTS.AUTHORIZE}`,
        params,
      );

      this.log("Opening authorization URL", authUrl);

      // Open authorization URL in browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        this.config.redirectUri,
      );

      if (result.type === "success") {
        const {
          code,
          state: returnedState,
          error,
        } = parseDeepLinkUrl(result.url);

        if (error) {
          // Clean up state on OAuth error
          await this.cleanupOAuthState();
          throw new AuthenticationError(`OAuth error: ${error}`);
        }

        if (!code || !returnedState) {
          // Clean up state on missing parameters
          await this.cleanupOAuthState();
          throw new AuthenticationError("Missing code or state in callback");
        }

        // Verify state
        const savedState = await this.storage.getItem(STORAGE_KEYS.OAUTH_STATE);
        if (returnedState !== savedState) {
          // Clean up state on CSRF check failure
          await this.cleanupOAuthState();
          throw new AuthenticationError("Invalid state parameter");
        }

        // Exchange code for tokens
        await this.handleCallback(code, returnedState);
      } else if (result.type === "cancel") {
        // Clean up state on user cancellation
        await this.cleanupOAuthState();
        throw new AuthenticationError("Login cancelled by user");
      }
    } catch (error) {
      // Ensure cleanup on any error
      await this.cleanupOAuthState().catch(() => {
        // Ignore cleanup errors
      });
      this.emit(EVENTS.AUTH_ERROR, error);
      throw this.handleError(error);
    }
  }

  /**
   * Clean up OAuth state and PKCE verifier from storage
   */
  private async cleanupOAuthState(): Promise<void> {
    try {
      await this.storage.removeItem(STORAGE_KEYS.OAUTH_STATE);
      await this.storage.removeItem(STORAGE_KEYS.PKCE_VERIFIER);
    } catch (error) {
      this.log("Failed to cleanup OAuth state", error);
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(code: string, state: string): Promise<TokenResponse> {
    try {
      // Verify state
      const savedState = await this.storage.getItem(STORAGE_KEYS.OAUTH_STATE);
      if (state !== savedState) {
        throw new AuthenticationError(
          "Invalid state parameter - CSRF check failed",
        );
      }

      // Build token request
      const body: Record<string, string> = {
        grant_type: GRANT_TYPES.AUTHORIZATION_CODE,
        code,
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
      };

      // Add client secret if provided
      if (this.config.clientSecret) {
        body.client_secret = this.config.clientSecret;
      }

      // Add PKCE verifier if enabled
      if (this.config.pkce) {
        const codeVerifier = await this.storage.getItem(
          STORAGE_KEYS.PKCE_VERIFIER,
        );
        if (codeVerifier) {
          body.code_verifier = codeVerifier;
        }
      }

      this.log("Exchanging code for tokens", { code, state });

      // Exchange code for tokens
      const response = await this.http.post<TokenResponse>(
        ENDPOINTS.TOKEN,
        new URLSearchParams(body).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const tokens = response.data;

      // Store tokens
      await this.storeTokens(tokens);

      // Cleanup
      await this.storage.removeItem(STORAGE_KEYS.OAUTH_STATE);
      await this.storage.removeItem(STORAGE_KEYS.PKCE_VERIFIER);

      // Fetch user profile
      const user = await this.getCurrentUser();
      this.emit(EVENTS.USER_LOGGED_IN, user);

      return tokens;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Store tokens in storage
   */
  private async storeTokens(tokens: TokenResponse): Promise<void> {
    await this.storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
    await this.storage.setItem(STORAGE_KEYS.TOKEN_TYPE, tokens.token_type);

    if (tokens.refresh_token) {
      await this.storage.setItem(
        STORAGE_KEYS.REFRESH_TOKEN,
        tokens.refresh_token,
      );
    }

    // Calculate expiry time
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    await this.storage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
  }

  /**
   * Get access token from storage
   */
  async getAccessToken(): Promise<string | null> {
    return await this.storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get refresh token from storage
   */
  async getRefreshToken(): Promise<string | null> {
    return await this.storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) {
      return false;
    }

    // Check if token is expired
    const expiresAt = await this.storage.getItem(STORAGE_KEYS.EXPIRES_AT);
    if (expiresAt) {
      const expiry = parseInt(expiresAt, 10);
      if (Date.now() >= expiry) {
        // Try to refresh token
        try {
          await this.refreshAccessToken();
          return true;
        } catch {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Refresh access token with rate limiting
   */
  async refreshAccessToken(): Promise<TokenResponse> {
    try {
      // Rate limiting check
      const now = Date.now();
      if (now - this.lastRefreshAttempt < this.REFRESH_COOLDOWN) {
        throw new TokenError(
          "Token refresh rate limit exceeded. Please wait before retrying.",
        );
      }
      this.lastRefreshAttempt = now;

      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new TokenError("No refresh token available");
      }

      const body: Record<string, string> = {
        grant_type: GRANT_TYPES.REFRESH_TOKEN,
        refresh_token: refreshToken,
        client_id: this.config.clientId,
      };

      if (this.config.clientSecret) {
        body.client_secret = this.config.clientSecret;
      }

      this.log("Refreshing access token");

      const response = await this.http.post<TokenResponse>(
        ENDPOINTS.TOKEN,
        new URLSearchParams(body).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const tokens = response.data;
      await this.storeTokens(tokens);

      this.emit(EVENTS.TOKEN_REFRESHED, tokens);
      return tokens;
    } catch (error) {
      this.emit(EVENTS.TOKEN_EXPIRED, { error });
      throw this.handleError(error);
    }
  }

  /**
   * Get current authenticated user (with cache expiry)
   */
  async getCurrentUser(forceRefresh: boolean = false): Promise<User> {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedUser = await this.storage.getItem(STORAGE_KEYS.USER);
        const cachedAt = await this.storage.getItem(
          STORAGE_KEYS.USER_CACHED_AT,
        );

        if (cachedUser && cachedAt) {
          const cacheAge = Date.now() - parseInt(cachedAt, 10);
          if (cacheAge < this.USER_CACHE_DURATION) {
            this.log("Returning cached user data");
            return JSON.parse(cachedUser);
          }
          this.log("User cache expired, fetching fresh data");
        }
      }

      // Fetch from API
      const response = await this.http.get<User>(ENDPOINTS.USERINFO);
      const user = response.data;

      // Cache user with timestamp
      await this.storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      await this.storage.setItem(
        STORAGE_KEYS.USER_CACHED_AT,
        Date.now().toString(),
      );

      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<User> {
    try {
      const response = await this.http.patch<User>(ENDPOINTS.PROFILE, data);
      const user = response.data;

      // Update cache
      await this.storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      this.emit(EVENTS.USER_UPDATED, user);
      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Register new user
   */
  async register(data: RegistrationData): Promise<RegistrationResponse> {
    try {
      // Validate data
      if (!data.email || !data.password || !data.password_confirm) {
        throw new ValidationError(
          "Email, password, and password confirmation are required",
        );
      }

      if (data.password !== data.password_confirm) {
        throw new ValidationError("Passwords do not match", "password_confirm");
      }

      const response = await this.http.post<RegistrationResponse>(
        ENDPOINTS.REGISTER,
        data,
      );

      this.emit(EVENTS.USER_REGISTERED, response.data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Revoke tokens if possible
      const accessToken = await this.getAccessToken();
      if (accessToken) {
        try {
          await this.http.post(
            ENDPOINTS.REVOKE,
            new URLSearchParams({ token: accessToken }).toString(),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            },
          );
        } catch (error) {
          this.log("Token revocation failed", error);
        }
      }

      // Clear storage
      await this.storage.clear();

      this.emit(EVENTS.USER_LOGGED_OUT, undefined);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Login with social provider
   */
  async loginWithSocial(provider: SocialProvider): Promise<void> {
    try {
      const socialUrl = this.getSocialLoginUrl(provider);

      this.log("Opening social login URL", socialUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        socialUrl,
        this.config.redirectUri,
      );

      if (result.type === "success") {
        // After social login redirect, you'll need to handle the session
        // This depends on your backend implementation
        const user = await this.getCurrentUser();
        this.emit(EVENTS.USER_LOGGED_IN, user);
      } else if (result.type === "cancel") {
        throw new AuthenticationError("Social login cancelled by user");
      }
    } catch (error) {
      this.emit(EVENTS.AUTH_ERROR, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get social login URL without opening browser
   * Useful for custom UI implementations
   */
  getSocialLoginUrl(provider: SocialProvider): string {
    return `${this.config.authKitUrl}${ENDPOINTS.SOCIAL_LOGIN(provider)}`;
  }

  /**
   * Get OAuth authorization URL without opening browser
   * Useful for custom authentication flows with custom WebViews
   */
  async getAuthorizationUrl(): Promise<string> {
    // Generate state for CSRF protection
    const state = generateState();
    await this.storage.setItem(STORAGE_KEYS.OAUTH_STATE, state);

    // Generate PKCE parameters if enabled
    let codeChallenge: string | undefined;
    let codeChallengeMethod: string | undefined;

    if (this.config.pkce) {
      const pkceParams = await generatePKCEParams();
      await this.storage.setItem(
        STORAGE_KEYS.PKCE_VERIFIER,
        pkceParams.codeVerifier,
      );
      codeChallenge = pkceParams.codeChallenge;
      codeChallengeMethod = pkceParams.codeChallengeMethod;
    }

    // Build authorization URL
    const params: Record<string, string> = {
      client_id: this.config.clientId,
      response_type: "code",
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(" "),
      state,
    };

    if (codeChallenge && codeChallengeMethod) {
      params.code_challenge = codeChallenge;
      params.code_challenge_method = codeChallengeMethod;
    }

    return buildAuthorizationUrl(
      `${this.config.authKitUrl}${ENDPOINTS.AUTHORIZE}`,
      params,
    );
  }

  /**
   * Exchange authorization code for tokens
   * Use this for custom OAuth flows
   */
  async exchangeAuthorizationCode(
    code: string,
    codeVerifier?: string,
  ): Promise<TokenResponse> {
    try {
      const body: Record<string, string> = {
        grant_type: GRANT_TYPES.AUTHORIZATION_CODE,
        code,
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
      };

      // Add client secret if provided
      if (this.config.clientSecret) {
        body.client_secret = this.config.clientSecret;
      }

      // Add PKCE verifier
      if (codeVerifier) {
        body.code_verifier = codeVerifier;
      } else if (this.config.pkce) {
        const storedVerifier = await this.storage.getItem(
          STORAGE_KEYS.PKCE_VERIFIER,
        );
        if (storedVerifier) {
          body.code_verifier = storedVerifier;
        }
      }

      this.log("Exchanging code for tokens");

      const response = await this.http.post<TokenResponse>(
        ENDPOINTS.TOKEN,
        new URLSearchParams(body).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const tokens = response.data;
      await this.storeTokens(tokens);

      return tokens;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current token metadata
   * Returns null if no tokens are stored
   */
  async getTokens(): Promise<{
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    expiresAt: number;
    scopes: string[];
  } | null> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return null;
      }

      const tokenType =
        (await this.storage.getItem(STORAGE_KEYS.TOKEN_TYPE)) || "Bearer";
      const refreshToken = (await this.getRefreshToken()) || undefined;
      const expiresAtStr = await this.storage.getItem(STORAGE_KEYS.EXPIRES_AT);
      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
      const scopes = this.config.scopes;

      return {
        accessToken,
        refreshToken,
        tokenType,
        expiresAt,
        scopes,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Revoke a specific token
   * @param token - The token to revoke (access or refresh token)
   */
  async revokeToken(token: string): Promise<void> {
    try {
      await this.http.post(
        ENDPOINTS.REVOKE,
        new URLSearchParams({ token }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
      this.log("Token revoked successfully");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Clear all authentication data from storage
   * Does not revoke tokens on the server
   */
  async clearStorage(): Promise<void> {
    await this.storage.clear();
    this.log("Storage cleared");
  }
}
