export interface RefreshToken{
    id: string;
    userId: string;
    tokenHash: string;
    crreatedAt: Date;
    expiresAt: Date;
    isRRevoked: boolean;
    userAgent: string;
    ipAdress: string;
}