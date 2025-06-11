import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
} from 'react-native';
import { ChevronRight, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SportQuestionnaireModalProps {
  visible: boolean;
  sport: 'padel' | 'football' | 'basketball';
  onComplete: (answers: any) => void;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export function SportQuestionnaireModal({ visible, sport, onComplete, onClose }: SportQuestionnaireModalProps) {
  const { colors } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any>({});

  useEffect(() => {
    if (visible) {
      setCurrentQuestionIndex(0);
      setAnswers({});
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const questionnaires = {
    padel: {
      title: '🏓 Padel Upitnik',
      color: '#3B82F6',
      questions: [
        {
          id: 'experience',
          question: 'Koliko dugo igrate padel?',
          type: 'multiple-choice',
          multiSelect: false,
          options: [
            'Nikad nisam igrao/la',
            'Manje od 6 meseci',
            '6 meseci do 1 godine',
            '1 do 3 godine',
            'Više od 3 godine'
          ]
        },
        {
          id: 'frequency',
          question: 'Koliko često igrate padel?',
          type: 'multiple-choice',
          multiSelect: false,
          options: [
            'Retko (mesečno ili ređe)',
            'Jednom nedeljno',
            '2-3 puta nedeljno',
            'Skoro svaki dan'
          ]
        },
        {
          id: 'skill_level',
          question: 'Kako biste ocenili svoj nivo veštine u padelu?',
          type: 'multiple-choice',
          multiSelect: false,
          options: [
            'Početnik',
            'Srednji',
            'Napredni',
            'Takmičarski/Profesionalni'
          ]
        },
        {
          id: 'training',
          question: 'Da li imate trenera ili idete na organizovane treninge?',
          type: 'multiple-choice',
          multiSelect: false,
          options: [
            'Ne, igram rekreativno',
            'Povremeno idem na treninge',
            'Redovno treniram sa trenerom',
            'Takmičim se profesionalno'
          ]
        },
        {
          id: 'enjoyment',
          question: 'Šta najviše volite kod padela?',
          type: 'text',
          placeholder: 'Opišite šta vas najviše privlači u padelu... (minimum 5 reči)',
          minWords: 5
        }
      ]
    },
    football: {
      title: '⚽ Fudbalski Upitnik',
      color: '#10B981',
      questions: [
        {
          id: 'experience',
          question: 'Koliko dugo se bavite fudbalom?',
          type: 'multiple-choice',
          multiSelect: false,
          options: [
            'Nikad nisam igrao/la',
            'Manje od 1 godine',
            '1 do 5 godina',
            'Više od 5 godina'
          ]
        },
        {
          id: 'frequency',
          question: 'Koliko često igrate fudbal?',
          type: 'multiple-choice',
          multiSelect: false,
          options: [
            'Retko (mesečno ili ređe)',
            'Jednom nedeljno',
            '2-3 puta nedeljno',
            'Skoro svaki dan'
          ]
        },
        {
          id: 'type',
          question: 'Da li igrate fudbal rekreativno ili takmičarski?',
          type: 'multiple-choice',
          multiSelect: false,
          options: [
            'Samo rekreativno',
            'Uglavnom rekreativno, ponekad takmičarski',
            'Redovno se takmičim',
            'Profesionalno/polu-profesionalno'
          ]
        },
        {
          id: 'training',
          question: 'Da li imate trenera ili idete na organizovane treninge?',
          type: 'multiple-choice',
          multiSelect: false,
          options: [
            'Ne, igram samo rekreativno',
            'Povremeno idem na treninge',
            'Redovno treniram sa trenerom',
            'Član sam kluba/tima'
          ]
        },
        {
          id: 'enjoyment',
          question: 'Koji aspekt fudbala najviše volite?',
          type: 'text',
          placeholder: 'Opišite šta vas najviše privlači u fudbalu... (minimum 5 reči)',
          minWords: 5
        }
      ]
    },
    basketball: {
      title: '🏀 Košarkaški Upitnik',
      color: '#F59E0B',
      questions: [
        {
          id: 'experience',
          question: 'Koliko dugo igrate košarku?',
          type: 'multiple-choice',
          multiSelect: false,
          options: [
            'Nikad nisam igrao/la',
            'Manje od 1 godine',
            '1 do 5 godina',
            'Više od 5 godina'
          ]
        },
        {
          id: 'frequency',
          question: 'Koliko često igrate košarku?',
          type: 'multiple-choice',
          multiSelect: false,
          options: [
            'Retko (mesečno ili ređe)',
            'Jednom nedeljno',
            '2-3 puta nedeljno',
            'Skoro svaki dan'
          ]
        },
        {
          id: 'skill_level',
          question: 'Kako biste opisali svoj nivo veštine u košarci?',
          type: 'multiple-choice',
          multiSelect: false,
          options: [
            'Početnik',
            'Srednji',
            'Napredni',
            'Takmičarski/Profesionalni'
          ]
        },
        {
          id: 'training',
          question: 'Da li imate trenera ili idete na organizovane treninge?',
          type: 'multiple-choice',
          multiSelect: false,
          options: [
            'Ne, igram samo rekreativno',
            'Povremeno idem na treninge',
            'Redovno treniram sa trenerom',
            'Član sam kluba/tima'
          ]
        },
        {
          id: 'enjoyment',
          question: 'Šta je vaš omiljeni deo igranja košarke?',
          type: 'text',
          placeholder: 'Opišite šta vas najviše privlači u košarci... (minimum 5 reči)',
          minWords: 5
        }
      ]
    }
  };

  const currentQuestionnaire = questionnaires[sport];
  const currentQuestion = currentQuestionnaire.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === currentQuestionnaire.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / currentQuestionnaire.questions.length) * 100;

  const handleAnswer = (answer: string) => {
    if (currentQuestion.type === 'multiple-choice' && currentQuestion.multiSelect) {
      // Handle multiple selection
      const currentAnswers = answers[currentQuestion.id] || [];
      const isSelected = currentAnswers.includes(answer);
      
      let newAnswers;
      if (isSelected) {
        // Remove from selection
        newAnswers = currentAnswers.filter((item: string) => item !== answer);
      } else {
        // Add to selection
        newAnswers = [...currentAnswers, answer];
      }
      
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: newAnswers
      }));
    } else {
      // Handle single selection or text input
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answer
      }));
    }
  };

  const calculateInitialRating = (sport: string, answers: any) => {
    let score = 2.0; // Base score for recreational players
    
    // Experience points
    const experience = answers.experience;
    if (experience === 'Više od 5 godina' || experience === 'Više od 3 godine') {
      score += 0.5;
    } else if (experience === '1 do 5 godina' || experience === '1 do 3 godine' || experience === '6 meseci do 1 godine') {
      score += 0.3;
    } else if (experience === 'Manje od 1 godine' || experience === 'Manje od 6 meseci') {
      score += 0.1;
    }
    
    // Frequency points
    const frequency = answers.frequency;
    if (frequency === 'Skoro svaki dan') {
      score += 0.4;
    } else if (frequency === '2-3 puta nedeljno') {
      score += 0.3;
    } else if (frequency === 'Jednom nedeljno') {
      score += 0.2;
    }
    
    // Skill level points
    const skillLevel = answers.skill_level;
    if (skillLevel === 'Takmičarski/Profesionalni') {
      score += 0.4;
    } else if (skillLevel === 'Napredni') {
      score += 0.3;
    } else if (skillLevel === 'Srednji') {
      score += 0.2;
    }
    
    // Training/Competition points
    const training = answers.training;
    const type = answers.type;
    
    if (training === 'Takmičim se profesionalno' || training === 'Član sam kluba/tima' || type === 'Profesionalno/polu-profesionalno') {
      score += 0.4;
    } else if (training === 'Redovno treniram sa trenerom' || type === 'Redovno se takmičim') {
      score += 0.3;
    } else if (training === 'Povremeno idem na treninge' || type === 'Uglavnom rekreativno, ponekad takmičarski') {
      score += 0.2;
    }
    
    // Cap the score between 2.0 and 3.5
    return Math.min(3.5, Math.max(2.0, Math.round(score * 10) / 10));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const initialRating = calculateInitialRating(sport, answers);
      onComplete({ sport, answers, initialRating });
      onClose();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Prevent closing the questionnaire modal - remove onRequestClose functionality
  const handleModalClose = () => {
    // Do nothing - questionnaire must be completed
  };

  const validateAnswer = () => {
    const answer = answers[currentQuestion?.id];
    
    if (currentQuestion?.type === 'text') {
      if (!answer || answer.trim().length === 0) return false;
      
      // Check minimum word count
      if (currentQuestion.minWords) {
        const wordCount = answer.trim().split(/\s+/).length;
        return wordCount >= currentQuestion.minWords;
      }
      return true;
    }
    
    if (currentQuestion?.type === 'multiple-choice') {
      if (currentQuestion.multiSelect) {
        return answer && Array.isArray(answer) && answer.length > 0;
      } else {
        return answer && answer.length > 0;
      }
    }
    
    return false;
  };

  const canProceed = validateAnswer();

  const getWordCount = () => {
    const answer = answers[currentQuestion?.id];
    if (currentQuestion?.type === 'text' && answer) {
      return answer.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
    }
    return 0;
  };

  const styles = createStyles(colors, currentQuestionnaire.color);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleModalClose} // Updated to prevent closing
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header - Remove close button */}
          <View style={styles.header}>
            <Text style={styles.title}>{currentQuestionnaire.title}</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentQuestionIndex + 1} od {currentQuestionnaire.questions.length}
            </Text>
          </View>

          {/* Question Content */}
          <ScrollView style={styles.questionContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.questionText}>{currentQuestion?.question}</Text>
            
            {/* Multi-select indicator */}
            {currentQuestion?.type === 'multiple-choice' && currentQuestion.multiSelect && (
              <Text style={styles.multiSelectHint}>
                Možete odabrati više opcija
              </Text>
            )}

            {currentQuestion?.type === 'multiple-choice' && (
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => {
                  let isSelected = false;
                  
                  if (currentQuestion.multiSelect) {
                    const selectedAnswers = answers[currentQuestion.id] || [];
                    isSelected = selectedAnswers.includes(option);
                  } else {
                    isSelected = answers[currentQuestion.id] === option;
                  }
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected
                      ]}
                      onPress={() => handleAnswer(option)}
                    >
                      <View style={styles.optionContent}>
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected
                        ]}>
                          {option}
                        </Text>
                        {isSelected && (
                          <Check size={20} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {currentQuestion?.type === 'text' && (
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder={currentQuestion.placeholder}
                  placeholderTextColor={colors.textSecondary}
                  value={answers[currentQuestion.id] || ''}
                  onChangeText={(text) => handleAnswer(text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {currentQuestion.minWords && (
                  <View style={styles.wordCountContainer}>
                    <Text style={[
                      styles.wordCountText,
                      getWordCount() >= currentQuestion.minWords ? styles.wordCountValid : styles.wordCountInvalid
                    ]}>
                      {getWordCount()}/{currentQuestion.minWords} reči
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Navigation */}
          <View style={styles.navigationContainer}>
            {currentQuestionIndex > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
                <Text style={styles.backButtonText}>Nazad</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canProceed && styles.nextButtonDisabled,
                currentQuestionIndex === 0 && styles.nextButtonFull
              ]}
              onPress={handleNext}
              disabled={!canProceed}
            >
              <Text style={[
                styles.nextButtonText,
                !canProceed && styles.nextButtonTextDisabled
              ]}>
                {isLastQuestion ? 'Završi' : 'Sledeće'}
              </Text>
              {!isLastQuestion && <ChevronRight size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (colors: any, sportColor: string) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    maxWidth: 450,
    width: '100%',
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: sportColor,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
  },
  questionContainer: {
    flex: 1,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    lineHeight: 28,
    marginBottom: 8,
  },
  multiSelectHint: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionButtonSelected: {
    backgroundColor: sportColor,
    borderColor: sportColor,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Roboto-Regular',
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textInputContainer: {
    marginTop: 8,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Roboto-Regular',
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 120,
  },
  wordCountContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  wordCountText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
  },
  wordCountValid: {
    color: '#10B981',
  },
  wordCountInvalid: {
    color: '#EF4444',
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: sportColor,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: colors.border,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Roboto-Bold',
  },
  nextButtonTextDisabled: {
    color: colors.textSecondary,
  },
});