import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { FIXED_ROLE, homeForRole } from '@/src/brand';
import type { AppRole } from '@/src/brand';

export default function IndexRedirect() {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const role = FIXED_ROLE ?? (session.user.user_metadata?.role as AppRole | undefined);
        setHref(homeForRole(role ?? 'homeowner'));
      } else {
        setHref('/login');
      }
    });
  }, []);

  if (!href) return <View style={{ flex: 1, backgroundColor: COLORS.canvas }} />;
  return <Redirect href={href} />;
}