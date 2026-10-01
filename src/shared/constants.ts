export const TRADE_CATEGORIES = [
  'plumbing',
  'electrical',
  'hvac',
  'hvac_repair',
  'roofing',
  'handyman',
  'appliance_repair',
  'bathroom_remodel',
  'kitchen_remodel',
  'windows_doors',
  'garage_door',
  'painting',
  'cleaning',
  'landscaping',
  'pest_control',
  'moving',
  'locksmith',
  'flooring',
  'renovation',
  'general',
] as const;

export const TRADE_LABELS: Record<string, string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  hvac: 'HVAC & AC',
  hvac_repair: 'HVAC Repair',
  roofing: 'Roofing',
  handyman: 'Handyman',
  appliance_repair: 'Appliance Repair',
  bathroom_remodel: 'Bathroom Remodel',
  kitchen_remodel: 'Kitchen Remodel',
  windows_doors: 'Windows & Doors',
  garage_door: 'Garage Door',
  painting: 'Painting',
  cleaning: 'Cleaning',
  landscaping: 'Landscaping',
  pest_control: 'Pest Control',
  moving: 'Moving & Shifting',
  locksmith: 'Locksmith',
  flooring: 'Flooring',
  renovation: 'Home Renovation',
  general: 'General Repairs',
};

export const TRADE_EMOJI: Record<string, string> = {
  plumbing: '🚰',
  electrical: '⚡',
  hvac: '❄️',
  hvac_repair: '🔧',
  roofing: '🏠',
  handyman: '🔨',
  appliance_repair: '🔌',
  bathroom_remodel: '🛁',
  kitchen_remodel: '🍳',
  windows_doors: '🪟',
  garage_door: '🚪',
  painting: '🎨',
  cleaning: '🧹',
  landscaping: '🌳',
  pest_control: '🐜',
  moving: '🚚',
  locksmith: '🔑',
  flooring: '🏗️',
  renovation: '🏡',
  general: '🛠️',
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  open: 'Open for Bidding',
  bid_placed: 'Bids Received',
  accepted: 'Bid Accepted',
  in_progress: 'In Progress',
  awaiting_confirmation: 'Awaiting Confirmation',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export const PLATFORM_NAME = 'FixIt Home';
export const PLATFORM_TAGLINE = 'Live bidding for local home pros.';
export const PRO_BRAND = 'ProFixit';
export const PRO_TAGLINE = 'The contractor earning engine — credit wallet, live bids, fast payouts.';
export const HOME_BRAND = 'FixIt Home';
export const HOME_TAGLINE = 'Post a job. Watch pros bid live. Pay when it\u2019s done.';

// Financial constants
export const BID_FEE_USD = 0.3;
export const PLATFORM_COMMISSION_BPS = 400; // 4% default
export const ESCROW_COMMISSION_BPS_MIN = 300; // 3%
export const ESCROW_COMMISSION_BPS_MAX = 400; // 4%

export const MAX_BID_DURATION_MINUTES = 30;
export const JOB_EXPIRY_MINUTES = 60;