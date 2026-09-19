const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

let authenticationFailureHandler = null;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function onAuthenticationFailure(handler) {
  authenticationFailureHandler = handler;
}

export async function apiRequest(path, {
  method = 'GET',
  body,
  token,
  signal,
  ignoreAuthenticationFailure = false,
  includeResponse = false
} = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['X-Authorization'] = token;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Unable to reach the auction service. Make sure the Express API is running.', 0);
  }

  const contentType = response.headers.get('content-type') || '';
  let payload = null;
  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      if (response.ok) throw new ApiError('The auction service returned an unreadable response.', response.status);
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token && !ignoreAuthenticationFailure) {
      authenticationFailureHandler?.();
      throw new ApiError('Your session has expired. Sign in again to continue.', 401);
    }
    throw new ApiError(payload?.error_message || `Request failed (${response.status})`, response.status);
  }
  return includeResponse ? { data: payload, response } : payload;
}

export { API_URL };
