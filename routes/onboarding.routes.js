const express = require('express');
const router = express.Router();
const multer = require('multer');
const onboardingController = require('../controllers/onboarding.controller');

// Setup multer for memory storage (files up to MAX_FILE_SIZE_MB)
const maxFileSize = (process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024;
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => {
    // Allowed extensions: .pdf, .doc, .docx, .jpg, .jpeg, .png
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, and PNG are allowed.'), false);
    }
  }
});

// Middleware for JWT auth (Mock implementation, assuming it exists elsewhere)
const jwtAuthMiddleware = (req, res, next) => {
  // Add your JWT verification logic here
  // For example: jsonwebtoken.verify(req.headers.authorization...)
  next();
};

// Define fields for file upload
const uploadFields = upload.fields([
  { name: 'aadharPanFile', maxCount: 1 },
  { name: 'payslipsFile', maxCount: 1 },
  { name: 'educationalCertificatesFile', maxCount: 1 },
  { name: 'previousOfferLetterFile', maxCount: 1 },
  { name: 'relievingExperienceLettersFile', maxCount: 1 },
  { name: 'appraisalHikeLettersFile', maxCount: 1 }
]);

// Routes
// 1. Generate Onboarding Link (Requires HR JWT auth)
router.post('/generate-link', jwtAuthMiddleware, onboardingController.generateLink);

// 2. Validate Link (Public)
router.get('/validate/:token', onboardingController.validateLink);

// 3. Submit Onboarding (Public)
// Add error handling for multer
router.post('/submit/:token', (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `File upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, onboardingController.submitOnboarding);

module.exports = router;
