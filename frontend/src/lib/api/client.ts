import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner'; 

// Note: Using sonner for toasts as it's often preferred, or update to use-toast if required.
// The package.json has "sonner", so I'll use that or the shadcn use-toast.
// Let's stick to the plan which mentions use-toast, but I see sonner in package.json too.
// I'll check if use-toast is just a wrapper or if I should use it directly.
// The file list showed use-toast.ts. Let's use that for consistency with shadcn.

// Actually, I'll import from the file I saw.
// import { toast } from "@/components/ui/use-toast" 
// But "sonner" is also there. Let's use the standard shadcn toast for now.

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/users/refresh-token`,
          { refreshToken }
        );
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Update tokens
        useAuthStore.getState().setTokens(accessToken, newRefreshToken);
        
        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    // We can't use hooks (useToast) here because this is not a React component
    // But we can import the toast function if it's exported purely
    // shadcn's use-toast exports a `toast` function that might work if Toaster is mounted
    // However, safest is to let the caller handle UI feedback or use a library that supports outside components
    // For now, I'll just reject. The caller (React Query mutation) will handle the toast.
    
    return Promise.reject(error);
  }
);

export default apiClient;
