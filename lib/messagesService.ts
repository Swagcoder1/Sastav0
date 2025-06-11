import { supabase } from './supabase';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  receiver?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  user: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  lastMessage: Message;
  unreadCount: number;
  isFriend: boolean;
}

export class MessagesService {
  // Send a message
  static async sendMessage(receiverId: string, content: string): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim()
        }]);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to send message' };
    }
  }

  // Get conversation between two users
  static async getConversation(userId: string): Promise<{ data?: Message[], error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, first_name, last_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return { error: 'Failed to fetch conversation' };
    }
  }

  // Get all conversations for current user
  static async getConversations(): Promise<{ data?: Conversation[], error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // Get all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, first_name, last_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      // Group messages by conversation partner
      const conversationsMap = new Map<string, Conversation>();

      for (const message of messages || []) {
        const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const partner = message.sender_id === user.id ? message.receiver : message.sender;

        if (!conversationsMap.has(partnerId)) {
          // Check if users are friends
          const { data: friendship } = await supabase
            .from('friendships')
            .select('status')
            .or(`and(requester_id.eq.${user.id},addressee_id.eq.${partnerId}),and(requester_id.eq.${partnerId},addressee_id.eq.${user.id})`)
            .eq('status', 'accepted')
            .maybeSingle();

          conversationsMap.set(partnerId, {
            user: partner,
            lastMessage: message,
            unreadCount: 0,
            isFriend: !!friendship
          });
        }

        // Count unread messages (messages sent to current user that are unread)
        if (message.receiver_id === user.id && !message.read) {
          const conversation = conversationsMap.get(partnerId)!;
          conversation.unreadCount++;
        }
      }

      return { data: Array.from(conversationsMap.values()) };
    } catch (error) {
      return { error: 'Failed to fetch conversations' };
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(senderId: string): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to mark messages as read' };
    }
  }

  // Get unread message count
  static async getUnreadCount(): Promise<{ count: number, error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { count: 0, error: 'Not authenticated' };

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (error) {
        return { count: 0, error: error.message };
      }

      return { count: count || 0 };
    } catch (error) {
      return { count: 0, error: 'Failed to get unread count' };
    }
  }
}