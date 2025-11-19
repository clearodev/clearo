import { Router } from 'express';
import { pool } from '../db';
import { calculateTransparencyScore } from '../services/scoring';
import { verifyTokenTransfer } from '../utils/solana';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const router = Router();

// Configure multer for project logo uploads
const logoUploadDir = 'uploads/logos';
if (!fs.existsSync(logoUploadDir)) {
  fs.mkdirSync(logoUploadDir, { recursive: true });
}

const logoUpload = multer({
  dest: logoUploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  },
});

// Get all projects
router.get('/', async (req, res) => {
  try {
    const { verified, minScore, owner_wallet, search, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (owner_wallet) {
      query += ` AND owner_wallet = $${paramCount++}`;
      params.push(owner_wallet);
    }

    if (verified !== undefined) {
      query += ` AND verified = $${paramCount++}`;
      params.push(verified === 'true');
    }

    if (minScore !== undefined) {
      query += ` AND transparency_score >= $${paramCount++}`;
      params.push(parseInt(minScore as string));
    }

    // Search by project name or contract address
    if (search) {
      query += ` AND (LOWER(name) LIKE $${paramCount} OR LOWER(contract_address) LIKE $${paramCount})`;
      params.push(`%${(search as string).toLowerCase()}%`);
      paramCount++;
    }

    query += ` ORDER BY transparency_score DESC, created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project by ID
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      'SELECT * FROM projects WHERE project_id = $1',
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    const { project_id, owner_wallet, name, description, contract_address, twitter_url, website_url, github_url } = req.body;

    if (!project_id || !owner_wallet || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO projects (project_id, owner_wallet, name, description, contract_address, twitter_url, website_url, github_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        project_id, 
        owner_wallet, 
        name, 
        description || '', 
        contract_address || null,
        twitter_url || null,
        website_url || null,
        github_url || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Project already exists' });
    }
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project verification status (with on-chain verification)
router.patch('/:projectId/verify', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { verified, transactionSignature, verificationCode, verifying_wallet } = req.body;

    // Get project to verify ownership
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE project_id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // If verifying, check on-chain transaction
    if (verified && transactionSignature && verificationCode) {
      // Verify the transaction signature matches the expected verification
      // This checks:
      // 1. Transaction signature is valid and confirmed
      // 2. Transaction contains memo with verification code
      // 3. Transaction signer matches the project owner wallet (CRITICAL!)
      
      const isValid = await verifyTokenTransfer(
        transactionSignature,
        project.owner_wallet, // Verify signer matches project owner
        verificationCode
      );

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid verification transaction. Transaction signer must match project owner wallet.' });
      }

      // Additional check: verify the verifying_wallet matches project owner
      if (verifying_wallet && verifying_wallet !== project.owner_wallet) {
        return res.status(403).json({ error: 'Only the project owner can verify this project' });
      }
    }

    // Store the wallet that verified the project (for transparency)
    const verifiedByWallet = verified && verifying_wallet ? verifying_wallet : null;

    const result = await pool.query(
      `UPDATE projects 
       SET verified = $1, verified_at = $2, verified_by_wallet = $3
       WHERE project_id = $4
       RETURNING *`,
      [verified, verified ? new Date() : null, verifiedByWallet, projectId]
    );

    // Recalculate score after verification change
    await calculateTransparencyScore(projectId);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload project logo (only owner can upload)
router.post('/:projectId/logo', logoUpload.single('logo'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { owner_wallet } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get project to check ownership
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE project_id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Verify ownership
    if (!owner_wallet || owner_wallet !== project.owner_wallet) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ error: 'Only project owner can upload logo' });
    }

    // Compress and resize image
    const fileName = `logo-${projectId}-${Date.now()}.webp`;
    const finalPath = path.join(logoUploadDir, fileName);

    try {
      await sharp(req.file.path)
        .resize(400, 400, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .webp({ quality: 80 })
        .toFile(finalPath);

      // Delete original uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      // Delete old logo if exists
      if (project.logo_url) {
        const oldLogoPath = path.join(process.cwd(), project.logo_url.replace(/^\//, ''));
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      const logoUrl = `/uploads/logos/${fileName}`;

      // Update project with new logo URL
      const result = await pool.query(
        `UPDATE projects 
         SET logo_url = $1, updated_at = NOW()
         WHERE project_id = $2
         RETURNING *`,
        [logoUrl, projectId]
      );

      res.json(result.rows[0]);
    } catch (sharpError: any) {
      console.error('Error processing logo:', sharpError);
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: 'Failed to process logo image' });
    }
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project (only owner can update)
router.patch('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, contract_address, twitter_url, website_url, github_url, owner_wallet } = req.body;

    // Get project to check ownership
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE project_id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Verify ownership (owner_wallet must match)
    if (owner_wallet && owner_wallet !== project.owner_wallet) {
      return res.status(403).json({ error: 'Only project owner can update the project' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      params.push(name);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      params.push(description);
    }

    if (contract_address !== undefined) {
      updates.push(`contract_address = $${paramCount++}`);
      params.push(contract_address || null);
    }

    if (twitter_url !== undefined) {
      updates.push(`twitter_url = $${paramCount++}`);
      params.push(twitter_url || null);
    }

    if (website_url !== undefined) {
      updates.push(`website_url = $${paramCount++}`);
      params.push(website_url || null);
    }

    if (github_url !== undefined) {
      updates.push(`github_url = $${paramCount++}`);
      params.push(github_url || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    params.push(projectId);

    const result = await pool.query(
      `UPDATE projects 
       SET ${updates.join(', ')}
       WHERE project_id = $${paramCount}
       RETURNING *`,
      params
    );

    // Recalculate score after update
    await calculateTransparencyScore(projectId);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project statistics
router.get('/:projectId/stats', async (req, res) => {
  try {
    const { projectId } = req.params;

    const [project, documents, votes, updates] = await Promise.all([
      pool.query('SELECT * FROM projects WHERE project_id = $1', [projectId]),
      pool.query('SELECT COUNT(*) FROM documents WHERE project_id = $1', [projectId]),
      pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE vote_type = 'Upvote') as upvotes,
          COUNT(*) FILTER (WHERE vote_type = 'Downvote') as downvotes,
          SUM(amount) as total_votes
         FROM votes WHERE project_id = $1`,
        [projectId]
      ),
      pool.query('SELECT COUNT(*) FROM project_updates WHERE project_id = $1', [projectId]),
    ]);

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      project: project.rows[0],
      documents: parseInt(documents.rows[0].count),
      votes: {
        upvotes: parseInt(votes.rows[0].upvotes || '0'),
        downvotes: parseInt(votes.rows[0].downvotes || '0'),
        total_votes: parseInt(votes.rows[0].total_votes || '0'),
      },
      updates: parseInt(updates.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as projectRoutes };


