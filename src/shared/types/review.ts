export interface Review {
  id: string;
  job_id: string;
  author_id: string;
  contractor_id: string;
  homeowner_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  tip_cents: number | null;
  created_at: string;
}

export interface CreateReviewInput {
  job_id: string;
  contractor_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  tip_cents?: number;
}

export type ReviewMetric = 'overall' | 'punctuality' | 'quality' | 'communication';