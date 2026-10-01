import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/src/theme';
import { initialsOf, timeAgo } from './types';
import type { ChatListItemData } from './types';

export default function ChatListItem({ chat }: { chat: ChatListItemData }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/chat/[chatId]', params: { chatId: chat.chatId } })}
      style={styles.row}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initialsOf(chat.counterpartName)}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text numberOfLines={1} style={styles.name}>
            {chat.counterpartName}
          </Text>
          {chat.lastMessageAt ? (
            <Text style={styles.time}>{timeAgo(chat.lastMessageAt)}</Text>
          ) : null}
        </View>

        {chat.jobTitle ? (
          <Text numberOfLines={1} style={styles.jobTitle}>
            {chat.jobTitle}
          </Text>
        ) : null}

        <Text numberOfLines={1} style={styles.preview}>
          {chat.lastMessage || (chat.counterpartSubtitle ?? 'Start a conversation')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.brand.DEFAULT,
    fontSize: 15,
    fontWeight: '700',
  },
  body: { flex: 1 },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.ink.DEFAULT, flex: 1 },
  time: { fontSize: 11, color: COLORS.ink.light },
  jobTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brand.DEFAULT,
    marginTop: 2,
  },
  preview: { fontSize: 13, color: COLORS.ink.muted, marginTop: 2 },
});