import { Router } from 'express';
import { calculateTransparencyScore } from '../services/scoring';

const router = Router();

// Calculate and update score for a project
router.post('/calculate/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const score = await calculateTransparencyScore(projectId);
    res.json({ project_id: projectId, transparency_score: score });
  } catch (error) {
    console.error('Error calculating score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as scoringRoutes };






