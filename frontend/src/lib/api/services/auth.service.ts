import apiClient from '../client';
import { 
  LoginCredentials, 
  SignupCredentials, 
  AuthResponse, 
  RefreshTokenResponse 
} from '@/types/auth.types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/users/login', credentials);
    return response.data.data;
  },

  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/users/signup', credentials);
    return response.data.data;
  },

  refreshToken: async (token: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post('/users/refresh-token', { refreshToken: token });
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    // Optional: Call backend to invalidate token
    // await apiClient.post('/users/logout');
  },
};
