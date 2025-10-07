import { sign } from "jsonwebtoken";
import { ACCESS_SECRET_KEY, ACCESS_TOKEN_EXPIRES_IN, EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, REFRESH_TOKEN_SECRET, SECRET_KEY } from "../config";
import { DataStoredInToken, TokenData } from "../interfaces/auth.interface";
import { User } from "../interfaces/users.interface";
import { v4 as uuidv4 } from "uuid";


interface RefreshTokenData {
  jti: string;
  token: string;
  expiresIn: number;
}



export const createAccessToken =(user: User) : TokenData =>{
    
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = ACCESS_SECRET_KEY;
    const expiresIn: number = ACCESS_TOKEN_EXPIRES_IN as unknown as number;

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
}

export const createRefreshToken = (user: User): RefreshTokenData => {
    const jti = uuidv4();
    const payload = { id: user.id, jti };
    const secret = REFRESH_TOKEN_SECRET;  
    const expiresIn = Number(REFRESH_TOKEN_EXPIRES_IN);
      return {
    jti,
    expiresIn,
    token: sign(payload, secret, { expiresIn }),
  };
}