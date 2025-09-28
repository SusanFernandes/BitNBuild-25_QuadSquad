import React, { useEffect, useState } from 'react';
import {
  CartesianChart,
  type ChartBounds,
  type PointsArray,
  useAreaPath,
  useChartPressState,
  useLinePath,
} from 'victory-native';
import {
  Circle,
  Group,
  Line as SkiaLine,
  LinearGradient,
  Path,
  Skia,
  Text as SkiaText,
  useFont,
  vec,
} from '@shopify/react-native-skia';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  type TextStyle,
  View,
  useColorScheme,
} from 'react-native';
import { format } from 'date-fns';
import { type SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import inter from '../assets/inter-medium.ttf';

const appColors = {
  tint: '#f66b15',
  androidHeader: { dark: '#262626', light: '#fafafa' },
  viewBackground: { dark: '#404040', light: '#f5f5f5' },
  text: { dark: '#fafafa', light: '#262626' },
  cardBackground: { dark: '#525252', light: '#fff' },
  cardBorder: { dark: '#a1a1aa', light: '#a1a1aa' },
  success: { dark: '#4a90e2', light: '#2166b5' }, // Changed to shades of blue
  error: { dark: '#c84c4c', light: '#9e1a1a' },
  infoCardActive: { dark: '#c4b5fd', light: '#8b5cf6' },
  buttonBackgroundColor: { dark: '#737373', light: '#e7e7e7' },
  buttonBorderColor: { dark: '#a3a3a3', light: 'white' },
  buttonUnderlayColor: { dark: '#8b5cf6', light: '#ddd6fe' },
};

const data = [
  {
    date: '2019-09-30',
    high: 48.79600143432617,
    low: 47.22200012207031,
    open: 48.599998474121094,
    close: 48.17399978637695,
  },
  {
    date: '2019-10-01',
    high: 49.189998626708984,
    low: 47.82600021362305,
    open: 48.29999923706055,
    close: 48.9379997253418,
  },
  {
    date: '2019-10-02',
    high: 48.93000030517578,
    low: 47.88600158691406,
    open: 48.65800094604492,
    close: 48.625999450683594,
  },
  {
    date: '2019-10-03',
    high: 46.895999908447266,
    low: 44.85599899291992,
    open: 46.37200164794922,
    close: 46.60599899291992,
  },
  {
    date: '2019-10-04',
    high: 46.95600128173828,
    low: 45.61399841308594,
    open: 46.321998596191406,
    close: 46.2859992980957,
  },
  {
    date: '2019-10-07',
    high: 47.71200180053711,
    low: 45.709999084472656,
    open: 45.959999084472656,
    close: 47.54399871826172,
  },
  {
    date: '2019-10-08',
    high: 48.78799819946289,
    low: 46.900001525878906,
    open: 47.17399978637695,
    close: 48.0099983215332,
  },
  {
    date: '2019-10-09',
    high: 49.459999084472656,
    low: 48.130001068115234,
    open: 48.263999938964844,
    close: 48.90599822998047,
  },
  {
    date: '2019-10-10',
    high: 49.85599899291992,
    low: 48.316001892089844,
    open: 49.055999755859375,
    close: 48.948001861572266,
  },
  {
    date: '2019-10-11',
    high: 50.215999603271484,
    low: 49.36199951171875,
    open: 49.43000030517578,
    close: 49.577999114990234,
  },
  {
    date: '2019-10-14',
    high: 51.709999084472656,
    low: 49.42599868774414,
    open: 49.58000183105469,
    close: 51.391998291015625,
  },
];

const DATA = data.map((d) => ({ ...d, date: new Date(d.date).valueOf() }));
const initChartPressState = { x: 0, y: { high: 0 } } as const;

export default function GrowthChart() {
  const font = useFont(inter, 12);

  const colorPrefix = useColorScheme();
  const textColor = colorPrefix === 'dark' ? appColors.text.dark : appColors.text.light;
  const { state: firstTouch, isActive: isFirstPressActive } =
    useChartPressState(initChartPressState);
  const { state: secondTouch, isActive: isSecondPressActive } =
    useChartPressState(initChartPressState);

  // On activation of gesture, play haptic feedback

  // Active date display
  const activeDate = useDerivedValue(() => {
    if (!isFirstPressActive) return 'Single or multi-touch the chart';

    // One-touch only
    if (!isSecondPressActive) return formatDate(firstTouch.x.value.value);
    // Two-touch
    const early = firstTouch.x.value.value < secondTouch.x.value.value ? firstTouch : secondTouch;
    const late = early === firstTouch ? secondTouch : firstTouch;
    return `${formatDate(early.x.value.value)} - ${formatDate(late.x.value.value)}`;
  });

  // Active high display
  const activeHigh = useDerivedValue(() => {
    if (!isFirstPressActive) return '—';

    // One-touch
    if (!isSecondPressActive) return firstTouch.y.high.value.value.toFixed(2);

    // Two-touch
    const early = firstTouch.x.value.value < secondTouch.x.value.value ? firstTouch : secondTouch;
    const late = early === firstTouch ? secondTouch : firstTouch;

    return `${early.y.high.value.value.toFixed(2)} – ${late.y.high.value.value.toFixed(2)}`;
  });

  // Determine if the selected range has a positive delta, which will be used to conditionally pick colors.
  const isDeltaPositive = useDerivedValue(() => {
    if (!isSecondPressActive) return true;

    const early = firstTouch.x.value.value < secondTouch.x.value.value ? firstTouch : secondTouch;
    const late = early === firstTouch ? secondTouch : firstTouch;
    return early.y.high.value.value < late.y.high.value.value;
  });

  // Color the active high display based on the delta
  const activeHighStyle = useAnimatedStyle<TextStyle>(() => {
    const s: TextStyle = { fontSize: 24, fontWeight: 'bold', color: textColor };

    // One-touch
    if (!isSecondPressActive) return s;
    s.color = isDeltaPositive.value ? appColors.success[colorPrefix] : appColors.error[colorPrefix];

    return s;
  });

  // Indicator color based on delta
  const indicatorColor = useDerivedValue(() => {
    if (!(isFirstPressActive && isSecondPressActive)) return appColors.tint;
    return isDeltaPositive.value ? appColors.success[colorPrefix] : appColors.error[colorPrefix];
  });

  return (
    <View style={styles.scrollView}>
      <View style={{ flex: 2 }}>
        <CartesianChart
          data={DATA}
          xKey="date"
          padding={5}
          yKeys={['high']}
          chartPressState={[firstTouch, secondTouch]}
          axisOptions={{
            font: font,
            tickCount: 5,
            labelOffset: { x: 12, y: 8 },
            labelPosition: { x: 'outset', y: 'inset' },
            axisSide: { x: 'bottom', y: 'left' },
            formatXLabel: (ms) => format(new Date(ms), 'MM/yy'),
            formatYLabel: (v) => `${v}%`,
            lineColor: colorPrefix === 'dark' ? 'hsl(0, 0% ,13.33%)' : 'hsl(0, 0%, 93.73%)',
            labelColor: textColor,
          }}
          renderOutside={({ chartBounds }) => (
            <>
              {isFirstPressActive && (
                <>
                  <ActiveValueIndicator
                    xPosition={firstTouch.x.position}
                    yPosition={firstTouch.y.high.position}
                    bottom={chartBounds.bottom}
                    top={chartBounds.top}
                    activeValue={firstTouch.x.value}
                    textColor={textColor}
                    lineColor={colorPrefix === 'dark' ? '#71717a' : '#d4d4d8'}
                    indicatorColor={indicatorColor}
                  />
                </>
              )}
              {isSecondPressActive && (
                <>
                  <ActiveValueIndicator
                    xPosition={secondTouch.x.position}
                    yPosition={secondTouch.y.high.position}
                    bottom={chartBounds.bottom}
                    top={chartBounds.top}
                    activeValue={secondTouch.x.value}
                    textColor={textColor}
                    lineColor={colorPrefix === 'dark' ? '#71717a' : '#d4d4d8'}
                    indicatorColor={indicatorColor}
                    topOffset={16}
                  />
                </>
              )}
            </>
          )}>
          {({ chartBounds, points }) => (
            <>
              <StockArea
                colorPrefix={colorPrefix}
                points={points.high}
                isWindowActive={isFirstPressActive && isSecondPressActive}
                isDeltaPositive={isDeltaPositive}
                startX={firstTouch.x.position}
                endX={secondTouch.x.position}
                {...chartBounds}
              />
            </>
          )}
        </CartesianChart>
      </View>
    </View>
  );
}

/**
 * Show the line/area chart for the stock price, taking into account press state.
 */
const StockArea = ({
  colorPrefix,
  points,
  isWindowActive,
  isDeltaPositive,
  startX,
  endX,
  left,
  right,
  top,
  bottom,
}: {
  colorPrefix: 'dark' | 'light';
  points: PointsArray;
  isWindowActive: boolean;
  isDeltaPositive: SharedValue<boolean>;
  startX: SharedValue<number>;
  endX: SharedValue<number>;
} & ChartBounds) => {
  const { path: areaPath } = useAreaPath(points, bottom, { curveType: 'bumpX' });
  const { path: linePath } = useLinePath(points, { curveType: 'bumpX' });

  const backgroundClip = useDerivedValue(() => {
    const path = Skia.Path.Make();

    if (isWindowActive) {
      path.addRect(Skia.XYWHRect(left, top, startX.value - left, bottom - top));
      path.addRect(Skia.XYWHRect(endX.value, top, right - endX.value, bottom - top));
    } else {
      path.addRect(Skia.XYWHRect(left, top, right - left, bottom - top));
    }

    return path;
  });

  const windowClip = useDerivedValue(() => {
    if (!isWindowActive) return Skia.Path.Make();

    const path = Skia.Path.Make();
    path.addRect(Skia.XYWHRect(startX.value, top, endX.value - startX.value, bottom - top));
    return path;
  });

  const windowLineColor = useDerivedValue(() => {
    return isDeltaPositive.value ? appColors.success[colorPrefix] : appColors.error[colorPrefix];
  });

  return (
    <>
      {/* Base */}
      <Group clip={backgroundClip} opacity={isWindowActive ? 0.3 : 1}>
        <Path path={areaPath} style="fill">
          <LinearGradient
            start={vec(0, 0)}
            end={vec(top, bottom)}
            colors={
              isWindowActive
                ? [appColors.cardBorder[colorPrefix], `${appColors.cardBorder[colorPrefix]}33`]
                : [appColors.tint, `${appColors.tint}33`]
            }
          />
        </Path>
        <Path
          path={linePath}
          style="stroke"
          strokeWidth={2}
          color={isWindowActive ? appColors.cardBorder[colorPrefix] : appColors.tint}
        />
      </Group>
      {/* Clipped window */}
      {isWindowActive && (
        <Group clip={windowClip}>
          <Path path={areaPath} style="fill">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(top, bottom)}
              colors={
                !isWindowActive
                  ? [appColors.tint, `${appColors.tint}33`]
                  : isDeltaPositive.value
                    ? [appColors.success[colorPrefix], `${appColors.success[colorPrefix]}33`]
                    : [appColors.error[colorPrefix], `${appColors.error[colorPrefix]}33`]
              }
            />
          </Path>
          <Path path={linePath} style="stroke" strokeWidth={2} color={windowLineColor} />
        </Group>
      )}
    </>
  );
};

const ActiveValueIndicator = ({
  xPosition,
  yPosition,
  top,
  bottom,
  activeValue,
  textColor,
  lineColor,
  indicatorColor,
  topOffset = 0,
}: {
  xPosition: SharedValue<number>;
  yPosition: SharedValue<number>;
  activeValue: SharedValue<number>;
  bottom: number;
  top: number;
  textColor: string;
  lineColor: string;
  indicatorColor: SharedValue<string>;
  topOffset?: number;
}) => {
  const FONT_SIZE = 16;
  const font = useFont(inter, FONT_SIZE);

  const start = useDerivedValue(() => vec(xPosition.value, bottom));
  const end = useDerivedValue(() => vec(xPosition.value, top + 1.5 * FONT_SIZE + topOffset));
  // Text label
  const activeValueDisplay = useDerivedValue(() => formatDate(activeValue.value));
  const activeValueWidth = useDerivedValue(
    () => font?.measureText(activeValueDisplay.value).width || 0
  );
  const activeValueX = useDerivedValue(() => xPosition.value - activeValueWidth.value / 2);

  return (
    <>
      <SkiaLine p1={start} p2={end} color={lineColor} strokeWidth={1} />
      <Circle cx={xPosition} cy={yPosition} r={10} color={indicatorColor} />
      <Circle cx={xPosition} cy={yPosition} r={8} color="hsla(0, 0, 100%, 0.25)" />
      <SkiaText
        font={font}
        color={textColor}
        text={activeValueDisplay}
        x={activeValueX}
        y={top + FONT_SIZE + topOffset}
      />
    </>
  );
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (ms: number) => {
  'worklet';

  const date = new Date(ms);
  const M = MONTHS[date.getMonth()];
  const D = date.getDate();
  const Y = date.getFullYear();
  return `${M} ${D}, ${Y}`;
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    $dark: {
      backgroundColor: appColors.viewBackground.dark,
    },
  },
  optionsScrollView: {
    flex: 1,
    backgroundColor: appColors.cardBackground.light,
    $dark: {
      backgroundColor: appColors.cardBackground.dark,
    },
  },
  options: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
