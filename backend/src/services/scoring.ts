import { pool } from '../db';

/**
 * Calculate transparency score based on:
 * - User Votes (25%)
 * - Documentation Quality (50%)
 * - Project Updates (15%)
 * - On-Chain Activity (10%)
 */
export async function calculateTransparencyScore(projectId: string): Promise<number> {
  try {
    // Get project data
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE project_id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new Error('Project not found');
    }

    const project = projectResult.rows[0];

    // 1. User Votes Score (25%)
    const votesResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE vote_type = 'Upvote') as upvotes,
        COUNT(*) FILTER (WHERE vote_type = 'Downvote') as downvotes,
        SUM(amount) as total_votes
       FROM votes WHERE project_id = $1`,
      [projectId]
    );

    const votes = votesResult.rows[0];
    const upvotes = parseInt(votes.upvotes || '0');
    const downvotes = parseInt(votes.downvotes || '0');
    const totalVotes = upvotes + downvotes;
    
    let voteScore = 0;
    if (totalVotes > 0) {
      const voteRatio = upvotes / totalVotes;
      voteScore = voteRatio * 25; // Max 25 points
    }

    // 2. Documentation Quality Score (50%)
    const docsResult = await pool.query(
      `SELECT doc_type, COUNT(*) as count
       FROM documents WHERE project_id = $1
       GROUP BY doc_type`,
      [projectId]
    );

    let docScore = 0;
    const docTypes = docsResult.rows.map((r: any) => r.doc_type);
    
    // Case-insensitive document type weights
    const docWeights: Record<string, number> = {
      'whitepaper': 10,
      'roadmap': 8,
      'tokenomics': 8,
      'monthlyreport': 6,
      'monthly report': 6,
      'financialtransparency': 8,
      'financial transparency': 8,
      'auditreport': 10,
      'audit report': 10,
      'teammembers': 5,
      'team introduction': 5,
      'team members': 5,
      'other': 3, // Base points for any document
    };

    // Calculate score for each document type (case-insensitive)
    docTypes.forEach((docType: string) => {
      const normalizedType = docType.toLowerCase().trim();
      const points = docWeights[normalizedType] || docWeights['other'] || 3;
      docScore += points;
    });

    // Also give base points for having any documents (encourages transparency)
    // Count total documents (sum of all counts)
    const totalDocs = docsResult.rows.reduce((sum: number, r: any) => sum + parseInt(r.count || '0'), 0);
    
    // If documents exist but no points were awarded (unrecognized types), give base points
    if (totalDocs > 0 && docScore === 0) {
      docScore = Math.min(totalDocs * 3, 15); // 3 points per document, max 15
    }

    // Add GitHub URL bonus (5 points if GitHub URL exists)
    if (project.github_url && project.github_url.trim() !== '') {
      docScore += 5;
    }

    docScore = Math.min(docScore, 50); // Cap at 50 points

    // 3. Project Updates Score (15%)
    const updatesResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM project_updates 
       WHERE project_id = $1 
       AND created_at > NOW() - INTERVAL '30 days'`,
      [projectId]
    );

    const recentUpdates = parseInt(updatesResult.rows[0].count || '0');
    const updateScore = Math.min(recentUpdates * 2, 15); // Max 15 points

    // 4. On-Chain Activity Score (10%)
    let onChainScore = 0;
    if (project.verified) {
      onChainScore += 5; // Verified projects get base score
    }

    // Check for recent activity (simplified - in production, check on-chain data)
    const daysSinceVerification = project.verified_at
      ? (Date.now() - new Date(project.verified_at).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    if (daysSinceVerification < 30) {
      onChainScore += 5; // Recent verification
    }

    // Calculate total score
    const totalScore = Math.round(voteScore + docScore + updateScore + onChainScore);
    const finalScore = Math.min(Math.max(totalScore, 0), 100); // Clamp between 0-100

    // Update project score
    await pool.query(
      `UPDATE projects 
       SET transparency_score = $1, score_updated_at = NOW()
       WHERE project_id = $2`,
      [finalScore, projectId]
    );

    return finalScore;
  } catch (error) {
    console.error('Error calculating transparency score:', error);
    throw error;
  }
}

/**
 * Get badge level based on score
 */
export function getBadgeLevel(score: number): string {
  if (score >= 90) return 'Diamond';
  if (score >= 75) return 'Platinum';
  if (score >= 60) return 'Gold';
  if (score >= 45) return 'Silver';
  if (score >= 30) return 'Bronze';
  return 'New'; // Changed from "Unverified" to avoid confusion with on-chain verification status
}


