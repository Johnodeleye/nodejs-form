const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/rtf',
    'text/csv',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    'application/zip',
    'application/x-rar-compressed',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Only images, documents, and archives are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: fileFilter
});

// Helper function to determine resource type
const getResourceType = (mimeType) => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType === 'application/pdf') {
    return 'raw'; // PDFs should be 'raw' or 'auto'
  } else if (mimeType.includes('word') || 
             mimeType.includes('excel') || 
             mimeType.includes('powerpoint') || 
             mimeType.includes('oasis') || 
             mimeType === 'text/plain' || 
             mimeType === 'application/rtf' || 
             mimeType === 'text/csv' ||
             mimeType === 'application/zip' ||
             mimeType === 'application/x-rar-compressed') {
    return 'raw';
  }
  return 'auto';
};

// Helper function to determine folder based on file type
const getFolder = (mimeType) => {
  if (mimeType.startsWith('image/')) {
    return 'hubpost/contact_form/images';
  } else if (mimeType === 'application/pdf') {
    return 'hubpost/contact_form/documents/pdf';
  } else if (mimeType.includes('word')) {
    return 'hubpost/contact_form/documents/word';
  } else if (mimeType.includes('excel') || mimeType === 'text/csv') {
    return 'hubpost/contact_form/documents/excel';
  } else if (mimeType.includes('powerpoint')) {
    return 'hubpost/contact_form/documents/powerpoint';
  } else if (mimeType.includes('oasis')) {
    return 'hubpost/contact_form/documents/opendocument';
  } else if (mimeType === 'application/zip' || mimeType === 'application/x-rar-compressed') {
    return 'hubpost/contact_form/archives';
  } else {
    return 'hubpost/contact_form/other';
  }
};

// Single file upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file provided or file type not allowed' 
      });
    }

    const resourceType = getResourceType(req.file.mimetype);
    const folder = getFolder(req.file.mimetype);
    
    // For raw files (PDFs, documents), we need to handle them differently
    const uploadOptions = {
      resource_type: resourceType,
      folder: folder,
      public_id: `contact_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timeout: 60000,
      // For raw files, add flags to ensure proper serving
      ...(resourceType === 'raw' && {
        access_mode: 'public',
        type: 'upload',
        sign_url: false
      })
    };

    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format || req.file.mimetype.split('/').pop(),
      resource_type: result.resource_type,
      size: result.bytes,
      created_at: result.created_at,
      original_name: req.file.originalname
    });

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'File upload failed. Please try again.' 
    });
  }
});

// Multiple file upload
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No files provided' 
      });
    }

    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const resourceType = getResourceType(file.mimetype);
        const folder = getFolder(file.mimetype);
        
        const uploadOptions = {
          resource_type: resourceType,
          folder: folder,
          public_id: `contact_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          ...(resourceType === 'raw' && {
            access_mode: 'public',
            type: 'upload',
            sign_url: false
          })
        };

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format || file.mimetype.split('/').pop(),
                resource_type: result.resource_type,
                size: result.bytes,
                originalname: file.originalname,
                mimetype: file.mimetype
              });
            }
          }
        );

        uploadStream.end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      files: results,
      count: results.length
    });

  } catch (error) {
    console.error('Cloudinary multiple upload error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'File upload failed. Please try again.' 
    });
  }
});

// Get file info endpoint (optional - for debugging)
router.get('/file-info/:public_id', async (req, res) => {
  try {
    const { public_id } = req.params;
    
    const result = await cloudinary.api.resource(public_id, {
      resource_type: 'auto'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get file info'
    });
  }
});

module.exports = router;