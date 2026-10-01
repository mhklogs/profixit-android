import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import ChatListItem from '@/src/components/chat/ChatListItem';
import type { ChatListItemData, OrArray } from '@/src/components/chat/types';
import { first } from '@/src/components/chat/types';

interface ChatRowEmbed {
  id: string;
  job_id: string | null;
  contractor_id: string;
  created_at: string;
  job: OrArray<{ title: string }> | null;
  contractor?: OrArray<{ trade_category: string; profiles: OrArray<{ full_name: string }> }> | null;
}

export default function HomeownerMessagesScreen() {
  const [chats, setChats] = useState<ChatListItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('chats')
        .select(
          'id, job_id, contractor_id, created_at, job:jobs(title), contractor:contractor_profiles(trade_category, profiles!inner(full_name))',
        )
        .eq('homeowner_id', user.id)
        .order('created_at', { ascending: false });

      if (!data || !mounted) return;

      const chatIds = (data as ChatRowEmbed[]).map((c) => c.id);
      const lastByChat = new Map<string, { body: string; created_at: string }>();

      if (chatIds.length > 0) {
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('chat_id, body, created_at')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: false });
        if (msgs) {
          for (const m of msgs) {
            if (!lastByChat.has(m.chat_id)) lastByChat.set(m.chat_id, { body: m.body, created_at: m.created_at });
          }
        }
      }

      const list: ChatListItemData[] = (data as ChatRowEmbed[]).map((c) => {
        const last = lastByChat.get(c.id);
        const contractor = first(c.contractor);
        return {
          chatId: c.id,
          jobTitle: first(c.job)?.title ?? null,
          counterpartName: contractor ? first(contractor.profiles)?.full_name ?? 'Contractor' : 'Contractor',
          counterpartSubtitle: contractor?.trade_category ?? null,
          lastMessage: last?.body ?? null,
          lastMessageAt: last?.created_at ?? null,
          createdAt: c.created_at,
        };
      });

      list.sort((a, b) => (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt));
      setChats(list);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel('homeowner-chat-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand.DEFAULT} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.canvas }}>
      <View style={styles.heading}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Chat with contractors about your jobs.</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={(c) => c.chatId}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 34 }}>💬</Text>
            <Text style={styles.emptyText}>
              No conversations yet. Accept a bid on a job and you can chat with the pro here.
            </Text>
          </View>
        }
        renderItem={({ item }) => <ChatListItem chat={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.canvas },
  heading: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.ink.DEFAULT },
  subtitle: { fontSize: 13, color: COLORS.ink.muted, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: COLORS.ink.muted, marginTop: 10, textAlign: 'center', paddingHorizontal: 32 },
});