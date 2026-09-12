// Helper to get base path for API calls and client routes
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH !== undefined ? process.env.NEXT_PUBLIC_BASE_PATH : "";

const isRpaDb = process.env.NOTION_DATA_SOURCE_ID === "adeee8c4-8df2-82ec-8281-815b6c3ddb80" || (!process.env.NOTION_DATA_SOURCE_ID && !process.env.NEXT_PUBLIC_APP_NAME);

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || (isRpaDb ? "Todo RPAVault" : "Kumar ToDo");
export const APP_SUBTITLE = process.env.NEXT_PUBLIC_APP_SUBTITLE || (isRpaDb ? "Team Workspace" : "Personal Workspace");

export function apiPath(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${BASE_PATH}${cleanEndpoint}`;
}

