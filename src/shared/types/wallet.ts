export type WalletTransactionType =
  | 'topup'
  | 'bid_fee'
  | 'bid_fee_refund'
  | 'job_payout'
  | 'commission'
  | 'adjustment';

export type WalletTransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface Wallet {
  id: string;
  contractor_id: string;
  balance_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: WalletTransactionType;
  amount_cents: number;
  balance_after_cents: number;
  status: WalletTransactionStatus;
  ref_type: string | null;
  ref_id: string | null;
  stripe_payment_intent: string | null;
  created_at: string;
}

export const BID_FEE_CENTS = 30;
export const PLATFORM_COMMISSION_BPS_MIN = 300;
export const PLATFORM_COMMISSION_BPS_MAX = 400;
export const DEFAULT_COMPLETION_SIGN_OFF = true;