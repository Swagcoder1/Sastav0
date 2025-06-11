import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, MapPin, Clock, Users, Calendar, Phone, Navigation, Share } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface Field {
  id: string;
  name: string;
  address: string;
  city: string;
  rating: number;
  price_range: string;
  features: string[];
  coordinates?: any;
  created_at: string;
}

interface Game {
  id: string;
  title: string;
  time: string;
  date: string;
  players: string;
  price: string;
  skill: string;
  organizer: string;
  status: 'confirmed' | 'filling';
}

export default function FieldScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const [field, setField] = useState<Field | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchField();
    } else {
      // Use params data if available
      const fieldFromParams = {
        id: params.id as string,
        name: params.name as string,
        address: params.address as string,
        city: params.city as string,
        rating: parseFloat(params.rating as string) || 0,
        price_range: params.priceRange as string || '',
        features: ['Parking', 'Svlačionice', 'Tuš', 'Kafić'],
        created_at: new Date().toISOString(),
      };
      setField(fieldFromParams);
      loadMockGames();
      setLoading(false);
    }
  }, [params]);

  const fetchField = async () => {
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching field:', error);
      } else if (data) {
        setField(data);
      }
      
      loadMockGames();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMockGames = () => {
    // Mock games data for demonstration
    const mockGames: Game[] = [
      {
        id: '1',
        title: 'Večernji meč - Srednji nivo',
        time: '18:00',
        date: 'Danas',
        players: '8/12',
        price: '800 RSD',
        skill: 'Srednji',
        organizer: 'Marko Petrović',
        status: 'confirmed',
      },
      {
        id: '2',
        title: 'Jutarnji trening',
        time: '09:00',
        date: 'Sutra',
        players: '6/10',
        price: '600 RSD',
        skill: 'Početni',
        organizer: 'Ana Nikolić',
        status: 'filling',
      },
      {
        id: '3',
        title: 'Weekend turnir',
        time: '10:00',
        date: 'Subota',
        players: '16/20',
        price: '1200 RSD',
        skill: 'Napredni',
        organizer: 'Stefan Jovanović',
        status: 'confirmed',
      },
    ];
    setGames(mockGames);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Učitavanje...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!field) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Teren nije pronađen</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Nazad</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderGame = (game: Game) => (
    <TouchableOpacity key={game.id} style={styles.gameCard}>
      <View style={styles.gameHeader}>
        <View style={styles.gameDate}>
          <Text style={styles.gameDateText}>{game.date}</Text>
          <View style={styles.gameTime}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={styles.gameTimeText}>{game.time}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, styles[`status${game.status}`]]}>
          <Text style={[styles.statusText, styles[`statusText${game.status}`]]}>
            {game.status === 'confirmed' ? 'Potvrđen' : 'Popunjava se'}
          </Text>
        </View>
      </View>

      <Text style={styles.gameTitle}>{game.title}</Text>
      
      <View style={styles.gameDetails}>
        <View style={styles.gameDetailItem}>
          <Users size={14} color={colors.textSecondary} />
          <Text style={styles.gameDetailText}>{game.players}</Text>
        </View>
        
        <View style={styles.skillBadge}>
          <Text style={styles.skillText}>{game.skill}</Text>
        </View>
        
        <Text style={styles.gamePrice}>{game.price}</Text>
      </View>

      <View style={styles.gameFooter}>
        <Text style={styles.organizerText}>Organizator: {game.organizer}</Text>
        <TouchableOpacity style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Pridruži se</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalji terena</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Share size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Field Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg' }}
            style={styles.fieldImage}
          />
          <View style={styles.imageOverlay}>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#EAB308" fill="#EAB308" />
              <Text style={styles.ratingText}>{field.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Field Info */}
        <View style={styles.fieldInfo}>
          <Text style={styles.fieldName}>{field.name}</Text>
          <View style={styles.fieldLocation}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={styles.fieldAddress}>{field.address}, {field.city}</Text>
          </View>
          <Text style={styles.priceRange}>{field.price_range}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton}>
            <Phone size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Pozovi</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Navigation size={20} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Navigacija
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Pogodnosti</Text>
          <View style={styles.featuresContainer}>
            {field.features.map((feature, index) => (
              <View key={index} style={styles.featureTag}>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Available Games */}
        <View style={styles.gamesSection}>
          <View style={styles.gamesSectionHeader}>
            <Text style={styles.sectionTitle}>Dostupni mečevi ({games.length})</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Vidi sve</Text>
            </TouchableOpacity>
          </View>
          
          {games.map(renderGame)}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistike terena</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Calendar size={24} color="#3B82F6" />
              <Text style={styles.statValue}>{games.length}</Text>
              <Text style={styles.statLabel}>Aktivnih mečeva</Text>
            </View>
            
            <View style={styles.statCard}>
              <Users size={24} color="#10B981" />
              <Text style={styles.statValue}>
                {games.reduce((total, game) => {
                  const [current] = game.players.split('/');
                  return total + parseInt(current);
                }, 0)}
              </Text>
              <Text style={styles.statLabel}>Ukupno igrača</Text>
            </View>
            
            <View style={styles.statCard}>
              <Star size={24} color="#EAB308" />
              <Text style={styles.statValue}>{field.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Prosečna ocena</Text>
            </View>
            
            <View style={styles.statCard}>
              <Clock size={24} color="#F97316" />
              <Text style={styles.statValue}>24h</Text>
              <Text style={styles.statLabel}>Radno vreme</Text>
            </View>
          </View>
        </View>

        {/* Create Game Button */}
        <View style={styles.createGameSection}>
          <TouchableOpacity style={styles.createGameButton}>
            <Calendar size={20} color="#111827" />
            <Text style={styles.createGameButtonText}>Kreiraj meč na ovom terenu</Text>
          </TouchableOpacity>
        </View>
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
    fontFamily: 'Roboto-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fieldImage: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 4,
  },
  fieldInfo: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  fieldName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 8,
  },
  fieldLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldAddress: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginLeft: 4,
    flex: 1,
  },
  priceRange: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Medium',
  },
  gamesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  gamesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontFamily: 'Roboto-Medium',
  },
  gameCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameDate: {
    alignItems: 'flex-start',
  },
  gameDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 4,
  },
  gameTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameTimeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusconfirmed: {
    backgroundColor: '#065F46',
  },
  statusfilling: {
    backgroundColor: '#92400E',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
  },
  statusTextconfirmed: {
    color: '#10B981',
  },
  statusTextfilling: {
    color: '#F59E0B',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 12,
  },
  gameDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  gameDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginLeft: 4,
  },
  skillBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 16,
  },
  skillText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Medium',
  },
  gamePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  organizerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    flex: 1,
  },
  joinButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Roboto-Regular',
  },
  createGameSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  createGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createGameButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
  },
});