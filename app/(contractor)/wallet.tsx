import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { formatCents } from '@/src/shared';
import type { Wallet, WalletTransaction } from '@/src/shared';

export default function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topping, setTopping] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      const { data: w } = await supabase
        .from('wallets')
        .select('*')
        .eq('contractor_id', user.id)
        .single();
      if (w) setWallet(w as Wallet);

      const { data: t } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (t) setTxns(t as WalletTransaction[]);

      setLoading(false);
    })();
  }, []);

  async function topUp(amountCents: number) {
    setTopping(true);
    const res = await fetch('/api/stripe/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents }),
    });
    setTopping(false);
    const data = await res.json();
    if (!res.ok) return Alert.alert('Top-up failed', data.error);
    Alert.alert(
      'Payment',
      'Complete payment in the PaymentSheet to add funds.',
    );
    // PaymentSheet wiring lives in the app wrapper (same as homeowner).
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.canvas }}>
        <ActivityIndicator size="large" color={COLORS.brand.DEFAULT} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: COLORS.canvas }} contentContainerStyle={{ padding: 24, paddingTop: 64, paddingBottom: 48 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.ink.DEFAULT }}>
        Contractor Wallet
      </Text>

      {/* Balance card */}
      <View style={{
        marginTop: 20,
        backgroundColor: COLORS.brand.DEFAULT,
        borderRadius: 20,
        padding: 24,
      }}>
        <Text style={{ color: COLORS.brand.soft, fontSize: 13, fontWeight: '600' }}>
          Available balance
        </Text>
        <Text style={{ color: '#FFF', fontSize: 34, fontWeight: '800', marginTop: 4 }}>
          {wallet ? formatCents(wallet.balance_cents) : '$0.00'}
        </Text>
        <Text style={{ color: COLORS.brand.light, fontSize: 12, marginTop: 4 }}>
          Bids cost $0.30 · 96–97% payout on job completion
        </Text>
      </View>

      {/* Quick top-up buttons */}
      <View className="flex-row mt-5" style={{ gap: 12 }}>
        {[1000, 2500, 5000].map((amt) => (
          <TouchableOpacity
            key={amt}
            onPress={() => topUp(amt)}
            disabled={topping}
            style={{
              flex: 1,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.brand.DEFAULT }}>
              ${(amt / 100).toFixed(0)}
            </Text>
            <Text style={{ fontSize: 11, color: COLORS.ink.muted }}>Top up</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions */}
      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink.DEFAULT, marginTop: 28 }}>
        Recent activity
      </Text>

      {txns.length === 0 ? (
        <Text style={{ color: COLORS.ink.muted, marginTop: 12 }}>
          No transactions yet.
        </Text>
      ) : (
        <View style={{ marginTop: 12, gap: 10 }}>
          {txns.map((tx) => (
            <View
              key={tx.id}
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.ink.DEFAULT }}>
                  {tx.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.ink.muted, marginTop: 2 }}>
                  {new Date(tx.created_at).toLocaleString()}
                </Text>
              </View>
              <Text style={{
                fontSize: 15,
                fontWeight: '700',
                color: tx.amount_cents > 0 ? COLORS.success : COLORS.error,
              }}>
                {tx.amount_cents > 0 ? '+' : ''}{formatCents(tx.amount_cents)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}