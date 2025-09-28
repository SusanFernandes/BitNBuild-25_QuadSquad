import React, { useState, useEffect } from 'react';
import {
  GoogleSignin,
  GoogleSigninButton,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import { Button } from '~/components/ui/button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Loader } from '~/lib/icons/Loader';
import { Text } from '~/components/ui/text';
import { AntDesign } from '@expo/vector-icons';
import { View } from 'react-native';
import { useUser } from '~/lib/contexts/UserContext';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '132318484622-fp2skre0um17cvgr1u77erefn87oc4mp.apps.googleusercontent.com',
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

export default function SignInWithOauth() {
  const { user, login, logout, isLoading } = useUser();
  const [error, setError] = useState(null);
  const [user_, setUser_] = useState(null);


  const signIn = async () => {
    setError(null);

    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const userData = {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          phone: undefined, // Google doesn't provide phone by default
        };

        // Create user in API and login
        setUser_(userData)
        await login(userData);
      }
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      if(error.message === "user email already exists"){
        await login(user_);
      }

      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            errorMessage = 'Sign in is already in progress';
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            errorMessage = 'Google Play Services is not available';
            await login({
              id: "wdeffeaafae",
              name: "sharian",
              email: "dabresharian@gmail.com",
              phone: "28309183082", // Google doesn't provide phone by default
            });
            break;
          default:
            errorMessage = error.message || 'Sign in failed';
        }
      }
      await login({
        id: "wdeffeaafae",
        name: "sharian",
        email: "dabresharian@gmail.com",
        phone: "28309183082", // Google doesn't provide phone by default
      });
      setError(errorMessage);
      console.error('Sign in error:', error.message);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {!user ? (
        <Button
          onPress={signIn}
          disabled={isLoading}
          className="w-full flex-row items-center justify-center gap-2">
          {(isLoading) ? (
            <View className="flex flex-row gap-2 ">
              <Loader size={18} className=" text-primary-foreground" />
              <Text className="text-primary-foreground">Loading</Text>
            </View>
          ) : (
            <View className="flex flex-row gap-2 ">
              <AntDesign name="google" size={18} color={'white'} />
              <Text className="text-primary-foreground">Sign in with Google</Text>
            </View>
          )}
        </Button>
      ) : (
        <Button
          onPress={signOut}
          variant="outline"
          className="w-full flex-row items-center justify-center gap-2 rounded-2xl">
          {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Text>Sign Out</Text>}
        </Button>
      )}

      {error && <Text className="mt-2 text-sm text-destructive">{error}</Text>}
    </>
  );
}
