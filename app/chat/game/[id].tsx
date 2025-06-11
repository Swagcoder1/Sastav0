import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Users, Calendar, MapPin } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocalSearchParams, router } from 'expo-router';
import { GameChatsService, GameMessage, GameParticipant } from '@/lib/gameChatsService';
import { PresenceService } from '@/lib/presenceService';
import { useAuth } from '@/contexts/AuthContext';

export default function GameChatScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [participants, setParticipants] = useState<GameParticipant[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [subscription, setSubscription] = useState<any>(null);

  const gameChatId = params.id as string;
  const chatName = params.name as string;
  const gameId = params.gameId as string;

  useEffect(() => {
    loadChatData();
    markMessagesAsRead();
    
    // Subscribe to real-time messages
    const sub = GameChatsService.subscribeToGameChat(gameChatId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      setTimeout(() => scrollToBottom(), 100);
    });
    setSubscription(sub);

    return () => {
      if (subscription) {
        GameChatsService.unsubscribeFromGameChat(subscription);
      }
    };
  }, []);

  const loadChatData = async () => {
    try {
      await Promise.all([
        loadMessages(),
        loadParticipants(),
        loadOnlineUsers()
      ]);
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    const { data, error } = await GameChatsService.getGameChatMessages(gameChatId);
    if (!error && data) {
      setMessages(data);
      setTimeout(() => scrollToBottom(), 100);
    }
  };

  const loadParticipants = async () => {
    const { data, error } = await GameChatsService.getGameParticipants(gameId);
    if (!error && data) {
      setParticipants(data);
    }
  };

  const loadOnlineUsers = async () => {
    const { data, error } = await PresenceService.getOnlineFriends();
    if (!error && data) {
      setOnlineUsers(data);
    }
  };

  const markMessagesAsRead = async () => {
    await GameChatsService.markGameMessagesAsRead(gameChatId);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const { error } = await GameChatsService.sendGameMessage(gameChatId, messageContent);
    
    if (error) {
      console.error('Error sending message:', error);
      // Restore message on error
      setNewMessage(messageContent);
    }
    
    setSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('sr-RS', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Danas';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Juče';
    } else {
      return date.toLocaleDateString('sr-RS');
    }
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.some(user => user.user_id === userId);
  };

  const renderMessage = (message: GameMessage, index: number) => {
    const isMyMessage = message.sender_id === user?.id;
    const isSystemMessage = message.message_type !== 'text';
    const showDate = index === 0 || 
      formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);

    if (isSystemMessage) {
      return (
        <View key={message.id}>
          {showDate && (
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{formatDate(message.created_at)}</Text>
            </View>
          )}
          <View style={styles.systemMessageContainer}>
            <Text style={styles.systemMessageText}>{message.content}</Text>
            <Text style={styles.systemMessageTime}>{formatTime(message.created_at)}</Text>
          </View>
        </View>
      );
    }

    return (
      <View key={message.id}>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(message.created_at)}</Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
        ]}>
          {!isMyMessage && (
            <View style={styles.senderInfo}>
              {message.sender?.avatar_url ? (
                <Image source={{ uri: message.sender.avatar_url }} style={styles.senderAvatar} />
              ) : (
                <View style={styles.senderAvatarPlaceholder}>
                  <Text style={styles.senderAvatarInitials}>
                    {message.sender?.first_name?.charAt(0)}{message.sender?.last_name?.charAt(0)}
                  </Text>
                </View>
              )}
              {isUserOnline(message.sender_id) && <View style={styles.onlineIndicator} />}
            </View>
          )}
          
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
          ]}>
            {!isMyMessage && (
              <Text style={styles.senderName}>
                {message.sender?.first_name} {message.sender?.last_name}
              </Text>
            )}
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText
            ]}>
              {message.content}
            </Text>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime
            ]}>
              {formatTime(message.created_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatIcon}>
            <Calendar size={20} color={colors.text} />
          </View>
          <View style={styles.chatDetails}>
            <Text style={styles.chatName}>{chatName}</Text>
            <Text style={styles.chatSubtitle}>
              {participants.length} učesnika • {onlineUsers.filter(u => 
                participants.some(p => p.user_id === u.user_id)
              ).length} online
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.participantsButton}
          onPress={() => {
            // Navigate to participants list
            router.push({
              pathname: '/chat/game/participants/[id]',
              params: { id: gameId, chatId: gameChatId }
            });
          }}
        >
          <Users size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom()}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Učitavanje poruka...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                Dobrodošli u grupni chat! Pošaljite prvu poruku.
              </Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
        </ScrollView>

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Napišite poruku..."
            placeholderTextColor={colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Send size={20} color={newMessage.trim() && !sending ? '#FFFFFF' : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatDetails: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  chatSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  participantsButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    marginTop: 16,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Medium',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  systemMessageTime: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    marginTop: 2,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  senderInfo: {
    position: 'relative',
    marginRight: 8,
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  senderAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderAvatarInitials: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
    fontFamily: 'Roboto-Bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.background,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Roboto-Regular',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Roboto-Regular',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surface,
  },
});