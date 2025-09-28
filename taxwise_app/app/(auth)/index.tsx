import { Stack, Link } from 'expo-router';
import { View, Text, Image, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignInWithOauth from '~/components/SignInWithOauth';
import React, { useEffect, useRef } from 'react';

const { width, height } = Dimensions.get('window');

const FloatingIcon = ({ icon, delay, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    );

    // Rotation animation
    const rotationAnimation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    );

    const timer = setTimeout(() => {
      floatingAnimation.start();
      rotationAnimation.start();
    }, delay);

    return () => {
      clearTimeout(timer);
      floatingAnimation.stop();
      rotationAnimation.stop();
    };
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          transform: [{ translateY }, { rotate }],
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 24, opacity: 0.6 }}>{icon}</Text>
    </Animated.View>
  );
};

const FeatureCard = ({ icon, title, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex-row items-center space-x-3 mb-3"
    >
      <View className="bg-white/20 w-12 h-12 rounded-xl items-center justify-center">
        <Text className="text-xl">{icon}</Text>
      </View>
      <Text className="text-white font-medium text-base flex-1">{title}</Text>
    </Animated.View>
  );
};

export default function Home() {
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlideAnim = useRef(new Animated.Value(50)).current;
  const subtitleFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.timing(logoFadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Title animation
    Animated.timing(titleSlideAnim, {
      toValue: 0,
      duration: 1000,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Subtitle animation
    Animated.timing(subtitleFadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

        <SafeAreaView style={{ flex: 1 }}>
          {/* Floating Background Elements */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <FloatingIcon icon="₹" delay={0} style={{ top: '15%', left: '10%' }} />
            <FloatingIcon icon="📊" delay={500} style={{ top: '25%', right: '15%' }} />
            <FloatingIcon icon="🏦" delay={1000} style={{ top: '45%', left: '8%' }} />
            <FloatingIcon icon="📈" delay={1500} style={{ top: '35%', right: '8%' }} />
            <FloatingIcon icon="💳" delay={2000} style={{ top: '60%', left: '20%' }} />
            <FloatingIcon icon="🎯" delay={2500} style={{ top: '70%', right: '20%' }} />
          </View>

          <View className="flex-1 justify-between px-6 pt-8 pb-6">
            {/* Top Section - Branding */}
            <View className="items-center">
              <Animated.View
                style={{ opacity: logoFadeAnim }}
                className="bg-white/20 backdrop-blur-lg w-24 h-24 rounded-3xl items-center justify-center mb-6 shadow-2xl"
              >
                <Text className="text-4xl">🧮</Text>
              </Animated.View>

              <Animated.View style={{ transform: [{ translateY: titleSlideAnim }] }}>
                <Text className="text-4xl font-bold text-white text-center mb-3">
                  TaxWise
                </Text>
                <View className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Text className="text-white/90 font-medium text-sm">
                    AI-Powered Tax Assistant
                  </Text>
                </View>
              </Animated.View>

              <Animated.View style={{ opacity: subtitleFadeAnim }} className="mt-6">
                <Text className="text-white/80 text-center text-base leading-6 px-4">
                  Smart financial management for Indian taxpayers.{'\n'}
                  Simplify your taxes, maximize your savings.
                </Text>
              </Animated.View>
            </View>

            {/* Middle Section - Features */}
            <View className="flex-1 justify-center py-8">
              <View className="space-y-3">
                <FeatureCard 
                  icon="🤖" 
                  title="AI-powered tax calculations & insights"
                  delay={1000}
                />
                <FeatureCard 
                  icon="📱" 
                  title="Easy transaction tracking & management"
                  delay={1200}
                />
                <FeatureCard 
                  icon="📊" 
                  title="Credit score monitoring & improvement"
                  delay={1400}
                />
                <FeatureCard 
                  icon="🎯" 
                  title="Personalized financial recommendations"
                  delay={1600}
                />
              </View>

              {/* Stats Section */}
              <View className="flex-row justify-around mt-8 bg-white/10 backdrop-blur-sm rounded-2xl py-6 px-4">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-white">10K+</Text>
                  <Text className="text-white/70 text-sm">Active Users</Text>
                </View>
                <View className="w-px bg-white/20 mx-4" />
                <View className="items-center">
                  <Text className="text-2xl font-bold text-white">₹50Cr+</Text>
                  <Text className="text-white/70 text-sm">Tax Saved</Text>
                </View>
                <View className="w-px bg-white/20 mx-4" />
                <View className="items-center">
                  <Text className="text-2xl font-bold text-white">4.8★</Text>
                  <Text className="text-white/70 text-sm">App Rating</Text>
                </View>
              </View>
            </View>

            {/* Bottom Section - Auth */}
            <View>
              {/* Trust Indicators */}
              <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
                <View className="flex-row items-center justify-center space-x-4">
                  <View className="flex-row items-center space-x-2">
                    <Text className="text-green-300 text-lg">🔐</Text>
                    <Text className="text-white/80 text-sm">Bank-level Security</Text>
                  </View>
                  <View className="w-px bg-white/20 h-4" />
                  <View className="flex-row items-center space-x-2">
                    <Text className="text-blue-300 text-lg">✓</Text>
                    <Text className="text-white/80 text-sm">IT Dept. Compliant</Text>
                  </View>
                </View>
              </View>

              {/* Sign In Component */}
              <View className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl">
                <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
                  Welcome Back
                </Text>
                <Text className="text-gray-600 text-center mb-6">
                  Sign in to continue your financial journey
                </Text>
                <SignInWithOauth />
              </View>

              {/* Footer */}
              <Text className="text-white/60 text-xs text-center mt-6 leading-5">
                By continuing, you agree to our Terms of Service and Privacy Policy.{'\n'}
                Made with ❤️ for Indian taxpayers
              </Text>
            </View>
          </View>
        </SafeAreaView>

    </>
  );
}