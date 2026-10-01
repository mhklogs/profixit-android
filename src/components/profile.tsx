import { View, Text, Alert, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { initialsOf } from './chat/types';

export function ProfileAvatar({ name, size = 72 }: { name: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: COLORS.brand.soft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: COLORS.brand.DEFAULT, fontSize: size * 0.36, fontWeight: '800' }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

export function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function InfoField({
  label,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  multiline?: boolean;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholderTextColor={COLORS.ink.light}
        style={{
          backgroundColor: COLORS.canvas,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          fontSize: 15,
          color: COLORS.ink.DEFAULT,
          padding: 14,
          minHeight: multiline ? 80 : 48,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) return Alert.alert('Sign out failed', error.message);
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() =>
        Alert.alert('Sign out', 'Are you sure you want to sign out?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign out',
            style: 'destructive',
            onPress: async () => {
              await signOutUser();
              router.replace('/(auth)/login');
            },
          },
        ])
      }
      style={styles.signOut}
    >
      <Text style={styles.signOutText}>Sign out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.ink.DEFAULT },
  statLabel: { fontSize: 11, color: COLORS.ink.muted, marginTop: 2, textAlign: 'center' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.ink.muted, marginBottom: 6 },
  signOut: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  signOutText: { color: COLORS.error, fontWeight: '700', fontSize: 15 },
});