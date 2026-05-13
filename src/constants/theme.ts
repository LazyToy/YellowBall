import { Platform } from 'react-native';

export type ColorToken = {
  source: string;
  hsl: string;
  hex: string;
};

export type ThemeMode = 'light' | 'dark';

const token = (source: string, hsl: string, hex: string): ColorToken => ({
  source,
  hsl,
  hex,
});

export const theme = {
  colors: {
    light: {
      background: token('oklch(0.985 0.008 95)', '48 52% 97%', '#fcfaf4'),
      foreground: token('oklch(0.18 0.02 160)', '148 36% 6%', '#0a140f'),
      card: token('oklch(1 0 0)', '0 0% 100%', '#ffffff'),
      cardForeground: token(
        'oklch(0.18 0.02 160)',
        '148 36% 6%',
        '#0a140f',
      ),
      popover: token('oklch(1 0 0)', '0 0% 100%', '#ffffff'),
      popoverForeground: token(
        'oklch(0.18 0.02 160)',
        '148 36% 6%',
        '#0a140f',
      ),
      primary: token('oklch(0.32 0.06 160)', '152 57% 15%', '#103c28'),
      primaryForeground: token(
        'oklch(0.985 0.008 95)',
        '48 52% 97%',
        '#fcfaf4',
      ),
      accent: token('oklch(0.88 0.18 115)', '66 76% 57%', '#d5e43f'),
      accentForeground: token(
        'oklch(0.22 0.05 160)',
        '153 100% 7%',
        '#002112',
      ),
      secondary: token('oklch(0.95 0.01 100)', '53 22% 92%', '#f0efe7'),
      secondaryForeground: token(
        'oklch(0.25 0.03 160)',
        '148 31% 11%',
        '#14261d',
      ),
      muted: token('oklch(0.95 0.008 100)', '53 18% 93%', '#efefe9'),
      mutedForeground: token(
        'oklch(0.5 0.02 150)',
        '130 6% 38%',
        '#5c675d',
      ),
      destructive: token('oklch(0.6 0.2 25)', '359 72% 55%', '#de3b3d'),
      destructiveForeground: token('oklch(0.985 0 0)', '0 0% 99%', '#fcfcfc'),
      warning: token('status-warning-background', '47 100% 90%', '#fff4cc'),
      warningBorder: token('status-warning-border', '45 82% 68%', '#f2d16b'),
      warningForeground: token('status-warning-foreground', '44 100% 17%', '#594100'),
      border: token('oklch(0.9 0.01 100)', '52 12% 86%', '#dfded7'),
      input: token('oklch(0.92 0.01 100)', '52 14% 88%', '#e6e5dd'),
      ring: token('oklch(0.32 0.06 160)', '152 57% 15%', '#103c28'),
      chart1: token('oklch(0.32 0.06 160)', '152 57% 15%', '#103c28'),
      chart2: token('oklch(0.88 0.18 115)', '66 76% 57%', '#d5e43f'),
      chart3: token('oklch(0.55 0.12 160)', '157 78% 30%', '#118659'),
      chart4: token('oklch(0.75 0.14 110)', '61 50% 47%', '#b4b53d'),
      chart5: token('oklch(0.4 0.04 160)', '147 20% 26%', '#344f40'),
    },
    dark: {
      background: token('oklch(0.16 0.02 160)', '146 46% 4%', '#06100a'),
      foreground: token('oklch(0.98 0.005 95)', '48 29% 97%', '#f9f8f5'),
      card: token('oklch(0.22 0.025 160)', '148 31% 9%', '#101e17'),
      cardForeground: token(
        'oklch(0.98 0.005 95)',
        '48 29% 97%',
        '#f9f8f5',
      ),
      primary: token('oklch(0.88 0.18 115)', '66 76% 57%', '#d5e43f'),
      primaryForeground: token(
        'oklch(0.18 0.04 160)',
        '149 97% 5%',
        '#00170b',
      ),
      accent: token('oklch(0.88 0.18 115)', '66 76% 57%', '#d5e43f'),
      accentForeground: token(
        'oklch(0.18 0.04 160)',
        '149 97% 5%',
        '#00170b',
      ),
      secondary: token('oklch(0.27 0.03 160)', '148 26% 13%', '#192b21'),
      secondaryForeground: token(
        'oklch(0.98 0.005 95)',
        '48 29% 97%',
        '#f9f8f5',
      ),
      muted: token('oklch(0.27 0.03 160)', '148 26% 13%', '#192b21'),
      mutedForeground: token(
        'oklch(0.7 0.02 150)',
        '129 6% 61%',
        '#96a298',
      ),
      destructive: token('oklch(0.55 0.2 25)', '359 69% 50%', '#d22d33'),
      destructiveForeground: token('oklch(0.98 0 0)', '0 0% 98%', '#fafafa'),
      warning: token('status-warning-background-dark', '44 35% 20%', '#453819'),
      warningBorder: token('status-warning-border-dark', '43 54% 38%', '#95712d'),
      warningForeground: token('status-warning-foreground-dark', '47 100% 90%', '#fff4cc'),
      border: token('oklch(0.3 0.03 160)', '147 22% 16%', '#203329'),
      input: token('oklch(0.3 0.03 160)', '147 22% 16%', '#203329'),
      ring: token('oklch(0.88 0.18 115)', '66 76% 57%', '#d5e43f'),
    },
  },
typography: {
  fontFamily: {
    body: Platform.select({
      web: 'Geist, system-ui, sans-serif',
      default: 'System',
    }) as string,
    display: Platform.select({
      web: 'Manrope, Geist, system-ui, sans-serif',
      default: 'System',
    }) as string,
    mono: Platform.select({
      web: 'Geist Mono, Menlo, monospace',
      default: 'monospace',
    }) as string,
  },

    fontSize: {
      xs: 13,
      sm: 14,
      h1: 32,
      h2: 24,
      body: 16,
      caption: 12,
    },
    lineHeight: {
      xs: 18,
      sm: 20,
      h1: 40,
      h2: 32,
      body: 24,
      caption: 16,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    '2xl': 30,
  },
  borderWidth: {
    hairline: 1,
  },
  opacity: {
    disabled: 0.5,
    pressed: 0.88,
  },
  controlHeights: {
    tab: 30,
    sm: 32,
    md: 36,
    lg: 40,
  },
  componentSpacing: {
    tabListPadding: 3,
    badgeVerticalPadding: 2,
  },
  shadow: {
    card: {
      shadowColor: '#0a140f',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
  },
} as const;

export const lightColors = theme.colors.light;
export const darkColors = theme.colors.dark;
