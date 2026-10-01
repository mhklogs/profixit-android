import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { BID_FEE_USD } from '@/src/shared';
import type { Job } from '@/src/shared';

export default function BidScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [price, setPrice] = useState('');
  const [eta, setEta] = useState('30');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const [{ data: jobData }, { data: walletData }] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', jobId).single(),
        supabase
          .from('wallets')
          .select('balance_cents')
          .eq('contractor_id', (await supabase.auth.getUser()).data.user?.id ?? '')
          .maybeSingle(),
      ]);
      if (jobData) setJob(jobData as Job);
      if (walletData) setWalletBalance(walletData.balance_cents);
      setLoading(false);
    })();
  }, [jobId]);

  async function submit() {
    const priceNum = Math.round(Number(price) * 100);
    const etaNum = parseInt(eta, 10);
    if (!priceNum || priceNum < 100) return Alert.alert('Invalid price', 'Enter a valid bid amount.');
    if (!etaNum || etaNum < 1) return Alert.alert('Invalid ETA', 'Enter estimated minutes to arrive.');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (walletBalance != null && walletBalance < 30) {
      return Alert.alert('Insufficient funds', `A $${BID_FEE_USD} bid fee is deducted from your wallet. Top up first.`);
    }

    setSubmitting(true);
    const { error } = await supabase.rpc('place_bid', {
      p_job_id: jobId,
      p_contractor_id: user.id,
      p_price_cents: priceNum,
      p_eta_minutes: etaNum,
      p_message: message || null,
      p_bid_fee_cents: 30,
    });
    setSubmitting(false);

    if (error) return Alert.alert('Bid failed', error.message);
    Alert.alert('Bid placed', 'The homeowner will be notified. Good luck!');
    router.back();
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.canvas }}>
        <ActivityIndicator size="large" color={COLORS.brand.DEFAULT} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: COLORS.canvas }}
      contentContainerStyle={{ padding: 24, paddingTop: 64, paddingBottom: 48 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.ink.DEFAULT }}>
        Place your bid
      </Text>
      <Text style={{ color: COLORS.ink.muted, marginTop: 2 }}>
        {job?.title}
      </Text>

      {walletBalance !== null && (
        <View style={{ marginTop: 16, backgroundColor: COLORS.brand.soft, borderRadius: 12, padding: 14 }}>
          <Text style={{ fontSize: 13, color: COLORS.ink.muted }}>
            Wallet balance: ${(walletBalance / 100).toFixed(2)}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.ink.muted, marginTop: 2 }}>
            A flat ${BID_FEE_USD} fee will be deducted when you bid.
          </Text>
        </View>
      )}

      {job?.target_price_cents != null && (
        <View style={{ marginTop: 12, backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
          <Text style={{ fontSize: 12, color: COLORS.ink.muted }}>Homeowner target price</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.brand.DEFAULT }}>
            ${(job.target_price_cents / 100).toFixed(2)}
          </Text>
        </View>
      )}

      <View style={{ marginTop: 20, gap: 16 }}>
        <View>
          <Text style={styles.label}>Your bid price ($)</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder={job?.target_price_cents ? `Around $${(job.target_price_cents / 100).toFixed(0)}` : 'e.g. 350'}
            placeholderTextColor={COLORS.ink.light}
            style={styles.input}
          />
        </View>
        <View>
          <Text style={styles.label}>ETA to arrive (minutes)</Text>
          <TextInput
            value={eta}
            onChangeText={setEta}
            keyboardType="number-pad"
            placeholder="30"
            placeholderTextColor={COLORS.ink.light}
            style={styles.input}
          />
        </View>
        <View>
          <Text style={styles.label}>Message to homeowner (optional)</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            placeholder="Tell them why you're the right pro for this job…"
            placeholderTextColor={COLORS.ink.light}
            style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={submit}
        disabled={submitting}
        style={{
          marginTop: 24,
          backgroundColor: COLORS.brand.DEFAULT,
          padding: 16,
          borderRadius: 14,
          alignItems: 'center',
        }}
      >
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>
            Submit bid · ${BID_FEE_USD.toFixed(2)} fee
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: COLORS.ink.muted, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.ink.DEFAULT,
  },
});