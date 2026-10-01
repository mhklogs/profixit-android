import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { ProfileAvatar, InfoField, SignOutButton } from '@/src/components/profile';

interface ProfileRow {
  id: string;
  role: string;
  account_status: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
}

export default function HomeownerProfileScreen() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      setEmail(user.email ?? '');

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) {
        setProfile(data as ProfileRow);
        setName((data as ProfileRow).full_name);
        setPhone((data as ProfileRow).phone ?? '');
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    if (!name.trim()) return Alert.alert('Name required', 'Please enter your full name.');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), phone: phone.trim() || null })
      .eq('id', user.id);
    setSaving(false);
    if (error) return Alert.alert('Save failed', error.message);
    Alert.alert('Saved', 'Your profile was updated.');
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
      <Text style={styles.title}>Profile</Text>

      <View style={styles.headerCard}>
        <ProfileAvatar name={profile?.full_name || email} />
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={styles.headerName}>{profile?.full_name || 'Homeowner'}</Text>
          <Text style={styles.headerSub}>{email}</Text>
        </View>
        <Text style={styles.roleBadge}>Homeowner</Text>
      </View>

      <View style={{ marginTop: 24, gap: 16 }}>
        <InfoField label="Full name" value={name} onChangeText={setName} />
        <InfoField label="Phone" value={phone} onChangeText={setPhone} />
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
  headerSub: { fontSize: 13, color: COLORS.ink.muted, marginTop: 2 },
  roleBadge: {
    marginTop: 10,
    backgroundColor: COLORS.brand.soft,
    color: COLORS.brand.DEFAULT,
    fontWeight: '600',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.ink.muted, marginBottom: 6 },
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