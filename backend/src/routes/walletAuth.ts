import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { pool } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { authenticateWallet, generateAuthMessage } from '../utils/walletAuth';

const router = express.Router();

// Configure multer for avatar uploads
const avatarUploadDir = 'uploads/avatars';
if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

const avatarUpload = multer({
  dest: avatarUploadDir,
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

// Generate authentication message (nonce)
router.post('/auth-message', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Validate Solana wallet address format
    if (walletAddress.length < 32 || walletAddress.length > 44) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const message = generateAuthMessage(walletAddress);
    res.json({ message });
  } catch (error: any) {
    console.error('Auth message error:', error);
    res.status(500).json({ error: 'Failed to generate auth message' });
  }
});

// Authenticate with wallet signature
router.post('/authenticate', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: 'Wallet address, signature, and message are required' });
    }

    const { token, profile } = await authenticateWallet(walletAddress, signature, message);

    res.json({
      message: 'Authentication successful',
      token,
      profile,
    });
  } catch (error: any) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: error.message || 'Authentication failed' });
  }
});

// Get current wallet profile
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT wallet_address, username, full_name, avatar_url, created_at, updated_at 
       FROM wallet_profiles WHERE wallet_address = $1`,
      [req.walletAddress]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = result.rows[0];
    res.json({
      walletAddress: profile.wallet_address,
      username: profile.username,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile information' });
  }
});

// Update profile
router.patch('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { username, fullName } = req.body;

    if (!req.walletAddress) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if username is already taken (if provided)
    if (username) {
      const existingUser = await pool.query(
        'SELECT wallet_address FROM wallet_profiles WHERE username = $1 AND wallet_address != $2',
        [username, req.walletAddress]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      params.push(username || null);
    }
    if (fullName !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      params.push(fullName || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    params.push(req.walletAddress);

    const result = await pool.query(
      `UPDATE wallet_profiles 
       SET ${updates.join(', ')} 
       WHERE wallet_address = $${paramCount} 
       RETURNING wallet_address, username, full_name, avatar_url, created_at, updated_at`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = result.rows[0];
    res.json({
      walletAddress: profile.wallet_address,
      username: profile.username,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload avatar
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    if (!req.walletAddress) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `avatar-${req.walletAddress}-${Date.now()}.webp`;
    const finalPath = path.join(avatarUploadDir, fileName);

    try {
      // Compress and convert to WebP
      await sharp(req.file.path)
        .resize(200, 200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .webp({ quality: 80 })
        .toFile(finalPath);

      // Delete original file
      fs.unlinkSync(req.file.path);

      // Get old avatar URL to delete old file
      const profileResult = await pool.query(
        'SELECT avatar_url FROM wallet_profiles WHERE wallet_address = $1',
        [req.walletAddress]
      );

      if (profileResult.rows.length > 0 && profileResult.rows[0].avatar_url) {
        const oldAvatarPath = path.join(process.cwd(), profileResult.rows[0].avatar_url.replace(/^\//, ''));
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      const avatarUrl = `/uploads/avatars/${fileName}`;
      const result = await pool.query(
        `UPDATE wallet_profiles 
         SET avatar_url = $1, updated_at = NOW() 
         WHERE wallet_address = $2 
         RETURNING wallet_address, username, full_name, avatar_url, created_at, updated_at`,
        [avatarUrl, req.walletAddress]
      );

      res.json({
        walletAddress: result.rows[0].wallet_address,
        username: result.rows[0].username,
        fullName: result.rows[0].full_name,
        avatarUrl: result.rows[0].avatar_url,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      });
    } catch (sharpError: any) {
      // Clean up uploaded file if processing fails
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw sharpError;
    }
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload avatar' });
  }
});

export { router as walletAuthRoutes };


