import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import OnboardingFlow from '~/components/OnboardingFlow';
import { useUser } from '~/lib/contexts/UserContext';

export default function OnboardingScreen() {
  const { isOnboarded } = useUser();

  // If user is already onboarded, redirect to main app
  React.useEffect(() => {
    if (isOnboarded) {
      router.replace('/(drawer)/(tabs)');
    }
  }, [isOnboarded]);

  if (isOnboarded) {
    return null; // Will redirect
  }

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingFlow />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
