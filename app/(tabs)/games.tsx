import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, Users, MapPin, Plus, Filter } from 'lucide-react-native';
import { FloatingSearch } from '@/components/FloatingSearch';
import { FloatingSearchButton } from '@/components/FloatingSearchButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useSport } from '@/contexts/SportContext';
import { useFloatingButton } from '@/contexts/FloatingButtonContext';

const { width } = Dimensions.get('window');

export default function GamesScreen() {
  const { colors } = useTheme();
  const { selectedSport, setSelectedSport } = useSport();
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const { searchVisible, setSearchVisible } = useFloatingButton();

  const sports = [
    { id: 'padel', name: 'Padel', color: '#3B82F6' },
    { id: 'football', name: 'Fudbal', color: '#10B981' },
    { id: 'basketball', name: 'Košarka', color: '#F59E0B' },
  ];

  const upcomingGames = [
    {
      id: 1,
      title: 'Večernji meč - Srednji nivo',
      date: '15 Dec',
      time: '18:00',
      location: 'Sportski centar "Crvena zvezda"',
      players: '8/12',
      price: '800 RSD',
      organizer: 'Marko Petrović',
      skill: 'Srednji',
      status: 'confirmed',
      sport: 'football',
    },
    {
      id: 2,
      title: 'Padel turnir - Napredni',
      date: '16 Dec',
      time: '10:00',
      location: 'Padel centar "Beograd"',
      players: '6/8',
      price: '1500 RSD',
      organizer: 'Stefan Jovanović',
      skill: 'Napredni',
      status: 'filling',
      sport: 'padel',
    },
    {
      id: 3,
      title: 'Košarkaški meč',
      date: '17 Dec',
      time: '16:30',
      location: 'Košarkaški klub "Partizan"',
      players: '8/10',
      price: 'Besplatno',
      organizer: 'Ana Nikolić',
      skill: 'Mešovito',
      status: 'confirmed',
      sport: 'basketball',
    },
  ];

  const pastGames = [
    {
      id: 4,
      title: 'Noćni turnir',
      date: '10 Dec',
      time: '20:00',
      location: 'Arena "Beograd"',
      result: 'Pobeda 3-2',
      rating: 4.8,
      organizer: 'Miloš Stojanović',
      sport: 'football',
    },
    {
      id: 5,
      title: 'Padel meč',
      date: '8 Dec',
      time: '09:00',
      location: 'Padel centar "Novi Sad"',
      result: 'Poraz 1-2',
      rating: 4.2,
      organizer: 'Jovana Milić',
      sport: 'padel',
    },
  ];

  const tabs = [
    { id: 'upcoming', label: 'Predstojeći', count: upcomingGames.filter(game => game.sport === selectedSport).length },
    { id: 'past', label: 'Odigrani', count: pastGames.filter(game => game.sport === selectedSport).length },
    { id: 'created', label: 'Moji mečevi', count: 2 },
  ];

  const filteredUpcomingGames = upcomingGames.filter(game => game.sport === selectedSport);
  const filteredPastGames = pastGames.filter(game => game.sport === selectedSport);

  const renderUpcomingGame = (game) => (
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
      
      <View style={styles.gameLocation}>
        <MapPin size={14} color={colors.textSecondary} />
        <Text style={styles.locationText}>{game.location}</Text>
      </View>

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

  const renderPastGame = (game) => (
    <TouchableOpacity key={game.id} style={styles.gameCard}>
      <View style={styles.gameHeader}>
        <View style={styles.gameDate}>
          <Text style={styles.gameDateText}>{game.date}</Text>
          <View style={styles.gameTime}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={styles.gameTimeText}>{game.time}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>⭐ {game.rating}</Text>
        </View>
      </View>

      <Text style={styles.gameTitle}>{game.title}</Text>
      
      <View style={styles.gameLocation}>
        <MapPin size={14} color={colors.textSecondary} />
        <Text style={styles.locationText}>{game.location}</Text>
      </View>

      <View style={styles.gameResult}>
        <Text style={styles.resultText}>{game.result}</Text>
      </View>

      <Text style={styles.organizerText}>Organizator: {game.organizer}</Text>
    </TouchableOpacity>
  );

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mečevi</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton}>
            <Plus size={20} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sport Selection Bar */}
      <View style={styles.sportSelectionContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportSelection}>
          {sports.map((sport) => (
            <TouchableOpacity
              key={sport.id}
              style={[
                styles.sportButton,
                selectedSport === sport.id && [styles.sportButtonActive, { backgroundColor: sport.color }]
              ]}
              onPress={() => setSelectedSport(sport.id as any)}
            >
              <Text
                style={[
                  styles.sportButtonText,
                  selectedSport === sport.id && styles.sportButtonTextActive
                ]}
              >
                {sport.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                selectedTab === tab.id && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {selectedTab === 'upcoming' && (
          <View style={styles.gamesContainer}>
            {filteredUpcomingGames.length > 0 ? (
              filteredUpcomingGames.map(renderUpcomingGame)
            ) : (
              <View style={styles.emptyState}>
                <Calendar size={48} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>Nema predstojećih mečeva</Text>
                <Text style={styles.emptySubtitle}>
                  Trenutno nema zakazanih mečeva za {sports.find(s => s.id === selectedSport)?.name.toLowerCase()}
                </Text>
              </View>
            )}
          </View>
        )}

        {selectedTab === 'past' && (
          <View style={styles.gamesContainer}>
            {filteredPastGames.length > 0 ? (
              filteredPastGames.map(renderPastGame)
            ) : (
              <View style={styles.emptyState}>
                <Calendar size={48} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>Nema odigranih mečeva</Text>
                <Text style={styles.emptySubtitle}>
                  Još niste odigrali nijedan meč za {sports.find(s => s.id === selectedSport)?.name.toLowerCase()}
                </Text>
              </View>
            )}
          </View>
        )}

        {selectedTab === 'created' && (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nemate kreiranje mečeve</Text>
            <Text style={styles.emptySubtitle}>
              Kreirajte svoj prvi meč i pozovite prijatelje da se pridruže
            </Text>
            <TouchableOpacity style={styles.createGameButton}>
              <Plus size={20} color="#111827" />
              <Text style={styles.createGameText}>Kreiraj meč</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Search Button */}
      <FloatingSearchButton onPress={() => setSearchVisible(true)} />

      {/* Floating Search */}
      <FloatingSearch 
        visible={searchVisible} 
        onClose={() => setSearchVisible(false)} 
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportSelectionContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sportSelection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sportButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sportButtonActive: {
    borderColor: 'transparent',
  },
  sportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'Roboto-Bold',
  },
  sportButtonTextActive: {
    color: '#FFFFFF',
  },
  tabsContainer: {
    paddingLeft: 20,
    marginBottom: 16,
    marginTop: 16,
  },
  tabButton: {
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
  tabButtonActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Medium',
    marginRight: 6,
  },
  tabTextActive: {
    color: colors.background,
  },
  tabBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'Roboto-Bold',
  },
  content: {
    flex: 1,
  },
  gamesContainer: {
    paddingHorizontal: 20,
  },
  gameCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  ratingContainer: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 8,
  },
  gameLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginLeft: 4,
    flex: 1,
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
  },
  gameResult: {
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Roboto-Regular',
    marginBottom: 24,
  },
  createGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createGameText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
  },
});