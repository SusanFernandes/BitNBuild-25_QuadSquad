import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, View } from 'react-native';
import { setAndroidNavigationBar } from '~/lib/android-navigation-bar';
import { MoonStar } from '~/lib/icons/MoonStar';
import { Sun } from '~/lib/icons/Sun';
import { useColorScheme } from '~/lib/useColorScheme';
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';

export function ThemeToggleSwitch() {
  const { isDarkColorScheme, setColorScheme } = useColorScheme();

  const handleThemeChange = (isChecked) => {
    const newTheme = isChecked ? 'dark' : 'light';
    setColorScheme(newTheme);
    setAndroidNavigationBar(newTheme);
    AsyncStorage.setItem('theme', newTheme);
  };

  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        {isDarkColorScheme ? (
          <MoonStar className="h-5 w-5 text-foreground" />
        ) : (
          <Sun className="h-5 w-5 text-foreground" />
        )}
        <Label className="text-base">{isDarkColorScheme ? 'Dark Mode' : 'Light Mode'}</Label>
      </View>
      <Switch
        checked={isDarkColorScheme}
        onCheckedChange={handleThemeChange}
        className="data-[state=checked]:bg-primary"
      />
    </View>
  );
}
