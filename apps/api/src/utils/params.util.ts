/**
 * Parse a numeric route parameter into an integer.
 */
export function parseIdParam(param: string | string[] | undefined): number {
  const val = Array.isArray(param) ? param[0] : param;
  return parseInt(val || '0', 10);
}

