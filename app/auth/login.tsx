import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, LogIn, CircleAlert as AlertCircle } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SuccessNotification } from '@/components/SuccessNotification';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Molimo unesite email i lozinku');
      return;
    }

    if (loading || authLoading) {
      return; // Prevent multiple simultaneous login attempts
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting login process...');
      const { error: authError } = await signIn(email.trim(), password);

      if (authError) {
        console.error('Login error:', authError);
        // Provide more specific error messages based on the error
        if (authError.includes('Invalid login credentials') || authError.includes('invalid_credentials')) {
          setError('Neispravni podaci za prijavu. Proverite email i lozinku.');
        } else if (authError.includes('Email not confirmed')) {
          setError('Molimo potvrdite svoj email pre prijave.');
        } else if (authError.includes('Too many requests')) {
          setError('Previše pokušaja prijave. Pokušajte ponovo za nekoliko minuta.');
        } else {
          setError(authError);
        }
      } else {
        console.log('Login successful, showing success notification');
        // Show success notification
        setShowSuccess(true);
        
        // Clear form
        setEmail('');
        setPassword('');
        
        // Redirect after notification is shown
        setTimeout(() => {
          console.log('Redirecting to tabs...');
          router.replace('/(tabs)');
        }, 1500);
      }
    } catch (error) {
      console.error('Login exception:', error);
      setError('Došlo je do neočekivane greške. Molimo pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Success Notification */}
      <SuccessNotification
        visible={showSuccess}
        message="Uspešno ste se prijavili!"
        onHide={() => setShowSuccess(false)}
        duration={1500}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={[colors.card, colors.border]}
              style={styles.logoContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logo}>⚽</Text>
            </LinearGradient>
            <Text style={styles.title}>Dobrodošli u Sastav!</Text>
            <Text style={styles.subtitle}>
              Prijavite se da biste pristupili svojem nalogu
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Email adresa"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null); // Clear error when user starts typing
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading && !authLoading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Lozinka"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError(null); // Clear error when user starts typing
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading && !authLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  disabled={loading || authLoading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, (loading || authLoading) && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading || authLoading}
            >
              {loading || authLoading ? (
                <ActivityIndicator size="small\" color="#111827" />
              ) : (
                <LogIn size={20} color="#111827" />
              )}
              <Text style={styles.loginButtonText}>
                {loading || authLoading ? 'Prijavljivanje...' : 'Prijavite se'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ili</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Nemate nalog? </Text>
              <Link href="/auth/register" asChild>
                <TouchableOpacity disabled={loading || authLoading}>
                  <Text style={[styles.signupLink, (loading || authLoading) && styles.signupLinkDisabled]}>
                    Registrujte se
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Roboto-Regular',
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  signupLink: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Roboto-Bold',
  },
  signupLinkDisabled: {
    opacity: 0.5,
  },
});