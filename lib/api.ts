const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

async function formatErrorMessage(response: Response): Promise<string> {
  const status = response.status;
  try {
    // We clone the response because .json() and .text() can only be called once
    // But since we are in the error handler and won't use the response again,
    // we don't strictly need to clone unless we want to fallback to text().
    const data = await response.json();

    // Handle FastAPI/Pydantic validation errors (array of errors)
    if (data && Array.isArray(data.detail)) {
      return data.detail
        .map((err: any) => {
          const field = err.loc ? err.loc[err.loc.length - 1] : "";
          const msg = err.msg || "Invalid value";
          return field ? `${field}: ${msg}` : msg;
        })
        .join(", ");
    }

    // Handle simple FastAPI detail string or generic message
    const message = data?.detail || data?.message || data?.error;
    if (message && typeof message === "string") {
      return message;
    }

    // Fallback if we have JSON but no recognized message field
    return `API Error ${status}: ${JSON.stringify(data)}`;
  } catch {
    // If not JSON, fallback to raw text or status
    try {
      // Note: if response.json() failed, we might be able to get text()
      // but if the stream was already consumed, this might fail.
      const text = await response.text();
      return text || `API Error: ${status}`;
    } catch {
      return `API Error: ${status}`;
    }
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorMessage = await formatErrorMessage(response);
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
