import { supabase } from './supabase';

export interface UserPresence {
  user_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
  user?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export class PresenceService {
  private static presenceChannel: any = null;
  private static heartbeatInterval: NodeJS.Timeout | null = null;

  // Initialize presence tracking for current user
  static async initializePresence(): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // Set user as online
      await this.updatePresence('online');

      // Set up real-time presence channel
      this.presenceChannel = supabase.channel('online-users', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      // Track presence state
      this.presenceChannel
        .on('presence', { event: 'sync' }, () => {
          console.log('Presence synced');
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
          console.log('User joined:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
          console.log('User left:', key, leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track this user's presence
            await this.presenceChannel.track({
              user_id: user.id,
              status: 'online',
              last_seen: new Date().toISOString(),
            });
          }
        });

      // Set up heartbeat to keep presence alive
      this.heartbeatInterval = setInterval(() => {
        this.updatePresence('online');
      }, 30000); // Update every 30 seconds

      // Handle page visibility changes (web)
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            this.updatePresence('away');
          } else {
            this.updatePresence('online');
          }
        });
      }

      return {};
    } catch (error) {
      return { error: 'Failed to initialize presence' };
    }
  }

  // Update user's presence status
  static async updatePresence(status: 'online' | 'offline' | 'away'): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status,
          last_seen: new Date().toISOString(),
        });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to update presence' };
    }
  }

  // Get ALL online users (not just friends)
  static async getAllOnlineUsers(): Promise<{ data?: UserPresence[], error?: string }> {
    try {
      // Get all users who are online (last seen within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('user_presence')
        .select(`
          *,
          user:profiles!user_presence_user_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .eq('status', 'online')
        .gte('last_seen', fiveMinutesAgo);

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return { error: 'Failed to get all online users' };
    }
  }

  // Get online friends
  static async getOnlineFriends(): Promise<{ data?: UserPresence[], error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // Step 1: Get friend IDs
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendshipsError) {
        return { error: friendshipsError.message };
      }

      // Extract friend IDs (excluding current user)
      const friendIds: string[] = [];
      friendships?.forEach(friendship => {
        if (friendship.requester_id === user.id) {
          friendIds.push(friendship.addressee_id);
        } else {
          friendIds.push(friendship.requester_id);
        }
      });

      // If no friends, return empty array
      if (friendIds.length === 0) {
        return { data: [] };
      }

      // Step 2: Get online presence for friends
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('user_presence')
        .select(`
          *,
          user:profiles!user_presence_user_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .in('user_id', friendIds)
        .eq('status', 'online')
        .gte('last_seen', fiveMinutesAgo);

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return { error: 'Failed to get online friends' };
    }
  }

  // Get user's online status
  static async getUserPresence(userId: string): Promise<{ data?: UserPresence, error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select(`
          *,
          user:profiles!user_presence_user_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        return { error: error.message };
      }

      // Check if user is considered online (last seen within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const lastSeen = new Date(data.last_seen);
      
      if (lastSeen < fiveMinutesAgo) {
        data.status = 'offline';
      }

      return { data };
    } catch (error) {
      return { error: 'Failed to get user presence' };
    }
  }

  // Clean up presence tracking
  static async cleanup(): Promise<void> {
    try {
      // Set user as offline
      await this.updatePresence('offline');

      // Clean up heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Unsubscribe from presence channel
      if (this.presenceChannel) {
        await supabase.removeChannel(this.presenceChannel);
        this.presenceChannel = null;
      }
    } catch (error) {
      console.error('Error cleaning up presence:', error);
    }
  }

  // Subscribe to presence changes for specific users
  static subscribeToPresence(userIds: string[], callback: (presences: UserPresence[]) => void) {
    const channel = supabase
      .channel('presence-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=in.(${userIds.join(',')})`,
        },
        (payload) => {
          // Fetch updated presence data
          this.getPresenceForUsers(userIds).then(({ data }) => {
            if (data) callback(data);
          });
        }
      )
      .subscribe();

    return channel;
  }

  // Get presence for multiple users
  static async getPresenceForUsers(userIds: string[]): Promise<{ data?: UserPresence[], error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select(`
          *,
          user:profiles!user_presence_user_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .in('user_id', userIds);

      if (error) {
        return { error: error.message };
      }

      // Update status based on last seen time
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const updatedData = data?.map(presence => {
        const lastSeen = new Date(presence.last_seen);
        if (lastSeen < fiveMinutesAgo && presence.status !== 'offline') {
          presence.status = 'offline';
        }
        return presence;
      }) || [];

      return { data: updatedData };
    } catch (error) {
      return { error: 'Failed to get presence for users' };
    }
  }
}