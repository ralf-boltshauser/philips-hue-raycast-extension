import { showToast, Toast } from "@raycast/api";

/**
 * Custom error class for Hue Bridge related errors
 */
export class HueBridgeError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "HueBridgeError";
  }
}

/**
 * Custom error class for connection related errors
 */
export class ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionError";
  }
}

/**
 * Custom error class for validation related errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Helper function to handle errors and show appropriate toast messages
 */
export function handleError(error: unknown, context: string): void {
  let title = "Error";
  let message = "An unexpected error occurred";
  const style = Toast.Style.Failure;

  if (error instanceof HueBridgeError) {
    title = "Bridge Error";
    message = error.message;
  } else if (error instanceof ConnectionError) {
    title = "Connection Error";
    message = error.message;
  } else if (error instanceof ValidationError) {
    title = "Validation Error";
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  console.error(`${context}:`, error);
  showToast({
    title,
    message: `${context}: ${message}`,
    style,
  });
}

/**
 * Helper function to validate bridge IP address
 */
export function validateBridgeIP(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) {
    throw new ValidationError("Invalid IP address format");
  }

  const parts = ip.split(".").map(Number);
  const isValid = parts.every((part) => part >= 0 && part <= 255);

  if (!isValid) {
    throw new ValidationError("IP address numbers must be between 0 and 255");
  }

  return true;
}

/**
 * Helper function to ensure bridge is configured
 */
export function ensureBridgeConfigured(bridgeIP?: string, username?: string): void {
  if (!bridgeIP || !username) {
    throw new HueBridgeError("Bridge not configured. Please connect to a Hue Bridge first.");
  }
}
