export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'warehouse_manager' | 'procurement_officer' | 'supplier';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password?: string;
  role: User['role'];
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: User['role'];
  isActive?: boolean;
}
