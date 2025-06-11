import { supabase } from './supabase';
import { UserStatsService } from './userStatsService';

export interface GameResult {
  result: 'win' | 'loss' | 'draw';
  goals_scored?: number;
  assists?: number;
  sport: 'football' | 'padel' | 'basketball';
}

export class GameService {
  // Simulate a game result for a user
  static async simulateGameResult(
    userId: string,
    sport: 'football' | 'padel' | 'basketball',
    result: 'win' | 'loss' = 'win',
    goalsScored: number = 1,
    assists: number = 0
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.rpc('simulate_game_result', {
        p_user_id: userId,
        p_sport: sport,
        p_result: result,
        p_goals_scored: goalsScored,
        p_assists: assists
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'Failed to simulate game result' };
    }
  }

  // Add a mock game result for testing
  static async addMockGameResult(
    userId: string,
    sport: 'football' | 'padel' | 'basketball' = 'football'
  ): Promise<{ message?: string, error?: string }> {
    try {
      const { data, error } = await supabase.rpc('add_mock_game_result', {
        p_user_id: userId,
        p_sport: sport
      });

      if (error) {
        return { error: error.message };
      }

      return { message: data };
    } catch (error) {
      return { error: 'Failed to add mock game result' };
    }
  }

  // Calculate rating change based on game result
  static calculateRatingChange(result: 'win' | 'loss' | 'draw'): number {
    switch (result) {
      case 'win':
        return 0.4;
      case 'loss':
        return -0.4;
      case 'draw':
        return 0.0;
      default:
        return 0.0;
    }
  }

  // Apply rating change to user (clamped between 2.0 and 3.5)
  static applyRatingChange(currentRating: number, change: number): number {
    const newRating = currentRating + change;
    return Math.max(2.0, Math.min(3.5, Math.round(newRating * 10) / 10));
  }

  // Process a game result and update user statistics
  static async processGameResult(
    userId: string,
    gameResult: GameResult
  ): Promise<{ newRating?: number, error?: string }> {
    try {
      // Get current user statistics
      const { data: currentStats } = await UserStatsService.getUserStatistics(userId, gameResult.sport);
      
      const currentRating = currentStats?.average_rating || 2.0;
      const ratingChange = this.calculateRatingChange(gameResult.result);
      const newRating = this.applyRatingChange(currentRating, ratingChange);

      // Add game to history
      const { error: historyError } = await UserStatsService.addGameHistory(
        userId,
        `game-${Date.now()}`, // Mock game ID
        gameResult.sport,
        gameResult.result,
        gameResult.goals_scored || 0,
        gameResult.assists || 0,
        newRating
      );

      if (historyError) {
        return { error: historyError };
      }

      return { newRating };
    } catch (error) {
      return { error: 'Failed to process game result' };
    }
  }

  // Get user's rank in leaderboard
  static async getUserRank(
    userId: string,
    sport: 'football' | 'padel' | 'basketball'
  ): Promise<{ rank?: number, error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_user_rank_in_leaderboard', {
        p_user_id: userId,
        p_sport: sport
      });

      if (error) {
        return { error: error.message };
      }

      return { rank: data };
    } catch (error) {
      return { error: 'Failed to get user rank' };
    }
  }

  // Generate random game results for testing
  static generateRandomGameResult(sport: 'football' | 'padel' | 'basketball'): GameResult {
    const results: ('win' | 'loss')[] = ['win', 'loss'];
    const result = results[Math.floor(Math.random() * results.length)];
    
    let goals_scored = 0;
    let assists = 0;

    if (sport === 'football') {
      goals_scored = result === 'win' ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2);
      assists = Math.floor(Math.random() * 2);
    } else if (sport === 'basketball') {
      goals_scored = result === 'win' ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 15) + 5;
      assists = Math.floor(Math.random() * 8);
    }

    return {
      result,
      goals_scored,
      assists,
      sport
    };
  }
}