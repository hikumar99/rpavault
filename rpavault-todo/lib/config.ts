// Helper to get base path for API calls and client routes
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH !== undefined ? process.env.NEXT_PUBLIC_BASE_PATH : "";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Kumar ToDo";
export const APP_SUBTITLE = process.env.NEXT_PUBLIC_APP_SUBTITLE || "Personal Workspace";

export function apiPath(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${BASE_PATH}${cleanEndpoint}`;
}

