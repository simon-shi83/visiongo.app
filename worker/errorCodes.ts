// Error answers of the API carry a code of SDK/schemas/errors.json (errors 1)
// and its message, beside the `error` field they always had; identity
// endpoints keep their OAuth `error` and `error_description` too.
const CODE_OF_STATUS: Record<number, string> = {
  400: 'INVALID_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'INVALID_REQUEST',
  409: 'CONFLICT',
  422: 'INVALID_REQUEST',
  500: 'INTERNAL_ERROR',
  502: 'UPSTREAM_FAILED',
  503: 'UNAVAILABLE',
  504: 'TIMEOUT',
};

/** Adds {code, message} to a JSON error answer that names no code yet. */
export async function withErrorCode(response: Response): Promise<Response> {
  const code = CODE_OF_STATUS[response.status];
  if (!code || !response.headers.get('Content-Type')?.includes('application/json')) return response;
  const body = await response.clone().json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body) || 'code' in body) return response;
  const message = typeof body.message === 'string' ? body.message
    : typeof body.error_description === 'string' ? body.error_description
    : typeof body.error === 'string' ? body.error : code;
  const headers = new Headers(response.headers);
  headers.delete('Content-Length');
  return new Response(JSON.stringify({ ...body, code, message }), { status: response.status, statusText: response.statusText, headers });
}
