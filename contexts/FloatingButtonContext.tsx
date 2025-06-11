import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated } from 'react-native';

interface FloatingButtonContextType {
  position: Animated.ValueXY;
  searchVisible: boolean;
  setSearchVisible: (visible: boolean) => void;
}

const FloatingButtonContext = createContext<FloatingButtonContextType | undefined>(undefined);

export function FloatingButtonProvider({ children }: { children: React.ReactNode }) {
  // Create a shared position that persists across all tabs
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [searchVisible, setSearchVisible] = useState(false);

  return (
    <FloatingButtonContext.Provider
      value={{
        position,
        searchVisible,
        setSearchVisible,
      }}
    >
      {children}
    </FloatingButtonContext.Provider>
  );
}

export const useFloatingButton = () => {
  const context = useContext(FloatingButtonContext);
  if (context === undefined) {
    throw new Error('useFloatingButton must be used within a FloatingButtonProvider');
  }
  return context;
};