import { useState, useEffect } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { BiometricResult, BiometricOptions, BiometricType } from "../types";
import { BiometricError } from "../errors";

/**
 * useBiometric hook - provides biometric authentication methods
 */
export function useBiometric() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [supportedTypes, setSupportedTypes] = useState<BiometricType[]>([]);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  /**
   * Check if biometric authentication is available
   */
  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsAvailable(compatible);

      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsEnrolled(enrolled);

        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        const supportedBiometricTypes: BiometricType[] = [];

        if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          supportedBiometricTypes.push("fingerprint");
        }
        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          )
        ) {
          supportedBiometricTypes.push("facial_recognition");
        }
        if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          supportedBiometricTypes.push("iris");
        }

        setSupportedTypes(supportedBiometricTypes);
      }
    } catch (error) {
      console.error("Error checking biometric availability:", error);
      setIsAvailable(false);
      setIsEnrolled(false);
    }
  };

  /**
   * Authenticate with biometrics
   */
  const authenticate = async (
    options?: BiometricOptions,
  ): Promise<BiometricResult> => {
    try {
      if (!isAvailable) {
        throw new BiometricError(
          "Biometric authentication is not available on this device",
        );
      }

      if (!isEnrolled) {
        throw new BiometricError(
          "No biometric credentials enrolled on this device",
        );
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage || "Authenticate to continue",
        cancelLabel: options?.cancelLabel || "Cancel",
        fallbackLabel: options?.fallbackLabel || "Use Passcode",
        disableDeviceFallback: options?.disableDeviceFallback || false,
      });

      if (result.success) {
        return {
          success: true,
          biometricType: supportedTypes[0],
        };
      } else {
        return {
          success: false,
          error: result.error || "Authentication failed",
        };
      }
    } catch (error) {
      if (error instanceof BiometricError) {
        throw error;
      }
      throw new BiometricError(
        "Biometric authentication failed",
        error instanceof Error ? error.message : "Unknown error",
        error,
      );
    }
  };

  return {
    /** Whether biometric authentication is available */
    isAvailable,
    /** Whether biometric credentials are enrolled */
    isEnrolled,
    /** Supported biometric types */
    supportedTypes,
    /** Authenticate with biometrics */
    authenticate,
    /** Re-check biometric availability */
    refresh: checkBiometricAvailability,
  };
}
