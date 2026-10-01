import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { FIXED_ROLE, homeForRole, fixedProfileStub } from '@/src/brand';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup() {
    if (!fullName || !email || !password) return;
    if (password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) return Alert.alert('Signup failed', error.message);
    if (data.user) {
      if (FIXED_ROLE) {
        await supabase.from('profiles').upsert({ id: data.user.id, ...fixedProfileStub(FIXED_ROLE) });
        router.replace(homeForRole(FIXED_ROLE));
      } else {
        router.replace('/role-select');
      }
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 px-6 pt-16"
      style={{ backgroundColor: COLORS.canvas }}
    >
      <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.ink.DEFAULT }}>
        Join SimpleFix or ProFixit
      </Text>
      <Text style={{ marginTop: 4, color: COLORS.ink.muted }}>
        Create your free account in seconds.
      </Text>

      <View style={{ marginTop: 32, gap: 16 }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink.muted, marginBottom: 6 }}>
            Full name
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
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
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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
          onPress={handleSignup}
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
              Create account
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={{ textAlign: 'center', color: COLORS.ink.muted, fontSize: 14 }}>
            Have an account?{' '}
            <Text style={{ color: COLORS.brand.DEFAULT, fontWeight: '600' }}>
              Log in
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}