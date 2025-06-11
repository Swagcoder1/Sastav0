import { supabase } from './supabase';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  updated_at: string;
  requester?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  addressee?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface FriendshipStatus {
  status: 'none' | 'pending' | 'accepted' | 'declined' | 'blocked';
  isRequester?: boolean;
  friendshipId?: string;
}

export class FriendsService {
  // Send a friend request
  static async sendFriendRequest(addresseeId: string): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
        .limit(1);

      if (existing && existing.length > 0) {
        return { error: 'Friendship request already exists' };
      }

      const { error } = await supabase
        .from('friendships')
        .insert([{
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending'
        }]);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to send friend request' };
    }
  }

  // Accept a friend request
  static async acceptFriendRequest(friendshipId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to accept friend request' };
    }
  }

  // Decline a friend request
  static async declineFriendRequest(friendshipId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to decline friend request' };
    }
  }

  // Remove/unfriend
  static async removeFriend(friendshipId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to remove friend' };
    }
  }

  // Get friendship status between two users
  static async getFriendshipStatus(userId: string): Promise<FriendshipStatus> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { status: 'none' };

      const { data } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
        .limit(1);

      if (!data || data.length === 0) {
        return { status: 'none' };
      }

      const friendship = data[0];
      return {
        status: friendship.status,
        isRequester: friendship.requester_id === user.id,
        friendshipId: friendship.id
      };
    } catch (error) {
      return { status: 'none' };
    }
  }

  // Get user's friends
  static async getFriends(): Promise<{ data?: any[], error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!friendships_requester_id_fkey(id, username, first_name, last_name, avatar_url),
          addressee:profiles!friendships_addressee_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) {
        return { error: error.message };
      }

      // Transform data to get the friend (not the current user)
      const friends = data?.map(friendship => {
        const friend = friendship.requester_id === user.id 
          ? friendship.addressee 
          : friendship.requester;
        return {
          ...friend,
          friendshipId: friendship.id,
          friendsSince: friendship.created_at
        };
      }) || [];

      return { data: friends };
    } catch (error) {
      return { error: 'Failed to fetch friends' };
    }
  }

  // Get pending friend requests (received)
  static async getPendingRequests(): Promise<{ data?: any[], error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!friendships_requester_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return { error: 'Failed to fetch pending requests' };
    }
  }

  // Get sent friend requests
  static async getSentRequests(): Promise<{ data?: any[], error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          addressee:profiles!friendships_addressee_id_fkey(id, username, first_name, last_name, avatar_url)
        `)
        .eq('requester_id', user.id)
        .eq('status', 'pending');

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return { error: 'Failed to fetch sent requests' };
    }
  }
}