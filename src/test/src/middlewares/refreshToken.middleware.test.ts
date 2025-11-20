import { RefreshTokenMiddleware } from "../../../middlewares/refreshToken.middleware";

describe('RefreshTokenMiddleware', () => {
    let req: any;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
        req = {
            cookies: {}
        };
        res = {};
        next = jest.fn();
    });

    it('should call next with HttpException if refreshToken cookie is missing', () => {
        RefreshTokenMiddleware(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            status: 401,
            message: 'Refresh token cookie missing'
        }));
    });

    it('should set req.refreshToken and call next if refreshToken cookie is present', () => {
        const mockToken = 'mockRefreshToken';
        req.cookies['refreshToken'] = mockToken;

        RefreshTokenMiddleware(req, res, next);

        expect(req.refreshToken).toBe(mockToken);
        expect(next).toHaveBeenCalledWith();
    });
});
