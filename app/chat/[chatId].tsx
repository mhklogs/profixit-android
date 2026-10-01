import { useLocalSearchParams } from 'expo-router';
import ChatConversationView from '@/src/components/chat/ChatConversationView';

export default function ConversationScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  return <ChatConversationView chatId={chatId} />;
}