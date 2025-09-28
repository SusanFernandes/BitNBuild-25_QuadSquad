import { Link, Tabs } from 'expo-router';
import { Home } from '~/lib/icons/Home';
import { UserRoundCog } from '~/lib/icons/UserSetting';
import { Pressable, View } from 'react-native';
import { cn } from '~/lib/utils';
import { 
  Calculator, 
  TrendingUp, 
  Download 
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: 'hsl(22.93 92.59% 52.35%)',
        headerTransparent: false,
        headerShown:false,
        tabBarStyle: { 
          borderTopRightRadius: 20, 
          borderTopLeftRadius: 20,
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          headerRight: () => (
            <Link href={'/modal'} className="mr-4">
              <UserRoundCog className="text-foreground" size={23} strokeWidth={1.25} />
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="tax-optimization"
        options={{
          title: 'Tax',
          tabBarIcon: ({ color, size }) => <Calculator size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cibil-advisor"
        options={{
          title: 'CIBIL',
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bank-analysis"
        options={{
          title: 'Bank Analysis',
          tabBarIcon: ({ color, size }) =>  <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
