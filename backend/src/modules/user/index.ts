/**
 * User module exports
 */
export { default as UserModel } from './model';
export { default as UserService } from './service';
export { default as UserController } from './controller';
export { default as userRoutes } from './routes';
export * from './validation';
export type { IUser, UserRole, INotificationPreferences } from './model';
