export const COLORS = {
  primary: '#1E3A8A',        
  primaryLight: '#3B82F6',   
  primaryDark: '#1E40AF',    

  secondary: '#0EA5E9',      
  secondaryLight: '#38BDF8', 
  
  accent: '#06B6D4',         
  success: '#10B981',        // Green
  warning: '#F59E0B',        
  error: '#EF4444',          // Red
  
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  
  moodHappy: '#FCD34D',     
  moodSad: '#60A5FA',        
  moodStressed: '#F87171',   
  moodMotivated: '#34D399', 
  moodCalm: '#A78BFA',       
  moodEnergetic: '#FB923C',  
  
  
  transparent: 'rgba(0,0,0,0)',
  overlay: 'rgba(0,0,0,0.5)',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundDark: '#111827',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',
  textMuted: '#9CA3AF',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#3B82F6',
  divider: '#E5E7EB',
  
  // Input colors
  inputBackground: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputFocus: '#3B82F6',
  inputText: '#111827',
  inputPlaceholder: '#9CA3AF',
  
  // Button colors
  buttonPrimary: '#1E3A8A',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#F3F4F6',
  buttonSecondaryText: '#374151',
  buttonDisabled: '#D1D5DB',
  buttonDisabledText: '#9CA3AF',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.15)',
  shadowHeavy: 'rgba(0, 0, 0, 0.25)',
  
  // Environment colors
  environmentHome: '#A78BFA',
  environmentWork: '#10B981',
  environmentGym: '#EF4444',
  environmentCommute: '#3B82F6',
  environmentNature: '#84CC16',
  environmentSocial: '#EC4899',
  
  // Spotify inspired colors
  spotifyGreen: '#1DB954',
  spotifyBlack: '#191414',
  spotifyDarkGray: '#121212',
  spotifyGray: '#535353',
  spotifyLightGray: '#B3B3B3',
  
  // Status colors variations
    successLight: '#D1FAE5',
  successDark: '#065F46',
  warningLight: '#FEF3C7',
  warningDark: '#92400E',
  errorLight: '#FEE2E2',
  errorDark: '#991B1B',
  
  // Additional mood colors
  moodAnxious: '#8B5CF6',
  moodExcited: '#F97316',
  moodContent: '#06B6D4',
  moodTired: '#6B7280',
  moodFocused: '#059669',
  moodRelaxed: '#84CC16',
  
  // Activity colors
  activityWork: '#3B82F6',
  activityExercise: '#EF4444',
  activitySocial: '#EC4899',
  activityHobby: '#F59E0B',
  activityRest: '#8B5CF6',
  activityTravel: '#06B6D4',
  
  // Chart colors
  chart1: '#3B82F6',
  chart2: '#10B981',
  chart3: '#F59E0B',
  chart4: '#EF4444',
  chart5: '#8B5CF6',
  chart6: '#06B6D4',
  chart7: '#EC4899',
  chart8: '#84CC16',
};

export const GRADIENTS = {
  primaryGradient: ['#1E3A8A', '#3B82F6'],
  secondaryGradient: ['#0EA5E9', '#06B6D4'],
  moodGradient: ['#1E3A8A', '#3B82F6', '#06B6D4'],
  successGradient: ['#10B981', '#34D399'],
  warningGradient: ['#F59E0B', '#FBBF24'],
  errorGradient: ['#EF4444', '#F87171'],
  accentGradient: ['#06B6D4', '#0891B2'],
  backgroundGradient: ['#F9FAFB', '#FFFFFF'],
  darkGradient: ['#111827', '#374151'],
  moodHappyGradient: ['#FCD34D', '#FDE047'],
  moodCalmGradient: ['#A78BFA', '#C4B5FD'],
  chartGradient: ['#3B82F6', '#10B981', '#F59E0B'],
};

export const DARK_COLORS = {
  ...COLORS,
  
  // Override specific colors for dark mode
  background: '#111827',
  backgroundSecondary: '#1F2937',
  backgroundDark: '#000000',
  surface: '#374151',
  card: '#1F2937',
  
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textInverse: '#111827',
  
  border: '#374151',
  borderLight: '#4B5563',
  divider: '#374151',
  
  inputBackground: '#374151',
  inputBorder: '#4B5563',
  inputText: '#F9FAFB',
  
  buttonSecondary: '#374151',
  buttonSecondaryText: '#F9FAFB',
  
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.2)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
  shadowHeavy: 'rgba(0, 0, 0, 0.6)',
};
