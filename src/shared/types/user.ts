export type UserRole = 'homeowner' | 'contractor';
export type AccountStatus = 'pending' | 'active' | 'suspended';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  account_status: AccountStatus;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractorProfile extends Omit<Profile, 'role'> {
  role: 'contractor';
  trade_category: TradeCategory;
  bio: string | null;
  years_experience: number | null;
  insurance_verified: boolean;
  background_verified: boolean;
  rating: number;
  rating_count: number;
  jobs_completed: number;
  service_radius_km: number;
  hourly_rate_min: number;
  hourly_rate_max: number;
  home_base_lat: number | null;
  home_base_lng: number | null;
  stripe_connect_id: string | null;
}

export type TradeCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'hvac_repair'
  | 'roofing'
  | 'handyman'
  | 'appliance_repair'
  | 'bathroom_remodel'
  | 'kitchen_remodel'
  | 'windows_doors'
  | 'garage_door'
  | 'painting'
  | 'cleaning'
  | 'landscaping'
  | 'pest_control'
  | 'moving'
  | 'locksmith'
  | 'flooring'
  | 'renovation'
  | 'general';