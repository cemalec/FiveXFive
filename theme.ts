const radius = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 50,
} as const;

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
} as const;

export type ThemeName =
  | 'midnightCarbon'
  | 'forestFloor'
  | 'emberForge'
  | 'foxfireLeaves'
  | 'paperMint'
  | 'neonPulse'
  | 'linenSlate';

export type AppTheme = {
  name: ThemeName;
  label: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    accent: string;
    danger: string;
    success: string;
    warning: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    textSoft: string;
    border: string;
    overlay: string;
    white: string;
    black: string;
  };
  radius: typeof radius;
  spacing: typeof spacing;
  shadow: {
    card: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    modal: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
};

export const themes: Record<ThemeName, AppTheme> = {
  midnightCarbon: {
    name: 'midnightCarbon',
    label: 'Midnight Carbon',
    colors: {
      background: '#03050A',
      surface: '#161B22',
      primary: '#58A6FF',
      accent: '#58A6FF',
      danger: '#F85149',
      success: '#3FB950',
      warning: '#D29922',
      text: '#E6EDF3',
      textSecondary: '#8B949E',
      textMuted: '#484F58',
      textSoft: '#6E7681',
      border: '#21262D',
      overlay: 'rgba(1,4,9,0.82)',
      white: '#FFFFFF',
      black: '#000000',
    },
    radius,
    spacing,
    shadow: {
      card: {
        shadowColor: '#58A6FF',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
      modal: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.65,
        shadowRadius: 20,
        elevation: 14,
      },
    },
  },

  forestFloor: {
    name: 'forestFloor',
    label: 'Forest Floor',
    colors: {
      background: '#050A05',
      surface: '#0E1A0F',
      primary: '#3FB950',
      accent: '#3FB950',
      danger: '#F85149',
      success: '#3FB950',
      warning: '#D29922',
      text: '#E2EDE3',
      textSecondary: '#7EA882',
      textMuted: '#3A5C3D',
      textSoft: '#567A5A',
      border: '#1B3320',
      overlay: 'rgba(2,8,3,0.85)',
      white: '#FFFFFF',
      black: '#000000',
    },
    radius,
    spacing,
    shadow: {
      card: {
        shadowColor: '#3FB950',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 3,
      },
      modal: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.65,
        shadowRadius: 20,
        elevation: 14,
      },
    },
  },

  emberForge: {
    name: 'emberForge',
    label: 'Ember Forge',
    colors: {
      background: '#0A0603',
      surface: '#1A1108',
      primary: '#F0873A',
      accent: '#F0873A',
      danger: '#F85149',
      success: '#3FB950',
      warning: '#D29922',
      text: '#F0E8DC',
      textSecondary: '#A8906C',
      textMuted: '#5C4828',
      textSoft: '#7A6040',
      border: '#2E1F08',
      overlay: 'rgba(10,6,2,0.85)',
      white: '#FFFFFF',
      black: '#000000',
    },
    radius,
    spacing,
    shadow: {
      card: {
        shadowColor: '#F0873A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 3,
      },
      modal: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.65,
        shadowRadius: 20,
        elevation: 14,
      },
    },
  },

  foxfireLeaves: {
    name: 'foxfireLeaves',
    label: 'Foxfire Leaves',
    colors: {
      background: '#F4EDE2',
      surface: '#FFF9F1',
      primary: '#C66A3B',
      accent: '#C66A3B',
      danger: '#B85733',
      success: '#3E6A5A',
      warning: '#C4881A',
      text: '#1F2430',
      textSecondary: '#534E45',
      textMuted: '#7B7467',
      textSoft: '#9E9288',
      border: '#DDD0BE',
      overlay: 'rgba(19, 23, 32, 0.55)',
      white: '#FFFFFF',
      black: '#000000',
    },
    radius,
    spacing,
    shadow: {
      card: {
        shadowColor: '#8B6040',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
      },
      modal: {
        shadowColor: '#1F2430',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.20,
        shadowRadius: 20,
        elevation: 12,
      },
    },
  },

  paperMint: {
    name: 'paperMint',
    label: 'Paper Mint',
    colors: {
      background: '#F6FBF8',
      surface: '#FFFFFF',
      primary: '#1F8C6A',
      accent: '#2FA67D',
      danger: '#C14B4B',
      success: '#2D8A5E',
      warning: '#B9861A',
      text: '#1F2A24',
      textSecondary: '#4D5E56',
      textMuted: '#7C8C85',
      textSoft: '#99A79F',
      border: '#D4E4DC',
      overlay: 'rgba(20, 31, 27, 0.45)',
      white: '#FFFFFF',
      black: '#000000',
    },
    radius,
    spacing,
    shadow: {
      card: {
        shadowColor: '#1F8C6A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 9,
        elevation: 3,
      },
      modal: {
        shadowColor: '#1F2A24',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 10,
      },
    },
  },

  neonPulse: {
    name: 'neonPulse',
    label: 'Neon Pulse',
    colors: {
      background: '#0A0A0A',
      surface: '#1A1A1A',
      primary: '#00D4FF',
      accent: '#FF0080',
      danger: '#FF4444',
      success: '#00FF88',
      warning: '#FFA500',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
      textMuted: '#888888',
      textSoft: '#AAAAAA',
      border: '#333333',
      overlay: 'rgba(0, 0, 0, 0.8)',
      white: '#FFFFFF',
      black: '#000000',
    },
    radius,
    spacing,
    shadow: {
      card: {
        shadowColor: '#00D4FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.30,
        shadowRadius: 12,
        elevation: 5,
      },
      modal: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 20,
      },
    },
  },

  linenSlate: {
    name: 'linenSlate',
    label: 'Linen Slate',
    colors: {
      background: '#F3F4F6',
      surface: '#FFFFFF',
      primary: '#50627A',
      accent: '#5E738D',
      danger: '#BE4E4E',
      success: '#3B7A63',
      warning: '#B07E1E',
      text: '#1F2937',
      textSecondary: '#4B5563',
      textMuted: '#6B7280',
      textSoft: '#9CA3AF',
      border: '#D7DCE3',
      overlay: 'rgba(17, 24, 39, 0.45)',
      white: '#FFFFFF',
      black: '#000000',
    },
    radius,
    spacing,
    shadow: {
      card: {
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 10,
        elevation: 3,
      },
      modal: {
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
        elevation: 10,
      },
    },
  },
};

// Default export kept for any code that hasn't migrated to useTheme() yet
export const theme = themes.linenSlate;
