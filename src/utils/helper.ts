/**
 * Utility functions that can be imported by workers
 */

export const someUtilFunction = (input: string): string => {
  // 1. Process the input
  const processed = `[PROCESSED] ${input.toUpperCase()}`;

  // 2. Add timestamp
  const timestamp = new Date().toISOString();

  // 3. Return formatted result
  return `${processed} - ${timestamp}`;
};

export const calculateHash = (data: string): string => {
  // Simple hash function for demo purposes
  let hash = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
};

export const formatMessage = (message: unknown): string => {
  // 1. Handle different input types
  if (typeof message === "string") {
    return message;
  }

  if (typeof message === "object" && message !== null) {
    return JSON.stringify(message, null, 2);
  }

  // 2. Convert other types to string
  return String(message);
};
