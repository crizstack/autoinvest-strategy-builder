/**
 * Premium Dark Mode Theme - TradingView + Stripe Style
 * Blueprint Architecture Aesthetic
 */

export const colors = {
  // Primary Colors - Blueprint Aesthetic
  primary: {
    50: '#e6f2ff',
    100: '#cce5ff',
    200: '#99ccff',
    300: '#66b2ff',
    400: '#3399ff',
    500: '#0066ff', // Main brand blue (royal blue)
    600: '#0052cc',
    700: '#003d99',
    800: '#002966',
    900: '#001433',
  },

  // Secondary Colors - Technical Grid
  secondary: {
    50: '#f0f4f8',
    100: '#e1e8f0',
    200: '#c3d1e0',
    300: '#a5bbd0',
    400: '#8799c0',
    500: '#6b7fb0', // Grid line color
    600: '#556a8f',
    700: '#3f556e',
    800: '#2a404d',
    900: '#152b2c',
  },

  // Accent Colors - Trading Status
  success: {
    50: '#e6ffe6',
    100: '#ccffcc',
    200: '#99ff99',
    300: '#66ff66',
    400: '#33ff33',
    500: '#00ff00', // Bright green for gains
    600: '#00cc00',
    700: '#009900',
    800: '#006600',
    900: '#003300',
  },

  danger: {
    50: '#ffe6e6',
    100: '#ffcccc',
    200: '#ff9999',
    300: '#ff6666',
    400: '#ff3333',
    500: '#ff0000', // Bright red for losses
    600: '#cc0000',
    700: '#990000',
    800: '#660000',
    900: '#330000',
  },

  warning: {
    50: '#fff5e6',
    100: '#ffebcc',
    200: '#ffd699',
    300: '#ffc266',
    400: '#ffad33',
    500: '#ff9900', // Orange for warnings
    600: '#cc7700',
    700: '#995500',
    800: '#663300',
    900: '#331100',
  },

  // Neutral Colors - Dark Mode Base
  neutral: {
    0: '#000000',
    50: '#0a0e27', // Darkest background
    100: '#111633', // Dark background
    150: '#16192f', // Card background
    200: '#1a1f3a', // Hover background
    300: '#2a3150', // Border color
    400: '#3a4260', // Disabled text
    500: '#6b7280', // Secondary text
    600: '#9ca3af', // Tertiary text
    700: '#d1d5db', // Light text
    800: '#e5e7eb', // Lighter text
    900: '#f3f4f6', // Lightest text
    1000: '#ffffff', // White
  },

  // Semantic Colors
  background: {
    primary: '#0a0e27', // Main background
    secondary: '#111633', // Secondary background
    tertiary: '#16192f', // Card background
    hover: '#1a1f3a', // Hover state
    border: '#2a3150', // Border color
  },

  text: {
    primary: '#f3f4f6', // Main text
    secondary: '#d1d5db', // Secondary text
    tertiary: '#9ca3af', // Tertiary text
    disabled: '#6b7280', // Disabled text
    inverse: '#0a0e27', // Inverse text
  },

  // Chart Colors
  chart: {
    positive: '#00ff00', // Green for gains
    negative: '#ff0000', // Red for losses
    neutral: '#0066ff', // Blue for neutral
    grid: '#2a3150', // Grid lines
    text: '#d1d5db', // Chart text
  },

  // UI Elements
  ui: {
    border: '#2a3150',
    divider: '#1a1f3a',
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
