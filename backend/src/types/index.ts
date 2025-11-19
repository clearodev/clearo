export interface Project {
  id?: number;
  project_id: string;
  owner_wallet: string;
  name: string;
  description: string;
  verified: boolean;
  verified_at?: Date | null;
  transparency_score: number;
  score_updated_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface Document {
  id?: number;
  project_id: string;
  doc_type: DocumentType;
  hash: string;
  url: string;
  uploaded_at?: Date;
}

export type DocumentType =
  | 'Whitepaper'
  | 'Roadmap'
  | 'Tokenomics'
  | 'MonthlyReport'
  | 'FinancialTransparency'
  | 'AuditReport'
  | 'TeamIntroduction'
  | 'GitHub';

export interface Vote {
  id?: number;
  project_id: string;
  voter_wallet: string;
  vote_type: 'Upvote' | 'Downvote';
  amount: number;
  transaction_signature?: string | null;
  voted_at?: Date;
  updated_at?: Date | null;
}

export interface ProjectUpdate {
  id?: number;
  project_id: string;
  update_type: string;
  description?: string;
  created_at?: Date;
}






