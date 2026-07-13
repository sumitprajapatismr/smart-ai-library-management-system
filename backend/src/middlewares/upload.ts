import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import { AppError } from './error';

// Multer memory storage (keeps file in memory buffer)
const storage = multer.memoryStorage();

// File filter for images, PDFs and audios
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const mime = file.mimetype;
  if (mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image, PDF, and audio files are allowed!', 400) as any, false);
  }
};

// Limit file size to 15MB
export const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter,
});

// Helper to stream upload file buffer to Cloudinary
export const uploadToCloudinary = (
  fileBuffer: Buffer, 
  folder: string = 'library_covers',
  resourceType: 'image' | 'raw' | 'video' = 'image'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If Cloudinary keys are missing, fallback to standard mock URLs
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      console.warn('Cloudinary not configured. Returning default mock URLs.');
      if (resourceType === 'image') {
        resolve('https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400');
      } else if (folder === 'ebooks') {
        resolve('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'); // Mock PDF url
      } else {
        resolve('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); // Mock Audiobook audio url
      }
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(new AppError(`Cloudinary Upload Error: ${error.message}`, 500));
        } else {
          resolve(result?.secure_url || '');
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};
