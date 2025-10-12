import { TokenData } from '../interfaces/auth.interface';

// export const createCookie = (tokenData: TokenData): string => {
//   return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};SameSite=Lax`;
// };

// Assurez-vous d'avoir ceci pour la PROD (HTTPS OBLIGATOIRE)
const isProduction = process.env.NODE_ENV === 'production';

export const createCookie = (refreshTokenData: TokenData): string => {
    let cookieString = 
        `refreshToken=${refreshTokenData.token}; HttpOnly; Max-Age=${refreshTokenData.expiresIn}; Path=/`;

    if (isProduction) {
        // Ces attributs sont OBLIGATOIRES pour les cookies Cross-Site en HTTPS
        cookieString += '; Secure; SameSite=Lax'; 
    } else {
        // Gardez 'SameSite=Lax' ou ne mettez rien en dev HTTP
        cookieString += '; SameSite=Lax'; 
    }
    
    return cookieString;
};
