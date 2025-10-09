export interface Session{
    id: string;
    userId: string;
    jti: string;
    userAgent: string;
    ipAddress: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
    isRevoked: boolean;
}