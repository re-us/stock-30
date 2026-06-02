export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000,
): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    return (await response.text()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
