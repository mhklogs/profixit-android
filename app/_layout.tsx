import '@/src/lib/supabase';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { FIXED_ROLE, homeForRole } from '@/src/brand';

type Role = 'homeowner' | 'contractor';

function useAuthSession() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const first = segments[0] as string | undefined;

      if (!session) {
        if (first !== '(auth)') router.replace('/login');
      } else {
        const role = FIXED_ROLE ?? (session.user.user_metadata.role as Role | undefined);
        if (first === '(auth)') {
          router.replace(homeForRole(role ?? 'homeowner'));
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
    });

    return () => subscription.unsubscribe();
  }, [segments, router]);
}

export default function RootLayout() {
  useAuthSession();

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.canvas } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(homeowner)" />
        <Stack.Screen name="(contractor)" />
        <Stack.Screen name="bid" />
        <Stack.Screen name="chat/[chatId]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}