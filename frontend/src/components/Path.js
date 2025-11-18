const app_name = 'ntw234.xyz'

export function buildPath(route) {
    if (process.env.NODE_ENV !== 'development') {
        const apiBase = import.meta.env.VITE_API_BASE_URL;
        
        if (apiBase) {
            // Use custom API base URL from environment variable
            return `${apiBase}/${route}`;
        } else {
            // Default: Use same domain with HTTPS (assuming API is proxied through nginx)
            // If your API is on port 5000, you may need: `https://${app_name}:5000`
            // But typically with nginx, API is proxied to same domain
            return `https://${app_name}/${route}`;
        }
    } else {
        // Development: Use localhost
        return `http://localhost:5000/${route}`;
    }
}