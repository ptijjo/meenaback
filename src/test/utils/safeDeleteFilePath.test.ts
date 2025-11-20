import safeDeleteFilePath from '../../utils/safeDeleteFilePath';
import fs from 'fs';
import path from 'path';

describe('safeDeleteFilePath', () => {
  const testDir = path.join(__dirname, 'testDir');
  const testFile = path.join(testDir, 'testFile.txt');

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
    fs.writeFileSync(testFile, 'Test content');
  });

  afterAll(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });

  test('should delete the file if it exists', async () => {
    expect(fs.existsSync(testFile)).toBe(true);
    await safeDeleteFilePath(testFile);
    expect(fs.existsSync(testFile)).toBe(false);
  });

  test('should not throw an error if the file does not exist', async () => {
    await expect(safeDeleteFilePath(testFile)).resolves.toBeUndefined();
  });
});

                 