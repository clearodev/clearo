import { Router } from 'express';
import { pool } from '../db';
import { calculateTransparencyScore } from '../services/scoring';
import { verifyVoteBurn } from '../utils/solana';

const router = Router();

const VOTE_BURN_AMOUNT = 10_000_000; // 10 CLRO tokens (6 decimals)

// Get votes for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE vote_type = 'Upvote') as upvotes,
        COUNT(*) FILTER (WHERE vote_type = 'Downvote') as downvotes,
        SUM(amount) as total_votes
       FROM votes WHERE project_id = $1`,
      [projectId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's vote for a project
router.get('/project/:projectId/user/:wallet', async (req, res) => {
  try {
    const { projectId, wallet } = req.params;
    const result = await pool.query(
      'SELECT * FROM votes WHERE project_id = $1 AND voter_wallet = $2',
      [projectId, wallet]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vote not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record vote (called after on-chain vote)
router.post('/', async (req, res) => {
  try {
    const { project_id, voter_wallet, vote_type, amount, transaction_signature } = req.body;

    if (!project_id || !voter_wallet || !vote_type || !amount || !transaction_signature) {
      return res.status(400).json({ error: 'Missing required fields. Transaction signature is required.' });
    }

    if (vote_type !== 'Upvote' && vote_type !== 'Downvote') {
      return res.status(400).json({ error: 'Invalid vote_type' });
    }

    // Check if user already voted on this project
    const existingVote = await pool.query(
      'SELECT * FROM votes WHERE project_id = $1 AND voter_wallet = $2',
      [project_id, voter_wallet]
    );

    if (existingVote.rows.length > 0) {
      return res.status(400).json({ 
        error: 'You have already voted on this project. Each wallet can only vote once per project.' 
      });
    }

    // Verify the token burn transaction
    const isValid = await verifyVoteBurn(
      transaction_signature,
      voter_wallet,
      VOTE_BURN_AMOUNT
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid vote transaction. Transaction must burn 10 CLRO tokens and signer must match voter wallet.' });
    }

    // Insert vote (no update allowed - one vote per wallet per project)
    const result = await pool.query(
      `INSERT INTO votes (project_id, voter_wallet, vote_type, amount, transaction_signature)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [project_id, voter_wallet, vote_type, amount, transaction_signature]
    );

    // Recalculate transparency score
    await calculateTransparencyScore(project_id);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent votes
router.get('/recent', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const result = await pool.query(
      `SELECT v.*, p.name as project_name
       FROM votes v
       JOIN projects p ON v.project_id = p.project_id
       ORDER BY v.voted_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recent votes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as votingRoutes };



