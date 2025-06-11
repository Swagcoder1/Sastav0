import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Star, Trophy, Calendar, MapPin, Users, Award, Target, Clock, LogOut, Bell, ChevronDown, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSport } from '@/contexts/SportContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FloatingSearch } from '@/components/FloatingSearch';
import { FloatingSearchButton } from '@/components/FloatingSearchButton';
import { useFloatingButton } from '@/contexts/FloatingButtonContext';
import { NotificationsService } from '@/lib/notificationsService';
import { UserStatsService } from '@/lib/userStatsService';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { selectedSport, setSelectedSport } = useSport();
  const { searchVisible, setSearchVisible } = useFloatingButton();
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [showSportDropdown, setShowSportDropdown] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [userStats, setUserStats] = React.useState<any>(null);
  const [userAchievements, setUserAchievements] = React.useState<any[]>([]);
  const [profileData, setProfileData] = React.useState({
    location: 'Beograd',
    bio: 'Strastveni sportista koji voli da igra u slobodno vreme. Uvek spreman za novi izazov!',
  });

  // Available sports
  const sports = [
    { id: 'football', name: 'Fudbal', emoji: '⚽', color: '#10B981' },
    { id: 'padel', name: 'Padel', emoji: '🏓', color: '#3B82F6' },
    { id: 'basketball', name: 'Košarka', emoji: '🏀', color: '#F59E0B' },
  ];

  // Mock user data with default values for new accounts
  const userProfile = {
    name: user?.user_metadata?.username || 'Korisnik',
    avatar: null, // Remove default avatar
  };

  const currentSport = sports.find(sport => sport.id === selectedSport);

  // Load data when screen comes into focus (including when returning from settings)
  useFocusEffect(
    React.useCallback(() => {
      loadNotificationCount();
      loadProfileData();
      loadUserStats();
      loadUserAchievements();
    }, [selectedSport])
  );

  React.useEffect(() => {
    loadNotificationCount();
    loadProfileData();
    loadUserStats();
    loadUserAchievements();
  }, [selectedSport]);

  const loadNotificationCount = async () => {
    const { count } = await NotificationsService.getUnreadCount();
    setNotificationCount(count);
  };

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
        setProfileData({
          location: data.location || 'Beograd',
          bio: data.bio || 'Strastveni sportista koji voli da igra u slobodno vreme. Uvek spreman za novi izazov!',
        });
      } else {
        // No profile found, use default values
        console.info('No profile found for user, using default values');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await UserStatsService.getUserStatistics(user.id, selectedSport);
      if (!error && data) {
        setUserStats(data);
      } else {
        // Set default stats if none found
        setUserStats({
          games_played: 0,
          games_won: 0,
          games_lost: 0,
          goals_scored: 0,
          assists: 0,
          average_rating: 0.0,
          win_percentage: 0
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStats({
        games_played: 0,
        games_won: 0,
        games_lost: 0,
        goals_scored: 0,
        assists: 0,
        average_rating: 0.0,
        win_percentage: 0
      });
    }
  };

  const loadUserAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await UserStatsService.getUserAchievements(user.id, selectedSport);
      if (!error && data) {
        setUserAchievements(data);
      } else {
        // Set default achievements
        setUserAchievements([
          { 
            achievement_name: 'Novi igrač', 
            achievement_description: 'Dobrodošli u Sastav!', 
            sport: null,
            unlocked_at: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
      setUserAchievements([
        { 
          achievement_name: 'Novi igrač', 
          achievement_description: 'Dobrodošli u Sastav!', 
          sport: null,
          unlocked_at: new Date().toISOString()
        }
      ]);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadNotificationCount(),
      loadProfileData(),
      loadUserStats(),
      loadUserAchievements(),
    ]);
    setRefreshing(false);
  }, [selectedSport]);

  const stats = [
    { 
      label: 'Odigrani mečevi', 
      value: userStats?.games_played?.toString() || '0', 
      icon: Calendar, 
      color: colors.text 
    },
    { 
      label: 'Prosečna ocena', 
      value: userStats?.average_rating?.toFixed(1) || '0.0', 
      icon: Star, 
      color: '#EAB308' 
    },
    { 
      label: 'Pobede', 
      value: userStats?.games_won?.toString() || '0', 
      icon: Trophy, 
      color: '#3B82F6' 
    },
    { 
      label: selectedSport === 'football' ? 'Golovi' : 'Poeni', 
      value: selectedSport === 'football' ? (userStats?.goals_scored?.toString() || '0') : 'N/A', 
      icon: Target, 
      color: '#F97316' 
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'achievement',
      title: 'Novo dostignuće!',
      subtitle: `${currentSport?.name} - ${userAchievements[0]?.achievement_name || 'Novi igrač'}`,
      time: 'Upravo',
    },
  ];

  const handleSignOut = async () => {
    if (signingOut) return; // Prevent multiple logout attempts

    Alert.alert(
      'Odjava',
      'Da li ste sigurni da se želite odjaviti?',
      [
        {
          text: 'Otkaži',
          style: 'cancel',
        },
        {
          text: 'Odjavi se',
          style: 'destructive',
          onPress: async () => {
            try {
              setSigningOut(true);
              console.log('User confirmed logout');
              
              await signOut();
              
              console.log('Logout completed, redirecting to login');
              // Force navigation to login
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error during logout:', error);
              // Even if there's an error, redirect to login
              router.replace('/auth/login');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleNotifications = () => {
    router.push('/notifications');
  };

  const handleSettings = () => {
    router.push('/profile/settings');
  };

  const handleLeaderboard = () => {
    router.push('/leaderboard');
  };

  const handleSportSelect = (sportId: 'football' | 'padel' | 'basketball') => {
    setSelectedSport(sportId);
    setShowSportDropdown(false);
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
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Settings size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationButton} onPress={handleNotifications}>
              <Bell size={20} color={colors.textSecondary} />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <ThemeToggle />
            <TouchableOpacity 
              style={[styles.logoutButton, signingOut && styles.logoutButtonDisabled]} 
              onPress={handleSignOut}
              disabled={signingOut}
            >
              <LogOut size={20} color={signingOut ? colors.border : colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <LinearGradient
            colors={[colors.card, colors.border]}
            style={styles.profileGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.profileContent}>
              {/* Profile Avatar - Show placeholder or initials if no avatar */}
              <View style={styles.profileImageContainer}>
                {userProfile.avatar ? (
                  <Image
                    source={{ uri: userProfile.avatar }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileImageInitials}>
                      {userProfile.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.profileName}>{userProfile.name}</Text>
              {/* Email is now hidden */}
              <Text style={styles.profileSubtitle}>
                {profileData.location} • Sportista
              </Text>
              
              <View style={styles.profileStats}>
                <View style={styles.profileStat}>
                  <Star size={16} color={colors.text} fill={colors.text} />
                  <Text style={styles.profileStatText}>{userStats?.average_rating?.toFixed(1) || '0.0'}</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStat}>
                  <Calendar size={16} color={colors.text} />
                  <Text style={styles.profileStatText}>{userStats?.games_played || 0} mečeva</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStat}>
                  <MapPin size={16} color={colors.text} />
                  <Text style={styles.profileStatText}>{profileData.location}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Bio Section */}
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>O meni</Text>
          <Text style={styles.bioText}>{profileData.bio}</Text>
        </View>

        {/* Sport Selection Dropdown */}
        <View style={styles.sportSelectionSection}>
          <Text style={styles.sectionTitle}>Izabrani sport</Text>
          <TouchableOpacity 
            style={styles.sportDropdown}
            onPress={() => setShowSportDropdown(!showSportDropdown)}
          >
            <View style={styles.sportDropdownContent}>
              <View style={styles.selectedSport}>
                <Text style={styles.sportEmoji}>{currentSport?.emoji}</Text>
                <Text style={styles.sportName}>{currentSport?.name}</Text>
              </View>
              <ChevronDown 
                size={20} 
                color={colors.textSecondary}
                style={[
                  styles.dropdownIcon,
                  showSportDropdown && styles.dropdownIconRotated
                ]}
              />
            </View>
          </TouchableOpacity>

          {showSportDropdown && (
            <View style={styles.sportDropdownMenu}>
              {sports.map((sport) => (
                <TouchableOpacity
                  key={sport.id}
                  style={[
                    styles.sportOption,
                    selectedSport === sport.id && styles.sportOptionSelected
                  ]}
                  onPress={() => handleSportSelect(sport.id as any)}
                >
                  <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                  <Text style={[
                    styles.sportOptionText,
                    selectedSport === sport.id && styles.sportOptionTextSelected
                  ]}>
                    {sport.name}
                  </Text>
                  {selectedSport === sport.id && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistike - {currentSport?.name}</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                    <IconComponent size={20} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Dostignuća - {currentSport?.name}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {userAchievements.map((achievement, index) => (
              <View key={index} style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>🏆</Text>
                <Text style={styles.achievementTitle}>
                  {achievement.achievement_name}
                </Text>
                <Text style={styles.achievementDescription}>
                  {achievement.achievement_description}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Nedavna aktivnost</Text>
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[
                styles.activityIcon,
                { backgroundColor: `${currentSport?.color}20` }
              ]}>
                <Award size={16} color={currentSport?.color} />
              </View>
              
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
              </View>
              
              <View style={styles.activityTime}>
                <Clock size={12} color={colors.textSecondary} />
                <Text style={styles.activityTimeText}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Users size={20} color="#111827" />
            <Text style={styles.actionButtonText}>Pozovi prijatelje</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleLeaderboard}
          >
            <TrendingUp size={20} color={colors.textSecondary} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              Rang lista
            </Text>
          </TouchableOpacity>
        </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  profileSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: 24,
    alignItems: 'center',
  },
  profileContent: {
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.text,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.text,
  },
  profileImageInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.background,
    fontFamily: 'Roboto-Bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginBottom: 16,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileStatText: {
    fontSize: 12,
    color: colors.text,
    fontFamily: 'Roboto-Medium',
    marginLeft: 4,
  },
  profileStatDivider: {
    width: 1,
    height: 12,
    backgroundColor: `${colors.text}40`,
    marginHorizontal: 12,
  },
  bioSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  bioText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    lineHeight: 24,
  },
  sportSelectionSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    position: 'relative',
    zIndex: 1000,
  },
  sportDropdown: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sportDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedSport: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  sportName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  dropdownIcon: {
    transform: [{ rotate: '0deg' }],
  },
  dropdownIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  sportDropdownMenu: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sportOptionSelected: {
    backgroundColor: `${colors.text}10`,
  },
  sportOptionText: {
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Roboto-Medium',
    flex: 1,
  },
  sportOptionTextSelected: {
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsSection: {
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
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Roboto-Regular',
  },
  achievementsSection: {
    paddingLeft: 20,
    marginBottom: 24,
  },
  achievementCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
  },
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  activityTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTimeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginLeft: 4,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 8,
  },
  actionButtonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 0,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
  },
  actionButtonTextSecondary: {
    color: colors.textSecondary,
  },
});