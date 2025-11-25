
type ValidationResult = {
  valid: boolean;
  reason?: string;
};

export function validateExpiry(expiresAtStr: string): ValidationResult {
  const expiresAt = new Date(expiresAtStr);
  const now = new Date();

  const diffMs = expiresAt.getTime() - now.getTime();

  const diffMinutes = diffMs / (1000 * 60);
  const diffHours   = diffMs / (1000 * 60 * 60);

  // Rule 1: expires_at - now > 24 hours → reject
  if (diffHours > 24) {
    return { valid: false, reason: "Expiry is more than 24 hours ahead" };
  }

  // Rule 2: expires_at < now → reject
  if (expiresAt < now) {
    return { valid: false, reason: "Expiry is already in the past" };
  }

  // Rule 3: expires_at - now < 5 minutes → reject
  if (diffMinutes < 5) {
    return { valid: false, reason: "Expiry is too soon (< 5 minutes)" };
  }

  // Otherwise valid
  return { valid: true };
}