import {
  DashPathEffect,
  LinearGradient,
  useFont,
  vec,
  type Color,
} from '@shopify/react-native-skia';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { Bar, CartesianChart } from 'victory-native';
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

const DATA = (length: number = 10) =>
  Array.from({ length }, (_, index) => ({
    month: index + 1,
    listenCount: Math.floor(Math.random() * (100 - 50 + 1)) + 50,
  }));

export default function BarChartPage() {
  const font = useFont(inter, 12);
  const isDark = true;
  const [data, setData] = useState(DATA(5));
  const [innerPadding, setInnerPadding] = useState(0.33);
  const [roundedCorner, setRoundedCorner] = useState(5);
  const [labelPosition, setLabelPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');

  const colorPrefix = useColorScheme();
  const textColor = colorPrefix === 'dark' ? appColors.text.dark : appColors.text.light;

  return (
    <>
      <SafeAreaView style={styles.safeView}>
        <View style={styles.chart}>
          <CartesianChart
            xKey="month"
            padding={5}
            yKeys={['listenCount']}
            domainPadding={{ left: 50, right: 50, top: 30 }}
            domain={{ y: [0, 100] }}
            axisOptions={{
              font: font,
              tickCount: 5,
              labelOffset: { x: 12, y: 8 },
              labelPosition: { x: 'outset', y: 'inset' },
              axisSide: { x: 'bottom', y: 'left' },
              lineColor: colorPrefix === 'dark' ? 'hsl(0, 0% ,13.33%)' : 'hsl(0, 0%, 93.73%)',
              labelColor: textColor,
            }}
            frame={{
              lineWidth: 0,
            }}
            yAxis={[
              {
                yKeys: ['listenCount'],
                font,
                linePathEffect: <DashPathEffect intervals={[4, 4]} />,
              },
            ]}
            data={data}>
            {({ points, chartBounds }) => {
              return (
                <Bar
                  points={points.listenCount}
                  chartBounds={chartBounds}
                  animate={{ type: 'spring' }}
                  innerPadding={innerPadding}
                  roundedCorners={{
                    topLeft: roundedCorner,
                    topRight: roundedCorner,
                  }}
                  labels={{ font, color: textColor, position: labelPosition }}>
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(0, 400)}
                    colors={['#f66b15', 'rgba(246, 107, 21,0.1)']}
                  />
                </Bar>
              );
            }}
          </CartesianChart>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeView: {
    flex: 1,
  },
  chart: {
    flex: 1.5,
  },
  optionsScrollView: {
    flex: 1,
  },
  options: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
