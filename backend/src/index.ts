import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { projectRoutes } from './routes/projects';
import { documentRoutes } from './routes/documents';
import { votingRoutes } from './routes/voting';
import { scoringRoutes } from './routes/scoring';
import { walletAuthRoutes } from './routes/walletAuth';
import { initDatabase } from './db';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (avatars, uploads) - must be before routes
// PM2 runs from project root, so use backend/uploads path
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1y', // Cache for 1 year
  etag: true,
}));

// Rate limiting - More lenient for general API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (very lenient for development)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ 
      error: 'Too many requests. Please try again later.' 
    });
  },
  // Skip rate limiting for health checks and auth endpoints (login/signup/me should not be rate limited)
  skip: (req) => {
    const url = req.url || req.originalUrl || '';
    const path = req.path || url.split('?')[0] || '';
    
    // Check exact paths and path starts with
    if (path === '/health' || url.includes('/health')) return true;
    if (path === '/api/auth/login' || url.includes('/api/auth/login')) return true;
    if (path === '/api/auth/signup' || url.includes('/api/auth/signup')) return true;
    if (path === '/api/auth/me' || url.includes('/api/auth/me')) return true;
    
    return false;
  },
});

// Routes
app.use('/api/wallet', walletAuthRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/scoring', scoringRoutes);

// Apply rate limiter AFTER routes, with better path detection
app.use('/api/', (req, res, next) => {
  const url = req.originalUrl || req.url || '';
  const path = req.path || url.split('?')[0] || '';
  
  // Skip rate limiting for auth endpoints
  if (path === '/health' || url.includes('/health')) return next();
  if (path === '/api/auth/login' || url.includes('/api/auth/login')) return next();
  if (path === '/api/auth/signup' || url.includes('/api/auth/signup')) return next();
  if (path === '/api/auth/me' || url.includes('/api/auth/me')) return next();
  
  // Apply rate limiter to other routes
  limiter(req, res, next);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
initDatabase()
  .then(() => {
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Clearo Backend running on http://${HOST}:${PORT}`);
      console.log(`   Accessible from: http://localhost:${PORT} or your server IP:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

export default app;

