import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

type Sport = 'padel' | 'football' | 'basketball';

interface SportContextType {
  selectedSport: Sport;
  setSelectedSport: (sport: Sport) => void;
  showSportSelection: boolean;
  setShowSportSelection: (show: boolean) => void;
  isFirstTime: boolean;
  setIsFirstTime: (isFirst: boolean) => void;
  hasCompletedQuestionnaire: boolean;
  setHasCompletedQuestionnaire: (completed: boolean) => void;
}

const SportContext = createContext<SportContextType | undefined>(undefined);

export function SportProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedSport, setSelectedSportState] = useState<Sport>('football');
  const [showSportSelection, setShowSportSelection] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaireState] = useState(false);

  useEffect(() => {
    if (user) {
      // When user logs in, check their questionnaire status
      loadSportPreference();
    } else {
      // When user logs out, reset state
      resetState();
    }
  }, [user]);

  const resetState = () => {
    setSelectedSportState('football');
    setShowSportSelection(false);
    setIsFirstTime(true);
    setHasCompletedQuestionnaireState(false);
  };

  const loadSportPreference = async () => {
    if (!user) return;

    try {
      // Use user ID to create unique storage keys for each user
      const userKey = `user_${user.id}`;
      const savedSport = await AsyncStorage.getItem(`${userKey}_selectedSport`);
      const questionnaireCompleted = await AsyncStorage.getItem(`${userKey}_questionnaireCompleted`);
      
      if (savedSport) {
        setSelectedSportState(savedSport as Sport);
      }
      
      if (questionnaireCompleted === 'true') {
        setHasCompletedQuestionnaireState(true);
        setIsFirstTime(false);
        setShowSportSelection(false);
      } else {
        // New user or user who hasn't completed questionnaire
        setIsFirstTime(true);
        setHasCompletedQuestionnaireState(false);
        setShowSportSelection(true);
      }
    } catch (error) {
      console.error('Error loading sport preference:', error);
      // On error, treat as new user
      setIsFirstTime(true);
      setHasCompletedQuestionnaireState(false);
      setShowSportSelection(true);
    }
  };

  const setSelectedSport = async (sport: Sport) => {
    if (!user) return;

    try {
      setSelectedSportState(sport);
      const userKey = `user_${user.id}`;
      await AsyncStorage.setItem(`${userKey}_selectedSport`, sport);
    } catch (error) {
      console.error('Error saving sport preference:', error);
    }
  };

  const setHasCompletedQuestionnaire = async (completed: boolean, questionnaireData?: any) => {
    if (!user) return;

    try {
      setHasCompletedQuestionnaireState(completed);
      const userKey = `user_${user.id}`;
      await AsyncStorage.setItem(`${userKey}_questionnaireCompleted`, completed.toString());
      
      if (completed && questionnaireData) {
        // Store questionnaire data and initial rating in the database
        const { sport, answers, initialRating } = questionnaireData;
        
        // Update user statistics with initial rating
        await supabase
          .from('user_statistics')
          .upsert({
            user_id: user.id,
            sport: sport,
            average_rating: initialRating,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,sport'
          });

        // Store questionnaire answers in user profile metadata
        await supabase
          .from('profiles')
          .update({
            [`${sport}_questionnaire`]: answers,
            [`${sport}_initial_rating`]: initialRating,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        console.log(`Stored questionnaire data for ${sport} with initial rating: ${initialRating}`);
      }
      
      if (completed) {
        setIsFirstTime(false);
        setShowSportSelection(false);
      }
    } catch (error) {
      console.error('Error saving questionnaire completion status:', error);
    }
  };

  return (
    <SportContext.Provider
      value={{
        selectedSport,
        setSelectedSport,
        showSportSelection,
        setShowSportSelection,
        isFirstTime,
        setIsFirstTime,
        hasCompletedQuestionnaire,
        setHasCompletedQuestionnaire,
      }}
    >
      {children}
    </SportContext.Provider>
  );
}

export const useSport = () => {
  const context = useContext(SportContext);
  if (context === undefined) {
    throw new Error('useSport must be used within a SportProvider');
  }
  return context;
};