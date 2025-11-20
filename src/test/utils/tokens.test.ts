import { createAccessToken } from "../../utils/tokens";
import { createRefreshToken } from "../../utils/tokens";
import { createCookie } from "../../utils/tokens";
import { User } from "../../interfaces/users.interface";

describe("Token Utilities", () => {
  const mockUser: User = {
      id: "1",
      email: "user@example.com",
      password: "password123",
      name: "Test User",
      role: "user",
      status: "onLine",
      avatar: "",
      is2FaEnable: false,
      twoFaVerified: false,
      failedLoginAttempts: 0,
      isVerified: false,
      createdAt: undefined,
      updatedAt: undefined
  };

  describe("createAccessToken", () => {
    it("should create a valid access token", () => {
      const tokenData = createAccessToken(mockUser);
      expect(tokenData).toHaveProperty("token");
      expect(tokenData).toHaveProperty("expiresIn");
      expect(typeof tokenData.token).toBe("string");
      expect(typeof tokenData.expiresIn).toBe("number");
    });
  });

  describe("createRefreshToken", () => {
    it("should create a valid refresh token with jti", () => {
      const refreshTokenData = createRefreshToken(mockUser);
      expect(refreshTokenData).toHaveProperty("token");
      expect(refreshTokenData).toHaveProperty("expiresIn");
      expect(refreshTokenData).toHaveProperty("jti");
      expect(typeof refreshTokenData.token).toBe("string");
      expect(typeof refreshTokenData.expiresIn).toBe("number");
      expect(typeof refreshTokenData.jti).toBe("string");
    });
  });

  describe("createCookie", () => {
    it("should create a valid cookie string for the refresh token", () => {
      const refreshTokenData = createRefreshToken(mockUser);
      const cookie = createCookie(refreshTokenData);
      expect(cookie).toContain(`refreshToken=${refreshTokenData.token}`);
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).toContain(`Max-Age=${refreshTokenData.expiresIn}`);
    });
  });
}); 