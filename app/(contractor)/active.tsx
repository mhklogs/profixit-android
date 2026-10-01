import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { JOB_STATUS_LABELS } from '@/src/shared';
import type { Job } from '@/src/shared';

export default function ActiveJobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('contractor_id', user.id)
        .in('status', ['accepted', 'in_progress', 'awaiting_confirmation'])
        .order('updated_at', { ascending: false });
      if (data) setJobs(data as Job[]);
      setLoading(false);
    })();
  }, []);

  async function advanceStatus(job: Job, newStatus: string) {
    setActing(job.id);
    const rpc = newStatus === 'in_progress' ? 'mark_in_progress' : 'request_completion';
    const { error } = await supabase.rpc(rpc, { p_job_id: job.id, p_status: newStatus });
    setActing(null);
    if (error) return Alert.alert('Error', error.message);
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, status: newStatus as any } : j)),
    );
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
        <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.ink.DEFAULT }}>
          My Active Jobs
        </Text>
      </View>
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text style={{ fontSize: 34 }}>🛠️</Text>
            <Text style={{ color: COLORS.ink.muted, marginTop: 8 }}>No active jobs right now.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16 }}>
            <View className="flex-row items-center justify-between">
              <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink.DEFAULT, flex: 1 }}>
                {item.title}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.brand.DEFAULT, fontWeight: '600' }}>
                {JOB_STATUS_LABELS[item.status as keyof typeof JOB_STATUS_LABELS]}
              </Text>
            </View>
            <Text numberOfLines={2} style={{ color: COLORS.ink.muted, marginTop: 4, fontSize: 13 }}>
              {item.description}
            </Text>

            {item.status === 'accepted' && (
              <TouchableOpacity
                onPress={() => advanceStatus(item, 'in_progress')}
                disabled={acting === item.id}
                style={{ marginTop: 12, backgroundColor: COLORS.brand.DEFAULT, padding: 12, borderRadius: 12, alignItems: 'center' }}
              >
                {acting === item.id ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>🚗 Start heading to job</Text>
                )}
              </TouchableOpacity>
            )}
            {item.status === 'in_progress' && (
              <TouchableOpacity
                onPress={() => advanceStatus(item, 'awaiting_confirmation')}
                disabled={acting === item.id}
                style={{ marginTop: 12, backgroundColor: COLORS.success, padding: 12, borderRadius: 12, alignItems: 'center' }}
              >
                {acting === item.id ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>✓ Mark complete</Text>
                )}
              </TouchableOpacity>
            )}
            {item.status === 'awaiting_confirmation' && (
              <Text style={{ color: COLORS.ink.muted, marginTop: 12, textAlign: 'center', fontSize: 13 }}>
                Waiting for homeowner to confirm…
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
}