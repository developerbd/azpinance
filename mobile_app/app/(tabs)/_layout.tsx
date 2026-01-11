import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarStyle: {
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                backgroundColor: '#ffffff',
                borderRadius: 25,
                height: 70,
                borderTopWidth: 0,
                paddingBottom: 10,
                paddingTop: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 5,
            },
            tabBarActiveTintColor: '#2563eb',
            tabBarInactiveTintColor: '#94a3b8',
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: 'Trans.',
                    tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="expenses"
                options={{
                    title: 'Expenses',
                    tabBarIcon: ({ color, size }) => <Ionicons name="flash-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="contacts"
                options={{
                    title: 'Contacts',
                    tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Menu',
                    tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
