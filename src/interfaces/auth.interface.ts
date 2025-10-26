import { Request } from 'express';
import { User } from './users.interface';
import { UserSecret } from './userSecret.interface';


export interface DataStoredInToken {
  id: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: User;
  userSecret?: UserSecret;
  jti: string;
  logIn: any;
  isAuthenticated?: any;
  refreshToken: string;
  file:any
}
