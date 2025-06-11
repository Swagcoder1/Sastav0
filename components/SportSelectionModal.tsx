import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SportQuestionnaireModal } from './SportQuestionnaireModal';

interface SportSelectionModalProps {
  visible: boolean;
  onSelectSport: (sport: 'padel' | 'football' | 'basketball', questionnaireData?: any) => void;
  onClose: () => void;
  isFirstTime?: boolean; // New prop to indicate if this is first time
}

const { width, height } = Dimensions.get('window');

export function SportSelectionModal({ visible, onSelectSport, onClose, isFirstTime = false }: SportSelectionModalProps) {
  const { colors } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [selectedSport, setSelectedSport] = useState<'padel' | 'football' | 'basketball' | null>(null);

  useEffect(() => {
    if (visible) {
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

  const sports = [
    {
      id: 'padel' as const,
      name: 'Padel',
      description: 'Dinamičan sport koji kombinuje tenis i squash',
      image: { uri: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800' },
      color: '#3B82F6',
    },
    {
      id: 'basketball' as const,
      name: 'Košarka',
      description: 'Brz i uzbudljiv timski sport',
      image: { uri: 'https://images.pexels.com/photos/1607855/pexels-photo-1607855.jpg?auto=compress&cs=tinysrgb&w=800' },
      color: '#F59E0B',
    },
    {
      id: 'football' as const,
      name: 'Fudbal',
      description: 'Najpopularniji sport na svetu',
      image: require('../assets/images/Football/pexels-pixabay-46798.jpg'),
      color: '#10B981',
    },
  ];

  const handleSportSelect = (sport: 'padel' | 'football' | 'basketball') => {
    setSelectedSport(sport);
    setShowQuestionnaire(true);
  };

  const handleQuestionnaireComplete = (data: any) => {
    console.log('Questionnaire completed:', data);
    onSelectSport(data.sport, data);
    setShowQuestionnaire(false);
    setSelectedSport(null);
    onClose();
  };

  const handleQuestionnaireClose = () => {
    setShowQuestionnaire(false);
    setSelectedSport(null);
  };

  const handleModalClose = () => {
    // Only allow closing if it's not first time (not for new users)
    if (!isFirstTime) {
      onClose();
    }
  };

  const styles = createStyles(colors);

  return (
    <>
      <Modal
        visible={visible && !showQuestionnaire}
        transparent
        animationType="none"
        onRequestClose={handleModalClose} // Updated to use conditional close
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
            {/* Header - Remove close button for first time users */}
            <View style={styles.header}>
              <Text style={styles.title}>Odaberite sport</Text>
              {!isFirstTime && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Subtitle - Updated for first time users */}
            <Text style={styles.subtitle}>
              {isFirstTime 
                ? 'Dobrodošli u Sastav! Molimo odaberite sport koji vas zanima da biste personalizovali svoje iskustvo.'
                : 'Izaberite sport koji vas zanima da biste personalizovali svoje iskustvo'
              }
            </Text>

            {/* Scrollable Sports Container */}
            <ScrollView 
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              <View style={styles.sportsContainer}>
                {sports.map((sport) => (
                  <TouchableOpacity
                    key={sport.id}
                    style={styles.sportCard}
                    onPress={() => handleSportSelect(sport.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sportImageContainer}>
                      <Image source={sport.image} style={styles.sportImage} />
                      <View style={[styles.sportOverlay, { backgroundColor: `${sport.color}80` }]} />
                    </View>
                    
                    <View style={styles.sportContent}>
                      <Text style={[styles.sportName, { color: sport.color }]}>
                        {sport.name}
                      </Text>
                      <Text style={styles.sportDescription}>
                        {sport.description}
                      </Text>
                    </View>

                    <View style={[styles.selectButton, { backgroundColor: sport.color }]}>
                      <Text style={styles.selectButtonText}>Izaberi</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Footer - Updated message for first time users */}
            <Text style={styles.footerText}>
              {isFirstTime 
                ? 'Ova selekcija će personalizovati vaše iskustvo u aplikaciji'
                : 'Možete promeniti sport u bilo kom trenutku u podešavanjima'
              }
            </Text>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Questionnaire Modal */}
      {selectedSport && (
        <SportQuestionnaireModal
          visible={showQuestionnaire}
          sport={selectedSport}
          onComplete={handleQuestionnaireComplete}
          onClose={handleQuestionnaireClose}
        />
      )}
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
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
    maxWidth: 400,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    lineHeight: 22,
    marginBottom: 24,
  },
  scrollContainer: {
    flex: 1,
    marginBottom: 16,
  },
  sportsContainer: {
    gap: 16,
    paddingBottom: 8,
  },
  sportCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sportImageContainer: {
    position: 'relative',
    height: 120,
  },
  sportImage: {
    width: '100%',
    height: '100%',
  },
  sportOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sportContent: {
    padding: 16,
    paddingBottom: 12,
  },
  sportName: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Bold',
    marginBottom: 4,
  },
  sportDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    lineHeight: 18,
  },
  selectButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto-Bold',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
});