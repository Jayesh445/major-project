import { useMutation } from '@tanstack/react-query';
import { authService } from '@/lib/api/services/auth.service';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { LoginCredentials, SignupCredentials } from '@/types/auth.types';

export const useLogin = () => {
  const { setUser, setTokens } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens(data.accessToken, data.refreshToken);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      
      // Redirect based on role
      switch (data.user.role) {
        case 'admin':
          router.push('/dashboard/admin');
          break;
        case 'warehouse_manager':
          router.push('/dashboard/warehouse');
          break;
        case 'procurement_officer':
          router.push('/dashboard/procurement');
          break;
        case 'supplier':
          router.push('/dashboard/supplier');
          break;
        default:
          router.push('/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.response?.data?.message || 'Invalid credentials',
        variant: 'destructive',
      });
    },
  });
};

export const useSignup = () => {
  const { setUser, setTokens } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: SignupCredentials) => authService.signup(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens(data.accessToken, data.refreshToken);
      toast({
        title: 'Account created!',
        description: 'Welcome to StationeryChain.',
      });
      
      // Redirect based on role (same logic)
      switch (data.user.role) {
        case 'admin':
          router.push('/dashboard/admin');
          break;
        case 'warehouse_manager':
          router.push('/dashboard/warehouse');
          break;
        case 'procurement_officer':
          router.push('/dashboard/procurement');
          break;
        case 'supplier':
          router.push('/dashboard/supplier');
          break;
        default:
          router.push('/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Signup failed',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
};

export const useLogout = () => {
  const { logout: storeLogout } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  return () => {
    storeLogout();
    authService.logout(); // Fire and forget
    router.push('/login');
    toast({
      title: 'Logged out',
      description: 'See you next time!',
    });
  };
};
