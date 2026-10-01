import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { first, initialsOf } from './types';
import type { ChatMessageRow } from './types';

interface ChatWithEmbeds {
  id: string;
  job_id: string | null;
  homeowner_id: string;
  contractor_id: string;
  job: { title: string }[] | null;
  contractor?: {
    id: string;
    trade_category: string;
    profiles: { full_name: string }[];
  }[] | null;
  homeowner?: { full_name: string }[] | null;
}

export default function ChatConversationView({ chatId }: { chatId: string }) {
  const router = useRouter();
  const [chat, setChat] = useState<ChatWithEmbeds | null>(null);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const userIdRef = useRef<string | null>(null);
  const listRef = useRef<FlatList<ChatMessageRow>>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      userIdRef.current = user.id;

      const { data: chatData } = await supabase
        .from('chats')
        .select(
          'id, job_id, homeowner_id, contractor_id, job:jobs(title), contractor:contractor_profiles(id, trade_category, profiles!inner(full_name)), homeowner:profiles(full_name)',
        )
        .eq('id', chatId)
        .single();
      if (chatData) setChat(chatData as ChatWithEmbeds);

      await loadMessages();
      setLoading(false);
    })();
  }, [chatId]);

  async function loadMessages() {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as ChatMessageRow[]);
  }

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const msg = payload.new as ChatMessageRow;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const isHomeowner = chat ? chat.homeowner_id === userIdRef.current : true;
  const counterpartName = isHomeowner
    ? first(chat?.contractor)?.profiles[0]?.full_name ?? 'Contractor'
    : first(chat?.homeowner)?.full_name ?? 'Homeowner';

  async function send() {
    const body = draft.trim();
    const myId = userIdRef.current;
    if (!body || !myId) return;
    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      chat_id: chatId,
      sender_id: myId,
      body,
    });
    setSending(false);
    if (error) {
      return Alert.alert('Could not send', error.message);
    }
    setDraft('');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand.DEFAULT} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{counterpartName}</Text>
          {first(chat?.job)?.title ? (
            <Text numberOfLines={1} style={styles.headerSub}>
              {first(chat?.job)?.title}
            </Text>
          ) : null}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 30 }}>💬</Text>
            <Text style={styles.emptyText}>No messages yet. Say hello and agree on details.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const mine = item.sender_id === userIdRef.current;
          return (
            <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
                  {item.body}
                </Text>
                <Text style={[styles.bubbleTime, mine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message…"
          placeholderTextColor={COLORS.ink.light}
          multiline
          style={styles.input}
        />
        <TouchableOpacity
          onPress={send}
          disabled={sending || !draft.trim()}
          style={[styles.sendBtn, (!draft.trim() || sending) && { opacity: 0.5 }]}
        >
          {sending ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.sendText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 24, lineHeight: 28, color: COLORS.brand.DEFAULT, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.ink.DEFAULT },
  headerSub: { fontSize: 12, color: COLORS.ink.muted, marginTop: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: COLORS.ink.muted, marginTop: 8, textAlign: 'center' },
  bubbleWrap: { flexDirection: 'row' },
  bubbleWrapMine: { justifyContent: 'flex-end' },
  bubbleWrapTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: COLORS.brand.DEFAULT, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTextMine: { color: '#FFFFFF' },
  bubbleTextTheirs: { color: COLORS.ink.DEFAULT },
  bubbleTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.75)' },
  bubbleTimeTheirs: { color: COLORS.ink.light },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    paddingBottom: 28,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.ink.DEFAULT,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
});