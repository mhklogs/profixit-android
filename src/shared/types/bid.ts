import type { JobStatus } from './job';

export type BidStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

export interface Bid {
  id: string;
  job_id: string;
  contractor_id: string;
  price_cents: number;
  eta_minutes: number;
  message: string | null;
  status: BidStatus;
  bid_fee_txn_id: string | null;
  created_at: string;
}

export interface PlaceBidInput {
  job_id: string;
  price: number;
  eta_minutes: number;
  message?: string;
}

export interface BidEvent {
  type: 'bid_created' | 'bid_accepted' | 'bid_declined';
  job_id: string;
  bid?: Bid;
  job_status?: JobStatus;
}