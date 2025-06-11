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
import { MessageCircle, Users, Clock, UserPlus, Check, X, Calendar, Wifi } from 'lucide-react-native';
import { FloatingSearch } from '@/components/FloatingSearch';
import { FloatingSearchButton } from '@/components/FloatingSearchButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useFloatingButton } from '@/contexts/FloatingButtonContext';
import { MessagesService, Conversation } from '@/lib/messagesService';
import { FriendsService } from '@/lib/friendsService';
import { GameChatsService, GameChat } from '@/lib/gameChatsService';
import { PresenceService } from '@/lib/presenceService';
import { NotificationsService } from '@/lib/notificationsService';
import { router, useFocusEffect } from 'expo-router';

export default function ChatScreen() {
  const { colors } = useTheme();
  const [selectedTab, setSelectedTab] = useState('friends');
  const { searchVisible, setSearchVisible } = useFloatingButton();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [gameChats, setGameChats] = useState<GameChat[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reload data when screen comes into focus (when returning from chat)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
      loadOnlineUsers();
    }, [])
  );

  useEffect(() => {
    loadData();
    loadOnlineUsers();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        loadConversations(),
        loadGameChats(),
        loadPendingRequests()
      ]);
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await MessagesService.getConversations();
      if (!error && data) {
        setConversations(data);
      } else if (error) {
        console.error('Error loading conversations:', error);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error in loadConversations:', error);
      setConversations([]);
    }
  };

  const loadGameChats = async () => {
    try {
      const { data, error } = await GameChatsService.getGameChats();
      if (!error && data) {
        setGameChats(data);
      } else if (error) {
        console.error('Error loading game chats:', error);
        setGameChats([]);
      }
    } catch (error) {
      console.error('Error in loadGameChats:', error);
      setGameChats([]);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const { data, error } = await FriendsService.getPendingRequests();
      if (!error && data) {
        setPendingRequests(data);
      } else if (error) {
        console.error('Error loading pending requests:', error);
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Error in loadPendingRequests:', error);
      setPendingRequests([]);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const { data, error } = await PresenceService.getOnlineFriends();
      if (!error && data) {
        // The data is already in the correct format from PresenceService
        setOnlineUsers(data);
      } else if (error) {
        console.error('Error loading online users:', error);
        setOnlineUsers([]);
      }
    } catch (error) {
      console.error('Error in loadOnlineUsers:', error);
      setOnlineUsers([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadOnlineUsers()]);
    setRefreshing(false);
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    setActionLoading(requestId);
    const { error } = await FriendsService.acceptFriendRequest(requestId);
    
    if (!error) {
      await loadData();
      await loadOnlineUsers();
      
      // Mark related notifications as read
      await markFriendRequestNotificationsAsRead(requestId);
    }
    setActionLoading(null);
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    setActionLoading(requestId);
    const { error } = await FriendsService.declineFriendRequest(requestId);
    
    if (!error) {
      await loadData();
      
      // Mark related notifications as read
      await markFriendRequestNotificationsAsRead(requestId);
    }
    setActionLoading(null);
  };

  const markFriendRequestNotificationsAsRead = async (friendshipId: string) => {
    try {
      // Get all notifications related to this friendship
      const { data: notifications } = await NotificationsService.getNotifications();
      if (notifications) {
        const relatedNotifications = notifications.filter(
          n => n.data?.friendship_id === friendshipId && !n.read
        );
        
        // Mark each related notification as read
        for (const notification of relatedNotifications) {
          await NotificationsService.markAsRead(notification.id);
        }
      }
    } catch (error) {
      console.error('Error marking friend request notifications as read:', error);
    }
  };

  const markMessageNotificationsAsRead = async (userId: string) => {
    try {
      // Get all notifications related to messages from this user
      const { data: notifications } = await NotificationsService.getNotifications();
      if (notifications) {
        const messageNotifications = notifications.filter(
          n => n.type === 'message' && n.data?.sender_id === userId && !n.read
        );
        
        // Mark each message notification as read
        for (const notification of messageNotifications) {
          await NotificationsService.markAsRead(notification.id);
        }
      }
    } catch (error) {
      console.error('Error marking message notifications as read:', error);
    }
  };

  const handleConversationPress = async (conversation: Conversation) => {
    // Mark messages as read when opening conversation
    await MessagesService.markMessagesAsRead(conversation.user.id);
    
    // Mark related message notifications as read
    await markMessageNotificationsAsRead(conversation.user.id);
    
    // Update local state to reflect read status
    setConversations(prev => 
      prev.map(conv => 
        conv.user.id === conversation.user.id 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );

    router.push({
      pathname: '/chat/[id]',
      params: {
        id: conversation.user.id,
        name: `${conversation.user.first_name} ${conversation.user.last_name}`,
        avatar: conversation.user.avatar_url || '',
        username: conversation.user.username
      }
    });
  };

  const handleGameChatPress = async (gameChat: GameChat) => {
    // Mark game chat messages as read when opening
    await GameChatsService.markGameMessagesAsRead(gameChat.id);
    
    // Update local state to reflect read status
    setGameChats(prev => 
      prev.map(chat => 
        chat.id === gameChat.id 
          ? { ...chat, unread_count: 0 }
          : chat
      )
    );

    router.push({
      pathname: '/chat/game/[id]',
      params: {
        id: gameChat.id,
        name: gameChat.name,
        gameId: gameChat.game_id
      }
    });
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

  const isUserOnline = (userId: string) => {
    return onlineUsers.some(user => user.user_id === userId);
  };

  const friendConversations = conversations.filter(conv => conv.isFriend);
  const nonFriendConversations = conversations.filter(conv => !conv.isFriend);

  // Calculate total unread counts for each tab
  const friendsUnreadCount = friendConversations.reduce((total, conv) => total + conv.unreadCount, 0);
  const gamesUnreadCount = gameChats.reduce((total, chat) => total + chat.unread_count, 0);
  const requestsUnreadCount = pendingRequests.length + nonFriendConversations.reduce((total, conv) => total + conv.unreadCount, 0);

  const tabs = [
    { id: 'friends', label: 'Prijatelji', count: friendConversations.length, unreadCount: friendsUnreadCount },
    { id: 'games', label: 'Mečevi', count: gameChats.length, unreadCount: gamesUnreadCount },
    { id: 'requests', label: 'Zahtevi', count: pendingRequests.length + nonFriendConversations.length, unreadCount: requestsUnreadCount },
  ];

  const renderFriendConversation = (conversation: Conversation) => (
    <TouchableOpacity 
      key={conversation.user.id} 
      style={styles.chatItem}
      onPress={() => handleConversationPress(conversation)}
    >
      <View style={styles.avatarContainer}>
        {conversation.user.avatar_url ? (
          <Image source={{ uri: conversation.user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {conversation.user.first_name?.charAt(0)}{conversation.user.last_name?.charAt(0)}
            </Text>
          </View>
        )}
        {isUserOnline(conversation.user.id) && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>
            {conversation.user.first_name} {conversation.user.last_name}
          </Text>
          <View style={styles.chatMeta}>
            <Text style={styles.chatTime}>
              {formatTime(conversation.lastMessage.created_at)}
            </Text>
            {conversation.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.lastMessage} numberOfLines={1}>
          {conversation.lastMessage.content}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderGameChat = (gameChat: GameChat) => (
    <TouchableOpacity 
      key={gameChat.id} 
      style={styles.chatItem}
      onPress={() => handleGameChatPress(gameChat)}
    >
      <View style={styles.gameChatIcon}>
        <Calendar size={24} color={colors.text} />
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{gameChat.name}</Text>
          <View style={styles.chatMeta}>
            {gameChat.last_message && (
              <Text style={styles.chatTime}>
                {formatTime(gameChat.last_message.created_at)}
              </Text>
            )}
            {gameChat.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{gameChat.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
        
        {gameChat.last_message ? (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {gameChat.last_message.sender_name}: {gameChat.last_message.content}
          </Text>
        ) : (
          <Text style={styles.lastMessage} numberOfLines={1}>
            Grupni chat kreiran
          </Text>
        )}
        
        <View style={styles.gameChatInfo}>
          <Users size={12} color={colors.textSecondary} />
          <Text style={styles.participantsText}>
            {gameChat.participants_count} učesnika
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPendingRequest = (request: any) => (
    <View key={request.id} style={styles.requestItem}>
      <View style={styles.avatarContainer}>
        {request.requester.avatar_url ? (
          <Image source={{ uri: request.requester.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {request.requester.first_name?.charAt(0)}{request.requester.last_name?.charAt(0)}
            </Text>
          </View>
        )}
        {isUserOnline(request.requester.id) && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.requestContent}>
        <Text style={styles.requestName}>
          {request.requester.first_name} {request.requester.last_name}
        </Text>
        <Text style={styles.requestText}>
          Želi da vam bude prijatelj
        </Text>
        <Text style={styles.requestTime}>
          {formatTime(request.created_at)}
        </Text>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptFriendRequest(request.id)}
          disabled={actionLoading === request.id}
        >
          <Check size={16} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleDeclineFriendRequest(request.id)}
          disabled={actionLoading === request.id}
        >
          <X size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNonFriendConversation = (conversation: Conversation) => (
    <TouchableOpacity 
      key={conversation.user.id} 
      style={styles.requestItem}
      onPress={() => handleConversationPress(conversation)}
    >
      <View style={styles.avatarContainer}>
        {conversation.user.avatar_url ? (
          <Image source={{ uri: conversation.user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {conversation.user.first_name?.charAt(0)}{conversation.user.last_name?.charAt(0)}
            </Text>
          </View>
        )}
        {isUserOnline(conversation.user.id) && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.requestContent}>
        <Text style={styles.requestName}>
          {conversation.user.first_name} {conversation.user.last_name}
        </Text>
        <Text style={styles.requestText} numberOfLines={1}>
          {conversation.lastMessage.content}
        </Text>
        <Text style={styles.requestTime}>
          {formatTime(conversation.lastMessage.created_at)}
        </Text>
      </View>

      <View style={styles.messageIndicator}>
        <MessageCircle size={16} color={colors.textSecondary} />
        {conversation.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Poruke</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
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
            {tab.unreadCount > 0 ? (
              <View style={styles.tabUnreadBadge}>
                <Text style={styles.tabUnreadText}>{tab.unreadCount}</Text>
              </View>
            ) : tab.count > 0 ? (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.count}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'friends' && (
          <View style={styles.chatsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Učitavanje...</Text>
              </View>
            ) : friendConversations.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Poruke sa prijateljima</Text>
                {friendConversations.map(renderFriendConversation)}
              </>
            ) : (
              <View style={styles.emptyState}>
                <MessageCircle size={48} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>Nema poruka</Text>
                <Text style={styles.emptySubtitle}>
                  Počnite razgovor sa prijateljima
                </Text>
              </View>
            )}
          </View>
        )}

        {selectedTab === 'games' && (
          <View style={styles.chatsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Učitavanje...</Text>
              </View>
            ) : gameChats.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Grupni chatovi mečeva</Text>
                {gameChats.map(renderGameChat)}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Calendar size={48} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>Nema grupnih chatova</Text>
                <Text style={styles.emptySubtitle}>
                  Pridružite se meču da biste pristupili grupnom chatu
                </Text>
              </View>
            )}
          </View>
        )}

        {selectedTab === 'requests' && (
          <View style={styles.chatsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Učitavanje...</Text>
              </View>
            ) : (
              <>
                {pendingRequests.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Zahtevi za prijateljstvo</Text>
                    {pendingRequests.map(renderPendingRequest)}
                  </>
                )}

                {nonFriendConversations.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Poruke od nepoznatih</Text>
                    {nonFriendConversations.map(renderNonFriendConversation)}
                  </>
                )}

                {pendingRequests.length === 0 && nonFriendConversations.length === 0 && (
                  <View style={styles.emptyState}>
                    <UserPlus size={48} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>Nema zahteva</Text>
                    <Text style={styles.emptySubtitle}>
                      Ovde će se pojaviti zahtevi za prijateljstvo i poruke od nepoznatih korisnika
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Activity Status */}
      <View style={styles.activityStatus}>
        <View style={styles.activityIndicator}>
          <View style={styles.onlineIndicator} />
          <Text style={styles.activityText}>
            {selectedTab === 'friends' 
              ? `${onlineUsers.length} prijatelja online`
              : selectedTab === 'games'
              ? `${gameChats.length} aktivnih chatova`
              : `${pendingRequests.length + nonFriendConversations.length} zahteva`
            }
          </Text>
        </View>
      </View>

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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
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
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'Roboto-Bold',
  },
  tabUnreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  tabUnreadText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Roboto-Bold',
  },
  content: {
    flex: 1,
  },
  chatsContainer: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 12,
    marginTop: 8,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  requestItem: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
    fontFamily: 'Roboto-Bold',
  },
  gameChatIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.card,
  },
  chatContent: {
    flex: 1,
  },
  requestContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 2,
  },
  chatMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginRight: 8,
  },
  requestTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Roboto-Bold',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  requestText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  gameChatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  participantsText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginLeft: 4,
  },
  requestActions: {
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
  messageIndicator: {
    alignItems: 'center',
    position: 'relative',
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
  },
  activityStatus: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginLeft: 6,
  },
});