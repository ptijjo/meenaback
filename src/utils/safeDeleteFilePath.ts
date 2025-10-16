import fs from 'fs/promises';

async function safeDelete(filePath: string) {
    console.log('Attempting to delete file:', filePath);
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      console.log('File does not exist:', filePath);
    } else {
      throw err;
    }
  }
}

export default safeDelete;