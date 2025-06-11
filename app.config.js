import 'dotenv/config';

export default {
  expo: {
    name: 'Sastav',
    slug: 'sastav-football-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'sastav',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.sastav.app'
    },
    android: {
      package: 'com.sastav.app',
      adaptiveIcon: {
        foregroundImage: './assets/images/icon.png',
        backgroundColor: '#22C55E'
      }
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      'expo-router', 
      'expo-font', 
      'expo-web-browser', 
      'expo-location'
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    }
  }
};