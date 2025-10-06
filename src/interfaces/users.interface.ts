import { Method2Fa, Role, UserStatus } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  password?: string;
  secretName: string;
  phone?: string;
  phoneVerified?: boolean;
  googleId?: string;
  role: Role;
  status: UserStatus;
  avatar: string;
  is2FaEnable: boolean;
  twoFaMethod?: Method2Fa;
  twoFaVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  isVerified: boolean;
  verificationToken?: string;
  verificationExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
