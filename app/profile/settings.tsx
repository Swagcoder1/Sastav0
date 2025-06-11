import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, User, Save } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ProfileSettingsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Form state
  const [location, setLocation] = useState('Beograd');
  const [bio, setBio] = useState('');

  // Store initial values to detect changes
  const [initialLocation, setInitialLocation] = useState('Beograd');
  const [initialBio, setInitialBio] = useState('');

  // Available cities in Serbia
  const cities = [
    'Beograd',
    'Novi Sad',
    'Niš',
    'Kragujevac',
    'Subotica',
    'Zrenjanin',
    'Pančevo',
    'Čačak',
    'Novi Pazar',
    'Kraljevo',
    'Smederevo',
    'Leskovac',
    'Užice',
    'Vranje',
    'Zaječar',
    'Sombor',
    'Kikinda',
    'Valjevo',
    'Kruševac',
    'Pirot'
  ];

  const [showCityPicker, setShowCityPicker] = useState(false);

  // Load current profile data
  useEffect(() => {
    loadProfileData();
  }, [user]);

  // Check for changes whenever location or bio changes
  useEffect(() => {
    const hasLocationChanged = location !== initialLocation;
    const hasBioChanged = bio !== initialBio;
    setHasChanges(hasLocationChanged || hasBioChanged);
  }, [location, bio, initialLocation, initialBio]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('location, bio')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
      } else if (data) {
        const loadedLocation = data.location || 'Beograd';
        const loadedBio = data.bio || 'Strastveni sportista koji voli da igra u slobodno vreme. Uvek spreman za novi izazov!';
        
        setLocation(loadedLocation);
        setBio(loadedBio);
        setInitialLocation(loadedLocation);
        setInitialBio(loadedBio);
      } else {
        // No profile found, use default values
        console.info('No profile found for user, using default values');
        const defaultBio = 'Strastveni sportista koji voli da igra u slobodno vreme. Uvek spreman za novi izazov!';
        setBio(defaultBio);
        setInitialBio(defaultBio);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
    setShowCityPicker(false);
  };

  const handleBioChange = (newBio: string) => {
    setBio(newBio);
  };

  const saveProfileData = async () => {
    if (!user) {
      Alert.alert('Greška', 'Korisnik nije prijavljen.');
      return false;
    }

    try {
      // First, check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            location: location.trim(),
            bio: bio.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating profile:', error);
          Alert.alert('Greška', 'Došlo je do greške prilikom čuvanja podataka.');
          return false;
        }
      } else {
        // Create new profile if it doesn't exist
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.user_metadata?.username || 'user',
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            location: location.trim(),
            bio: bio.trim(),
            skills: user.user_metadata?.skills || [],
            positions: user.user_metadata?.positions || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error creating profile:', error);
          Alert.alert('Greška', 'Došlo je do greške prilikom kreiranja profila.');
          return false;
        }
      }

      // Update initial values to reflect saved state
      setInitialLocation(location);
      setInitialBio(bio);
      setHasChanges(false);
      return true;
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Greška', 'Došlo je do neočekivane greške.');
      return false;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    const success = await saveProfileData();
    
    if (success) {
      // Navigate back to profile page immediately after successful save
      router.back();
    }
    
    setLoading(false);
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Nesačuvane izmene',
        'Imate nesačuvane izmene. Da li želite da ih sačuvate pre odlaska?',
        [
          {
            text: 'Odbaci izmene',
            style: 'destructive',
            onPress: () => router.back()
          },
          {
            text: 'Sačuvaj',
            onPress: async () => {
              setLoading(true);
              const success = await saveProfileData();
              setLoading(false);
              
              if (success) {
                router.back();
              }
            }
          },
          {
            text: 'Otkaži',
            style: 'cancel'
          }
        ]
      );
    } else {
      router.back();
    }
  };

  // Quick save function for header button (saves and redirects immediately)
  const handleQuickSave = async () => {
    setLoading(true);
    
    const success = await saveProfileData();
    
    if (success) {
      // Save successful, redirect immediately without alert
      router.back();
    }
    
    setLoading(false);
  };

  const styles = createStyles(colors);

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Učitavanje...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Podešavanja profila</Text>
        {hasChanges && (
          <TouchableOpacity 
            onPress={handleQuickSave} 
            style={styles.saveButton}
            disabled={loading}
          >
            <Save size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {!hasChanges && <View style={styles.headerSpacer} />}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={colors.text} />
            <Text style={styles.sectionTitle}>Lokacija</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Odaberite grad porekla
          </Text>
          
          <TouchableOpacity 
            style={styles.locationSelector}
            onPress={() => setShowCityPicker(!showCityPicker)}
          >
            <Text style={styles.locationText}>{location}</Text>
            <Text style={styles.locationArrow}>▼</Text>
          </TouchableOpacity>

          {showCityPicker && (
            <View style={styles.cityPicker}>
              <ScrollView style={styles.cityList} nestedScrollEnabled>
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.cityOption,
                      location === city && styles.cityOptionSelected
                    ]}
                    onPress={() => handleLocationChange(city)}
                  >
                    <Text style={[
                      styles.cityOptionText,
                      location === city && styles.cityOptionTextSelected
                    ]}>
                      {city}
                    </Text>
                    {location === city && (
                      <Text style={styles.selectedIndicator}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={colors.text} />
            <Text style={styles.sectionTitle}>O meni</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Napišite nešto o sebi i svojim sportskim interesovanjima
          </Text>
          
          <View style={styles.bioContainer}>
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={handleBioChange}
              placeholder="Napišite nešto o sebi..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <View style={styles.characterCount}>
              <Text style={styles.characterCountText}>
                {bio.length}/500 karaktera
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        {hasChanges && (
          <View style={styles.saveSection}>
            <TouchableOpacity 
              style={[styles.saveButtonLarge, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Čuvanje...' : 'Sačuvaj izmene'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Roboto-Regular',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  locationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationText: {
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Roboto-Medium',
  },
  locationArrow: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cityPicker: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cityList: {
    maxHeight: 200,
  },
  cityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cityOptionSelected: {
    backgroundColor: `${colors.text}10`,
  },
  cityOptionText: {
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Roboto-Regular',
  },
  cityOptionTextSelected: {
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
  },
  selectedIndicator: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bioContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  bioInput: {
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Roboto-Regular',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  saveSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  saveButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
  },
});