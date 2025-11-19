import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { calculateTransparencyScore } from '../services/scoring';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(pdf|doc|docx|txt|md)$/i;
    const extname = allowedExtensions.test(path.extname(file.originalname));
    
    // Check MIME types - DOC files can have various MIME types
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'text/plain', // .txt
      'text/markdown', // .md
      'text/x-markdown', // .md (alternative)
      'application/octet-stream', // Sometimes DOC files come as this
    ];
    
    const mimetype = allowedMimeTypes.includes(file.mimetype) || !file.mimetype;
    
    // Accept if extension matches (more lenient - extension is what matters)
    if (extname) {
      return cb(null, true);
    }
    
    cb(new Error(`Invalid file type. Only PDF, DOC, DOCX, TXT, and MD files are allowed. Got: ${file.mimetype || 'unknown'} (${path.extname(file.originalname)})`));
  },
});

// Get all documents for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      'SELECT * FROM documents WHERE project_id = $1 ORDER BY uploaded_at DESC',
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Multer error handling middleware
const handleMulterError = (err: Error | multer.MulterError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  next();
};

// Upload document (only owner can upload)
router.post('/upload', upload.single('file'), handleMulterError, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { project_id, doc_type, owner_wallet } = req.body;

    if (!project_id || !doc_type) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Missing project_id or doc_type' });
    }

    // Verify project exists and check ownership
    const projectCheck = await pool.query(
      'SELECT * FROM projects WHERE project_id = $1',
      [project_id]
    );

    if (projectCheck.rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify ownership if owner_wallet is provided
    if (owner_wallet && owner_wallet !== projectCheck.rows[0].owner_wallet) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Only project owner can upload documents' });
    }

    // Generate hash (simplified - use crypto in production)
    const crypto = require('crypto');
    
    // Read file and generate hash
    let fileBuffer: Buffer;
    try {
      fileBuffer = fs.readFileSync(req.file.path);
    } catch (readError: any) {
      console.error('Error reading uploaded file:', readError);
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ 
        error: 'Failed to read uploaded file',
        details: process.env.NODE_ENV === 'development' ? readError.message : undefined
      });
    }
    
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Store file URL - use multer's filename (it's already saved in uploads directory)
    // Optionally rename to include original filename for better organization
    const originalName = req.file.originalname || 'document';
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedName}`;
    
    // Get absolute paths
    const currentPath = path.isAbsolute(req.file.path) 
      ? req.file.path 
      : path.join(process.cwd(), req.file.path);
    
    const finalPath = path.isAbsolute(uploadsDir) 
      ? path.join(uploadsDir, fileName)
      : path.join(process.cwd(), uploadsDir, fileName);
    
    // Rename file to include original filename (optional, but better for organization)
    try {
      if (currentPath !== finalPath) {
        fs.renameSync(currentPath, finalPath);
      }
    } catch (renameError: any) {
      console.error('Error renaming file:', renameError);
      console.error('From:', currentPath);
      console.error('To:', finalPath);
      // Continue with multer's filename if rename fails
      const url = `/uploads/${req.file.filename}`;
      
      // Still try to insert into database with original multer filename
      try {
        const result = await pool.query(
          `INSERT INTO documents (project_id, doc_type, hash, url)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [project_id, doc_type, hash, url]
        );
        
        await calculateTransparencyScore(project_id);
        return res.status(201).json(result.rows[0]);
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        if (fs.existsSync(currentPath)) {
          fs.unlinkSync(currentPath);
        }
        return res.status(500).json({ 
          error: 'Failed to save document to database',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }
    }
    
    const url = `/uploads/${fileName}`;

    // Insert into database
    let result;
    try {
      result = await pool.query(
        `INSERT INTO documents (project_id, doc_type, hash, url)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [project_id, doc_type, hash, url]
      );
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      // Clean up file if database insert fails
      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }
      return res.status(500).json({ 
        error: 'Failed to save document to database',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    // Recalculate transparency score
    await calculateTransparencyScore(project_id);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error uploading document:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    // Return more detailed error message
    const errorMessage = error.message || 'Internal server error';
    res.status(500).json({ 
      error: 'Failed to upload document',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Delete document
router.delete('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM documents WHERE id = $1 RETURNING *',
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Recalculate transparency score
    await calculateTransparencyScore(result.rows[0].project_id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as documentRoutes };


