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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Target, Zap, Shield, Users, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);

  const skills = [
    { id: 'speed', name: 'Brzina', icon: Zap },
    { id: 'technique', name: 'Tehnika', icon: Target },
    { id: 'defense', name: 'Odbrana', icon: Shield },
    { id: 'teamwork', name: 'Timski rad', icon: Users },
    { id: 'shooting', name: 'Šutiranje', icon: Target },
    { id: 'passing', name: 'Dodavanje', icon: Target },
    { id: 'dribbling', name: 'Dribling', icon: Zap },
    { id: 'heading', name: 'Igra glavom', icon: Target },
  ];

  const positions = [
    { id: 'goalkeeper', name: 'Golman' },
    { id: 'defender', name: 'Odbrana' },
    { id: 'midfielder', name: 'Vezni red' },
    { id: 'forward', name: 'Napad' },
    { id: 'winger', name: 'Krilo' },
    { id: 'striker', name: 'Špic' },
    { id: 'sweeper', name: 'Libero' },
    { id: 'fullback', name: 'Bek' },
  ];

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const togglePosition = (positionId: string) => {
    setSelectedPositions(prev => 
      prev.includes(positionId) 
        ? prev.filter(id => id !== positionId)
        : [...prev, positionId]
    );
  };

  const validateForm = () => {
    if (!email || !password || !username || !firstName || !lastName) {
      setError('Molimo popunite sva polja');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju');
      return false;
    }

    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      return false;
    }

    if (selectedSkills.length === 0) {
      setError('Molimo odaberite najmanje jednu veštinu');
      return false;
    }

    if (selectedPositions.length === 0) {
      setError('Molimo odaberite najmanje jednu poziciju');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    // Get skill and position names for storage
    const skillNames = selectedSkills.map(skillId => 
      skills.find(skill => skill.id === skillId)?.name || skillId
    );
    const positionNames = selectedPositions.map(positionId => 
      positions.find(position => position.id === positionId)?.name || positionId
    );
    
    const { error: authError } = await signUp(email, password, username, firstName, lastName, skillNames, positionNames);
    setLoading(false);

    if (authError) {
      // Provide specific error messages based on the error type
      if (authError.includes('User already registered')) {
        setError('Korisnik sa ovom email adresom već postoji. Molimo koristite drugu email adresu ili se prijavite.');
      } else if (authError.includes('Email rate limit exceeded')) {
        setError('Previše pokušaja registracije. Molimo pokušajte ponovo za nekoliko minuta.');
      } else if (authError.includes('Password should be at least')) {
        setError('Lozinka mora imati najmanje 6 karaktera i biti dovoljno jaka.');
      } else if (authError.includes('Invalid email')) {
        setError('Molimo unesite validnu email adresu.');
      } else if (authError.includes('Signup is disabled')) {
        setError('Registracija je trenutno onemogućena. Molimo pokušajte kasnije.');
      } else if (authError.includes('Username')) {
        setError('Korisničko ime već postoji. Molimo odaberite drugo korisničko ime.');
      } else {
        setError(authError);
      }
    } else {
      // Show success message
      setSuccess('Uspešno ste kreirali nalog! Preusmeriće vas na stranicu za prijavu...');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.replace('/auth/login');
      }, 3000);
    }
  };

  const clearError = () => {
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.title}>Sastav!</Text>
            <Text style={styles.subtitle}>
              Pridružite se zajednici fudbalskih ljubitelja
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

            {/* Success Message */}
            {success && (
              <View style={styles.successContainer}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.nameInput]}>
                <View style={styles.inputWrapper}>
                  <User size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ime"
                    placeholderTextColor={colors.textSecondary}
                    value={firstName}
                    onChangeText={(text) => {
                      setFirstName(text);
                      clearError();
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!success}
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, styles.nameInput]}>
                <View style={styles.inputWrapper}>
                  <User size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Prezime"
                    placeholderTextColor={colors.textSecondary}
                    value={lastName}
                    onChangeText={(text) => {
                      setLastName(text);
                      clearError();
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!success}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <User size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Korisničko ime"
                  placeholderTextColor={colors.textSecondary}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    clearError();
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!success}
                />
              </View>
            </View>

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
                    clearError();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!success}
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
                    clearError();
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!success}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  disabled={success}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Potvrdite lozinku"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearError();
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!success}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  disabled={success}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Skills Selection */}
            <View style={styles.selectionSection}>
              <Text style={styles.selectionTitle}>Odaberite vaše veštine</Text>
              <Text style={styles.selectionSubtitle}>Izaberite veštine koje najbolje opisuju vašu igru</Text>
              <View style={styles.skillsGrid}>
                {skills.map((skill) => {
                  const IconComponent = skill.icon;
                  const isSelected = selectedSkills.includes(skill.id);
                  return (
                    <TouchableOpacity
                      key={skill.id}
                      style={[
                        styles.skillCard,
                        isSelected && styles.skillCardSelected
                      ]}
                      onPress={() => {
                        if (!success) {
                          toggleSkill(skill.id);
                          clearError();
                        }
                      }}
                      disabled={success}
                    >
                      <IconComponent 
                        size={20} 
                        color={isSelected ? '#FFFFFF' : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.skillText,
                        isSelected && styles.skillTextSelected
                      ]}>
                        {skill.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Positions Selection */}
            <View style={styles.selectionSection}>
              <Text style={styles.selectionTitle}>Odaberite vaše pozicije</Text>
              <Text style={styles.selectionSubtitle}>Na kojim pozicijama najradije igrate?</Text>
              <View style={styles.positionsGrid}>
                {positions.map((position) => {
                  const isSelected = selectedPositions.includes(position.id);
                  return (
                    <TouchableOpacity
                      key={position.id}
                      style={[
                        styles.positionCard,
                        isSelected && styles.positionCardSelected
                      ]}
                      onPress={() => {
                        if (!success) {
                          togglePosition(position.id);
                          clearError();
                        }
                      }}
                      disabled={success}
                    >
                      <Text style={[
                        styles.positionText,
                        isSelected && styles.positionTextSelected
                      ]}>
                        {position.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {!success && (
              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <UserPlus size={20} color="#111827" />
                <Text style={styles.registerButtonText}>
                  {loading ? 'Kreiranje naloga...' : 'Kreiraj nalog'}
                </Text>
              </TouchableOpacity>
            )}

            {!success && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ili</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Već imate nalog? </Text>
                  <Link href="/auth/login" asChild>
                    <TouchableOpacity>
                      <Text style={styles.loginLink}>Prijavite se</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </>
            )}
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
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#059669',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
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
  selectionSection: {
    marginBottom: 24,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 4,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  skillCardSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  skillText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Medium',
    marginLeft: 6,
  },
  skillTextSelected: {
    color: '#FFFFFF',
  },
  positionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionCard: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  positionCardSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  positionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Medium',
  },
  positionTextSelected: {
    color: '#FFFFFF',
  },
  registerButton: {
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
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  loginLink: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Roboto-Bold',
  },
});