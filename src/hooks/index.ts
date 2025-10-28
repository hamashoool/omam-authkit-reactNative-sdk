// High-level hooks (original API - backward compatible)
export { useAuth } from "./useAuth";
export { useUser } from "./useUser";
export { useBiometric } from "./useBiometric";
export { useNetwork } from "./useNetwork";

// Headless/Custom UI hooks (new API for full customization)
export { useAuthActions } from "./useAuthActions";
export { useAuthState } from "./useAuthState";
export { useTokenManager } from "./useTokenManager";
export { useAuthClient } from "./useAuthClient";
