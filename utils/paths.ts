/**
 * Build a full URL for API/data access using Vite's BASE_URL
 */
export function buildUrl(path: string): string {
    const baseUrl = import.meta.env.BASE_URL;
    // Remove leading slash from path if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}${cleanPath}`;
}

