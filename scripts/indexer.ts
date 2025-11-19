/**
 * Off-chain indexer to sync Solana on-chain data with PostgreSQL
 * This should run periodically to update transparency scores
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { pool } from '../backend/src/db';
import { calculateTransparencyScore } from '../backend/src/services/scoring';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

async function indexProjects() {
  console.log('Starting indexer...');

  try {
    // Get all projects from database
    const projects = await pool.query('SELECT project_id FROM projects');

    for (const project of projects.rows) {
      try {
        // In production, fetch on-chain data here
        // For now, just recalculate scores
        await calculateTransparencyScore(project.project_id);
        console.log(`Updated score for project: ${project.project_id}`);
      } catch (error) {
        console.error(`Error indexing project ${project.project_id}:`, error);
      }
    }

    console.log('Indexing complete');
  } catch (error) {
    console.error('Indexer error:', error);
  }
}

// Run every 5 minutes
setInterval(indexProjects, 5 * 60 * 1000);

// Run immediately
indexProjects();


