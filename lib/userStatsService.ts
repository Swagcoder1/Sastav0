import { supabase } from './supabase';

export interface UserStatistics {
  user_id: string;
  sport: 'football' | 'padel' | 'basketball';
  games_played: number;
  games_won: number;
  games_lost: number;
  goals_scored: number;
  assists: number;
  average_rating: number;
  total_rating_points: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface GameHistory {
  id: string;
  user_id: string;
  game_id: string;
  sport: 'football' | 'padel' | 'basketball';
  result: 'win' | 'loss' | 'draw';
  goals_scored: number;
  assists: number;
  rating: number;
  notes?: string;
  played_at: string;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string;
  sport?: 'football' | 'padel' | 'basketball';
  unlocked_at: string;
  data: any;
}

export class UserStatsService {
  // Get user statistics for a specific sport
  static async getUserStatistics(userId: string, sport: 'football' | 'padel' | 'basketball'): Promise<{ data?: UserStatistics, error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .eq('sport', sport)
        .maybeSingle();

      if (error) {
        return { error: error.message };
      }

      return { data: data || undefined };
    } catch (error) {
      return { error: 'Failed to get user statistics' };
    }
  }

  // Get all user statistics for all sports
  static async getAllUserStatistics(userId: string): Promise<{ data?: UserStatistics[], error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .order('sport');

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return { error: 'Failed to get user statistics' };
    }
  }

  // Add a game to user's history
  static async addGameHistory(
    userId: string,
    gameId: string,
    sport: 'football' | 'padel' | 'basketball',
    result: 'win' | 'loss' | 'draw',
    goalsScored: number = 0,
    assists: number = 0,
    rating?: number,
    notes?: string
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('game_history')
        .insert([{
          user_id: userId,
          game_id: gameId,
          sport,
          result,
          goals_scored: goalsScored,
          assists,
          rating,
          notes,
          played_at: new Date().toISOString()
        }]);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to add game history' };
    }
  }

  // Get user's game history
  static async getGameHistory(userId: string, sport?: 'football' | 'padel' | 'basketball', limit: number = 50): Promise<{ data?: GameHistory[], error?: string }> {
    try {
      let query = supabase
        .from('game_history')
        .select('*')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(limit);

      if (sport) {
        query = query.eq('sport', sport);
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return { error: 'Failed to get game history' };
    }
  }

  // Get user achievements
  static async getUserAchievements(userId: string, sport?: 'football' | 'padel' | 'basketball'): Promise<{ data?: UserAchievement[], error?: string }> {
    try {
      let query = supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (sport) {
        query = query.or(`sport.eq.${sport},sport.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return { error: 'Failed to get user achievements' };
    }
  }

  // Add an achievement for a user
  static async addAchievement(
    userId: string,
    achievementType: string,
    achievementName: string,
    achievementDescription: string,
    sport?: 'football' | 'padel' | 'basketball',
    data: any = {}
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert([{
          user_id: userId,
          achievement_type: achievementType,
          achievement_name: achievementName,
          achievement_description: achievementDescription,
          sport,
          data
        }]);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to add achievement' };
    }
  }

  // Update user statistics manually (for admin purposes)
  static async updateUserStatistics(
    userId: string,
    sport: 'football' | 'padel' | 'basketball',
    updates: Partial<UserStatistics>
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('user_statistics')
        .upsert([{
          user_id: userId,
          sport,
          ...updates,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'user_id,sport'
        });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to update user statistics' };
    }
  }

  // Get leaderboard for a specific sport
  static async getLeaderboard(sport: 'football' | 'padel' | 'basketball', limit: number = 50): Promise<{ data?: any[], error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_statistics')
        .select(`
          *,
          profile:profiles!user_statistics_user_id_fkey(
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('sport', sport)
        .gte('games_played', 1) // Only include users who have played at least one game
        .order('average_rating', { ascending: false })
        .order('games_won', { ascending: false })
        .limit(limit);

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      return { error: 'Failed to get leaderboard' };
    }
  }

  // Calculate win percentage
  static calculateWinPercentage(gamesWon: number, gamesPlayed: number): number {
    if (gamesPlayed === 0) return 0;
    return Math.round((gamesWon / gamesPlayed) * 100 * 10) / 10; // Round to 1 decimal place
  }

  // Get user rank in leaderboard
  static async getUserRank(userId: string, sport: 'football' | 'padel' | 'basketball'): Promise<{ rank?: number, error?: string }> {
    try {
      // Get all users with better stats
      const { data, error } = await supabase
        .from('user_statistics')
        .select('user_id, average_rating, games_won')
        .eq('sport', sport)
        .gte('games_played', 1)
        .order('average_rating', { ascending: false })
        .order('games_won', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      const userIndex = data?.findIndex(stat => stat.user_id === userId);
      const rank = userIndex !== undefined && userIndex >= 0 ? userIndex + 1 : undefined;

      return { rank };
    } catch (error) {
      return { error: 'Failed to get user rank' };
    }
  }
}