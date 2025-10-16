import multer from 'multer';


const MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Stockage en mémoire
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers images (JPEG, PNG, GIF, WebP) sont autorisés'), false);
  }
};

const Avatar = multer({ storage, fileFilter }).single('avatar');

export default Avatar;