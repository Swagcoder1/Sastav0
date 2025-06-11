import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, colors } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getIcon = () => {
    return theme === 'light' 
      ? <Sun size={20} color={colors.textSecondary} />
      : <Moon size={20} color={colors.textSecondary} />;
  };

  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: colors.surface }]} 
      onPress={toggleTheme}
    >
      {getIcon()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
});