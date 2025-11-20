import { AuthMiddleware } from "../../../middlewares/auth.middleware";
import { Response, NextFunction } from "express";
import { RequestWithUser } from "../../../interfaces/auth.interface";
import * as jwt from "jsonwebtoken";
import { cacheService } from "../../../server";
import prisma from "../../../utils/prisma";
import { HttpException } from "../../../exceptions/httpException";

jest.mock("jsonwebtoken");
jest.mock("../../../server", () => ({
    cacheService: {
        get: jest.fn(),
        set: jest.fn(),
    },
}));
jest.mock("../../../utils/prisma", () => ({
    user: {
        findUnique: jest.fn(),
    },
}));    

describe("AuthMiddleware", () => {
    let mockReq: Partial<RequestWithUser>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock<void>;
    const mockUserId = "user-123";
    const mockToken = "valid-token";
    const mockUser = { id: mockUserId, email: "test@example.com", desactivateAccountDate: null };

    beforeEach(() => {
        mockReq = {
            header: jest.fn(),
            user: undefined,
        };
        mockRes = {};
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(AuthMiddleware).toBeDefined();
    });

    it("should return 401 when Authorization header is missing", async () => {
        (mockReq.header as jest.Mock).mockReturnValue(undefined);

        await AuthMiddleware(mockReq as RequestWithUser, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(HttpException));
        const error = mockNext.mock.calls[0][0];
        expect(error.status).toBe(401);
        expect(error.message).toBe("Authentication token missing");
    });

    it("should return 401 when token verification fails", async () => {
        (mockReq.header as jest.Mock).mockReturnValue(`Bearer ${mockToken}`);
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error("Invalid token");
        });

        await AuthMiddleware(mockReq as RequestWithUser, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(HttpException));
        const error = mockNext.mock.calls[0][0];
        expect(error.status).toBe(401);
        expect(error.message).toBe("Wrong authentication token");
    });

    it("should retrieve user from cache on cache hit", async () => {
        (mockReq.header as jest.Mock).mockReturnValue(`Bearer ${mockToken}`);
        (jwt.verify as jest.Mock).mockReturnValue({ id: mockUserId });
        (cacheService.get as jest.Mock).mockResolvedValue(mockUser);

        await AuthMiddleware(mockReq as RequestWithUser, mockRes as Response, mockNext);

        expect(cacheService.get).toHaveBeenCalledWith(`user:${mockUserId}`);
        expect(mockReq.user).toEqual(mockUser);
        expect(mockNext).toHaveBeenCalledWith();
    });

    it("should fetch from database and cache on cache miss", async () => {
        (mockReq.header as jest.Mock).mockReturnValue(`Bearer ${mockToken}`);
        (jwt.verify as jest.Mock).mockReturnValue({ id: mockUserId });
        (cacheService.get as jest.Mock).mockResolvedValue(null);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (cacheService.set as jest.Mock).mockResolvedValue(true);

        await AuthMiddleware(mockReq as RequestWithUser, mockRes as Response, mockNext);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { id: String(mockUserId), desactivateAccountDate: null },
        });
        expect(cacheService.set).toHaveBeenCalled();
        expect(mockReq.user).toEqual(mockUser);
        expect(mockNext).toHaveBeenCalledWith();
    });

    it("should return 401 when user is not found in database", async () => {
        (mockReq.header as jest.Mock).mockReturnValue(`Bearer ${mockToken}`);
        (jwt.verify as jest.Mock).mockReturnValue({ id: mockUserId });
        (cacheService.get as jest.Mock).mockResolvedValue(null);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        await AuthMiddleware(mockReq as RequestWithUser, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(HttpException));
        const error = mockNext.mock.calls[0][0];
        expect(error.status).toBe(401);
        expect(error.message).toBe("Wrong authentication token");
    });
}); 
