import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { BID_FEE_USD, TRADE_LABELS, haversineDistanceKm } from '@/src/shared';
import type { Job, GeoPoint } from '@/src/shared';

interface JobWithLocation extends Job {
  location: GeoPoint;
  distance_km?: number;
}

export default function JobFeedScreen() {
  const [jobs, setJobs] = useState<JobWithLocation[]>([]);
  const [profile, setProfile] = useState<{ trade_category: string; service_radius_km: number; id: string } | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [biddingOn, setBiddingOn] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      const { data: cp } = await supabase
        .from('contractor_profiles')
        .select('trade_category, service_radius_km, id')
        .eq('id', user.id)
        .single();
      if (cp) setProfile(cp);
    })();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase
        .from('jobs')
        .select('*, location:location_id(*)')
        .in('status', ['open', 'bid_placed'])
        .order('created_at', { ascending: false });
      if (!mounted || !data) return;

      const enriched: JobWithLocation[] = data
        .filter((j) => !profile || j.category === profile.trade_category || profile.trade_category === 'general')
        .map((j) => {
          const loc = Array.isArray(j.location) ? j.location[0] : j.location;
          const distance =
            userCoords && loc
              ? haversineDistanceKm(userCoords.lat, userCoords.lng, loc.lat, loc.lng)
              : undefined;
          return { ...(j as Job), location: loc, distance_km: distance };
        })
        .filter((j) => !j.distance_km || (profile && j.distance_km <= profile.service_radius_km))
        .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));

      setJobs(enriched);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel('contractor-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile, userCoords]);

  function placeBid(job: JobWithLocation) {
    setBiddingOn(job.id);
    router.push({ pathname: '/bid', params: { jobId: job.id } });
    setBiddingOn(null);
  }

  // Quick-bid at target when a target price exists
  async function quickBid(job: JobWithLocation, priceCents: number) {
    setBiddingOn(job.id);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBiddingOn(null);
      return Alert.alert('Auth required', 'Please log in.');
    }

    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance_cents')
      .eq('contractor_id', user.id)
      .single();

    if (!wallet || wallet.balance_cents < 30) {
      setBiddingOn(null);
      return Alert.alert('Add funds', `Bids cost $${BID_FEE_USD}. Top up your wallet first.`);
    }

    const { error } = await supabase.rpc('place_bid', {
      p_job_id: job.id,
      p_contractor_id: user.id,
      p_price_cents: priceCents,
      p_eta_minutes: 30,
      p_message: 'Available now — ready to start within 30 minutes.',
    });

    setBiddingOn(null);
    if (error) {
      return Alert.alert('Bid failed', error.message);
    }
    Alert.alert('Bid placed', 'Your bid was submitted. Good luck!');
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: COLORS.canvas }}>
        <ActivityIndicator size="large" color={COLORS.brand.DEFAULT} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.canvas }}>
      <View className="px-6 pt-16 pb-4">
        <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.ink.DEFAULT }}>
          Live Jobs Near You
        </Text>
        <Text style={{ color: COLORS.ink.muted, marginTop: 2 }}>
          {profile ? `Bidding as ${TRADE_LABELS[profile.trade_category] ?? profile.trade_category}` : 'Verified contractor'} · $0.30 per bid
        </Text>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text style={{ fontSize: 34 }}>🦺</Text>
            <Text style={{ color: COLORS.ink.muted, marginTop: 8, textAlign: 'center' }}>
              No open jobs in your area right now.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: 16,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink.DEFAULT }}>
                {item.title}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.ink.muted }}>
                {item.distance_km ? `${item.distance_km.toFixed(1)} km away` : 'nearby'}
              </Text>
            </View>
            <Text numberOfLines={2} style={{ color: COLORS.ink.muted, marginTop: 4 }}>
              {item.description}
            </Text>
            <View className="flex-row mt-3" style={{ gap: 8 }}>
              <Text style={styles.tag}>
                {TRADE_LABELS[item.category] ?? item.category}
              </Text>
              {item.price_basis === 'target' && item.target_price_cents != null && (
                <Text style={styles.tag}>
                  Target ${(item.target_price_cents / 100).toFixed(0)}
                </Text>
              )}
              <Text style={styles.tag}>🔥 {item.media.length} media</Text>
            </View>

            {item.price_basis === 'open_bidding' ? (
              <TouchableOpacity
                onPress={() => placeBid(item)}
                disabled={biddingOn === item.id}
                style={{
                  marginTop: 14,
                  backgroundColor: COLORS.brand.DEFAULT,
                  padding: 13,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                {biddingOn === item.id ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>
                    💰 Place your bid
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => item.target_price_cents != null && quickBid(item, item.target_price_cents)}
                disabled={biddingOn === item.id}
                style={{
                  marginTop: 14,
                  backgroundColor: COLORS.brand.soft,
                  padding: 13,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                {biddingOn === item.id ? (
                  <ActivityIndicator color={COLORS.brand.DEFAULT} />
                ) : (
                  <Text style={{ color: COLORS.brand.DEFAULT, fontWeight: '700' }}>
                    ⚡ Accept target bid
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    backgroundColor: COLORS.brand.soft,
    color: COLORS.brand.DEFAULT,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
});