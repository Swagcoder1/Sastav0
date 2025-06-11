import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'friend_accepted' | 'message' | 'new_user_match' | 'game_update';
  title: string;
  content: string;
  data: any;
  read: boolean;
  created_at: string;
}

export class NotificationsService {
  // Get all notifications for current user
  static async getNotifications(): Promise<{ data?: Notification[], error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return { error: 'Failed to fetch notifications' };
    }
  }

  // Get unread notification count
  static async getUnreadCount(): Promise<{ count: number, error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { count: 0, error: 'Not authenticated' };

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        return { count: 0, error: error.message };
      }

      return { count: count || 0 };
    } catch (error) {
      return { count: 0, error: 'Failed to get unread count' };
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to mark notification as read' };
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to mark all notifications as read' };
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to delete notification' };
    }
  }

  // Delete all notifications for current user
  static async deleteAllNotifications(): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to delete all notifications' };
    }
  }

  // Create a custom notification (for testing or admin purposes)
  static async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    content: string,
    data: any = {}
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type,
          title,
          content,
          data
        }]);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to create notification' };
    }
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }

  // Unsubscribe from real-time notifications
  static unsubscribeFromNotifications(subscription: any) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
}