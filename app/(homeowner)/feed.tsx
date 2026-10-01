import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { JOB_STATUS_LABELS } from '@/src/shared';
import type { Job } from '@/src/shared';

export default function FeedScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (mounted && data) setJobs(data as Job[]);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel('homeowner-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        () => load(),
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

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
          My Jobs
        </Text>
        <Text style={{ color: COLORS.ink.muted, marginTop: 2 }}>
          Track bids, status, and escrow.
        </Text>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text style={{ fontSize: 34 }}>🗂️</Text>
            <Text style={{ color: COLORS.ink.muted, marginTop: 8 }}>No jobs yet.</Text>
            <TouchableOpacity
              onPress={() => router.push('/broadcast')}
              style={{
                marginTop: 16,
                backgroundColor: COLORS.brand.soft,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: COLORS.brand.DEFAULT, fontWeight: '600' }}>
                Post your first job
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: 16,
            }}
            onPress={() => router.push({ pathname: '/live-radar', params: { jobId: item.id } })}
          >
            <View className="flex-row items-center justify-between">
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink.DEFAULT }}>
                {item.title}
              </Text>
              <Text
                style={{
                  color: item.status === 'open' ? COLORS.success : COLORS.brand.DEFAULT,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {JOB_STATUS_LABELS[item.status as keyof typeof JOB_STATUS_LABELS] ?? item.status}
              </Text>
            </View>
            <Text numberOfLines={2} style={{ color: COLORS.ink.muted, marginTop: 4 }}>
              {item.description}
            </Text>
            {item.target_price_cents != null && (
              <Text style={{ color: COLORS.brand.DEFAULT, fontWeight: '700', marginTop: 8 }}>
                Target: ${(item.target_price_cents / 100).toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}