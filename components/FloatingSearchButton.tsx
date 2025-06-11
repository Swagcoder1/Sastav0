import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Platform, Animated, PanResponder, Dimensions } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useFloatingButton } from '@/contexts/FloatingButtonContext';

interface FloatingSearchButtonProps {
  onPress: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const BUTTON_SIZE = 56;
const EDGE_PADDING = 20;

export function FloatingSearchButton({ onPress }: FloatingSearchButtonProps) {
  const { colors } = useTheme();
  const { position } = useFloatingButton();
  
  // Track if we're dragging to prevent onPress when dragging
  const isDragging = useRef(false);
  const dragThreshold = 10;
  
  // Initialize position only once
  useEffect(() => {
    // Set initial position if it hasn't been set
    const initialX = screenWidth - BUTTON_SIZE - EDGE_PADDING;
    const initialY = screenHeight - BUTTON_SIZE - (Platform.OS === 'web' ? 100 : 120);
    
    // Only set if position is at origin (0, 0)
    if (position.x._value === 0 && position.y._value === 0) {
      position.setValue({ x: initialX, y: initialY });
    }
  }, []);
  
  // Create pan responder for drag functionality
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only start dragging if we've moved more than the threshold
        return Math.abs(gestureState.dx) > dragThreshold || Math.abs(gestureState.dy) > dragThreshold;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > dragThreshold || Math.abs(gestureState.dy) > dragThreshold;
      },
      onPanResponderGrant: () => {
        // Set offset to current value when starting drag
        position.setOffset({
          x: position.x._value,
          y: position.y._value,
        });
        isDragging.current = false;
      },
      onPanResponderMove: (evt, gestureState) => {
        isDragging.current = true;
        // Update position during drag
        Animated.event([null, { dx: position.x, dy: position.y }], {
          useNativeDriver: false,
        })(evt, gestureState);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Flatten offset
        position.flattenOffset();
        
        // Get current position
        const currentX = position.x._value;
        const currentY = position.y._value;
        
        // Calculate boundaries
        const minX = EDGE_PADDING;
        const maxX = screenWidth - BUTTON_SIZE - EDGE_PADDING;
        const minY = EDGE_PADDING;
        const maxY = screenHeight - BUTTON_SIZE - EDGE_PADDING;
        
        // Only constrain within screen bounds, don't snap to edges
        let finalX = Math.max(minX, Math.min(maxX, currentX));
        let finalY = Math.max(minY, Math.min(maxY, currentY));
        
        // Only animate if we need to constrain the position
        if (finalX !== currentX || finalY !== currentY) {
          Animated.spring(position, {
            toValue: { x: finalX, y: finalY },
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }).start();
        }
        
        // Reset dragging flag after a short delay to prevent accidental press
        setTimeout(() => {
          isDragging.current = false;
        }, 100);
      },
    })
  ).current;

  const handlePress = () => {
    // Only trigger onPress if we weren't dragging
    if (!isDragging.current) {
      onPress();
    }
  };

  const styles = createStyles(colors);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: position.getTranslateTransform(),
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity 
        style={styles.floatingButton} 
        onPress={handlePress}
        activeOpacity={0.8}
        // Disable touch events during drag to prevent conflicts
        disabled={isDragging.current}
      >
        <Search size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    zIndex: 1000,
  },
  floatingButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});