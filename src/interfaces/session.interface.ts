export interface Session{
    id: string;
    userId: string;
    refreshToken: string;
    userAgent: string;
    ipAdress: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
    isRevoked: boolean;
}