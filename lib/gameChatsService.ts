import { supabase } from './supabase';

export interface GameChat {
  id: string;
  game_id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  game?: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    status: string;
  };
  participants_count: number;
  last_message?: {
    id: string;
    content: string;
    sender_name: string;
    created_at: string;
  };
  unread_count: number;
}

export interface GameMessage {
  id: string;
  game_chat_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'system' | 'join' | 'leave';
  created_at: string;
  sender?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface GameParticipant {
  id: string;
  game_id: string;
  user_id: string;
  status: 'joined' | 'left' | 'pending';
  created_at: string;
  user?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export class GameChatsService {
  // Get all game chats for current user
  static async getGameChats(): Promise<{ data?: GameChat[], error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // For now, return mock data since we don't have actual games
      const mockGameChats: GameChat[] = [
        {
          id: '1',
          game_id: 'game-1',
          name: 'Večernji meč - Chat',
          description: 'Grupni chat za večernji meč',
          created_by: user.id,
          created_at: new Date().toISOString(),
          participants_count: 8,
          unread_count: 2,
          last_message: {
            id: 'msg-1',
            content: 'Vidimo se na terenu!',
            sender_name: 'Marko Petrović',
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          }
        },
        {
          id: '2',
          game_id: 'game-2',
          name: 'Jutarnji trening - Chat',
          description: 'Grupni chat za jutarnji trening',
          created_by: user.id,
          created_at: new Date().toISOString(),
          participants_count: 6,
          unread_count: 0,
          last_message: {
            id: 'msg-2',
            content: 'Sutra u 9:00!',
            sender_name: 'Ana Nikolić',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          }
        }
      ];

      return { data: mockGameChats };
    } catch (error) {
      return { error: 'Failed to get game chats' };
    }
  }

  // Get messages for a specific game chat
  static async getGameChatMessages(gameChatId: string): Promise<{ data?: GameMessage[], error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // Mock messages for demonstration
      const mockMessages: GameMessage[] = [
        {
          id: '1',
          game_chat_id: gameChatId,
          sender_id: 'user-1',
          content: 'Pozdrav svima! Spremni za meč?',
          message_type: 'text',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sender: {
            id: 'user-1',
            username: 'marko_p',
            first_name: 'Marko',
            last_name: 'Petrović',
            avatar_url: undefined
          }
        },
        {
          id: '2',
          game_chat_id: gameChatId,
          sender_id: user.id,
          content: 'Da, jedva čekam!',
          message_type: 'text',
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          sender: {
            id: user.id,
            username: user.user_metadata?.username || 'user',
            first_name: user.user_metadata?.first_name || 'Korisnik',
            last_name: user.user_metadata?.last_name || '',
            avatar_url: undefined
          }
        },
        {
          id: '3',
          game_chat_id: gameChatId,
          sender_id: 'user-2',
          content: 'Vidimo se na terenu!',
          message_type: 'text',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          sender: {
            id: 'user-2',
            username: 'ana_n',
            first_name: 'Ana',
            last_name: 'Nikolić',
            avatar_url: undefined
          }
        }
      ];

      return { data: mockMessages };
    } catch (error) {
      return { error: 'Failed to get game chat messages' };
    }
  }

  // Send message to game chat
  static async sendGameMessage(gameChatId: string, content: string, messageType: 'text' | 'system' = 'text'): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // In a real implementation, this would save to the database
      console.log('Sending message:', { gameChatId, content, messageType, userId: user.id });

      return {};
    } catch (error) {
      return { error: 'Failed to send message' };
    }
  }

  // Get game participants
  static async getGameParticipants(gameId: string): Promise<{ data?: GameParticipant[], error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // Mock participants
      const mockParticipants: GameParticipant[] = [
        {
          id: '1',
          game_id: gameId,
          user_id: user.id,
          status: 'joined',
          created_at: new Date().toISOString(),
          user: {
            id: user.id,
            username: user.user_metadata?.username || 'user',
            first_name: user.user_metadata?.first_name || 'Korisnik',
            last_name: user.user_metadata?.last_name || '',
            avatar_url: undefined
          }
        },
        {
          id: '2',
          game_id: gameId,
          user_id: 'user-1',
          status: 'joined',
          created_at: new Date().toISOString(),
          user: {
            id: 'user-1',
            username: 'marko_p',
            first_name: 'Marko',
            last_name: 'Petrović',
            avatar_url: undefined
          }
        }
      ];

      return { data: mockParticipants };
    } catch (error) {
      return { error: 'Failed to get game participants' };
    }
  }

  // Join a game (creates chat if it doesn't exist)
  static async joinGame(gameId: string, gameTitle: string): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // Mock implementation
      console.log('Joining game:', { gameId, gameTitle, userId: user.id });

      return {};
    } catch (error) {
      return { error: 'Failed to join game' };
    }
  }

  // Leave a game
  static async leaveGame(gameId: string): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // Mock implementation
      console.log('Leaving game:', { gameId, userId: user.id });

      return {};
    } catch (error) {
      return { error: 'Failed to leave game' };
    }
  }

  // Mark messages as read
  static async markGameMessagesAsRead(gameChatId: string): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // Mock implementation
      console.log('Marking messages as read:', { gameChatId, userId: user.id });

      return {};
    } catch (error) {
      return { error: 'Failed to mark messages as read' };
    }
  }

  // Subscribe to game chat messages
  static subscribeToGameChat(gameChatId: string, callback: (message: GameMessage) => void) {
    // Mock subscription - in real implementation this would use Supabase realtime
    console.log('Subscribing to game chat:', gameChatId);
    
    // Return a mock subscription object
    return {
      unsubscribe: () => {
        console.log('Unsubscribing from game chat:', gameChatId);
      }
    };
  }

  // Unsubscribe from game chat
  static unsubscribeFromGameChat(subscription: any) {
    if (subscription && subscription.unsubscribe) {
      subscription.unsubscribe();
    }
  }
}