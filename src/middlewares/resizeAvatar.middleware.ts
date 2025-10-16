import { Response, NextFunction } from 'express';
import { join } from 'path';
import sharp from 'sharp';
import fs from 'fs/promises';
import { RequestWithUser } from '../interfaces/auth.interface';


const avatarFolder = join(__dirname, '..', '..', 'public', 'avatar');

const resizeAvatar = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  if (!req.file) return next();

  try {
    // Crée le dossier s'il n'existe pas
    await fs.mkdir(avatarFolder, { recursive: true });

    const outputFileName = `avatar_${Date.now()}.webp`;
    const outputPath = join(avatarFolder, outputFileName);

    // Sharp : redimensionner à 300x300, conversion en webp qualité 80
    await sharp(req.file.buffer).resize(300, 300, { fit: 'cover' }).webp({ quality: 80 }).toFile(outputPath);

    req.file.filename = outputFileName;
    req.file.path = outputPath;
    req.file.mimetype = 'image/webp';

    next();
  } catch (error) {
    next(error);
  }
};

export default resizeAvatar;