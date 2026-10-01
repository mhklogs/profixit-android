import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { FIXED_ROLE, homeForRole } from '@/src/brand';

type Role = 'homeowner' | 'contractor';

const CARDS: { role: Role; emoji: string; title: string; desc: string }[] = [
  {
    role: 'homeowner',
    emoji: '🏠',
    title: 'SimpleFix',
    desc: "I'm a homeowner — post jobs and watch local pros bid on them live.",
  },
  {
    role: 'contractor',
    emoji: '🔧',
    title: 'ProFixit',
    desc: "I'm a contractor — browse live job feeds and get paid for the work you do.",
  },
];

export default function RoleSelectScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (FIXED_ROLE) router.replace(homeForRole(FIXED_ROLE));
  }, [router]);

  async function select(role: Role) {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const fullName = (user.user_metadata.full_name as string | undefined)?.trim() || '';
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      role,
      account_status: role === 'homeowner' ? 'active' : 'pending',
      full_name: fullName || 'User',
    });
    setLoading(false);
    if (profileError) return Alert.alert('Error', profileError.message);

    if (role === 'homeowner') {
      router.replace('/feed');
    } else {
      router.replace('/radar');
    }
  }

  return (
    <View
      className="flex-1 px-6 justify-center"
      style={{ backgroundColor: COLORS.canvas }}
    >
      <Text style={{ fontSize: 26, fontWeight: '800', color: COLORS.ink.DEFAULT, textAlign: 'center' }}>
        Which app do you need?
      </Text>
      <Text style={{ marginTop: 6, color: COLORS.ink.muted, textAlign: 'center' }}>
        Choose your role. You can switch later.
      </Text>

      <View style={{ marginTop: 40, gap: 16 }}>
        {CARDS.map((card) => (
          <TouchableOpacity
            key={card.role}
            onPress={() => select(card.role)}
            disabled={loading}
            style={{
              backgroundColor: COLORS.surface,
              borderWidth: 1.5,
              borderColor: COLORS.border,
              borderRadius: 18,
              padding: 22,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Text style={{ fontSize: 34 }}>{card.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.ink.DEFAULT }}>
                {card.title}
              </Text>
              <Text style={{ marginTop: 2, color: COLORS.ink.muted, fontSize: 13 }}>
                {card.desc}
              </Text>
            </View>
            <Text style={{ color: COLORS.brand.DEFAULT, fontSize: 18, fontWeight: '600' }}>
              ›
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}