import apiClient from '../client';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
} from '@/types/user.types';
import { PaginatedResponse, QueryParams } from '@/types/index';

export const userService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/users', { params });
    const raw = response.data.data;
    // Backend returns { users, pagination } but other modules return { data, pagination }.
    // Normalize so the frontend can always use `data.data`.
    return {
      data: raw.users || raw.data || [],
      pagination: raw.pagination,
    } as PaginatedResponse<User>;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data;
  },

  create: async (data: CreateUserDto): Promise<User> => {
    // Backend registration endpoint is /users/signup
    const response = await apiClient.post('/users/signup', data);
    return response.data.data?.user || response.data.data;
  },

  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    // Backend uses PATCH for user updates, not PUT
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
