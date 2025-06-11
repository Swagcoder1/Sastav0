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
import { ArrowLeft, Send, Phone, Video } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocalSearchParams, router } from 'expo-router';
import { MessagesService, Message } from '@/lib/messagesService';
import { FriendsService } from '@/lib/friendsService';
import { NotificationsService } from '@/lib/notificationsService';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const chatPartner = {
    id: params.id as string,
    name: params.name as string,
    avatar: params.avatar as string,
    username: params.username as string,
  };

  useEffect(() => {
    loadConversation();
    checkFriendshipStatus();
    markMessagesAsRead();
    markMessageNotificationsAsRead();
  }, []);

  const loadConversation = async () => {
    const { data, error } = await MessagesService.getConversation(chatPartner.id);
    if (!error && data) {
      setMessages(data);
      setTimeout(() => scrollToBottom(), 100);
    }
    setLoading(false);
  };

  const checkFriendshipStatus = async () => {
    const status = await FriendsService.getFriendshipStatus(chatPartner.id);
    setIsFriend(status.status === 'accepted');
  };

  const markMessagesAsRead = async () => {
    await MessagesService.markMessagesAsRead(chatPartner.id);
  };

  const markMessageNotificationsAsRead = async () => {
    try {
      // Get all notifications related to messages from this user
      const { data: notifications } = await NotificationsService.getNotifications();
      if (notifications) {
        const messageNotifications = notifications.filter(
          n => n.type === 'message' && n.data?.sender_id === chatPartner.id && !n.read
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

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const { error } = await MessagesService.sendMessage(chatPartner.id, messageContent);
    
    if (!error) {
      // Add message to local state immediately for better UX
      const tempMessage: Message = {
        id: Date.now().toString(),
        sender_id: user?.id || '',
        receiver_id: chatPartner.id,
        content: messageContent,
        read: false,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempMessage]);
      setTimeout(() => scrollToBottom(), 100);
      
      // Reload conversation to get the actual message from server
      setTimeout(() => loadConversation(), 1000);
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

  const renderMessage = (message: Message, index: number) => {
    const isMyMessage = message.sender_id === user?.id;
    const showDate = index === 0 || 
      formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);

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
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
          ]}>
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
        
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => router.push({
            pathname: '/profile/[id]',
            params: { id: chatPartner.id }
          })}
        >
          {chatPartner.avatar ? (
            <Image source={{ uri: chatPartner.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {chatPartner.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{chatPartner.name}</Text>
            <Text style={styles.userStatus}>
              {isFriend ? 'Prijatelj' : 'Nije prijatelj'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Phone size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Video size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
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
              <Text style={styles.emptyText}>
                Još nema poruka. Pošaljite prvu poruku!
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
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  userStatus: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
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
  messageContainer: {
    marginBottom: 8,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
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