import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import type { Job, Bid } from '@/src/shared';

interface BidWithProfile extends Bid {
  contractor?: {
    full_name: string;
    rating: number;
    rating_count: number;
    trade_category: string;
    jobs_completed: number;
  } | null;
}

export default function LiveRadarScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [bids, setBids] = useState<BidWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const sweep = useRef(new Animated.Value(0)).current;
  const loadedJobId = useRef<string | null>(null);

  const tick = () => {
    Animated.sequence([
      Animated.timing(sweep, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: true,
      }),
      Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) tick(); });
  };

  useEffect(() => {
    tick();
    return () => sweep.stopAnimation();
  }, [sweep]);

  useEffect(() => {
    if (!jobId || loadedJobId.current === jobId) return;
    loadedJobId.current = jobId;

    const load = async () => {
      const [{ data: jobData }, { data: bidData }] = await Promise.all([
        supabase.from('jobs').select('*').eq('id', jobId).single(),
        supabase
          .from('bids')
          .select('*, contractor:contractor_profiles(full_name, rating, rating_count, trade_category, jobs_completed, profiles!inner(full_name))')
          .eq('job_id', jobId)
          .order('price_cents', { ascending: true }),
      ]);
      if (jobData) setJob(jobData as Job);
      if (bidData) setBids(bidData as BidWithProfile[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `job_id=eq.${jobId}` },
        async (payload) => {
          const b = payload.new as Bid;
          const { data: profile } = await supabase
            .from('contractor_profiles')
            .select('full_name, rating, rating_count, trade_category, jobs_completed, profiles!inner(full_name)')
            .eq('id', b.contractor_id)
            .single();
          setBids((prev) => {
            const existing = prev.some((p) => p.id === b.id);
            if (existing) return prev;
            const item: BidWithProfile = profile
              ? { ...b, contractor: profile }
              : b;
            return [...prev, item].sort((a, b) => a.price_cents - b.price_cents);
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` },
        (payload) => setJob(payload.new as Job),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  async function acceptBid(bid: BidWithProfile) {
    setAccepting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAccepting(false);
      return Alert.alert('Auth required', 'Please log in first.');
    }

    const { data: escrow, error } = await supabase.rpc('accept_bid', {
      p_job_id: jobId,
      p_bid_id: bid.id,
    });
    setAccepting(false);

    if (error) return Alert.alert('Could not accept bid', error.message);
    if (!escrow) return;

    // Present payment to hold funds in escrow.
    const res = await fetch('/api/stripe/escrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, bidId: bid.id }),
    });
    const { clientSecret } = await res.json();
    if (clientSecret) {
      // Wire into Stripe payment sheet (StripeProvider wraps the app).
      Alert.alert(
        'Bid accepted',
        'Complete payment to hold funds securely in escrow.',
        [{ text: 'OK', onPress: () => openPaymentSheet(clientSecret) }],
      );
    }
  }

  function openPaymentSheet(_clientSecret: string) {
    // PaymentSheet integration lives in a wrapper provider once STRIPE keys are set.
    Alert.alert('Payments', 'PaymentSheet will open here once Stripe is configured.');
  }

  const sweepRotate = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brand.DEFAULT} /></View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.canvas }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-16">
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.ink.muted }}>
            LIVE BIDDING
          </Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.ink.DEFAULT }}>
            {job?.title}
          </Text>
          <Text style={{ color: COLORS.ink.muted, marginTop: 4 }}>{job?.description}</Text>
        </View>

        {/* Radar */}
        <View style={styles.radar}>
          <View style={[styles.radarRing, { width: 340, height: 340 }]} />
          <View style={[styles.radarRing, { width: 240, height: 240 }]} />
          <View style={[styles.radarRing, { width: 140, height: 140 }]} />
          <Animated.View style={[styles.sweep, { transform: [{ rotate: sweepRotate }] }]} />
          <View style={styles.centerPin}>
            <Text style={{ fontSize: 30 }}>🔨</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.brand.DEFAULT, marginTop: 2 }}>
              {bids.length} {bids.length === 1 ? 'bid' : 'bids'}
            </Text>
          </View>

          {bids.map((bid, idx) => {
            const angle = (idx * 137.5) * Math.PI / 180; // golden angle
            const r = 90 + (idx % 3) * 40;
            return (
              <View
                key={bid.id}
                style={[
                  styles.bidPill,
                  { transform: [{ translateX: Math.cos(angle) * r - 70 }, { translateY: Math.sin(angle) * r - 60 }] },
                ]}
              >
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: COLORS.ink.DEFAULT, maxWidth: 118 }}>
                  {bid.contractor?.full_name ?? 'Pro'}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.brand.DEFAULT }}>
                  ${(bid.price_cents / 100).toFixed(0)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Bid list */}
        <View className="px-6 mt-6" style={{ gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink.DEFAULT }}>
            Incoming bids
          </Text>
          {bids.length === 0 ? (
            <View className="items-center py-10 rounded-2xl" style={{ backgroundColor: COLORS.surface }}>
              <Text style={{ fontSize: 30 }}>📡</Text>
              <Text style={{ color: COLORS.ink.muted, marginTop: 8, textAlign: 'center' }}>
                Waiting for local pros to bid…
              </Text>
            </View>
          ) : (
            bids.map((bid) => {
              const rejected = ['accepted', 'declined'].includes(bid.status);
              return (
                <View
                  key={bid.id}
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: bid.status === 'accepted' ? COLORS.brand.DEFAULT : COLORS.border,
                    padding: 16,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink.DEFAULT }}>
                        {bid.contractor?.full_name ?? 'Verified contractor'}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.ink.muted, marginTop: 2 }}>
                        ⭐ {Number(bid.contractor?.rating ?? 0).toFixed(1)} ·{' '}
                        {bid.contractor?.jobs_completed ?? 0} jobs · {bid.eta_minutes} min out
                      </Text>
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.brand.DEFAULT }}>
                      ${(bid.price_cents / 100).toFixed(2)}
                    </Text>
                  </View>
                  {bid.message ? (
                    <Text style={{ color: COLORS.ink.muted, marginTop: 8, fontSize: 13 }}>
                      “{bid.message}”
                    </Text>
                  ) : null}
                  {!rejected && job?.status === 'open' && (
                    <TouchableOpacity
                      onPress={() => acceptBid(bid)}
                      disabled={accepting}
                      style={{
                        marginTop: 12,
                        backgroundColor: COLORS.brand.DEFAULT,
                        padding: 12,
                        borderRadius: 12,
                        alignItems: 'center',
                      }}
                    >
                      {accepting ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={{ color: '#FFF', fontWeight: '700' }}>
                          Accept bid · ${(bid.price_cents / 100).toFixed(2)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                  {bid.status === 'accepted' && (
                    <Text style={{ color: COLORS.brand.DEFAULT, fontWeight: '600', marginTop: 12, textAlign: 'center' }}>
                      ✓ Bid accepted — funds held in escrow
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.canvas },
  radar: {
    height: 360,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand.soft,
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  radarRing: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(46,125,50,0.15)' },
  sweep: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 340,
    backgroundColor: 'rgba(102,187,106,0.06)',
  },
  centerPin: { alignItems: 'center', justifyContent: 'center' },
  bidPill: {
    position: 'absolute',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 140,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
  },
});