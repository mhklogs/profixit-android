# ProFixit — Android app

The **contractor** app for [ProFixit](https://fixit-web-rom.vercel.app), the earning side of
the FixIt Home marketplace. Browse live jobs in your trade and radius, bid $0.30 a time, and
get paid 96–97% of the job the moment the homeowner signs off.

- **Android package:** `com.profixit.app`
- **Expo slug:** `profixit`
- **Role:** contractor, fixed in `src/brand.ts`

The role is hard-coded rather than read from `EXPO_PUBLIC_ROLE`, so this repository can only
ever build a contractor APK. There is no way to accidentally ship the homeowner build from here.

## Stack

Expo SDK 51 · React Native 0.74 · expo-router 3 · NativeWind 4 (Tailwind) · Supabase ·
React Stripe Native · react-native-maps / camera / location

## Getting started

```bash
npm install --legacy-peer-deps
cp .env.example .env        # fill in Supabase URL + anon key
npm run dev                 # then press 'a' for the Android emulator
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Expo dev server |
| `npm run android` | Build and run on a connected device/emulator |
| `npm run prebuild` | Generate the native `android/` project |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `src/` |

## Building the APK

Push to `main`, or run the workflow manually. GitHub Actions builds a release APK with
Java 21 and uploads it as the `profixit-apk` artifact.

The workflow reads three repository secrets:

| Secret | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe to ship) |
| `EXPO_PUBLIC_API_URL` | Web API base URL |

## Structure

```
app/                expo-router screens
  (auth)/           login, signup, role gate
  (contractor)/     bid radar, active jobs, earnings, wallet, profile
  chat/             per-job messaging
  bid.tsx           bid review
src/
  brand.ts          fixed contractor role + role routing
  shared/           constants, types and helpers (vendored, no workspace needed)
  components/       shared UI
  lib/              supabase client, api helpers
  theme.ts          colours and spacing
assets/             icon, adaptive icon, splash
```

`src/shared/` is a vendored copy of the monorepo's `packages/shared`, so this repo installs,
builds and releases entirely on its own.

## Related repositories

- [`fixit-landing`](https://github.com/mhklogs/fixit-landing) — the website this app ships against
- [`fixit-home-android`](https://github.com/mhklogs/fixit-home-android) — the homeowner app