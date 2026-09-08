/**
 * PadhaiShuru — Standardized API response shape.
 *
 * Per PRD Section 8.1:
 *   Success: { success: true, data, error: null }
 *   Failure: { success: false, data: null, error: { code, message, details? } }
 */

// ---------- Types ----------

export interface ApiSuccess<T> {
  success: true
  data: T
  error: null
  meta?: Record<string, unknown>
}

export interface ApiErrorPayload {
  code: string
  message: string
  details?: unknown
}

export interface ApiError {
  success: false
  data: null
  error: ApiErrorPayload
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ---------- Helpers ----------

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return { success: true, data, error: null, ...(meta ? { meta } : {}) }
}

export function fail(code: string, message: string, details?: unknown): ApiError {
  return { success: false, data: null, error: { code, message, details } }
}

// ---------- Response builders ----------

export function unauthorized(message = 'Unauthorized') {
  return Response.json(fail('UNAUTHORIZED', message), { status: 401 })
}

export function forbidden(message = 'Insufficient permissions') {
  return Response.json(fail('FORBIDDEN', message), { status: 403 })
}

export function notFound(message = 'Resource not found') {
  return Response.json(fail('NOT_FOUND', message), { status: 404 })
}

export function badRequest(message: string, details?: unknown) {
  return Response.json(fail('BAD_REQUEST', message, details), { status: 400 })
}

export function rateLimited(retryAfterSeconds: number) {
  return Response.json(
    fail('RATE_LIMITED', 'Too many requests. Please try again shortly.'),
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  )
}

export function serverError(message = 'Internal server error', requestId?: string) {
  const body: ApiError = {
    success: false,
    data: null,
    error: { code: 'INTERNAL_ERROR', message, ...(requestId ? { details: { requestId } } : {}) },
  }
  return Response.json(body, { status: 500 })
}

export function paymentRequired(message = 'Premium subscription required') {
  return Response.json(fail('PREMIUM_REQUIRED', message), { status: 402 })
}

export function conflict(message: string, details?: unknown) {
  return Response.json(fail('CONFLICT', message, details), { status: 409 })
}
