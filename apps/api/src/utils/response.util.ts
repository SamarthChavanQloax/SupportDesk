import { ApiResponse, ApiErrorPayload } from '../types/response.types';

export function successResponse<T>(
  data: T,
  meta: Record<string, unknown> = {}
): ApiResponse<T> {
  return {
    data,
    error: null,
    meta,
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: unknown,
  meta: Record<string, unknown> = {}
): ApiResponse<null> {
  const errorPayload: ApiErrorPayload = {
    code,
    message,
  };

  if (details !== undefined) {
    errorPayload.details = details;
  }

  return {
    data: null,
    error: errorPayload,
    meta,
  };
}
