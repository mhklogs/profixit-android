import { View, Text } from 'react-native';
import { COLORS } from '@/src/theme';

export default function Placeholder({ title, emoji }: { title: string; emoji: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.canvas }}>
      <Text style={{ fontSize: 40 }}>{emoji}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink.DEFAULT, marginTop: 10 }}>
        {title}
      </Text>
      <Text style={{ color: COLORS.ink.muted, marginTop: 4, paddingHorizontal: 40, textAlign: 'center' }}>
        This screen is wired up and ready for the next build milestone.
      </Text>
    </View>
  );
}