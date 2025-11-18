const app_name = 'ntw234.xyz'

export function buildPath(route) {
    if (process.env.NODE_ENV !== 'development') {
        const apiBase = import.meta.env.VITE_API_BASE_URL;
        
        if (apiBase) {
            // Use custom API base URL from environment variable
            return `${apiBase}/${route}`;
        } else {
            // Default: Use relative path (recommended for same-domain setup)
            // This works when API is proxied through nginx on the same domain
            // If API is on different port/domain, set VITE_API_BASE_URL env var
            return `/${route}`;
        }
    } else {
        // Development: Use localhost
        return `http://localhost:5000/${route}`;
    }
}