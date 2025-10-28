import {
  generateCodeVerifier,
  generateCodeChallenge,
  generatePKCEParams,
  generateState,
} from "../utils/pkce";

describe("PKCE Utils", () => {
  describe("generateCodeVerifier", () => {
    it("should generate a code verifier with default length", () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toHaveLength(128);
    });

    it("should generate a code verifier with custom length", () => {
      const verifier = generateCodeVerifier(64);
      expect(verifier).toHaveLength(64);
    });

    it("should only contain valid characters", () => {
      const verifier = generateCodeVerifier();
      const validChars = /^[A-Za-z0-9\-._~]+$/;
      expect(verifier).toMatch(validChars);
    });

    it("should generate different verifiers on each call", () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      expect(verifier1).not.toBe(verifier2);
    });
  });

  describe("generateCodeChallenge", () => {
    it("should return the same value for plain method", async () => {
      const verifier = "test-verifier";
      const challenge = await generateCodeChallenge(verifier, "plain");
      expect(challenge).toBe(verifier);
    });

    it("should generate a hashed challenge for S256 method", async () => {
      const verifier = "test-verifier";
      const challenge = await generateCodeChallenge(verifier, "S256");
      expect(challenge).toBeTruthy();
      expect(challenge).not.toBe(verifier);
    });

    it("should generate consistent challenge for same verifier", async () => {
      const verifier = "test-verifier";
      const challenge1 = await generateCodeChallenge(verifier, "S256");
      const challenge2 = await generateCodeChallenge(verifier, "S256");
      expect(challenge1).toBe(challenge2);
    });
  });

  describe("generatePKCEParams", () => {
    it("should generate PKCE parameters with S256 by default", async () => {
      const params = await generatePKCEParams();
      expect(params).toHaveProperty("codeVerifier");
      expect(params).toHaveProperty("codeChallenge");
      expect(params).toHaveProperty("codeChallengeMethod");
      expect(params.codeChallengeMethod).toBe("S256");
      expect(params.codeVerifier).toHaveLength(128);
    });

    it("should generate PKCE parameters with plain method", async () => {
      const params = await generatePKCEParams("plain");
      expect(params.codeChallengeMethod).toBe("plain");
      expect(params.codeChallenge).toBe(params.codeVerifier);
    });
  });

  describe("generateState", () => {
    it("should generate a state parameter", () => {
      const state = generateState();
      expect(state).toHaveLength(32);
    });

    it("should generate different state on each call", () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
    });

    it("should only contain valid characters", () => {
      const state = generateState();
      const validChars = /^[A-Za-z0-9\-._~]+$/;
      expect(state).toMatch(validChars);
    });
  });
});
