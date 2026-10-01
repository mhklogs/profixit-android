import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Switch, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/theme';
import { TRADE_CATEGORIES, TRADE_LABELS } from '@/src/shared';
import type { JobMedia } from '@/src/shared';

export default function BroadcastScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [openBidding, setOpenBidding] = useState(true);
  const [media, setMedia] = useState<JobMedia[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();

  async function pickImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (result.canceled) return;
    const items: JobMedia[] = result.assets.map((a) => ({
      url: a.uri,
      type: a.type === 'video' ? 'video' : 'photo',
    }));
    setMedia((prev) => [...prev, ...items].slice(0, 3));
  }

  async function locate() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Location needed', 'Allow location to broadcast your job to nearby pros.');
    }
    const pos = await Location.getCurrentPositionAsync({});
    setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
  }

  async function uploadAsset(uri: string) {
    const ext = uri.split('.').pop() ?? 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data: fileData } = await supabase.storage
      .from('job-media')
      .upload(path, { uri, type: `image/${ext}`, name: path } as any, {
        contentType: 'image/*',
      });
    if (fileData?.path) {
      const { data: publicUrl } = supabase.storage.from('job-media').getPublicUrl(fileData.path);
      return publicUrl.publicUrl;
    }
    return null;
  }

  async function broadcast() {
    if (!title || !description || !category) {
      return Alert.alert('Missing info', 'Add a title, description, and trade category.');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Alert.alert('Auth required', 'Please log in first.');

    if (!geo) {
      return Alert.alert('Location needed', 'Tap “Get my location” to set the job location.');
    }

    setSubmitting(true);
    const mediaUrls: JobMedia[] = [];
    for (const item of media) {
      const url = await uploadAsset(item.url);
      if (url) mediaUrls.push({ url, type: item.type });
    }

    const { data: loc, error: locError } = await supabase.from('geo_points').insert({
      lat: geo.lat,
      lng: geo.lng,
      address_line1: 'Job location',
      city: '',
      state: '',
      postal_code: '',
    }).select('*').single();

    if (locError || !loc) {
      setSubmitting(false);
      return Alert.alert('Error', 'Could not save location.');
    }

    const { data: job, error } = await supabase.from('jobs').insert({
      homeowner_id: user.id,
      title,
      description,
      category,
      price_basis: openBidding ? 'open_bidding' : 'target',
      target_price_cents: openBidding || !targetPrice ? null : Math.round(Number(targetPrice) * 100),
      location_id: loc.id,
      media: mediaUrls,
    }).select('*').single();

    setSubmitting(false);

    if (error) return Alert.alert('Could not post job', error.message);
    router.replace({ pathname: '/live-radar', params: { jobId: job.id } });
  }

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: COLORS.canvas }} contentContainerStyle={{ padding: 24, paddingTop: 64, paddingBottom: 40 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.ink.DEFAULT }}>
        Post a job
      </Text>
      <Text style={{ color: COLORS.ink.muted, marginTop: 2 }}>
        Broadcast to verified pros in your area.
      </Text>

      <View style={{ marginTop: 24, gap: 4 }}>
        <Text style={styles.label}>What needs fixing?</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Water heater leaking in garage"
          placeholderTextColor={COLORS.ink.light}
          style={styles.input}
        />
      </View>

      <View style={{ marginTop: 16, gap: 4 }}>
        <Text style={styles.label}>Describe the problem</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholder="Add details like brand, symptoms, access…"
          placeholderTextColor={COLORS.ink.light}
          style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
        />
      </View>

      <View style={{ marginTop: 16, gap: 8 }}>
        <Text style={styles.label}>Trade</Text>
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {TRADE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={{
                backgroundColor: category === cat ? COLORS.brand.soft : COLORS.surface,
                borderWidth: 1,
                borderColor: category === cat ? COLORS.brand.DEFAULT : COLORS.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: category === cat ? COLORS.brand.DEFAULT : COLORS.ink.muted, fontWeight: '600', fontSize: 13 }}>
                {TRADE_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 16, gap: 8 }}>
        <Text style={styles.label}>Pricing</Text>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Switch value={openBidding} onValueChange={setOpenBidding} trackColor={{ true: COLORS.brand.DEFAULT }} />
          <Text style={{ color: COLORS.ink.DEFAULT, fontSize: 14 }}>Let pros compete (recommended)</Text>
        </View>
        {!openBidding && (
          <TextInput
            value={targetPrice}
            onChangeText={setTargetPrice}
            placeholder="Target price ($)"
            keyboardType="decimal-pad"
            placeholderTextColor={COLORS.ink.light}
            style={styles.input}
          />
        )}
      </View>

      <View style={{ marginTop: 16, gap: 8 }}>
        <Text style={styles.label}>Photos / video (optional, max 3)</Text>
        <TouchableOpacity
          onPress={pickImages}
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 14,
          }}
        >
          <Text style={{ color: COLORS.brand.DEFAULT, fontWeight: '600', textAlign: 'center' }}>
            📷 Add photos or video
          </Text>
        </TouchableOpacity>
        {media.length > 0 && (
          <Text style={{ color: COLORS.ink.muted, fontSize: 12 }}>
            {media.length} media file{media.length > 1 ? 's' : ''} selected
          </Text>
        )}
      </View>

      <View style={{ marginTop: 16, gap: 8 }}>
        <Text style={styles.label}>Job location</Text>
        <TouchableOpacity
          onPress={locate}
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: geo ? COLORS.brand.DEFAULT : COLORS.border,
            padding: 14,
          }}
        >
          <Text style={{ color: geo ? COLORS.brand.DEFAULT : COLORS.ink.muted, fontWeight: '600', textAlign: 'center' }}>
            {geo ? `📍 Lat ${geo.lat.toFixed(4)}, Lng ${geo.lng.toFixed(4)}` : '📍 Get my location'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={broadcast}
        disabled={submitting}
        style={{
          marginTop: 28,
          backgroundColor: COLORS.brand.DEFAULT,
          padding: 16,
          borderRadius: 14,
          alignItems: 'center',
        }}
      >
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>
            📡 Broadcast request
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: COLORS.ink.muted },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.ink.DEFAULT,
  },
});