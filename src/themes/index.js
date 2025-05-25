import { useColorScheme } from 'react-native';

export const lightColors = {
    background: '#FFFFFF', // Pure white for maximum contrast with dark text
    text: '#000000',       // Pure black for maximum contrast
    subText: '#444444',    // Darker grey for secondary text
    cardBackground: '#F5F5F5', // Very light grey for card backgrounds
    inputPlaceholder: '#666666', // Darker placeholder
    inputTextColor: '#000000',
    searchBarBackground: '#E8E8E8', // Slightly darker than cardBackground for distinction
    primary: '#1A73E8', // A strong blue for primary actions
    border: '#BBBBBB',
    errorText: '#CC0000', // Stronger red
  };
  
  export const darkColors = {
    background: '#121212', // Very dark grey/near black for deep dark mode
    text: '#F5F5F5',       // Very light grey for high contrast
    subText: '#BBBBBB',    // Lighter grey for secondary text
    cardBackground: '#1E1E1E', // Slightly lighter dark background for cards
    inputPlaceholder: '#AAAAAA', // Lighter placeholder
    inputTextColor: '#FFFFFF',
    searchBarBackground: '#2A2A2A', // Slightly lighter than cardBackground for distinction
    primary: '#4285F4', // A good blue for primary actions (consider accessibility with white text)
    border: '#3A3A3A',
    errorText: '#FF7F7F', // Brighter red for visibility
  };

export const useAppTheme = () => {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;

  return { colors, scheme };
};
