const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
}

type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

type ApiFailure = {
  success: false;
  error: string;
  message?: string;
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  let json: ApiResponse<T> | null = null;

  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      'Failed to parse API response',
      response.status
    );
  }

  if (!response.ok || !json.success) {
    const message =
      json && 'message' in json && json.message
        ? json.message
        : 'Request failed';

    const code =
      json && 'error' in json ? json.error : 'UNKNOWN_ERROR';

    throw new ApiClientError(message, response.status, code);
  }

  return json.data;
}