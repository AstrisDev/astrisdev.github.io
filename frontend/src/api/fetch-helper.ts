export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static wrap(err: unknown): ApiError {
    if (err instanceof ApiError) {
      return err;
    }
    return new ApiError(err instanceof Error ? err.message : String(err));
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchJsonFromSources(urls: string[]): Promise<{ url: string; content: any }> {
  let lastErr: unknown;
  for (const url of urls) {
    try {
      const content = await fetchJsonFromUrl(url);
      return {
        url: url,
        content: content,
      };
    } catch (err) {
      console.log(`Failed to fetch json from ${url}`, err);
      lastErr = err;
    }
  }
  throw lastErr;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchJsonFromUrl(url: string): Promise<any> {
  console.log(`Loading: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(`Error fetching ${url}\nResponse status: ${response.status} ${response.statusText}`);
  }
  const body = await response.json();
  return body;
}
