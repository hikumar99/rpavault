// Helper to get base path for API calls and client routes
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH !== undefined ? process.env.NEXT_PUBLIC_BASE_PATH : "";

export function apiPath(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${BASE_PATH}${cleanEndpoint}`;
}
