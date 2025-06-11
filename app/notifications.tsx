import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, UserPlus, MessageCircle, Users, Calendar, Check, X, Trash2, TrashIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { router, useFocusEffect } from 'expo-router';
import { NotificationsService, Notification } from '@/lib/notificationsService';
import { FriendsService } from '@/lib/friendsService';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reload notifications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data, error } = await NotificationsService.getNotifications();
    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    // Immediately update local state for instant feedback
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );

    // Then update in database
    await NotificationsService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    // Immediately update local state for instant feedback
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // Then update in database
    await NotificationsService.markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId: string) => {
    // Immediately update local state for instant feedback
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    // Then delete from database
    await NotificationsService.deleteNotification(notificationId);
  };

  const handleClearAllNotifications = async () => {
    Alert.alert(
      'Obriši sve notifikacije',
      'Da li ste sigurni da želite da obrišete sve notifikacije?',
      [
        {
          text: 'Otkaži',
          style: 'cancel',
        },
        {
          text: 'Obriši sve',
          style: 'destructive',
          onPress: async () => {
            // Immediately clear local state
            setNotifications([]);
            
            // Then delete from database
            await NotificationsService.deleteAllNotifications();
          },
        },
      ]
    );
  };

  const handleAcceptFriendRequest = async (notification: Notification) => {
    const friendshipId = notification.data?.friendship_id;
    if (!friendshipId) return;

    setActionLoading(notification.id);
    const { error } = await FriendsService.acceptFriendRequest(friendshipId);
    
    if (!error) {
      // Mark notification as read and update its content immediately
      setNotifications(prev => 
        prev.map(n => n.id === notification.id 
          ? { 
              ...n, 
              read: true, 
              title: 'Zahtev prihvaćen',
              content: 'Uspešno ste prihvatili zahtev za prijateljstvo.'
            } 
          : n
        )
      );

      // Also mark as read in database
      await handleMarkAsRead(notification.id);
    }
    setActionLoading(null);
  };

  const handleDeclineFriendRequest = async (notification: Notification) => {
    const friendshipId = notification.data?.friendship_id;
    if (!friendshipId) return;

    setActionLoading(notification.id);
    const { error } = await FriendsService.declineFriendRequest(friendshipId);
    
    if (!error) {
      // Remove the notification immediately
      await handleDeleteNotification(notification.id);
    }
    setActionLoading(null);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Always mark as read when tapped, regardless of type
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'friend_request':
        // Don't navigate for friend requests, handle them inline
        break;
      case 'friend_accepted':
        if (notification.data?.friend_id) {
          router.push({
            pathname: '/profile/[id]',
            params: { id: notification.data.friend_id }
          });
        }
        break;
      case 'message':
        if (notification.data?.sender_id) {
          router.push({
            pathname: '/chat/[id]',
            params: { 
              id: notification.data.sender_id,
              name: notification.title.replace('Nova poruka od ', '').replace('Zahtev za poruku od ', '')
            }
          });
        }
        break;
      case 'new_user_match':
        if (notification.data?.new_user_id) {
          router.push({
            pathname: '/profile/[id]',
            params: { id: notification.data.new_user_id }
          });
        }
        break;
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
        return UserPlus;
      case 'message':
        return MessageCircle;
      case 'new_user_match':
        return Users;
      case 'game_update':
        return Calendar;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
        return '#3B82F6';
      case 'message':
        return '#10B981';
      case 'new_user_match':
        return '#F59E0B';
      case 'game_update':
        return '#EF4444';
      default:
        return colors.textSecondary;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Upravo';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h`;
    return `${Math.floor(diffInMinutes / 1440)} dan`;
  };

  const renderNotification = (notification: Notification) => {
    const IconComponent = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);
    const isFriendRequest = notification.type === 'friend_request';
    const isLoading = actionLoading === notification.id;

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          !notification.read && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(notification)}
        disabled={isFriendRequest}
      >
        <View style={[styles.notificationIcon, { backgroundColor: `${iconColor}20` }]}>
          <IconComponent size={20} color={iconColor} />
        </View>

        <View style={styles.notificationContent}>
          <Text style={[
            styles.notificationTitle,
            !notification.read && styles.unreadText
          ]}>
            {notification.title}
          </Text>
          <Text style={styles.notificationText}>
            {notification.content}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTime(notification.created_at)}
          </Text>
        </View>

        <View style={styles.notificationActions}>
          {isFriendRequest && !notification.read ? (
            <View style={styles.friendRequestActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAcceptFriendRequest(notification)}
                disabled={isLoading}
              >
                <Check size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleDeclineFriendRequest(notification)}
                disabled={isLoading}
              >
                <X size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteNotification(notification.id)}
            >
              <Trash2 size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {!notification.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Obaveštenja {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>Označi sve</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAllNotifications} style={styles.clearAllButton}>
              <TrashIcon size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Učitavanje obaveštenja...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nema obaveštenja</Text>
            <Text style={styles.emptySubtitle}>
              Ovde će se pojaviti vaša obaveštenja kada ih budete imali
            </Text>
          </View>
        ) : (
          notifications.map(renderNotification)
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  markAllText: {
    fontSize: 12,
    color: '#3B82F6',
    fontFamily: 'Roboto-Medium',
  },
  clearAllButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsList: {
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
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: `${colors.text}05`,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  notificationActions: {
    alignItems: 'flex-end',
  },
  friendRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  declineButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
});