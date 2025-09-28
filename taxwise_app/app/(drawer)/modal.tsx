import * as React from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown, LayoutAnimationConfig } from 'react-native-reanimated';
import { Info } from '~/lib/icons/Info';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Text } from '~/components/ui/text';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { ThemeToggleSwitch } from '~/components/ThemeToggle';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { AlertTriangle } from '~/lib/icons/AlertTriangle';
import { router } from 'expo-router';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import SignInWithOauth from '~/components/SignInWithOauth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '~/lib/icons/User';
import { ChevronRight } from '~/lib/icons/ChevronRight';
export default function Modal() {
  const [progress, setProgress] = React.useState(50);
  const [currentUser, setCurrentUser] = React.useState(null);


  React.useLayoutEffect(() => {
    const loadUser = async () => {
      const user = await AsyncStorage.getItem('currentUser');
      setCurrentUser(user ? JSON.parse(user) : null);

      console.log(user)
      if (JSON.parse(user)?.profile.gender !== undefined) {
        setProgress(100);
      }
    };
    loadUser();
  }, []);

  const headerHeight = useHeaderHeight();

  function updateProgressValue() {
    setProgress(Math.floor(Math.random() * 100));
  }
  return (
    <SafeAreaView className="flex-1">
      <View
        style={{ marginTop: headerHeight / 2 }}
        className="flex-1 items-center justify-center gap-5 p-6">
        {currentUser?.profile && currentUser.profile.gender === undefined && (
          <Card className="mb-4 w-full rounded-2xl bg-secondary">
            <CardContent className="p-4">
              <View className="flex-row items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-secondary-foreground" />
                <View className="flex-1">
                  <Text className="text-base font-semibold">Please Complete the Form</Text>
                  <Text className="mt-1 text-sm text-muted-foreground">
                    Fill in all required fields to proceed with your application.
                  </Text>
                </View>
                <Button variant="ghost" className="h-8 px-2" onPress={() => router.push('/form')}>
                  <Text className="text-sm text-blue-600">Fill form</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        )}
        <Card className="w-full rounded-2xl bg-card p-6">
          <CardHeader className="items-center">
            <Avatar alt="Rick Sanchez's Avatar" className="h-24 w-24">
              <AvatarImage source={{ uri: currentUser?.image }} />
              <AvatarFallback>
                <Text>RS</Text>
              </AvatarFallback>
            </Avatar>
            <View className="p-3" />
            <CardTitle className="pb-2 text-center">{currentUser?.username}</CardTitle>
            <CardDescription className="text-base font-semibold">Freelancer</CardDescription>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-around gap-3">
              <View className="items-center">
                <Text className="text-sm text-muted-foreground">Gender</Text>
                <Text className="text-xl font-semibold">C-137</Text>
              </View>
              <View className="items-center">
                <Text className="text-sm text-muted-foreground">Age</Text>
                <Text className="text-xl font-semibold">70</Text>
              </View>
              <View className="items-center">
                <Text className="text-sm text-muted-foreground">Species</Text>
                <Text className="text-xl font-semibold">Human</Text>
              </View>
            </View>
          </CardContent>
          <CardFooter className="flex-col gap-3 pb-0">
            <View className="flex-row items-center overflow-hidden">
              <Text className="text-sm text-muted-foreground">Profile completed:</Text>
              <LayoutAnimationConfig skipEntering>
                <Animated.View
                  key={progress}
                  entering={FadeInUp}
                  exiting={FadeOutDown}
                  className="w-11 items-center">
                  <Text className="text-sm font-bold text-primary">{progress}%</Text>
                </Animated.View>
              </LayoutAnimationConfig>
            </View>
            <Progress value={progress} className="h-2" indicatorClassName="bg-primary" />
            <View />
          </CardFooter>
        </Card>

        <Card id="theme_toggle" className="w-full rounded-2xl bg-card p-6">
          <CardContent className="pb-0">
            <ThemeToggleSwitch />
          </CardContent>
        </Card>
        <Card className="w-full rounded-2xl bg-card p-6">
          <CardContent className="pb-0">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <User className="h-5 w-5 text-foreground" />
                <Label>Profile Details</Label>
              </View>
              <Button onPress={() => { router.push("/form") }} variant={"ghost"} >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </Button>
            </View>
          </CardContent>
        </Card>
        <SignInWithOauth />
      </View>
    </SafeAreaView>
  );
}
