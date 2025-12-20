/**
 * Get the base path for the application, ensuring correct path resolution
 * regardless of trailing slash in the URL
 */
export function getBasePath(): string {
    let path = window.location.pathname;

    // Remove index.html if present
    if (path.endsWith('index.html')) {
        path = path.replace(/index\.html$/, '');
    }

    // Ensure trailing slash
    if (!path.endsWith('/')) {
        path += '/';
    }

    return path;
}

/**
 * Build a full URL for API/data access
 * Uses the current application path (e.g., /giragelato/, /stellamarina/, etc.)
 */
export function buildUrl(relativePath: string): string {
    const base = getBasePath();
    // Remove leading ./ or / from relative path if present
    const cleanPath = relativePath.replace(/^\.?\//, '');
    return base + cleanPath;
}

