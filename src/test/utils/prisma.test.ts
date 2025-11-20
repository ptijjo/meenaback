import prisma from "../../utils/prisma";
describe('Prisma Client', () => {
  it('should be defined', () => {
    expect(prisma).toBeDefined();
  });

  it('should have the expected methods', () => {
    expect(typeof prisma.user).toBe('object');
    expect(typeof prisma.userSecret).toBe('object');
  });
}); 