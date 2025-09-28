import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Home, LineChart, UserRoundCog } from 'lucide-react-native';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';

const DrawerLayout = () => {
    const { isDarkColorScheme } = useColorScheme();
    const theme = isDarkColorScheme ? NAV_THEME.light : NAV_THEME.light;
    return (
        <Drawer screenOptions={{
            drawerType: 'slide',
            headerTitleStyle: { fontFamily: "Montserrat_700Bold" },
            headerTintColor: theme.text,
            headerStyle: { backgroundColor: theme.background },
            drawerActiveTintColor: theme.primary,
            drawerInactiveTintColor: theme.text,
            drawerStyle: { backgroundColor: theme.background },
            headerShadowVisible: false,
        }}>
            <Drawer.Screen
                name="(tabs)"
                options={{
                    headerTitle: 'Home',
                    drawerLabel: 'Home',
                    headerRight: () => (
                        <Link href={'/modal'} className="mr-4">
                          <UserRoundCog className="text-foreground" size={23} strokeWidth={1.25} />
                        </Link>
                      ),
                    drawerIcon: ({ size, color }) => (
                        <Home size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="ai"
                options={{
                    headerTitle: 'AI Assistant',
                    drawerLabel: 'AI Assistant',
                    drawerIcon: ({ size, color }) => <Ionicons name="mic-outline" size={size} color={color} />,
                }}
            />
            <Drawer.Screen
                name="transactions"
                options={{
                    headerTitle: 'Transactions',
                    drawerLabel: 'Transactions',
                    drawerIcon: ({ size, color }) => <LineChart size={size} color={color} />,
                }}
            />


        </Drawer>
    );
}

export default DrawerLayout;
