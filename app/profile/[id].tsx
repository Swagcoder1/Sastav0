import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star, Calendar, MapPin, Users, Award, Target, Clock, MessageCircle, UserPlus, UserMinus, UserCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { FriendsService, FriendshipStatus } from '@/lib/friendsService';
import { MessagesService } from '@/lib/messagesService';

const { width } = Dimensions.get('window');

interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  skills: string[];
  positions: string[];
  created_at: string;
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>({ status: 'none' });
  const [actionLoading, setActionLoading] = useState(false);

  // Initialize styles early to avoid initialization errors
  const styles = createStyles(colors);

  useEffect(() => {
    if (params.id) {
      fetchProfile();
      fetchFriendshipStatus();
    } else {
      // Use params data if available
      const profileFromParams = {
        id: params.id as string,
        username: params.username as string,
        first_name: params.firstName as string,
        last_name: params.lastName as string,
        avatar_url: params.avatarUrl as string || undefined,
        bio: 'Strastveni fudbaler koji voli da igra u slobodno vreme.',
        location: 'Beograd',
        skills: params.skills ? JSON.parse(params.skills as string) : [],
        positions: params.positions ? JSON.parse(params.positions as string) : [],
        created_at: new Date().toISOString(),
      };
      setProfile(profileFromParams);
      fetchFriendshipStatus();
      setLoading(false);
    }
  }, [params]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
      } else {
        // No profile found
        console.info('No profile found for user ID:', params.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendshipStatus = async () => {
    if (params.id) {
      const status = await FriendsService.getFriendshipStatus(params.id as string);
      setFriendshipStatus(status);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!profile) return;
    
    setActionLoading(true);
    const { error } = await FriendsService.sendFriendRequest(profile.id);
    
    if (error) {
      Alert.alert('Greška', error);
    } else {
      Alert.alert('Uspeh', 'Zahtev za prijateljstvo je poslat!');
      await fetchFriendshipStatus();
    }
    setActionLoading(false);
  };

  const handleAcceptFriendRequest = async () => {
    if (!friendshipStatus.friendshipId) return;
    
    setActionLoading(true);
    const { error } = await FriendsService.acceptFriendRequest(friendshipStatus.friendshipId);
    
    if (error) {
      Alert.alert('Greška', error);
    } else {
      Alert.alert('Uspeh', 'Zahtev za prijateljstvo je prihvaćen!');
      await fetchFriendshipStatus();
    }
    setActionLoading(false);
  };

  const handleDeclineFriendRequest = async () => {
    if (!friendshipStatus.friendshipId) return;
    
    setActionLoading(true);
    const { error } = await FriendsService.declineFriendRequest(friendshipStatus.friendshipId);
    
    if (error) {
      Alert.alert('Greška', error);
    } else {
      Alert.alert('Uspeh', 'Zahtev za prijateljstvo je odbačen.');
      await fetchFriendshipStatus();
    }
    setActionLoading(false);
  };

  const handleRemoveFriend = async () => {
    if (!friendshipStatus.friendshipId) return;
    
    Alert.alert(
      'Ukloni prijatelja',
      'Da li ste sigurni da želite da uklonite ovog prijatelja?',
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Ukloni',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const { error } = await FriendsService.removeFriend(friendshipStatus.friendshipId!);
            
            if (error) {
              Alert.alert('Greška', error);
            } else {
              Alert.alert('Uspeh', 'Prijatelj je uklonjen.');
              await fetchFriendshipStatus();
            }
            setActionLoading(false);
          }
        }
      ]
    );
  };

  const handleSendMessage = async () => {
    if (!profile) return;
    
    // Navigate to chat with this user
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        avatar: profile.avatar_url || '',
        username: profile.username
      }
    });
  };

  const renderFriendshipButton = () => {
    if (actionLoading) {
      return (
        <TouchableOpacity style={[styles.primaryActionButton, styles.disabledButton]} disabled>
          <Text style={styles.primaryActionButtonText}>Učitavanje...</Text>
        </TouchableOpacity>
      );
    }

    switch (friendshipStatus.status) {
      case 'none':
        return (
          <TouchableOpacity style={styles.primaryActionButton} onPress={handleSendFriendRequest}>
            <UserPlus size={20} color="#FFFFFF" />
            <Text style={styles.primaryActionButtonText}>Dodaj prijatelja</Text>
          </TouchableOpacity>
        );
      
      case 'pending':
        if (friendshipStatus.isRequester) {
          return (
            <TouchableOpacity style={[styles.primaryActionButton, styles.pendingButton]} disabled>
              <Clock size={20} color="#6B7280" />
              <Text style={[styles.primaryActionButtonText, { color: '#6B7280' }]}>Zahtev poslat</Text>
            </TouchableOpacity>
          );
        } else {
          return (
            <View style={styles.pendingRequestButtons}>
              <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptFriendRequest}>
                <UserCheck size={16} color="#FFFFFF" />
                <Text style={styles.acceptButtonText}>Prihvati</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineButton} onPress={handleDeclineFriendRequest}>
                <UserMinus size={16} color="#EF4444" />
                <Text style={styles.declineButtonText}>Odbaci</Text>
              </TouchableOpacity>
            </View>
          );
        }
      
      case 'accepted':
        return (
          <TouchableOpacity style={[styles.primaryActionButton, styles.friendButton]} onPress={handleRemoveFriend}>
            <UserCheck size={20} color="#10B981" />
            <Text style={[styles.primaryActionButtonText, { color: '#10B981' }]}>Prijatelji</Text>
          </TouchableOpacity>
        );
      
      default:
        return null;
    }
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

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Profil nije pronađen</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Nazad</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Mock stats for demonstration
  const stats = [
    { label: 'Odigrani mečevi', value: '0', icon: Calendar, color: colors.text },
    { label: 'Prosečna ocena', value: '0.0', icon: Star, color: '#EAB308' },
    { label: 'Pobede', value: '0', icon: Award, color: '#3B82F6' },
    { label: 'Golovi', value: '0', icon: Target, color: '#F97316' },
  ];

  const achievements = [
    { id: 1, title: 'Novi igrač', description: 'Dobrodošli u Sastav!', icon: '🎉', unlocked: true },
    { id: 2, title: 'Prvi meč', description: 'Odigrajte prvi meč', icon: '⚽', unlocked: false },
    { id: 3, title: 'Redovan igrač', description: '10+ mečeva', icon: '🏆', unlocked: false },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'achievement',
      title: 'Novo dostignuće!',
      subtitle: 'Novi igrač - Dobrodošli u Sastav!',
      time: 'Upravo',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.headerSpacer} />
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
              {/* Profile Avatar */}
              <View style={styles.profileImageContainer}>
                {profile.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileImageInitials}>
                      {profile.first_name?.charAt(0).toUpperCase()}{profile.last_name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.profileName}>
                {profile.first_name} {profile.last_name}
              </Text>
              <Text style={styles.profileUsername}>@{profile.username}</Text>
              <Text style={styles.profileSubtitle}>
                {profile.location || 'Beograd'} • Novi igrač
              </Text>
              
              <View style={styles.profileStats}>
                <View style={styles.profileStat}>
                  <Star size={16} color={colors.text} fill={colors.text} />
                  <Text style={styles.profileStatText}>0.0</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStat}>
                  <Calendar size={16} color={colors.text} />
                  <Text style={styles.profileStatText}>0 mečeva</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStat}>
                  <MapPin size={16} color={colors.text} />
                  <Text style={styles.profileStatText}>{profile.location || 'Beograd'}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsSection}>
          <TouchableOpacity style={styles.secondaryActionButton} onPress={handleSendMessage}>
            <MessageCircle size={20} color={colors.text} />
            <Text style={[styles.secondaryActionButtonText, { color: colors.text }]}>
              Pošaljite poruku
            </Text>
          </TouchableOpacity>
          
          {renderFriendshipButton()}
        </View>

        {/* Bio Section */}
        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>O korisniku</Text>
          <Text style={styles.bioText}>
            {profile.bio || 'Strastveni fudbaler koji voli da igra u slobodno vreme. Uvek spreman za novi izazov!'}
          </Text>
        </View>

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Veštine</Text>
            <View style={styles.tagsContainer}>
              {profile.skills.map((skill, index) => (
                <View key={index} style={[styles.tag, styles.skillTag]}>
                  <Text style={styles.tagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Positions Section */}
        {profile.positions && profile.positions.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Pozicije</Text>
            <View style={styles.tagsContainer}>
              {profile.positions.map((position, index) => (
                <View key={index} style={[styles.tag, styles.positionTag]}>
                  <Text style={styles.tagText}>{position}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistike</Text>
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
          <Text style={styles.sectionTitle}>Dostignuća</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={[
                styles.achievementCard,
                !achievement.unlocked && styles.achievementCardLocked
              ]}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={[
                  styles.achievementTitle,
                  !achievement.unlocked && styles.achievementTitleLocked
                ]}>
                  {achievement.title}
                </Text>
                <Text style={[
                  styles.achievementDescription,
                  !achievement.unlocked && styles.achievementDescriptionLocked
                ]}>
                  {achievement.description}
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
                { backgroundColor: '#3B82F620' }
              ]}>
                <Award size={16} color="#3B82F6" />
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
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  headerSpacer: {
    width: 40,
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
  profileUsername: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
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
  actionButtonsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
  },
  secondaryActionButton: {
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
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pendingButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  friendButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  pendingRequestButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 6,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  declineButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
    marginLeft: 6,
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
  tagsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skillTag: {
    backgroundColor: '#3B82F620',
    borderColor: '#3B82F6',
  },
  positionTag: {
    backgroundColor: '#10B98120',
    borderColor: '#10B981',
  },
  tagText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Medium',
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
  achievementCardLocked: {
    opacity: 0.5,
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
  achievementTitleLocked: {
    color: colors.textSecondary,
  },
  achievementDescription: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
  },
  achievementDescriptionLocked: {
    color: colors.border,
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
});