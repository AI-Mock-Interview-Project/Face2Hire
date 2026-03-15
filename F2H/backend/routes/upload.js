import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// Import correctly for CommonJS modules
import * as pdfParseModule from 'pdf-parse';
import mammoth from 'mammoth';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'job-descriptions');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|docx|doc|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF, DOCX, DOC, and TXT files are allowed!'));
    }
};

// Configure multer upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024 // 10MB default
    },
    fileFilter: fileFilter
});

// Helper function to extract text from files
async function extractText(filePath, mimeType) {
  try {
    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      // pdfParse is a function that returns a promise
      const data = await pdfParseLib(dataBuffer);
      return data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (mimeType === 'text/plain') {
      return fs.readFileSync(filePath, 'utf8');
    } else if (mimeType === 'application/msword') {
      console.warn('DOC files are not fully supported yet. Please convert to DOCX or PDF.');
      return '';
    }
    return '';
  } catch (error) {
    console.error('Error extracting text:', error);
    return '';
  }
}

// Helper function to extract skills from text
function extractSkills(text) {
    const skillKeywords = [
        'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
        'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
        'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind',
        'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'linux',
        'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch', 'pandas', 'numpy',
        'devops', 'ci/cd', 'agile', 'scrum', 'kanban'
    ];

    const foundSkills = [];
    const lowerText = text.toLowerCase();

    skillKeywords.forEach(skill => {
        if (lowerText.includes(skill.toLowerCase())) {
            foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
    });

    // Remove duplicates and limit to 10 skills
    return [...new Set(foundSkills)].slice(0, 10);
}

// Helper function to extract requirements from text
function extractRequirements(text) {
    const lines = text.split('\n');
    const requirements = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        // Look for bullet points, numbered lists, or lines that look like requirements
        if ((trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed) ||
             trimmed.toLowerCase().includes('experience') || trimmed.toLowerCase().includes('knowledge') ||
             trimmed.toLowerCase().includes('ability') || trimmed.toLowerCase().includes('skill')) &&
            trimmed.length > 10 && trimmed.length < 200) {
            requirements.push(trimmed.replace(/^•\s*|^-\s*|\d+\.\s*/, ''));
        }
    });

    // Remove duplicates and limit to 10 requirements
    return [...new Set(requirements)].slice(0, 10);
}

// @route   POST /api/upload/job-description
// @desc    Upload job description file and extract information
// @access  Private
router.post('/job-description', protect, upload.single('jobDescription'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const filePath = req.file.path;
        const mimeType = req.file.mimetype;

        // Extract text from the file
        let extractedText = '';
        try {
            extractedText = await extractText(filePath, mimeType);
        } catch (error) {
            console.error('Text extraction failed:', error);
            // Continue without extracted text
        }

        // Extract skills and requirements
        const skills = extractSkills(extractedText);
        const requirements = extractRequirements(extractedText);

        // Clean up the uploaded file
        fs.unlinkSync(filePath);

        // Return response
        res.json({
            success: true,
            message: 'Job description processed successfully',
            data: {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                extractedText: extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : ''), // Limit text
                skills: skills,
                requirements: requirements
            }
        });

    } catch (error) {
        console.error(error);

        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Server error processing file'
        });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size allowed is ${process.env.MAX_FILE_SIZE / (1024 * 1024) || 10}MB`
            });
        }
    }

    res.status(400).json({
        success: false,
        message: error.message || 'File upload error'
    });
});

export default router;