/**
 * Joven Invest visual tokens.
 * The object shape is preserved for existing consumers; only visual values are branded.
 */

export const colors = {
  primary: {
    50: '#F1FBE8',
    100: '#E2F7D1',
    200: '#C5EFA3',
    300: '#A2E96B',
    400: '#76E821',
    500: '#38A636',
    600: '#2F8F2E',
    700: '#235317',
    800: '#1A3E12',
    900: '#0F250A',
  },

  secondary: {
    50: '#E8F1E8',
    100: '#D1E2D1',
    200: '#AFC8AF',
    300: '#8EA98E',
    400: '#6B756B',
    500: '#596859',
    600: '#465746',
    700: '#344634',
    800: '#253525',
    900: '#182418',
  },

  success: {
    50: '#F1FBE8',
    100: '#E2F7D1',
    200: '#C5EFA3',
    300: '#A2E96B',
    400: '#76E821',
    500: '#38A636',
    600: '#2F8F2E',
    700: '#235317',
    800: '#1A3E12',
    900: '#0F250A',
  },

  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  neutral: {
    0: '#000000',
    50: '#050805',
    100: '#0B110B',
    150: '#101810',
    200: '#141C14',
    300: '#235317',
    400: '#394939',
    500: '#6B756B',
    600: '#8B978B',
    700: '#B8C2B8',
    800: '#D8E0D8',
    900: '#F0F5F0',
    1000: '#FFFFFF',
  },

  background: {
    primary: '#050805',
    secondary: '#0B110B',
    tertiary: '#101810',
    hover: '#141C14',
    border: '#235317',
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#B8C2B8',
    tertiary: '#8B978B',
    disabled: '#6B756B',
    inverse: '#050805',
  },

  chart: {
    positive: '#38A636',
    negative: '#EF4444',
    neutral: '#6B756B',
    grid: '#235317',
    text: '#B8C2B8',
  },

  ui: {
    border: '#235317',
    divider: '#141C14',
    shadow: 'rgba(0, 0, 0, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
};

// Tailwind CSS Configuration
export const tailwindConfig = {
  colors: {
    // Brand colors
    blue: colors.primary,
    slate: colors.secondary,
    green: colors.success,
    red: colors.danger,
    amber: colors.warning,
    gray: colors.neutral,

    // Semantic
    background: colors.background.primary,
    'background-secondary': colors.background.secondary,
    'background-tertiary': colors.background.tertiary,
    'background-hover': colors.background.hover,

    // Text
    foreground: colors.text.primary,
    'foreground-secondary': colors.text.secondary,
    'foreground-tertiary': colors.text.tertiary,
    'foreground-disabled': colors.text.disabled,

    // Borders
    border: colors.ui.border,
    divider: colors.ui.divider,
  },

  // Custom CSS variables for CSS-in-JS
  cssVariables: {
    '--color-primary': colors.primary[500],
    '--color-primary-dark': colors.primary[700],
    '--color-primary-light': colors.primary[300],

    '--color-background': colors.background.primary,
    '--color-background-secondary': colors.background.secondary,
    '--color-background-tertiary': colors.background.tertiary,
    '--color-background-hover': colors.background.hover,

    '--color-text-primary': colors.text.primary,
    '--color-text-secondary': colors.text.secondary,
    '--color-text-tertiary': colors.text.tertiary,

    '--color-border': colors.ui.border,
    '--color-success': colors.success[500],
    '--color-danger': colors.danger[500],
    '--color-warning': colors.warning[500],

    '--color-chart-positive': colors.chart.positive,
    '--color-chart-negative': colors.chart.negative,
    '--color-chart-grid': colors.chart.grid,
  },
};
