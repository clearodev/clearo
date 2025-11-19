import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory (works when running from project root or backend dir)
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'clearo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    // Add new columns to existing users table if they don't exist (only if table exists)
    await client.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='users' AND column_name='email_verification_token') THEN
            ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='users' AND column_name='password_reset_token') THEN
            ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='users' AND column_name='password_reset_expires') THEN
            ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='users' AND column_name='email_verification_expires') THEN
            ALTER TABLE users ADD COLUMN email_verification_expires TIMESTAMP;
          END IF;
        END IF;
      END $$;
    `);

    // Add new columns to existing projects table if they don't exist (only if table exists)
    await client.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='projects') THEN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='projects' AND column_name='logo_url') THEN
            ALTER TABLE projects ADD COLUMN logo_url TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='projects' AND column_name='contract_address') THEN
            ALTER TABLE projects ADD COLUMN contract_address VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='projects' AND column_name='twitter_url') THEN
            ALTER TABLE projects ADD COLUMN twitter_url VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='projects' AND column_name='website_url') THEN
            ALTER TABLE projects ADD COLUMN website_url VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='projects' AND column_name='verified_by_wallet') THEN
            ALTER TABLE projects ADD COLUMN verified_by_wallet VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='projects' AND column_name='github_url') THEN
            ALTER TABLE projects ADD COLUMN github_url VARCHAR(255);
          END IF;
        END IF;
      END $$;
    `);

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR(255) UNIQUE NOT NULL,
        owner_wallet VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        logo_url TEXT,
        contract_address VARCHAR(255),
        twitter_url VARCHAR(255),
        website_url VARCHAR(255),
        github_url VARCHAR(255),
        verified BOOLEAN DEFAULT FALSE,
        verified_at TIMESTAMP,
        verified_by_wallet VARCHAR(255),
        transparency_score INTEGER DEFAULT 0,
        score_updated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        doc_type VARCHAR(50) NOT NULL,
        hash VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        voter_wallet VARCHAR(255) NOT NULL,
        vote_type VARCHAR(10) NOT NULL,
        amount BIGINT NOT NULL,
        transaction_signature VARCHAR(255),
        voted_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        UNIQUE(project_id, voter_wallet),
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS project_updates (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        update_type VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS wallet_profiles (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100),
        full_name VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS wallet_sessions (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(255) NOT NULL REFERENCES wallet_profiles(wallet_address) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_wallet);
      CREATE INDEX IF NOT EXISTS idx_projects_verified ON projects(verified);
      CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
      CREATE INDEX IF NOT EXISTS idx_votes_project ON votes(project_id);
      CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_wallet);
      CREATE INDEX IF NOT EXISTS idx_wallet_profiles_address ON wallet_profiles(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_wallet_sessions_address ON wallet_sessions(wallet_address);
    `);
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

export { pool };

