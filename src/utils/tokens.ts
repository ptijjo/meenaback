import { sign } from "jsonwebtoken";
import { EXPIRES_IN, SECRET_KEY } from "../config";
import { DataStoredInToken, TokenData } from "../interfaces/auth.interface"
import { User } from "../interfaces/users.interface"


export const createToken =(user: User) : TokenData =>{
    
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = EXPIRES_IN as unknown as number;

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
}