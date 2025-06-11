import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    console.log('Index screen - loading:', loading, 'user:', user?.id);
    
    if (!loading) {
      if (user) {
        console.log('User found, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('No user, redirecting to login');
        router.replace('/auth/login');
      }
    }
  }, [user, loading]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.text} />
      <Text style={[styles.loadingText, { color: colors.text }]}>
        Učitavanje...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
  },
});