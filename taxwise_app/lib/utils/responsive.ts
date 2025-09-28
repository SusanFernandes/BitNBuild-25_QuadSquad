import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Breakpoints for responsive design
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
};

// Device type detection
export const isMobile = width < breakpoints.tablet;
export const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
export const isDesktop = width >= breakpoints.desktop;
export const isWeb = Platform.OS === 'web';

// Responsive dimensions
export const responsiveDimensions = {
  screenWidth: width,
  screenHeight: height,
  isLandscape: width > height,
  isPortrait: height > width,
};

// Responsive spacing
export const spacing = {
  xs: isMobile ? 4 : 6,
  sm: isMobile ? 8 : 12,
  md: isMobile ? 16 : 20,
  lg: isMobile ? 24 : 32,
  xl: isMobile ? 32 : 40,
  xxl: isMobile ? 48 : 64,
};

// Responsive font sizes
export const fontSizes = {
  xs: isMobile ? 10 : 12,
  sm: isMobile ? 12 : 14,
  md: isMobile ? 14 : 16,
  lg: isMobile ? 16 : 18,
  xl: isMobile ? 18 : 20,
  xxl: isMobile ? 20 : 24,
  xxxl: isMobile ? 24 : 32,
};

// Responsive grid columns
export const getGridColumns = () => {
  if (isMobile) return 2;
  if (isTablet) return 3;
  if (isDesktop) return 4;
  return 4;
};

// Responsive card width
export const getCardWidth = (columns: number = getGridColumns()) => {
  const totalSpacing = spacing.md * (columns + 1);
  return (width - totalSpacing) / columns;
};

// Responsive container max width
export const getContainerMaxWidth = () => {
  if (isMobile) return width;
  if (isTablet) return 768;
  if (isDesktop) return 1200;
  return 1200;
};

// Responsive padding
export const getResponsivePadding = () => {
  if (isMobile) return spacing.md;
  if (isTablet) return spacing.lg;
  if (isDesktop) return spacing.xl;
  return spacing.xl;
};

// Responsive margin
export const getResponsiveMargin = () => {
  if (isMobile) return spacing.sm;
  if (isTablet) return spacing.md;
  if (isDesktop) return spacing.lg;
  return spacing.lg;
};

// Responsive border radius
export const borderRadius = {
  sm: isMobile ? 4 : 6,
  md: isMobile ? 8 : 12,
  lg: isMobile ? 12 : 16,
  xl: isMobile ? 16 : 20,
  xxl: isMobile ? 20 : 24,
};

// Responsive shadow
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Responsive layout helpers
export const layout = {
  container: {
    flex: 1,
    maxWidth: getContainerMaxWidth(),
    alignSelf: 'center',
    width: '100%',
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  column: {
    flexDirection: 'column' as const,
  },
  center: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  spaceBetween: {
    justifyContent: 'space-between' as const,
  },
  spaceAround: {
    justifyContent: 'space-around' as const,
  },
  wrap: {
    flexWrap: 'wrap' as const,
  },
};

// Responsive text styles
export const textStyles = {
  h1: {
    fontSize: fontSizes.xxxl,
    fontWeight: '700' as const,
    lineHeight: fontSizes.xxxl * 1.2,
  },
  h2: {
    fontSize: fontSizes.xxl,
    fontWeight: '600' as const,
    lineHeight: fontSizes.xxl * 1.2,
  },
  h3: {
    fontSize: fontSizes.xl,
    fontWeight: '600' as const,
    lineHeight: fontSizes.xl * 1.2,
  },
  body: {
    fontSize: fontSizes.md,
    fontWeight: '400' as const,
    lineHeight: fontSizes.md * 1.5,
  },
  caption: {
    fontSize: fontSizes.sm,
    fontWeight: '400' as const,
    lineHeight: fontSizes.sm * 1.4,
  },
  button: {
    fontSize: fontSizes.md,
    fontWeight: '600' as const,
  },
};
