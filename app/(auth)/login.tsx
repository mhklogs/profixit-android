import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { FIXED_ROLE, homeForRole } from '@/src/brand';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return Alert.alert('Login failed', error.message);
    const role = FIXED_ROLE ?? (data.user?.user_metadata?.role as 'homeowner' | 'contractor' | undefined);
    router.replace(homeForRole(role ?? 'homeowner'));
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 px-6 pt-16"
      style={{ backgroundColor: COLORS.canvas }}
    >
      <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.ink.DEFAULT }}>
        Welcome back
      </Text>
      <Text style={{ marginTop: 4, color: COLORS.ink.muted }}>
        Log in to SimpleFix or ProFixit
      </Text>

      <View style={{ marginTop: 32, gap: 16 }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink.muted, marginBottom: 6 }}>
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@email.com"
            placeholderTextColor={COLORS.ink.light}
            style={{
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              color: COLORS.ink.DEFAULT,
            }}
          />
        </View>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink.muted, marginBottom: 6 }}>
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Your password"
            placeholderTextColor={COLORS.ink.light}
            style={{
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              color: COLORS.ink.DEFAULT,
            }}
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: COLORS.brand.DEFAULT,
            borderRadius: 14,
            padding: 16,
            alignItems: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
              Log in
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={{ textAlign: 'center', color: COLORS.ink.muted, fontSize: 14 }}>
            New here?{' '}
            <Text style={{ color: COLORS.brand.DEFAULT, fontWeight: '600' }}>
              Create an account
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}