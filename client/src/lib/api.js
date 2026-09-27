const configuredUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (configuredUrl || 'http://localhost:5000').replace(/\/$/, '');

export function apiUrl(path) {
    return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
