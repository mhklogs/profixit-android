import type { TradeCategory, UserRole } from './user';
import type { Bid } from './bid';

export type JobStatus =
  | 'open'
  | 'bid_placed'
  | 'accepted'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type PriceBasis = 'target' | 'open_bidding';

export interface JobMedia {
  url: string;
  type: 'photo' | 'video';
}

export interface Job {
  id: string;
  homeowner_id: string;
  contractor_id: string | null;
  title: string;
  description: string;
  category: TradeCategory;
  status: JobStatus;
  is_urgent: boolean;
  price_basis: PriceBasis;
  target_price_cents: number | null;
  accepted_bid_id: string | null;
  location: GeoPoint;
  media: JobMedia[];
  // ETA strings in minutes agreed by winning bid
  estimated_duration_minutes: number | null;
  scheduled_start: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
}

export interface UserTrades {
  id: string;
  user_id: string;
  trade: TradeCategory;
  hourly_rate: number;
}

export interface JobWithBids extends Job {
  bids: Bid[];
  contractor?: ContractorInfo;
}

export interface ContractorInfo {
  id: string;
  full_name: string;
  rating: number;
  rating_count: number;
  trade_category: TradeCategory;
  jobs_completed: number;
  home_base_lat?: number;
  home_base_lng?: number;
}

export interface CreateJobInput {
  title: string;
  description: string;
  category: TradeCategory;
  is_urgent?: boolean;
  price_basis: PriceBasis;
  target_price_cents: number | null;
  location: GeoPoint;
  media: JobMedia[];
  estimated_duration_minutes?: number;
  scheduled_start?: string;
}

export interface BroadcasterContext {
  role: UserRole;
}