const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api";

let authToken: string | null = null;

export function setAuthToken(
  token: string | null
) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

type ApiErrorPayload = {
  detail?: string;
  message?: string;
};

function buildUrl(endpoint: string) {
  const normalizedBaseUrl =
    BASE_URL.endsWith("/")
      ? BASE_URL.slice(0, -1)
      : BASE_URL;

  const normalizedEndpoint =
    endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

  return `${normalizedBaseUrl}${normalizedEndpoint}`;
}

async function parseResponse<T>(
  response: Response
): Promise<T> {
  const raw = await response.text();

  let parsed: unknown = null;

  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  if (!response.ok) {
    if (
      parsed &&
      typeof parsed === "object"
    ) {
      const payload =
        parsed as ApiErrorPayload;

      throw new Error(
        payload.detail ??
          payload.message ??
          `Erro ${response.status}`
      );
    }

    if (
      typeof parsed === "string" &&
      parsed.trim()
    ) {
      throw new Error(parsed);
    }

    throw new Error(
      `Erro ${response.status}`
    );
  }

  return (
    parsed === null
      ? ({} as T)
      : (parsed as T)
  );
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(endpoint);

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",

      ...(authToken
        ? {
            Authorization:
              `Bearer ${authToken}`,
          }
        : {}),

      ...(options.headers ?? {}),
    },
  });

  return parseResponse<T>(response);
}

export const api = {
  get<T>(
    endpoint: string
  ): Promise<T> {
    return request<T>(endpoint, {
      method: "GET",
    });
  },

  post<T>(
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(
        body ?? {}
      ),
    });
  },

  put<T>(
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    return request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(
        body ?? {}
      ),
    });
  },

  patch<T>(
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    return request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(
        body ?? {}
      ),
    });
  },

  delete<T>(
    endpoint: string
  ): Promise<T> {
    return request<T>(endpoint, {
      method: "DELETE",
    });
  },
};