import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { formatCents, TRADE_CATEGORIES, TRADE_LABELS } from '@/src/shared';
import { ProfileAvatar, StatChip, InfoField, SignOutButton } from '@/src/components/profile';

interface ProfileRow {
  id: string;
  role: string;
  account_status: string;
  full_name: string;
  phone: string | null;
}

interface ContractorRow {
  id: string;
  trade_category: string;
  bio: string | null;
  years_experience: number | null;
  insurance_verified: boolean;
  background_verified: boolean;
  rating: number;
  rating_count: number;
  jobs_completed: number;
  service_radius_km: number;
  stripe_account_status: string;
}

export default function ContractorProfileScreen() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [contractor, setContractor] = useState<ContractorRow | null>(null);
  const [email, setEmail] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [earningsCents, setEarningsCents] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [trade, setTrade] = useState('general');
  const [bio, setBio] = useState('');
  const [years, setYears] = useState('');
  const [radius, setRadius] = useState('25');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      setEmail(user.email ?? '');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (profileData) {
        setProfile(profileData as ProfileRow);
        setName((profileData as ProfileRow).full_name);
        setPhone((profileData as ProfileRow).phone ?? '');
      }

      const { data: cpData } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (cpData) {
        const cp = cpData as ContractorRow;
        setContractor(cp);
        setTrade(cp.trade_category);
        setBio(cp.bio ?? '');
        setYears(cp.years_experience != null ? String(cp.years_experience) : '');
        setRadius(String(cp.service_radius_km));
      }

      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance_cents')
        .eq('contractor_id', user.id)
        .maybeSingle();
      if (walletData) setWalletBalance((walletData as { balance_cents: number }).balance_cents);

      const { data: walletIdData } = await supabase
        .from('wallets')
        .select('id')
        .eq('contractor_id', user.id)
        .maybeSingle();
      if (walletIdData) {
        const { data: txnData } = await supabase
          .from('wallet_transactions')
          .select('amount_cents')
          .eq('wallet_id', (walletIdData as { id: string }).id)
          .eq('type', 'job_payout')
          .eq('status', 'succeeded');
        if (txnData) {
          const total = (txnData as { amount_cents: number }[]).reduce((s, t) => s + t.amount_cents, 0);
          setEarningsCents(total);
        }
      }

      setLoading(false);
    })();
  }, []);

  async function save() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (!name.trim()) return Alert.alert('Name required', 'Please enter your full name.');
    const yearsNum = years ? parseInt(years, 10) : null;
    const radiusNum = parseInt(radius, 10) || 25;

    setSaving(true);
    if (profile?.phone !== null || phone.trim()) {
      const { error: pErr } = await supabase
        .from('profiles')
        .update({ full_name: name.trim(), phone: phone.trim() || null })
        .eq('id', user.id);
      if (pErr) {
        setSaving(false);
        return Alert.alert('Save failed', pErr.message);
      }
    }
    const { error: cErr } = await supabase
      .from('contractor_profiles')
      .upsert({
        id: user.id,
        trade_category: trade,
        bio: bio.trim() || null,
        years_experience: yearsNum,
        service_radius_km: radiusNum,
      })
      .eq('id', user.id);
    setSaving(false);
    if (cErr) return Alert.alert('Save failed', cErr.message);
    Alert.alert('Saved', 'Your pro profile was updated.');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand.DEFAULT} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: COLORS.canvas }}
      contentContainerStyle={{ padding: 24, paddingTop: 16, paddingBottom: 48 }}
    >
      <Text style={styles.title}>Profile & Earnings</Text>

      <View style={styles.headerCard}>
        <ProfileAvatar name={profile?.full_name || email} />
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={styles.headerName}>{profile?.full_name || 'Contractor'}</Text>
          <Text style={styles.headerSub}>
            {TRADE_LABELS[trade] ?? trade} · {email}
          </Text>
        </View>
        <View className="flex-row mt-3" style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {contractor?.insurance_verified ? <Text style={styles.badge}>✓ Insured</Text> : null}
          {contractor?.background_verified ? <Text style={styles.badge}>✓ Background checked</Text> : null}
          {contractor?.stripe_account_status !== 'active' ? (
            <Text style={[styles.badge, styles.badgeWarn]}>Payout setup pending</Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row mt-4" style={{ gap: 10 }}>
        <StatChip label="Rating" value={`★ ${Number(contractor?.rating ?? 0).toFixed(1)}`} />
        <StatChip label="Jobs done" value={String(contractor?.jobs_completed ?? 0)} />
        <StatChip
          label="Wallet"
          value={walletBalance != null ? formatCents(walletBalance) : '$0.00'}
        />
      </View>

      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Total earned from completed jobs</Text>
        <Text style={styles.earningsValue}>{formatCents(earningsCents)}</Text>
        <Text style={styles.earningsSub}>96–97% of every job, paid straight to your wallet.</Text>
      </View>

      <View style={{ marginTop: 24, gap: 16 }}>
        <InfoField label="Full name" value={name} onChangeText={setName} />
        <InfoField label="Phone" value={phone} onChangeText={setPhone} />
        <View>
          <Text style={styles.fieldLabel}>Trade</Text>
          <View className="flex-row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {TRADE_CATEGORIES.map((cat) => {
              const active = trade === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setTrade(cat)}
                  style={[
                    styles.tradeChip,
                    active && { backgroundColor: COLORS.brand.DEFAULT, borderColor: COLORS.brand.DEFAULT },
                  ]}
                >
                  <Text style={[styles.tradeText, active && { color: '#FFF' }]}>
                    {TRADE_LABELS[cat] ?? cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <InfoField label="Bio" value={bio} onChangeText={setBio} multiline />
        <View className="flex-row" style={{ gap: 12 }}>
          <View className="flex-1">
            <InfoField label="Years experience" value={years} onChangeText={setYears} />
          </View>
          <View className="flex-1">
            <InfoField label="Radius (km)" value={radius} onChangeText={setRadius} />
          </View>
        </View>
        <View>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={styles.readonlyRow}>
            <Text style={styles.readonlyText}>{email}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={save}
        disabled={saving}
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
      >
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveText}>Save changes</Text>
        )}
      </TouchableOpacity>

      <SignOutButton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.canvas },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.ink.DEFAULT },
  headerCard: {
    marginTop: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
  },
  headerName: { fontSize: 18, fontWeight: '800', color: COLORS.ink.DEFAULT },
  headerSub: { fontSize: 13, color: COLORS.ink.muted, marginTop: 2, textAlign: 'center' },
  badge: {
    backgroundColor: COLORS.brand.soft,
    color: COLORS.brand.DEFAULT,
    fontWeight: '600',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeWarn: { backgroundColor: '#FEF3C7', color: '#B45309' },
  earningsCard: {
    marginTop: 16,
    backgroundColor: COLORS.brand.DEFAULT,
    borderRadius: 18,
    padding: 20,
  },
  earningsLabel: { color: COLORS.brand.soft, fontSize: 13, fontWeight: '600' },
  earningsValue: { color: '#FFF', fontSize: 32, fontWeight: '800', marginTop: 4 },
  earningsSub: { color: COLORS.brand.light, fontSize: 12, marginTop: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.ink.muted, marginBottom: 6 },
  tradeChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tradeText: { fontSize: 13, fontWeight: '600', color: COLORS.ink.DEFAULT },
  readonlyRow: {
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
  },
  readonlyText: { fontSize: 15, color: COLORS.ink.light },
  saveBtn: {
    marginTop: 24,
    backgroundColor: COLORS.brand.DEFAULT,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});