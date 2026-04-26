/**
 * MediFlow Design System — sourced from Google Stitch project 6783856950358988859
 * Primary: Teal (#005C55 / #0F766E)
 * Secondary: Indigo (#4648D4 / #6063EE)
 * Font: Inter
 * Roundness: 8px base
 */

export const colors = {
  // Primary (Teal)
  primary: '#005c55',
  primaryContainer: '#0f766e',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#a3faef',
  primaryFixed: '#9cf2e8',
  primaryFixedDim: '#80d5cb',
  inversePrimary: '#80d5cb',

  // Secondary (Indigo)
  secondary: '#4648d4',
  secondaryContainer: '#6063ee',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#fffbff',

  // Tertiary (Warm)
  tertiary: '#7f4025',
  tertiaryContainer: '#9c573a',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#ffe5db',

  // Surface / Background
  background: '#f7faf8',
  surface: '#f7faf8',
  surfaceBright: '#f7faf8',
  surfaceDim: '#d7dbd9',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f1f4f3',
  surfaceContainer: '#ebefed',
  surfaceContainerHigh: '#e5e9e7',
  surfaceContainerHighest: '#e0e3e1',
  surfaceVariant: '#e0e3e1',
  surfaceTint: '#006a63',

  // On Surface
  onBackground: '#181c1c',
  onSurface: '#181c1c',
  onSurfaceVariant: '#3e4947',
  inverseSurface: '#2d3130',
  inverseOnSurface: '#eef1f0',

  // Outline
  outline: '#6e7977',
  outlineVariant: '#bdc9c6',

  // Error
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',
} as const;

export const typography = {
  h1: { fontFamily: 'Inter', fontSize: '32px', fontWeight: '700', lineHeight: '40px', letterSpacing: '-0.02em' },
  h2: { fontFamily: 'Inter', fontSize: '24px', fontWeight: '600', lineHeight: '32px', letterSpacing: '-0.01em' },
  h3: { fontFamily: 'Inter', fontSize: '20px', fontWeight: '600', lineHeight: '28px', letterSpacing: '-0.01em' },
  bodyLg: { fontFamily: 'Inter', fontSize: '16px', fontWeight: '500', lineHeight: '24px', letterSpacing: '0' },
  bodyMd: { fontFamily: 'Inter', fontSize: '14px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0' },
  labelMd: { fontFamily: 'Inter', fontSize: '12px', fontWeight: '600', lineHeight: '16px', letterSpacing: '0.02em' },
  labelSm: { fontFamily: 'Inter', fontSize: '11px', fontWeight: '500', lineHeight: '14px', letterSpacing: '0.03em' },
} as const;

export const spacing = {
  base: '8px',
  sidebarWidth: '240px',
  headerHeight: '64px',
  containerPadding: '24px',
  elementGap: '16px',
  gridColumns: 12,
  gridGutter: '24px',
} as const;

export const borderRadius = {
  sm: '4px',
  DEFAULT: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
} as const;
