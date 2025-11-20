import { generateId } from "../../utils/generateId";
describe('generateId', () => {
  it('should generate an ID of the specified length', () => {
    const length = 10;
    const id = generateId(length);
    expect(id).toHaveLength(length);
  });

  it('should generate different IDs on subsequent calls', () => {
    const id1 = generateId(10);
    const id2 = generateId(10);
    expect(id1).not.toBe(id2);
  });

  it('should only contain valid characters', () => {
    const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const id = generateId(15);
    for (const char of id) {
      expect(validChars).toContain(char);
    }
  });
});