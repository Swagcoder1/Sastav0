import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, MapPin, Clock, Users, Star, ChevronRight, Calendar, Wifi, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSport } from '@/contexts/SportContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FloatingSearch } from '@/components/FloatingSearch';
import { FloatingSearchButton } from '@/components/FloatingSearchButton';
import { SportSelectionModal } from '@/components/SportSelectionModal';
import { useFloatingButton } from '@/contexts/FloatingButtonContext';
import { PresenceService } from '@/lib/presenceService';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { 
    selectedSport, 
    showSportSelection, 
    setShowSportSelection, 
    setSelectedSport, 
    isFirstTime,
    hasCompletedQuestionnaire,
    setHasCompletedQuestionnaire 
  } = useSport();
  const { searchVisible, setSearchVisible } = useFloatingButton();
  const [onlineFriends, setOnlineFriends] = useState<any[]>([]);
  const [allOnlineUsers, setAllOnlineUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [recentPlayers, setRecentPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  // Show sport selection modal for new users when they log in
  useEffect(() => {
    if (user && !hasCompletedQuestionnaire) {
      // Always show for users who haven't completed the questionnaire
      setShowSportSelection(true);
    }
  }, [user, hasCompletedQuestionnaire, setShowSportSelection]);

  // Load online friends when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadOnlineFriends();
      loadAllOnlineUsers();
      loadRecentPlayers();
    }
  }, [user]);

  const loadOnlineFriends = async () => {
    try {
      const { data, error } = await PresenceService.getOnlineFriends();
      if (!error && data) {
        // Map the presence data to friend format
        const friends = data.map(presence => ({
          id: presence.user_id,
          first_name: presence.user?.first_name,
          last_name: presence.user?.last_name,
          username: presence.user?.username,
          avatar_url: presence.user?.avatar_url,
          status: presence.status,
          last_seen: presence.last_seen,
        }));
        setOnlineFriends(friends);
      }
    } catch (error) {
      console.error('Error loading online friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllOnlineUsers = async () => {
    try {
      const { data, error } = await PresenceService.getAllOnlineUsers();
      if (!error && data) {
        // Show actual count of online users, not mock data
        setAllOnlineUsers(data);
      }
    } catch (error) {
      console.error('Error loading all online users:', error);
    }
  };

  const loadRecentPlayers = async () => {
    // Mock data for recent players - in a real app, this would come from game history
    const mockRecentPlayers = [
      {
        id: '1',
        first_name: 'Marko',
        last_name: 'Petrović',
        avatar_url: null,
        last_played: '2 dana',
        games_together: 3,
        current_rating: 4.2
      },
      {
        id: '2',
        first_name: 'Ana',
        last_name: 'Nikolić',
        avatar_url: null,
        last_played: '1 nedelja',
        games_together: 1,
        current_rating: 0
      },
      {
        id: '3',
        first_name: 'Stefan',
        last_name: 'Jovanović',
        avatar_url: null,
        last_played: '3 dana',
        games_together: 2,
        current_rating: 3.8
      }
    ];
    setRecentPlayers(mockRecentPlayers);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOnlineFriends(), loadAllOnlineUsers(), loadRecentPlayers()]);
    setRefreshing(false);
  };

  const handlePlayNow = () => {
    router.push('/(tabs)/games');
  };

  const handleViewAllGames = () => {
    router.push('/(tabs)/games');
  };

  const handleRatePlayer = () => {
    if (recentPlayers.length === 0) {
      Alert.alert(
        'Nema igrača za ocenjivanje',
        'Još niste igrali ni sa kim. Pridružite se mečevima da biste mogli da ocenjujete druge igrače.',
        [{ text: 'U redu' }]
      );
      return;
    }
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (!selectedPlayer || rating === 0) {
      Alert.alert('Greška', 'Molimo odaberite igrača i ocenu.');
      return;
    }

    // In a real app, this would save to the database
    Alert.alert(
      'Ocena poslata',
      `Uspešno ste ocenili ${selectedPlayer.first_name} ${selectedPlayer.last_name} sa ${rating} ${rating === 1 ? 'zvezdom' : 'zvezda'}.`,
      [{ text: 'U redu' }]
    );

    // Reset modal state
    setSelectedPlayer(null);
    setRating(0);
    setRatingComment('');
    setShowRatingModal(false);
  };

  const quickStats = [
    { label: 'Mečevi danas', value: '12', icon: Calendar },
    { label: 'Lokacije', value: '18', icon: MapPin },
    { label: 'Prijatelji online', value: onlineFriends.length.toString(), icon: Wifi },
    { label: 'Aktivni igrači', value: allOnlineUsers.length.toString(), icon: Users },
  ];

  const todaysGames = [
    {
      id: 1,
      time: '18:00',
      location: 'Sportski centar "Crvena zvezda"',
      players: '8/12',
      price: '800 RSD',
      skill: 'Srednji nivo',
    },
    {
      id: 2,
      time: '19:30',
      location: 'Arena "Beograd"',
      players: '6/10',
      price: '1000 RSD',
      skill: 'Napredni',
    },
  ];

  const handleSportSelect = (sport: 'padel' | 'football' | 'basketball', questionnaireData?: any) => {
    setSelectedSport(sport);
    setHasCompletedQuestionnaire(true, questionnaireData);
    setShowSportSelection(false);
  };

  const getSportName = (sport: string) => {
    switch (sport) {
      case 'padel': return 'PADEL';
      case 'football': return 'FUDBAL';
      case 'basketball': return 'KOŠARKU';
      default: return 'SPORT';
    }
  };

  const handleFriendPress = (friend: any) => {
    router.push({
      pathname: '/profile/[id]',
      params: { id: friend.id }
    });
  };

  const renderRatingStars = (currentRating: number, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress?.(star)}
            disabled={!onPress}
          >
            <Star
              size={24}
              color={star <= currentRating ? '#EAB308' : colors.border}
              fill={star <= currentRating ? '#EAB308' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Dobrodošli u</Text>
            <Text style={styles.appName}>Sastav!</Text>
          </View>
          <View style={styles.headerActions}>
            <ThemeToggle />
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={[colors.card, colors.border]}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>
                NADJI SPORT.{'\n'}BILO KAD.{'\n'}BILO GDE.
              </Text>
              <Text style={styles.heroSubtitle}>
                Pronađi igrače, rezerviši teren i organizuj najbolje mečeve u gradu
              </Text>
              <TouchableOpacity style={styles.playButton} onPress={handlePlayNow}>
                <Play size={20} color="#111827" />
                <Text style={styles.playButtonText}>Igraj sada</Text>
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.heroImage}
            />
          </LinearGradient>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Statistike</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <View key={index} style={styles.statCard}>
                  <IconComponent size={24} color={colors.text} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Friends Online Section */}
        {onlineFriends.length > 0 && (
          <View style={styles.friendsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prijatelji online</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push('/(tabs)/chat')}
              >
                <Text style={styles.seeAllText}>Vidi sve</Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.friendsList}>
                {onlineFriends.slice(0, 8).map((friend) => (
                  <TouchableOpacity 
                    key={friend.id} 
                    style={styles.friendCard}
                    onPress={() => handleFriendPress(friend)}
                  >
                    <View style={styles.friendAvatarContainer}>
                      {friend.avatar_url ? (
                        <Image source={{ uri: friend.avatar_url }} style={styles.friendAvatar} />
                      ) : (
                        <View style={styles.friendAvatarPlaceholder}>
                          <Text style={styles.friendAvatarInitials}>
                            {friend.first_name?.charAt(0)}{friend.last_name?.charAt(0)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.onlineIndicator} />
                    </View>
                    <Text style={styles.friendName} numberOfLines={1}>
                      {friend.first_name} {friend.last_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* No Friends Online State */}
        {onlineFriends.length === 0 && !loading && (
          <View style={styles.noFriendsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prijatelji online</Text>
            </View>
            <View style={styles.noFriendsOnline}>
              <Wifi size={32} color={colors.textSecondary} />
              <Text style={styles.noFriendsText}>Nema prijatelja online</Text>
              <Text style={styles.noFriendsSubtext}>
                Pozovite prijatelje da se pridruže ili pronađite nove!
              </Text>
            </View>
          </View>
        )}

        {/* Today's Games */}
        <View style={styles.gamesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Današnji mečevi</Text>
            <TouchableOpacity style={styles.seeAllButton} onPress={handleViewAllGames}>
              <Text style={styles.seeAllText}>Vidi sve</Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {todaysGames.map((game) => (
            <TouchableOpacity key={game.id} style={styles.gameCard}>
              <View style={styles.gameTime}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.gameTimeText}>{game.time}</Text>
              </View>
              
              <View style={styles.gameDetails}>
                <Text style={styles.gameLocation}>{game.location}</Text>
                <View style={styles.gameInfo}>
                  <View style={styles.gameInfoItem}>
                    <Users size={14} color={colors.textSecondary} />
                    <Text style={styles.gameInfoText}>{game.players}</Text>
                  </View>
                  <View style={styles.gameInfoItem}>
                    <Text style={styles.gamePrice}>{game.price}</Text>
                  </View>
                  <View style={styles.skillBadge}>
                    <Text style={styles.skillText}>{game.skill}</Text>
                  </View>
                </View>
              </View>
              
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Brze akcije</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handlePlayNow}>
              <Play size={24} color={colors.text} />
              <Text style={styles.actionText}>Kreiraj meč</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <MapPin size={24} color="#F97316" />
              <Text style={styles.actionText}>Pronađi teren</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <Users size={24} color="#3B82F6" />
              <Text style={styles.actionText}>Pozovi prijatelje</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={handleRatePlayer}>
              <Star size={24} color="#EAB308" />
              <Text style={styles.actionText}>Oceni igrače</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Player Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Oceni igrače</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                Odaberite igrača sa kojim ste nedavno igrali:
              </Text>

              {recentPlayers.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerCard,
                    selectedPlayer?.id === player.id && styles.playerCardSelected
                  ]}
                  onPress={() => setSelectedPlayer(player)}
                >
                  <View style={styles.playerInfo}>
                    {player.avatar_url ? (
                      <Image source={{ uri: player.avatar_url }} style={styles.playerAvatar} />
                    ) : (
                      <View style={styles.playerAvatarPlaceholder}>
                        <Text style={styles.playerAvatarInitials}>
                          {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.playerDetails}>
                      <Text style={styles.playerName}>
                        {player.first_name} {player.last_name}
                      </Text>
                      <Text style={styles.playerMeta}>
                        Poslednji put: {player.last_played} • {player.games_together} {player.games_together === 1 ? 'meč' : 'mečeva'}
                      </Text>
                      {player.current_rating > 0 && (
                        <View style={styles.currentRating}>
                          <Text style={styles.currentRatingText}>
                            Trenutna ocena: {player.current_rating.toFixed(1)}
                          </Text>
                          {renderRatingStars(player.current_rating)}
                        </View>
                      )}
                    </View>
                  </View>
                  {selectedPlayer?.id === player.id && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {selectedPlayer && (
                <View style={styles.ratingSection}>
                  <Text style={styles.ratingLabel}>
                    Ocenite {selectedPlayer.first_name} {selectedPlayer.last_name}:
                  </Text>
                  {renderRatingStars(rating, setRating)}
                  
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Dodajte komentar (opciono)"
                    placeholderTextColor={colors.textSecondary}
                    value={ratingComment}
                    onChangeText={setRatingComment}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={styles.cancelButtonText}>Otkaži</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedPlayer || rating === 0) && styles.submitButtonDisabled
                ]}
                onPress={submitRating}
                disabled={!selectedPlayer || rating === 0}
              >
                <Text style={styles.submitButtonText}>Pošalji ocenu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sport Selection Modal - Always show for users who haven't completed questionnaire */}
      <SportSelectionModal
        visible={showSportSelection}
        onSelectSport={handleSportSelect}
        onClose={() => setShowSportSelection(false)}
        isFirstTime={!hasCompletedQuestionnaire}
      />

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
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Black',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 24,
    minHeight: 200,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
    paddingRight: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 32,
    fontFamily: 'Roboto-Black',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'Roboto-Regular',
    marginBottom: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Roboto-Bold',
  },
  heroImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  statsContainer: {
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
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Roboto-Regular',
    marginTop: 4,
  },
  friendsContainer: {
    paddingLeft: 20,
    marginBottom: 24,
  },
  noFriendsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 20,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Medium',
    marginRight: 4,
  },
  friendsList: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  friendCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  friendAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.border,
  },
  friendAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  friendAvatarInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
    fontFamily: 'Roboto-Bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.background,
  },
  friendName: {
    fontSize: 12,
    color: colors.text,
    fontFamily: 'Roboto-Medium',
    textAlign: 'center',
  },
  noFriendsOnline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginRight: 20,
  },
  noFriendsText: {
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginTop: 12,
    textAlign: 'center',
  },
  noFriendsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  gamesContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  gameCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  gameTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  gameTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginLeft: 4,
  },
  gameDetails: {
    flex: 1,
  },
  gameLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 4,
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  gameInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginLeft: 4,
  },
  gamePrice: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  skillBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  skillText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Medium',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginTop: 8,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginVertical: 16,
  },
  playerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  playerCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: `${colors.text}05`,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  playerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerAvatarInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
    fontFamily: 'Roboto-Bold',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 4,
  },
  playerMeta: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginBottom: 4,
  },
  currentRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentRatingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ratingSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Roboto-Regular',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Roboto-Bold',
  },
});