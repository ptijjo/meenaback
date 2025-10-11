import { Request } from 'express';
import { User } from './users.interface';


export interface DataStoredInToken {
  id: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: User;
  jti: string;
  logIn: any;
  isAuthenticated?: any;
}
