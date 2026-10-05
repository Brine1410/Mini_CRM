/**
 * Thin wrapper around the Java servlet backend.
 *
 * Every call hits the REST API exposed by the embedded Jetty server
 * (see backend/src/main/java/com/minicrm/web/ApiServlet.java). In development
 * the Vite dev server proxies /api -> http://localhost:8080, so no absolute
 * URLs are needed. Override the base with VITE_API_BASE if the API lives
 * somewhere else.
 */

const BASE = import.meta.env.VITE_API_BASE || '/api'

class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 204) return null

  let payload = null
  try {
    payload = await response.json()
  } catch {
    throw new ApiError(response.status, `The server returned an unreadable response (${response.status})`)
  }

  if (!response.ok) {
    throw new ApiError(response.status, payload?.error || `Request failed (${response.status})`)
  }
  return payload
}

export const api = {
  health: () => request('/health'),
  list: (table) => request(`/${table}`),
  get: (table, id) => request(`/${table}/${id}`),
  create: (table, values) => request(`/${table}`, { method: 'POST', body: values }),
  update: (table, id, values) => request(`/${table}/${id}`, { method: 'PUT', body: values }),
  remove: (table, id) => request(`/${table}/${id}`, { method: 'DELETE' }),
  convertLead: (id) => request(`/leads/${id}/convert`, { method: 'POST' }),
}

export { ApiError }
