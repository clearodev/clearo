import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { pool } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email';

const router = express.Router();

// Rate limiter for verification email (3 requests per hour per IP)
const verificationEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ 
      error: 'Too many verification email requests. Please try again in an hour.' 
    });
  },
});

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

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, username, fullName } = req.body;

    // Validation
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // Token expires in 24 hours

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, username, full_name, email_verification_token, email_verification_expires) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, username, full_name, created_at`,
      [email, passwordHash, username, fullName || null, verificationToken, verificationExpires]
    );

    const user = result.rows[0];

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail signup if email fails, but log it
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // JWT token expiration (default 30 days, configurable via env)
    const jwtExpiration: string | number = process.env.JWT_EXPIRATION || '30d';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: jwtExpiration } as jwt.SignOptions
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
      },
      token,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, username, full_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // JWT token expiration (default 30 days, configurable via env)
    const jwtExpiration: string | number = process.env.JWT_EXPIRATION || '30d';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: jwtExpiration } as jwt.SignOptions
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, username, full_name, avatar_url, email_verified, created_at 
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get linked wallets
    const walletsResult = await pool.query(
      `SELECT wallet_address, wallet_name, is_primary, linked_at 
       FROM user_wallets WHERE user_id = $1 ORDER BY is_primary DESC, linked_at DESC`,
      [req.userId]
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
      },
      wallets: walletsResult.rows,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Link wallet to user account
router.post('/link-wallet', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { walletAddress, walletName } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Validate Solana wallet address format (basic check)
    if (walletAddress.length < 32 || walletAddress.length > 44) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Check if wallet is already linked to another user
    const existingLink = await pool.query(
      'SELECT user_id FROM user_wallets WHERE wallet_address = $1',
      [walletAddress]
    );

    if (existingLink.rows.length > 0 && existingLink.rows[0].user_id !== req.userId) {
      return res.status(400).json({ error: 'Wallet is already linked to another account' });
    }

    // Check if wallet is already linked to this user
    const userWallet = await pool.query(
      'SELECT id FROM user_wallets WHERE user_id = $1 AND wallet_address = $2',
      [req.userId, walletAddress]
    );

    if (userWallet.rows.length > 0) {
      return res.status(400).json({ error: 'Wallet is already linked to your account' });
    }

    // Check if user has any wallets (to set primary)
    const userWallets = await pool.query(
      'SELECT id FROM user_wallets WHERE user_id = $1',
      [req.userId]
    );

    const isPrimary = userWallets.rows.length === 0; // First wallet is primary

    // Link wallet
    await pool.query(
      `INSERT INTO user_wallets (user_id, wallet_address, wallet_name, is_primary) 
       VALUES ($1, $2, $3, $4)`,
      [req.userId, walletAddress, walletName || null, isPrimary]
    );

    res.json({
      message: 'Wallet linked successfully',
      wallet: {
        address: walletAddress,
        name: walletName,
        isPrimary,
      },
    });
  } catch (error: any) {
    console.error('Link wallet error:', error);
    res.status(500).json({ error: 'Failed to link wallet' });
  }
});

// Get user's linked wallets
router.get('/wallets', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT wallet_address, wallet_name, is_primary, linked_at 
       FROM user_wallets WHERE user_id = $1 ORDER BY is_primary DESC, linked_at DESC`,
      [req.userId]
    );

    res.json({ wallets: result.rows });
  } catch (error: any) {
    console.error('Get wallets error:', error);
    res.status(500).json({ error: 'Failed to get wallets' });
  }
});

// Unlink wallet
router.delete('/wallets/:address', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { address } = req.params;

    // Check if wallet belongs to user
    const wallet = await pool.query(
      'SELECT id, is_primary FROM user_wallets WHERE user_id = $1 AND wallet_address = $2',
      [req.userId, address]
    );

    if (wallet.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // If it's primary, set another wallet as primary
    if (wallet.rows[0].is_primary) {
      const otherWallet = await pool.query(
        'SELECT id FROM user_wallets WHERE user_id = $1 AND wallet_address != $2 LIMIT 1',
        [req.userId, address]
      );

      if (otherWallet.rows.length > 0) {
        await pool.query(
          'UPDATE user_wallets SET is_primary = TRUE WHERE id = $1',
          [otherWallet.rows[0].id]
        );
      }
    }

    // Delete wallet link
    await pool.query(
      'DELETE FROM user_wallets WHERE user_id = $1 AND wallet_address = $2',
      [req.userId, address]
    );

    res.json({ message: 'Wallet unlinked successfully' });
  } catch (error: any) {
    console.error('Unlink wallet error:', error);
    res.status(500).json({ error: 'Failed to unlink wallet' });
  }
});

// Set primary wallet
router.put('/wallets/:address/primary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { address } = req.params;

    // Check if wallet belongs to user
    const wallet = await pool.query(
      'SELECT id FROM user_wallets WHERE user_id = $1 AND wallet_address = $2',
      [req.userId, address]
    );

    if (wallet.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Remove primary from all wallets
    await pool.query(
      'UPDATE user_wallets SET is_primary = FALSE WHERE user_id = $1',
      [req.userId]
    );

    // Set this wallet as primary
    await pool.query(
      'UPDATE user_wallets SET is_primary = TRUE WHERE id = $1',
      [wallet.rows[0].id]
    );

    res.json({ message: 'Primary wallet updated successfully' });
  } catch (error: any) {
    console.error('Set primary wallet error:', error);
    res.status(500).json({ error: 'Failed to set primary wallet' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    // Don't reveal if user exists or not (security best practice)
    if (result.rows.length === 0) {
      return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour

    // Save reset token
    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({ error: 'Failed to send password reset email' });
    }

    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find user with valid reset token
    const result = await pool.query(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    res.json({ message: 'Password has been reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Send verification email (with rate limiting)
router.post('/send-verification', authenticateToken, verificationEmailLimiter, async (req: AuthRequest, res) => {
  try {
    // Get user
    const result = await pool.query(
      'SELECT id, email, email_verified, email_verification_token, email_verification_expires FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token if needed or expired
    let verificationToken = user.email_verification_token;
    const now = new Date();
    const tokenExpired = !user.email_verification_expires || new Date(user.email_verification_expires) < now;
    
    if (!verificationToken || tokenExpired) {
      verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24); // Token expires in 24 hours
      
      await pool.query(
        'UPDATE users SET email_verification_token = $1, email_verification_expires = $2 WHERE id = $3',
        [verificationToken, verificationExpires, user.id]
      );
    }

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken);
      res.json({ message: 'Verification email sent successfully' });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  } catch (error: any) {
    console.error('Send verification error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Verify email with token
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find user with valid verification token (not expired)
    const result = await pool.query(
      'SELECT id, email_verified, email_verification_expires FROM users WHERE email_verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Check if token has expired
    if (!user.email_verification_expires || new Date(user.email_verification_expires) < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired. Please request a new verification email.' });
    }

    // Verify email and clear token
    await pool.query(
      'UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL WHERE id = $1',
      [user.id]
    );

    res.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Update user profile
router.patch('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { fullName } = req.body;

    if (fullName !== undefined && typeof fullName !== 'string') {
      return res.status(400).json({ error: 'Invalid full name format' });
    }

    // Update user profile
    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name), updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, username, full_name, avatar_url, email_verified, created_at`,
      [fullName || null, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload avatar
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.userId;
    const inputPath = req.file.path;
    const outputFilename = `avatar_${userId}_${Date.now()}.webp`;
    const outputPath = path.join(avatarUploadDir, outputFilename);

    try {
      // Compress and convert image to WebP format
      await sharp(inputPath)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 80 })
        .toFile(outputPath);

      // Delete original uploaded file
      fs.unlinkSync(inputPath);

      // Get old avatar URL to delete old file
      const userResult = await pool.query(
        'SELECT avatar_url FROM users WHERE id = $1',
        [userId]
      );

      const oldAvatarUrl = userResult.rows[0]?.avatar_url;
      if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
        const oldAvatarPath = path.join(process.cwd(), oldAvatarUrl);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Update user avatar URL
      const avatarUrl = `/uploads/avatars/${outputFilename}`;
      const result = await pool.query(
        `UPDATE users 
         SET avatar_url = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, email, username, full_name, avatar_url, email_verified, created_at`,
        [avatarUrl, userId]
      );

      if (result.rows.length === 0) {
        // Clean up uploaded file
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      res.json({
        message: 'Avatar uploaded successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
        },
      });
    } catch (processingError: any) {
      // Clean up files on error
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      console.error('Image processing error:', processingError);
      return res.status(500).json({ error: 'Failed to process image' });
    }
  } catch (error: any) {
    console.error('Upload avatar error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    const errorMessage = error.message || 'Failed to upload avatar';
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export { router as authRoutes };


