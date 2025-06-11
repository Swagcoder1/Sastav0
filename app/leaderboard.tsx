import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trophy, Medal, Award, Star, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSport } from '@/contexts/SportContext';
import { router } from 'expo-router';
import { UserStatsService } from '@/lib/userStatsService';

interface LeaderboardEntry {
  user_id: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  goals_scored: number;
  assists: number;
  average_rating: number;
  profile: {
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  rank: number;
  win_percentage: number;
}

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const { selectedSport } = useSport();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'rating' | 'wins' | 'goals'>('rating');

  useEffect(() => {
    loadLeaderboard();
  }, [selectedSport, selectedCategory]);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await UserStatsService.getLeaderboard(selectedSport, 50);
      if (!error && data) {
        // Add rank and calculate win percentage
        const leaderboardData = data.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          win_percentage: UserStatsService.calculateWinPercentage(entry.games_won, entry.games_played)
        }));

        // Sort based on selected category
        const sortedData = sortLeaderboard(leaderboardData, selectedCategory);
        setLeaderboard(sortedData);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortLeaderboard = (data: LeaderboardEntry[], category: string) => {
    return data.sort((a, b) => {
      switch (category) {
        case 'rating':
          return b.average_rating - a.average_rating;
        case 'wins':
          return b.games_won - a.games_won;
        case 'goals':
          return b.goals_scored - a.goals_scored;
        default:
          return b.average_rating - a.average_rating;
      }
    }).map((entry, index) => ({ ...entry, rank: index + 1 }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={24} color="#FFD700" />;
      case 2:
        return <Medal size={24} color="#C0C0C0" />;
      case 3:
        return <Award size={24} color="#CD7F32" />;
      default:
        return (
          <View style={styles.rankNumber}>
            <Text style={styles.rankNumberText}>{rank}</Text>
          </View>
        );
    }
  };

  const getSportName = () => {
    switch (selectedSport) {
      case 'football': return 'Fudbal';
      case 'padel': return 'Padel';
      case 'basketball': return 'Košarka';
      default: return 'Sport';
    }
  };

  const getCategoryLabel = () => {
    switch (selectedCategory) {
      case 'rating': return 'Prosečna ocena';
      case 'wins': return 'Broj pobeda';
      case 'goals': return selectedSport === 'football' ? 'Golovi' : 'Poeni';
      default: return 'Prosečna ocena';
    }
  };

  const getCategoryValue = (entry: LeaderboardEntry) => {
    switch (selectedCategory) {
      case 'rating': return entry.average_rating.toFixed(1);
      case 'wins': return entry.games_won.toString();
      case 'goals': return entry.goals_scored.toString();
      default: return entry.average_rating.toFixed(1);
    }
  };

  const categories = [
    { id: 'rating', label: 'Ocena', icon: Star },
    { id: 'wins', label: 'Pobede', icon: Trophy },
    { id: 'goals', label: selectedSport === 'football' ? 'Golovi' : 'Poeni', icon: TrendingUp },
  ];

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => (
    <TouchableOpacity
      key={entry.user_id}
      style={[
        styles.leaderboardEntry,
        index < 3 && styles.topThreeEntry
      ]}
      onPress={() => router.push({
        pathname: '/profile/[id]',
        params: { id: entry.user_id }
      })}
    >
      <View style={styles.rankContainer}>
        {getRankIcon(entry.rank)}
      </View>

      <View style={styles.playerInfo}>
        {entry.profile.avatar_url ? (
          <Image source={{ uri: entry.profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {entry.profile.first_name?.charAt(0)}{entry.profile.last_name?.charAt(0)}
            </Text>
          </View>
        )}
        
        <View style={styles.playerDetails}>
          <Text style={styles.playerName}>
            {entry.profile.first_name} {entry.profile.last_name}
          </Text>
          <Text style={styles.playerUsername}>@{entry.profile.username}</Text>
          <Text style={styles.playerStats}>
            {entry.games_played} mečeva • {entry.win_percentage}% pobeda
          </Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={styles.scoreValue}>{getCategoryValue(entry)}</Text>
        <Text style={styles.scoreLabel}>{getCategoryLabel()}</Text>
      </View>
    </TouchableOpacity>
  );

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rang lista - {getSportName()}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Category Selector */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryList}>
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    isSelected && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category.id as any)}
                >
                  <IconComponent 
                    size={16} 
                    color={isSelected ? colors.background : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextActive
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Leaderboard */}
      <ScrollView
        style={styles.leaderboardContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Učitavanje rang liste...</Text>
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Trophy size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nema podataka</Text>
            <Text style={styles.emptySubtitle}>
              Rang lista će se popuniti kada igrači počnu da igraju mečeve
            </Text>
          </View>
        ) : (
          <View style={styles.leaderboardList}>
            {leaderboard.map(renderLeaderboardEntry)}
          </View>
        )}
      </ScrollView>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Rang lista se ažurira nakon svakog odigranog meča
        </Text>
      </View>
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
  headerSpacer: {
    width: 40,
  },
  categoryContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryList: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  categoryText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Medium',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: colors.background,
  },
  leaderboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  leaderboardList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  topThreeEntry: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 2,
  },
  playerUsername: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginBottom: 2,
  },
  playerStats: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
  },
});