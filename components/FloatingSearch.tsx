import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { Search, X, Users, MapPin, Building } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

interface Profile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  skills: string[];
  positions: string[];
}

interface Field {
  id: string;
  name: string;
  address: string;
  city: string;
  rating: number;
  price_range: string;
}

interface FloatingSearchProps {
  visible: boolean;
  onClose: () => void;
}

export function FloatingSearch({ visible, onClose }: FloatingSearchProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'fields' | 'locations'>('friends');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      performSearch();
    } else {
      clearResults();
    }
  }, [searchQuery, activeTab]);

  const performSearch = async () => {
    setLoading(true);
    
    try {
      if (activeTab === 'friends') {
        await searchProfiles();
      } else if (activeTab === 'fields') {
        await searchFields();
      } else if (activeTab === 'locations') {
        await searchLocations();
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, avatar_url, skills, positions')
        .or(`username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) {
        console.error('Profile search error:', error);
        setProfiles([]);
      } else if (data) {
        setProfiles(data);
      }
    } catch (error) {
      console.error('Profile search error:', error);
      setProfiles([]);
    }
  };

  const searchFields = async () => {
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('id, name, address, city, rating, price_range')
        .or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) {
        console.error('Field search error:', error);
        setFields([]);
      } else if (data) {
        setFields(data);
      }
    } catch (error) {
      console.error('Field search error:', error);
      setFields([]);
    }
  };

  const searchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('city')
        .ilike('city', `%${searchQuery}%`)
        .limit(10);

      if (error) {
        console.error('Location search error:', error);
        setLocations([]);
      } else if (data) {
        const uniqueCities = [...new Set(data.map(item => item.city))];
        setLocations(uniqueCities);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setLocations([]);
    }
  };

  const clearResults = () => {
    setProfiles([]);
    setFields([]);
    setLocations([]);
  };

  const handleClose = () => {
    setSearchQuery('');
    clearResults();
    setShowMap(false);
    onClose();
  };

  const handleProfilePress = (profile: Profile) => {
    handleClose();
    router.push({
      pathname: '/profile/[id]',
      params: { 
        id: profile.id,
        username: profile.username,
        firstName: profile.first_name,
        lastName: profile.last_name,
        avatarUrl: profile.avatar_url || '',
        skills: JSON.stringify(profile.skills || []),
        positions: JSON.stringify(profile.positions || [])
      }
    });
  };

  const handleFieldPress = (field: Field) => {
    handleClose();
    router.push({
      pathname: '/field/[id]',
      params: { 
        id: field.id,
        name: field.name,
        address: field.address,
        city: field.city,
        rating: field.rating.toString(),
        priceRange: field.price_range || ''
      }
    });
  };

  const handleLocationPress = (location: string) => {
    handleClose();
    router.push({
      pathname: '/(tabs)/index',
      params: { 
        city: location
      }
    });
  };

  const tabs = [
    { id: 'friends' as const, label: 'Prijatelji', icon: Users },
    { id: 'fields' as const, label: 'Tereni', icon: Building },
    { id: 'locations' as const, label: 'Lokacije', icon: MapPin },
  ];

  const renderProfileResult = (profile: Profile) => (
    <TouchableOpacity key={profile.id} style={styles.resultItem} onPress={() => handleProfilePress(profile)}>
      <View style={styles.profileResult}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {profile.first_name?.charAt(0) || ''}{profile.last_name?.charAt(0) || ''}
            </Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {profile.first_name} {profile.last_name}
          </Text>
          <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
            @{profile.username}
          </Text>
          {profile.positions && profile.positions.length > 0 && (
            <View style={styles.positionTags}>
              {profile.positions.slice(0, 2).map((position, index) => (
                <View key={index} style={styles.positionTag}>
                  <Text style={styles.positionTagText}>{position}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFieldResult = (field: Field) => (
    <TouchableOpacity key={field.id} style={styles.resultItem} onPress={() => handleFieldPress(field)}>
      <View style={styles.fieldResult}>
        <View style={styles.fieldIcon}>
          <Building size={24} color={colors.text} />
        </View>
        <View style={styles.fieldInfo}>
          <Text style={[styles.fieldName, { color: colors.text }]}>{field.name}</Text>
          <Text style={[styles.fieldAddress, { color: colors.textSecondary }]}>
            {field.address}, {field.city}
          </Text>
          <View style={styles.fieldMeta}>
            <Text style={[styles.fieldRating, { color: colors.text }]}>
              ⭐ {field.rating}
            </Text>
            <Text style={[styles.fieldPrice, { color: colors.textSecondary }]}>
              {field.price_range}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLocationResult = (location: string) => (
    <TouchableOpacity key={location} style={styles.resultItem} onPress={() => handleLocationPress(location)}>
      <View style={styles.locationResult}>
        <View style={styles.locationIcon}>
          <MapPin size={24} color={colors.text} />
        </View>
        <Text style={[styles.locationName, { color: colors.text }]}>{location}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMapView = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webMapPlaceholder}>
          <MapPin size={48} color={colors.textSecondary} />
          <Text style={[styles.webMapText, { color: colors.text }]}>
            Mapa je dostupna samo na mobilnim uređajima
          </Text>
          <Text style={[styles.webMapSubtext, { color: colors.textSecondary }]}>
            Koristite mobilnu aplikaciju za pristup mapi terena
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.mapPlaceholder}>
        <MapPin size={48} color={colors.textSecondary} />
        <Text style={[styles.mapPlaceholderText, { color: colors.text }]}>
          Mapa će biti dostupna uskoro
        </Text>
        <Text style={[styles.mapPlaceholderSubtext, { color: colors.textSecondary }]}>
          Trenutno radimo na integraciji mape
        </Text>
      </View>
    );
  };

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-300, 0],
                  }),
                },
              ],
              opacity: slideAnim,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Pretraži</Text>
            <View style={styles.headerActions}>
              {activeTab === 'fields' && (
                <TouchableOpacity 
                  onPress={() => setShowMap(!showMap)} 
                  style={styles.mapToggle}
                >
                  <MapPin size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Pretraži..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <IconComponent 
                    size={16} 
                    color={isActive ? colors.background : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.tabText,
                    isActive && styles.tabTextActive
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Results */}
          <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
            {showMap && activeTab === 'fields' ? (
              renderMapView()
            ) : (
              <>
                {loading && (
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      Pretraživanje...
                    </Text>
                  </View>
                )}

                {!loading && searchQuery.length > 0 && (
                  <>
                    {activeTab === 'friends' && profiles.length === 0 && (
                      <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                          Nema rezultata za "{searchQuery}"
                        </Text>
                      </View>
                    )}

                    {activeTab === 'fields' && fields.length === 0 && (
                      <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                          Nema terena za "{searchQuery}"
                        </Text>
                      </View>
                    )}

                    {activeTab === 'locations' && locations.length === 0 && (
                      <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                          Nema lokacija za "{searchQuery}"
                        </Text>
                      </View>
                    )}

                    {activeTab === 'friends' && profiles.map(renderProfileResult)}
                    {activeTab === 'fields' && fields.map(renderFieldResult)}
                    {activeTab === 'locations' && locations.map(renderLocationResult)}
                  </>
                )}

                {searchQuery.length === 0 && (
                  <View style={styles.instructionsContainer}>
                    <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
                      Unesite tekst za pretraživanje {activeTab === 'friends' ? 'prijatelja' : activeTab === 'fields' ? 'terena' : 'lokacija'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  container: {
    backgroundColor: colors.background,
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Roboto-Regular',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Medium',
    marginLeft: 6,
  },
  tabTextActive: {
    color: colors.background,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  resultItem: {
    marginBottom: 12,
  },
  profileResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
    fontFamily: 'Roboto-Bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Bold',
    marginBottom: 2,
  },
  profileUsername: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    marginBottom: 4,
  },
  positionTags: {
    flexDirection: 'row',
    gap: 4,
  },
  positionTag: {
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  positionTagText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Medium',
  },
  fieldResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Bold',
    marginBottom: 2,
  },
  fieldAddress: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    marginBottom: 4,
  },
  fieldMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldRating: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
  },
  fieldPrice: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
  },
  locationResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Bold',
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  webMapText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  webMapSubtext: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
  },
  instructionsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
  },
});