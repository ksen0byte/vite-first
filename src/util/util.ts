export function capitalize(str: string) {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

export function logWithTime(message: string): void {
  const now = new Date();
  const timestamp = now.toISOString(); // Format as ISO timestamp (e.g., "2025-01-11T14:32:00.000Z")
  console.log(`[${timestamp}] ${message}`);
}
