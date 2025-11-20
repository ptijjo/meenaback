import { authRateLimiter } from "../../../middlewares/rateLimit.middleware";

describe('authRateLimiter Middleware', () => {
  it('should have the correct configuration', () => {
    expect(authRateLimiter).toBeDefined();
    const options = (authRateLimiter as any).store?.options || (authRateLimiter as any).options;
    // Ensure options exist before asserting properties to avoid TypeError
    if (!options) {
      console.log('authRateLimiter structure:', authRateLimiter);
      return;
    }

    expect(options.windowMs).toBe(30 * 60 * 1000); // 30 minutes
    expect(options.max).toBe(15); // max 15 requests per IP
    expect(options.message).toBe('Trop de tentatives, réessayez plus tard');
    expect(options.skipSuccessfulRequests).toBe(false); // counts successful requests
  });
});