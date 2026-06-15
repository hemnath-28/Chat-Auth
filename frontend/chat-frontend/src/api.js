import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true // Crucial to allow sharing of cookies (refreshToken)
});

// Request Interceptor: Attach Access Token from LocalStorage
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Catch 401/403 errors and silently refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If response is unauthorized (401) or forbidden (403) and we haven't retried yet
        if (
            error.response &&
            (error.response.status === 401 || error.response.status === 403) &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                console.warn(`[API Interceptor] Token expired/invalid for request: ${originalRequest.method.toUpperCase()} ${originalRequest.url}`);
                console.log("[API Interceptor] Attempting silent token refresh via /auth/refresh...");
                
                const response = await axios.post(
                    'http://localhost:3000/auth/refresh',
                    {},
                    { withCredentials: true }
                );

                const newToken = response.data.token;
                console.log("[API Interceptor] Token refreshed successfully! New Access Token:", newToken);
                localStorage.setItem('token', newToken);

                // Update the Authorization header and retry the original request
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                console.log(`[API Interceptor] Retrying original request: ${originalRequest.method.toUpperCase()} ${originalRequest.url}`);
                return api(originalRequest);
            } catch (refreshError) {
                console.error("[API Interceptor] Silent token refresh failed (Refresh token is expired/invalid). Logging out...", refreshError);
                localStorage.removeItem('token');
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
