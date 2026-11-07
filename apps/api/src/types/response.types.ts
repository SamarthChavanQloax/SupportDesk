export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: ApiErrorPayload | null;
  meta: Record<string, unknown>;
}
